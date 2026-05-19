import type { Plugin } from "vite";
import { posts } from "./src/data/posts";
import { mediumPosts } from "./src/data/medium";
import { notes } from "./src/data/notes";
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

function generateSitemap(): string {
  const routes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/writing", priority: "0.9", changefreq: "weekly" },
    { path: "/notes", priority: "0.9", changefreq: "weekly" },
    { path: "/projects", priority: "0.8", changefreq: "monthly" },
    { path: "/now", priority: "0.7", changefreq: "weekly" },
    { path: "/graph", priority: "0.6", changefreq: "monthly" },
  ];

  const postUrls = posts.map((p) => ({
    loc: `${SITE.url}/writing/${p.slug}`,
    lastmod: p.date,
    priority: "0.8",
    changefreq: "monthly",
  }));

  const noteUrls = notes.map((n) => ({
    loc: `${SITE.url}/notes/${n.slug}`,
    lastmod: n.date,
    priority: "0.7",
    changefreq: "monthly",
  }));

  const allUrls = [
    ...routes.map((r) => ({
      loc: `${SITE.url}${r.path}`,
      lastmod: new Date().toISOString().split("T")[0],
      priority: r.priority,
      changefreq: r.changefreq,
    })),
    ...postUrls,
    ...noteUrls,
  ];

  const urlXml = allUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>`;
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

      const sitemap = generateSitemap();
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: sitemap,
      });
    },
  };
}
