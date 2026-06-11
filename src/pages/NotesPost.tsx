import { useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { usePostHog } from "../lib/analytics";
import SeoMeta from "../components/SeoMeta";
import Backlinks from "../components/Backlinks";
import { notes } from "../data/notes";
import { buildFullGraph } from "../lib/graph";
import { readingTimeMinutes } from "../lib/readingTime";
import { SITE } from "../data/site";
import { noteJsonLd } from "../lib/jsonLd";
import { triggerNodeGuide } from "../components/NodeGuide";
import { replaceMascotImages } from "../lib/mascotHtml";
import { recordVisit } from "../lib/constellation";
import { aiMeta } from "../data/aiMeta";
import hljs from "highlight.js/lib/core";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import yaml from "highlight.js/lib/languages/yaml";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/github-dark-dimmed.css";
import "../syntax.css";

hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);

export default function NotesPost() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();
  const note = notes.find((n) => n.slug === slug);
  const fullGraph = useMemo(() => buildFullGraph(), []);

  useEffect(() => {
    if (note) {
      document.title = `${note.title} — Rameez Khan`;
      posthog?.capture("note_opened", { slug: note.slug, title: note.title, tags: note.tags });
      recordVisit("note", note.slug);
    }
  }, [note]);

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
  }, [note]);

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
  }, [note]);

  if (!note) {
    return (
      <div className="not-found">
        <div className="not-found-bracket">[404]</div>
        <h1 className="not-found-title">Note not found</h1>
        <p className="not-found-desc">The note you're looking for doesn't exist.</p>
        <nav className="not-found-nav">
          <Link to="/notes" className="not-found-link">&larr; Browse notes</Link>
          <Link to="/" className="not-found-link">Back to home</Link>
        </nav>
      </div>
    );
  }

  return (
    <article className="post-content-wrapper">
      <SeoMeta
        title={`${note.title} — Rameez Khan`}
        description={note.content.replace(/<[^>]*>/g, " ").slice(0, 160)}
        url={`${SITE.url}/notes/${note.slug}`}
        type="article"
        publishedAt={note.date}
        tags={note.tags}
      />
      <script type="application/ld+json">{noteJsonLd(note)}</script>
      <header className="post-header">
        <div className="notes-label">note</div>
        <h1 className="post-title-heading">{note.title}</h1>
        <div className="post-meta-row">
          <time dateTime={note.date}>
            {new Date(note.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
          {note.tags.length > 0 && <span className="post-tags-sep" />}
          {note.tags.map((tag) => (
            <span key={tag} className="post-tag">{tag}</span>
          ))}
          <span className="post-tags-sep" />
          <span className="post-meta-read">{readingTimeMinutes(note.content)} min read</span>
        </div>
      </header>
      <hr />
      {aiMeta[note.slug]?.tldr && (
        <aside className="post-tldr">
          <span className="post-tldr-label">✨ tl;dr</span>
          <p className="post-tldr-text">{aiMeta[note.slug].tldr}</p>
        </aside>
      )}
      <div
        ref={contentRef}
        className="post-content"
        dangerouslySetInnerHTML={{ __html: replaceMascotImages(note.content) }}
      />
      <Backlinks
        currentSlug={note.slug}
        edges={fullGraph.edges}
        allNodes={fullGraph.nodes}
      />

      <hr />
      <nav className="post-nav">
        <Link to="/notes" className="post-back">&larr; All notes</Link>
      </nav>
    </article>
  );
}
