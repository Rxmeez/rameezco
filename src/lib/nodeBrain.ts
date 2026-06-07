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

export async function askNode(question: string): Promise<{ answer: string; sources: string[] }> {
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

  const systemPrompt = `You are Node, a helpful assistant embedded in Rameez Khan's personal website. You answer questions about Rameez's work, projects, writing, and background using ONLY the provided context. Be concise, friendly, and honest. If the context doesn't contain the answer, say so.

Context:
${context}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://rameez.co",
      "X-Title": "Rameez.co - Ask Node",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim() ?? "I'm not sure about that one.";

  return { answer, sources };
}
