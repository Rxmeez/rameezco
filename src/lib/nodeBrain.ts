import { pipeline, cos_sim } from "@xenova/transformers";
import type { FeatureExtractionPipeline } from "@xenova/transformers";

interface KnowledgeChunk {
  id: string;
  type: string;
  source: string;
  sourceUrl?: string;
  text: string;
  embedding: number[];
}

interface KnowledgeBase {
  embeddingModel: string;
  llmModel: string;
  chunks: KnowledgeChunk[];
}

let knowledgeBase: KnowledgeBase | null = null;
let embedder: FeatureExtractionPipeline | null = null;
let loadError: string | null = null;

export function getLoadError() {
  return loadError;
}

export function resetLoadError() {
  loadError = null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s. Check your connection.`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function initKnowledgeBase() {
  if (knowledgeBase) return;
  const response = await fetch("/knowledge-base.json");
  if (!response.ok) {
    throw new Error(`Failed to load knowledge base: ${response.status}`);
  }
  knowledgeBase = await response.json();
}

export async function initEmbedder() {
  if (embedder) return;
  loadError = null;

  try {
    embedder = await withTimeout(
      pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        quantized: true,
      }),
      30000,
      "Loading embedding model",
    );
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

export async function askNode(
  question: string,
  onToken?: (token: string) => void,
  pageContext?: { title: string; content: string; type: string } | null,
): Promise<{ answer: string; sources: string[] }> {
  if (!knowledgeBase || !embedder) {
    throw new Error("Node is not ready yet. Please wait for the embedding model to load.");
  }

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is missing. Please add VITE_OPENROUTER_API_KEY to your environment.");
  }

  const qOutput = await embedder(question, {
    pooling: "mean",
    normalize: true,
  });
  const qEmbedding = Array.from(qOutput.data as Float32Array);

  const scored = knowledgeBase.chunks.map((chunk) => ({
    ...chunk,
    score: cos_sim(qEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, 3);
  const context = topChunks.map((c) => c.text).join("\n\n");
  const sources = [...new Set(topChunks.map((c) => c.source).filter(Boolean))];

  let systemPrompt = `You are Node, a helpful assistant embedded in Rameez Khan's personal website. You answer questions about Rameez's work, projects, writing, and background using ONLY the provided context.

Formatting rules:
- Use **bold** for key terms and section headers
- Use bullet points (- item) for lists, not paragraphs
- Keep answers concise (2-4 sentences max for summaries)
- For summaries: cover the main argument, key insight, and practical takeaway
- Do not mention "the context says" or "according to the text" — just answer directly
- If the user asks to summarize, give a tight overview in 2-3 bullet points`;

  if (pageContext) {
    systemPrompt += `\n\nThe user is currently reading a ${pageContext.type} titled "${pageContext.title}". Here is its content:\n${pageContext.content}`;
  }

  systemPrompt += `\n\nRetrieved knowledge base context:\n${context}`;

  const useStreaming = typeof onToken === "function";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://rameez.co",
      "X-Title": "Rameez.co - Ask Node",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: useStreaming,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  if (!useStreaming) {
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() ?? "I'm not sure about that one.";
    return { answer, sources };
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader for streaming.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let tokenCount = 0;

  function tryParseSseLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) return;

    const dataStr = trimmed.slice(6);
    if (dataStr === "[DONE]") return;

    try {
      const data = JSON.parse(dataStr);
      const delta = data.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        tokenCount++;
        answer += delta;
        onToken?.(delta);
      }
    } catch {}
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      tryParseSseLine(line);
    }
  }

  for (const line of buffer.split("\n")) {
    tryParseSseLine(line);
  }

  if (tokenCount === 0 && buffer) {
    try {
      const data = JSON.parse(buffer);
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (content) {
        answer = content;
        onToken?.(content);
      }
    } catch {}
  }

  return { answer: answer.trim(), sources };
}
