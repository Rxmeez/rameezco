import kbData from "./knowledge-base.json";

interface Env {
  OPENROUTER_API_KEY: string;
  VENICE_API_KEY?: string;
  AI: {
    run(
      model: string,
      params: { text: string[] },
    ): Promise<{ data: number[][] }>;
  };
}

const VENICE_FALLBACK_STATUSES = new Set([402, 429, 503]);

async function callLLM(
  messages: { role: string; content: string }[],
  env: Env,
): Promise<Response> {
  // Try Venice.ai first if a key is configured
  if (env.VENICE_API_KEY) {
    const resp = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages,
        temperature: 0.3,
        max_tokens: 500,
        stream: true,
      }),
    });
    if (resp.ok || !VENICE_FALLBACK_STATUSES.has(resp.status)) return resp;
    // Credits exhausted / rate-limited → fall through to OpenRouter
  }

  // OpenRouter fallback — free models with automatic provider fallback
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://rameez.co",
      "X-Title": "Rameez.co - Ask Node",
    },
    body: JSON.stringify({
      models: [
        "google/gemma-4-31b-it:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
      ],
      route: "fallback",
      messages,
      temperature: 0.3,
      max_tokens: 500,
      stream: true,
    }),
  });
}

const ALLOWED_ORIGINS = [
  "https://rameez.co",
  "https://rameez-co.pages.dev",
  "http://localhost:5173",
  "http://localhost:4173",
];

interface KnowledgeChunk {
  id: string;
  type: string;
  source: string;
  text: string;
}

// Chunk embeddings are generated once on first request and reused for the
// lifetime of the Worker instance — avoids embedding 19 chunks every request
let cachedChunkEmbeddings: number[][] | null = null;

// Retrieval gating, tuned for bge-small-en-v1.5 cosine scores: strongly
// related question/passage pairs land well above 0.6, while completely
// unrelated text still scores ~0.4-0.55. Chunks below CONTEXT_MIN_SCORE are
// treated as noise and never shown to the model; a source is only attributed
// to the answer when its chunk both clears SOURCE_MIN_SCORE and is
// competitive with the best-matching chunk.
const CONTEXT_MIN_SCORE = 0.45;
const SOURCE_MIN_SCORE = 0.58;
const SOURCE_BEST_MARGIN = 0.06;
const MAX_CONTEXT_CHUNKS = 5;
const MAX_SOURCES = 3;

interface KnowledgeBase {
  catalog?: {
    writing: { title: string; date: string }[];
    notes: { title: string; date: string }[];
    projects: { title: string; description: string }[];
  };
  chunks: KnowledgeChunk[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildContentCatalog(kb: KnowledgeBase): string {
  const { writing, notes, projects } = kb.catalog ?? { writing: [], notes: [], projects: [] };
  const writingList = writing.map((p) => `- "${p.title}" (${p.date})`).join("\n");
  const notesList = notes.map((n) => `- "${n.title}" (${n.date})`).join("\n");
  const projectsList = projects.map((p) => `- "${p.title}": ${p.description}`).join("\n");
  return `Content catalog (sorted newest first):

Writing / blog posts:
${writingList || "- (none yet)"}

Notes:
${notesList || "- (none yet)"}

Projects:
${projectsList || "- (none yet)"}`;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Node-Sources",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body: {
      question: string;
      history?: { role: "user" | "node"; text: string }[];
      pageContext?: { title: string; content: string; type: string } | null;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return new Response("Bad Request: invalid JSON", { status: 400 });
    }

    const { question, history, pageContext } = body;
    if (!question || typeof question !== "string") {
      return new Response("Bad Request: question required", { status: 400 });
    }

    const kb = kbData as unknown as KnowledgeBase;

    // Embed query + all chunks in parallel (chunks are cached after first request)
    const [queryResult, chunkResult] = await Promise.all([
      env.AI.run("@cf/baai/bge-small-en-v1.5", { text: [question] }),
      cachedChunkEmbeddings
        ? Promise.resolve({ data: cachedChunkEmbeddings })
        : env.AI.run("@cf/baai/bge-small-en-v1.5", {
            text: kb.chunks.map((c) => c.text),
          }),
    ]);
    const queryEmbedding = queryResult.data[0];
    cachedChunkEmbeddings = chunkResult.data;

    // Cosine similarity retrieval
    const scored = kb.chunks.map((chunk, i) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, cachedChunkEmbeddings![i]),
    }));
    scored.sort((a, b) => b.score - a.score);
    const bestScore = scored[0]?.score ?? 0;
    const contextChunks = scored
      .slice(0, MAX_CONTEXT_CHUNKS)
      .filter((c) => c.score >= CONTEXT_MIN_SCORE);

    // Only attribute sources when the match is strong and competitive with
    // the best chunk — weak retrieval (meta questions, small talk) gets none.
    // The page the user is already reading is never worth citing back to them.
    const sourceFloor = Math.max(SOURCE_MIN_SCORE, bestScore - SOURCE_BEST_MARGIN);
    const sources = [
      ...new Set(
        contextChunks
          .filter((c) => c.score >= sourceFloor)
          .map((c) => c.source)
          .filter((s) => Boolean(s) && s !== pageContext?.title),
      ),
    ].slice(0, MAX_SOURCES);

    // System prompt
    let systemPrompt = `You are Node, the AI assistant built into Rameez Khan's personal website (rameez.co).

About you — use ONLY this section for questions about Node itself (who you are, what model powers you, how you work):
- You are a small retrieval-augmented assistant that Rameez built into this site.
- The site's writing, notes, and projects are embedded with Cloudflare Workers AI; answers are generated by a language model (DeepSeek via Venice.ai, with open-source fallbacks via OpenRouter).
- Questions about you are not about the site's content. Answer them in one or two sentences and do not mention, summarize, or recommend any posts, notes, or projects while doing so.

Your job: answer questions about Rameez's work, projects, writing, and background using ONLY the provided context.

Formatting rules:
- Use **bold** for key terms and section headers
- Use bullet points (- item) for lists, not paragraphs
- Keep answers concise (2-4 sentences max for summaries)
- Do not mention "the context says" or "according to the text" — just answer directly
- Do not cite sources unless the user explicitly asks
- For questions about recent or latest posts/notes/projects, use the content catalog below`;

    systemPrompt += `\n\n${buildContentCatalog(kb)}`;

    if (pageContext) {
      systemPrompt += `\n\nUser is reading a ${pageContext.type} titled "${pageContext.title}":\n${pageContext.content}`;
    }

    if (contextChunks.length > 0) {
      systemPrompt += `\n\nRetrieved context:\n${contextChunks.map((c) => c.text).join("\n\n")}`;
      if (bestScore < SOURCE_MIN_SCORE) {
        systemPrompt +=
          "\n\nNote: the retrieved context only loosely matched this question. Use it only if it genuinely answers the question; otherwise say you don't know.";
      }
    } else {
      systemPrompt +=
        "\n\nNo site content matched this question. If it is about Rameez or his work, say you don't have that information rather than guessing.";
    }

    const historyMessages = (history ?? [])
      .slice(-8)
      .map((m) => ({
        role: m.role === "node" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));

    const upstream = await callLLM(
      [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: question },
      ],
      env,
    );

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Unknown error");
      return new Response(
        JSON.stringify({ error: `Upstream LLM error ${upstream.status}: ${errorText}` }),
        {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        },
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
        "X-Node-Sources": JSON.stringify(sources),
        ...corsHeaders(origin),
      },
    });
  },
};
