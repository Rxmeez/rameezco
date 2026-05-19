import { useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { buildFullGraph } from "../lib/graph";
import Backlinks from "../components/Backlinks";
import { readingTimeMinutes } from "../lib/readingTime";
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
    }
  }, [article]);

  if (!article) return <p>Post not found.</p>;

  const content = article.content ?? "";
  const tags = article.tags ?? [];

  return (
    <article className="post-content-wrapper">
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
              <a href={mediumPost.url} target="_blank" rel="noopener noreferrer" className="medium-src-link" onClick={() => posthog?.capture("medium_link_clicked", { slug: article.slug, title: article.title })}>
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

      <Backlinks
        currentSlug={article.slug}
        edges={fullGraph.edges}
        allNodes={fullGraph.nodes}
      />

      <hr />
      <nav className="post-nav">
        <Link to="/writing" className="post-back">&larr; Back to writing</Link>
        <Link to="/graph" className="post-back" onClick={() => posthog?.capture("writing_graph_opened", { from_slug: article.slug })}>&rarr; Full graph</Link>
      </nav>
    </article>
  );
}
