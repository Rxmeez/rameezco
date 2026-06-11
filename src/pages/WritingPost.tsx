import { useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { usePostHog } from "../lib/analytics";
import SeoMeta from "../components/SeoMeta";
import TableOfContents from "../components/TableOfContents";
import RelatedPosts from "../components/RelatedPosts";
import Backlinks from "../components/Backlinks";
import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { buildFullGraph } from "../lib/graph";
import { readingTimeMinutes } from "../lib/readingTime";
import { SITE } from "../data/site";
import { blogPostingJsonLd } from "../lib/jsonLd";
import { triggerNodeGuide } from "../components/NodeGuide";
import { replaceMascotImages } from "../lib/mascotHtml";
import hljs from "highlight.js/lib/core";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import yaml from "highlight.js/lib/languages/yaml";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github-dark-dimmed.css";
import "../syntax.css";

hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("ts", javascript);

export default function WritingPost() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();

  const blogPost = posts.find((p) => p.slug === slug);
  const mediumPost = mediumPosts.find((p) => p.slug === slug);
  const article = blogPost ?? mediumPost;
  const fullGraph = useMemo(() => buildFullGraph(), []);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — Rameez Khan`;
      posthog?.capture("writing_post_opened", { slug: article.slug, title: article.title, tags: article.tags ?? [] });
    }
  }, [article]);

  useEffect(() => {
    if (contentRef.current) {
      for (const block of contentRef.current.querySelectorAll("pre code")) {
        hljs.highlightElement(block as HTMLElement);
      }
      const h2s = contentRef.current.querySelectorAll("h2");
      for (let i = 0; i < h2s.length; i++) {
        h2s[i].id = `heading-${i}`;
      }
      for (const pre of contentRef.current.querySelectorAll("pre")) {
        if (pre.querySelector(".code-copy-btn")) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "code-copy-btn";
        btn.textContent = "Copy";
        btn.addEventListener("click", () => {
          const code = pre.querySelector("code");
          if (!code) return;
          navigator.clipboard.writeText(code.textContent ?? "").then(() => {
            btn.textContent = "Copied!";
            setTimeout(() => { btn.textContent = "Copy"; }, 2000);
            triggerNodeGuide("Copied to clipboard!", "surprised", "none", 2500);
          });
        });
        pre.appendChild(btn);
      }
    }
  }, [article]);

  useEffect(() => {
    const nav = document.querySelector(".post-nav");
    if (!nav) return;
    let triggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !triggered) {
            triggered = true;
            triggerNodeGuide("You made it to the end!", "default", "celebrate", 4000);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(nav);
    return () => observer.disconnect();
  }, [article]);

  if (!article) {
    return (
      <div className="not-found">
        <div className="not-found-bracket">[404]</div>
        <h1 className="not-found-title">Post not found</h1>
        <p className="not-found-desc">The article you're looking for doesn't exist.</p>
        <nav className="not-found-nav">
          <Link to="/writing" className="not-found-link">&larr; Browse writing</Link>
          <Link to="/" className="not-found-link">Back to home</Link>
        </nav>
      </div>
    );
  }

  const content = replaceMascotImages(article.content ?? "");
  const tags = article.tags ?? [];

  return (
    <article className="post-content-wrapper">
      <SeoMeta
        title={`${article.title} — Rameez Khan`}
        description={article.excerpt}
        url={`${SITE.url}/writing/${article.slug}`}
        type="article"
        publishedAt={article.date}
        tags={tags}
      />
      {blogPost && <script type="application/ld+json">{blogPostingJsonLd(blogPost)}</script>}
      <TableOfContents content={content} />
      <header className="post-header">
        <h1 className="post-title-heading">{article.title}</h1>
        <div className="post-meta-row">
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="post-tags-sep" />
          {mediumPost && (
            <>
              <span className="post-tags-sep" />
              <a href={mediumPost.url} target="_blank" rel="noopener noreferrer" className="medium-src-link" onClick={() => setTimeout(() => posthog?.capture("medium_link_clicked", { slug: article.slug, title: article.title }), 0)}>
                medium ↗
              </a>
            </>
          )}
          {tags.length > 0 && <span className="post-tags-sep" />}
          {tags.map((tag) => (
            <span key={tag} className="post-tag">{tag}</span>
          ))}
          <span className="post-tags-sep" />
          <span className="post-meta-read">{readingTimeMinutes(content)} min read</span>
        </div>
      </header>
      <hr />
      <div
        ref={contentRef}
        className="post-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {blogPost && (
        <RelatedPosts
          currentSlug={blogPost.slug}
          type="post"
          tags={tags}
        />
      )}

      <Backlinks
        currentSlug={article.slug}
        edges={fullGraph.edges}
        allNodes={fullGraph.nodes}
      />

      <hr />
      <nav className="post-nav">
        <Link to="/writing" className="post-back">&larr; Back to writing</Link>
        <Link to="/graph" className="post-back" onClick={() => setTimeout(() => posthog?.capture("writing_graph_opened", { from_slug: article.slug }), 0)}>&rarr; Full graph</Link>
      </nav>
    </article>
  );
}
