import { pipeline, cos_sim } from "@xenova/transformers";
import type { FeatureExtractionPipeline, TextGenerationPipeline } from "@xenova/transformers";

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
let generator: TextGenerationPipeline | null = null;
let loadProgress = 0;
let loadError: string | null = null;

export function getLoadProgress() {
  return loadProgress;
}

export function getLoadError() {
  return loadError;
}

export function resetLoadError() {
  loadError = null;
  loadProgress = 0;
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

export async function initModels(onProgress?: (progress: number) => void) {
  if (embedder && generator) return;
  loadError = null;

  loadProgress = 0.1;
  onProgress?.(loadProgress);

  try {
    embedder = await withTimeout(
      pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        quantized: true,
      }),
      30000,
      "Loading embedding model",
    );

    loadProgress = 0.5;
    onProgress?.(loadProgress);

    generator = await withTimeout(
      pipeline("text-generation", "Xenova/tinyllama-chat-v1.0", {
        quantized: true,
      }),
      120000,
      "Loading language model",
    );

    loadProgress = 1.0;
    onProgress?.(loadProgress);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
    loadProgress = 0;
    throw err;
  }
}

export async function askNode(question: string): Promise<{ answer: string; sources: string[] }> {
  if (!knowledgeBase || !embedder || !generator) {
    throw new Error("Node is not ready yet. Please wait for the model to load.");
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

  const prompt = `You are Node, ${knowledgeBase.chunks[0]?.source || "a digital assistant"}. You help answer questions about the website owner's work, projects, and writing. Use the provided context to answer. Be concise, friendly, and honest. If you don't know, say so.

Context:
${context}

Question: ${question}
Answer:`;

  const result = await generator(prompt, {
    max_new_tokens: 200,
    temperature: 0.7,
    do_sample: true,
    top_k: 50,
  });

  const firstResult = Array.isArray(result) ? result[0] : result;
  const rawText = "generated_text" in firstResult ? firstResult.generated_text : "";
  const generatedText = typeof rawText === "string" ? rawText : "";
  const answer = generatedText.replace(prompt, "").trim();

  return { answer, sources };
}
