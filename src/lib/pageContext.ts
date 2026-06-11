import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";
import { projects } from "../data/projects";
import { aiMeta } from "../data/aiMeta";

export interface ContentLink {
  title: string;
  url: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getContentLinks(): ContentLink[] {
  const links: ContentLink[] = [
    ...posts.map((p) => ({ title: p.title, url: `/writing/${p.slug}` })),
    ...mediumPosts.map((p) => ({ title: p.title, url: `/writing/${p.slug}` })),
    ...notes.map((n) => ({ title: n.title, url: `/notes/${n.slug}` })),
    ...projects.map((p) => ({ title: p.title, url: "/projects" })),
  ];
  // Longest titles first so substrings don't shadow longer matches.
  return links.sort((a, b) => b.title.length - a.title.length);
}

const SOURCE_URL_INDEX = new Map<string, string>(
  getContentLinks().map((l) => [l.title, l.url]),
);

export function getSourceUrl(title: string): string | undefined {
  return SOURCE_URL_INDEX.get(title);
}

export function linkifyContent(html: string, links: ContentLink[]): string {
  let result = html;
  for (const { title, url } of links) {
    const escapedTitle = escapeHtml(title);
    // Match the title only when not already inside an <a> tag (lookbehind on open tag, lookahead on close tag).
    const pattern = new RegExp(
      `(?<!<a[^>]*>)(?<![\\w"/>])${escapeRegExp(escapedTitle)}(?![^<]*</a>)`,
      "g",
    );
    result = result.replace(
      pattern,
      `<a class="node-chat-link" href="${url}">${escapedTitle}</a>`,
    );
  }
  return result;
}

export interface PageContext {
  type: "post" | "note" | "project" | "none";
  title: string;
  content: string;
  slug: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/g, "[code block]")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getCurrentPageContext(): PageContext | null {
  const path = window.location.pathname;

  const writingMatch = path.match(/^\/writing\/([^/]+)$/);
  if (writingMatch) {
    const slug = writingMatch[1];
    const post = posts.find((p) => p.slug === slug);
    const medium = mediumPosts.find((p) => p.slug === slug);
    const article = post ?? medium;
    if (article) {
      return {
        type: "post",
        title: article.title,
        content: stripHtml(article.content ?? ""),
        slug: article.slug,
      };
    }
  }

  const notesMatch = path.match(/^\/notes\/([^/]+)$/);
  if (notesMatch) {
    const slug = notesMatch[1];
    const note = notes.find((n) => n.slug === slug);
    if (note) {
      return {
        type: "note",
        title: note.title,
        content: stripHtml(note.content),
        slug: note.slug,
      };
    }
  }

  return null;
}

export function getSuggestedQuestions(context: PageContext | null): string[] {
  if (!context) {
    return [
      "What is Rameez working on?",
      "What has he written recently?",
      "Tell me about his projects",
    ];
  }

  // Prefer AI-generated questions specific to this page's content
  const generated = aiMeta[context.slug]?.questions;
  if (generated && generated.length > 0) return generated;

  if (context.type === "post") {
    return [
      "Summarize this post",
      "What are the key takeaways?",
      "Explain the main concepts",
    ];
  }

  if (context.type === "note") {
    return [
      "Summarize this note",
      "What are the key commands or patterns?",
      "Explain this in simpler terms",
    ];
  }

  return [];
}
