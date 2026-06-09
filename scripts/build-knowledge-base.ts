import { posts } from "../src/data/posts";
import { mediumPosts } from "../src/data/medium";
import { notes } from "../src/data/notes";
import { projects } from "../src/data/projects";
import { SITE } from "../src/data/site";
import { writeFileSync } from "node:fs";

interface KnowledgeChunk {
  id: string;
  type: "post" | "medium" | "note" | "project" | "site" | "now";
  source: string;
  sourceUrl?: string;
  text: string;
  embedding: number[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<div[^>]*class="mascot-aside"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/g, (_match, inner) => {
      const code = inner
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
      return `\n${code}\n`;
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, maxLength = 700): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ` ${sentence}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text.slice(0, maxLength)];
}

async function embedBatch(
  texts: string[],
  accountId: string,
  apiToken: string,
): Promise<number[][]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-small-en-v1.5`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: texts }),
    },
  );

  if (!response.ok) {
    throw new Error(`CF AI API error ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as { result: { data: number[][] }; success: boolean };
  if (!json.success) throw new Error("CF AI API returned success: false");
  return json.result.data;
}

async function buildKnowledgeBase() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    console.log("No CF credentials found — skipping knowledge base regeneration.");
    process.exit(0);
  }

  const partialChunks: Omit<KnowledgeChunk, "embedding">[] = [];

  partialChunks.push({
    id: "site-info",
    type: "site",
    source: "About Rameez",
    text: `${SITE.author} is a ${SITE.role}. ${SITE.description}`,
  });

  partialChunks.push({
    id: "about-rameez",
    type: "site",
    source: "About Rameez",
    text: `Rameez Khan is a software engineer who writes about data engineering, Go, SQL, and developer tooling. His technical writing covers SQL window functions in BigQuery (FIRST_VALUE and LAST_VALUE frame clause behaviour), dbt unit testing for macros using dbt 1.8 native unit tests, Goose database schema migration tool for Go services, and Go error handling patterns including sentinel errors, error wrapping with fmt.Errorf, and custom error types. His projects include ox-db (a TypeScript database query tool with a clean UI for writing and executing SQL across multiple database types) and bragdoc (a second brain tool for tracking professional accomplishments — designed for performance reviews, interviews, and 1:1s). He has a machine learning background including a self-driving car project using CNNs and behavioral cloning. He is active on GitHub as rxmeez and publishes on Medium as @rxmeez. His interests span backend systems, data pipelines, and tools that make developers more effective.`,
  });

  for (const post of posts) {
    const plain = stripHtml(post.content);
    const textChunks = chunkText(plain);
    for (let i = 0; i < textChunks.length; i++) {
      partialChunks.push({
        id: `post-${post.slug}-${i}`,
        type: "post",
        source: post.title,
        sourceUrl: `/writing/${post.slug}`,
        text: textChunks[i],
      });
    }
  }

  for (const post of mediumPosts) {
    const plain = stripHtml(post.content);
    const textChunks = chunkText(plain);
    for (let i = 0; i < textChunks.length; i++) {
      partialChunks.push({
        id: `medium-${post.slug}-${i}`,
        type: "medium",
        source: post.title,
        sourceUrl: `/writing/${post.slug}`,
        text: textChunks[i],
      });
    }
  }

  for (const note of notes) {
    const plain = stripHtml(note.content);
    const textChunks = chunkText(plain);
    for (let i = 0; i < textChunks.length; i++) {
      partialChunks.push({
        id: `note-${note.slug}-${i}`,
        type: "note",
        source: note.title,
        sourceUrl: `/notes/${note.slug}`,
        text: textChunks[i],
      });
    }
  }

  for (const project of projects) {
    partialChunks.push({
      id: `project-${project.title}`,
      type: "project",
      source: project.title,
      sourceUrl: "/projects",
      text: `${project.title}: ${project.description}. Tags: ${project.tags.join(", ")}.`,
    });
  }

  console.log(`Embedding ${partialChunks.length} chunks via Cloudflare AI...`);

  // Embed in batches of 10
  const BATCH_SIZE = 10;
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < partialChunks.length; i += BATCH_SIZE) {
    const batch = partialChunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(
      batch.map((c) => c.text),
      accountId,
      apiToken,
    );
    allEmbeddings.push(...embeddings);
    console.log(`  Embedded ${Math.min(i + BATCH_SIZE, partialChunks.length)}/${partialChunks.length}`);
  }

  const chunks: KnowledgeChunk[] = partialChunks.map((chunk, i) => ({
    ...chunk,
    embedding: allEmbeddings[i],
  }));

  // Build the content catalog for the Worker
  const writing = [
    ...posts.map((p) => ({ title: p.title, date: p.date })),
    ...mediumPosts.map((p) => ({ title: p.title, date: p.date })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const sortedNotes = [...notes]
    .map((n) => ({ title: n.title, date: n.date }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const catalog = {
    writing,
    notes: sortedNotes,
    projects: projects.map((p) => ({ title: p.title, description: p.description })),
  };

  const knowledgeBase = {
    embeddingModel: "@cf/baai/bge-small-en-v1.5",
    catalog,
    chunks,
  };

  writeFileSync("public/knowledge-base.json", JSON.stringify(knowledgeBase));
  console.log(`Knowledge base saved (${chunks.length} chunks, ${allEmbeddings[0]?.length ?? 0}-dim embeddings).`);
}

buildKnowledgeBase().catch((err) => {
  console.error("Failed to build knowledge base:", err);
  process.exit(1);
});
