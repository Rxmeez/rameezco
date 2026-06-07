import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";

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
  if (!context) return [];

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
