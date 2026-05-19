import type { Plugin } from "vite";
import { posts } from "./src/data/posts";
import { mediumPosts } from "./src/data/medium";
import { SITE } from "./src/data/site";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRssFeed(): string {
  const allItems = [
    ...posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      date: p.date,
      excerpt: p.excerpt,
      tags: p.tags,
      url: `${SITE.url}/writing/${p.slug}`,
      isMedium: false,
    })),
    ...mediumPosts.map((p) => ({
      title: p.title,
      slug: p.slug,
      date: p.date,
      excerpt: p.excerpt,
      tags: p.tags,
      url: p.url,
      isMedium: true,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastBuildDate = allItems.length > 0
    ? new Date(allItems[0].date).toUTCString()
    : new Date().toUTCString();

  const itemsXml = allItems.map((item) => {
    const pubDate = new Date(item.date).toUTCString();
    const categories = item.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n    ");

    return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(item.excerpt)}</description>
      ${categories}
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}

export default function rssPlugin(): Plugin {
  return {
    name: "rss-feed",
    buildStart() {
      const rss = generateRssFeed();
      this.emitFile({
        type: "asset",
        fileName: "rss.xml",
        source: rss,
      });
    },
  };
}
