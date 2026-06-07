import { pipeline } from "@xenova/transformers";
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
  embedding?: number[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string, maxLength = 300): string[] {
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

async function buildKnowledgeBase() {
  const chunks: KnowledgeChunk[] = [];

  chunks.push({
    id: "site-info",
    type: "site",
    source: "About",
    text: `${SITE.author} is a ${SITE.role}. ${SITE.description}`,
  });

  for (const post of posts) {
    const plain = stripHtml(post.content);
    const textChunks = chunkText(plain);
    for (let i = 0; i < textChunks.length; i++) {
      chunks.push({
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
      chunks.push({
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
      chunks.push({
        id: `note-${note.slug}-${i}`,
        type: "note",
        source: note.title,
        sourceUrl: `/notes/${note.slug}`,
        text: textChunks[i],
      });
    }
  }

  for (const project of projects) {
    chunks.push({
      id: `project-${project.title}`,
      type: "project",
      source: project.title,
      sourceUrl: "/projects",
      text: `${project.title}: ${project.description}. Tags: ${project.tags.join(", ")}.`,
    });
  }

  console.log(`Building knowledge base with ${chunks.length} chunks...`);

  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  for (let i = 0; i < chunks.length; i++) {
    const output = await embedder(chunks[i].text, {
      pooling: "mean",
      normalize: true,
    });
    chunks[i].embedding = Array.from(output.data as Float32Array);
    if ((i + 1) % 10 === 0) {
      console.log(`  Embedded ${i + 1}/${chunks.length} chunks...`);
    }
  }

  const knowledgeBase = {
    embeddingModel: "Xenova/all-MiniLM-L6-v2",
    llmModel: "Xenova/tinyllama-chat-v1.0",
    chunks,
  };

  writeFileSync("public/knowledge-base.json", JSON.stringify(knowledgeBase));
  console.log("Knowledge base saved to public/knowledge-base.json");
}

buildKnowledgeBase().catch((err) => {
  console.error("Failed to build knowledge base:", err);
  process.exit(1);
});
