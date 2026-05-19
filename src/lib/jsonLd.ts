import type { BlogPost } from "../data/posts";
import type { Note } from "../data/notes";
import type { Project } from "../data/projects";
import { SITE } from "../data/site";

function toJsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function personJsonLd() {
  return toJsonLd({
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.author,
    url: SITE.url,
    jobTitle: SITE.role,
    sameAs: [
      SITE.socials.github,
      SITE.socials.linkedin,
      SITE.socials.medium,
    ].filter(Boolean),
  });
}

export function blogPostingJsonLd(post: BlogPost) {
  return toJsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE.url}/writing/${post.slug}`,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.url,
    },
    keywords: post.tags.join(", "),
  });
}

export function noteJsonLd(note: Note) {
  return toJsonLd({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: note.title,
    url: `${SITE.url}/notes/${note.slug}`,
    datePublished: note.date,
    author: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.url,
    },
    keywords: note.tags.join(", "),
  });
}

export function creativeWorkJsonLd(project: Project) {
  return toJsonLd({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: project.url || `${SITE.url}/projects`,
    author: {
      "@type": "Person",
      name: SITE.author,
      url: SITE.url,
    },
    keywords: project.tags.join(", "),
  });
}
