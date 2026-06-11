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

async function buildKnowledgeBase() {
  const chunks: KnowledgeChunk[] = [];

  chunks.push({
    id: "site-info",
    type: "site",
    source: "About Rameez",
    text: `${SITE.author} is a ${SITE.role}. ${SITE.description}`,
  });

  chunks.push({
    id: "about-rameez",
    type: "site",
    source: "About Rameez",
    text: `Rameez Khan is a software engineer who writes about data engineering, Go, SQL, and developer tooling. His technical writing covers SQL window functions in BigQuery (FIRST_VALUE and LAST_VALUE frame clause behaviour), dbt unit testing for macros using dbt 1.8 native unit tests, Goose database schema migration tool for Go services, and Go error handling patterns including sentinel errors, error wrapping with fmt.Errorf, and custom error types. His projects include ox-db (a TypeScript database query tool with a clean UI for writing and executing SQL across multiple database types) and bragdoc (a second brain tool for tracking professional accomplishments — designed for performance reviews, interviews, and 1:1s). He has a machine learning background including a self-driving car project using CNNs and behavioral cloning. He is active on GitHub as rxmeez and publishes on Medium as @rxmeez. His interests span backend systems, data pipelines, and tools that make developers more effective.`,
  });

  for (const post of posts) {
    const plain = stripHtml(post.content);
    for (let i = 0; i < chunkText(plain).length; i++) {
      chunks.push({
        id: `post-${post.slug}-${i}`,
        type: "post",
        source: post.title,
        sourceUrl: `/writing/${post.slug}`,
        text: chunkText(plain)[i],
      });
    }
  }

  for (const post of mediumPosts) {
    const plain = stripHtml(post.content);
    for (let i = 0; i < chunkText(plain).length; i++) {
      chunks.push({
        id: `medium-${post.slug}-${i}`,
        type: "medium",
        source: post.title,
        sourceUrl: `/writing/${post.slug}`,
        text: chunkText(plain)[i],
      });
    }
  }

  for (const note of notes) {
    const plain = stripHtml(note.content);
    for (let i = 0; i < chunkText(plain).length; i++) {
      chunks.push({
        id: `note-${note.slug}-${i}`,
        type: "note",
        source: note.title,
        sourceUrl: `/notes/${note.slug}`,
        text: chunkText(plain)[i],
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

  const catalog = {
    writing: [...posts.map((p) => ({ title: p.title, date: p.date })),
               ...mediumPosts.map((p) => ({ title: p.title, date: p.date }))]
      .sort((a, b) => b.date.localeCompare(a.date)),
    notes: [...notes]
      .map((n) => ({ title: n.title, date: n.date }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    projects: projects.map((p) => ({ title: p.title, description: p.description })),
  };

  writeFileSync("worker/knowledge-base.json", JSON.stringify({ catalog, chunks }));
  console.log(`Knowledge base saved: ${chunks.length} chunks (embeddings generated at Worker runtime).`);
}

buildKnowledgeBase().catch((err) => {
  console.error("Failed to build knowledge base:", err);
  process.exit(1);
});
