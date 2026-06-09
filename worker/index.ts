import kbData from "../public/knowledge-base.json";

interface Env {
  OPENROUTER_API_KEY: string;
  AI: {
    run(
      model: string,
      params: { text: string[] },
    ): Promise<{ data: number[][] }>;
  };
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
    const topChunks = scored.slice(0, 5);
    const bestScore = topChunks[0]?.score ?? 0;
    const context = topChunks.map((c) => c.text).join("\n\n");
    const sources = [
      ...new Set(
        topChunks
          .filter((c) => c.score >= 0.2)
          .map((c) => c.source)
          .filter(Boolean),
      ),
    ];

    // System prompt
    let systemPrompt = `You are Node, a helpful assistant embedded in Rameez Khan's personal website. Answer questions about Rameez's work, projects, writing, and background using ONLY the provided context.

Formatting rules:
- Use **bold** for key terms and section headers
- Use bullet points (- item) for lists, not paragraphs
- Keep answers concise (2-4 sentences max for summaries)
- Do not mention "the context says" or "according to the text" — just answer directly
- Do not cite sources unless the user explicitly asks
- For questions about recent or latest posts/notes/projects, use the content catalog below`;

    systemPrompt += `\n\n${buildContentCatalog(kb)}`;

    if (bestScore < 0.2) {
      systemPrompt +=
        "\n\nNote: Retrieved context may not directly answer this question. Say so briefly rather than speculating.";
    }

    if (pageContext) {
      systemPrompt += `\n\nUser is reading a ${pageContext.type} titled "${pageContext.title}":\n${pageContext.content}`;
    }

    systemPrompt += `\n\nRetrieved context:\n${context}`;

    const historyMessages = (history ?? [])
      .slice(-8)
      .map((m) => ({
        role: m.role === "node" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));

    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://rameez.co",
          "X-Title": "Rameez.co - Ask Node",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it:free",
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: question },
          ],
          temperature: 0.3,
          max_tokens: 500,
          stream: true,
        }),
      },
    );

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Unknown error");
      return new Response(
        JSON.stringify({ error: `OpenRouter error ${upstream.status}: ${errorText}` }),
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
