import { useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import { notes } from "../data/notes";
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
    }
  }, [note]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [note]);

  if (!note) return <p>Note not found.</p>;

  return (
    <article className="post-content-wrapper">
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
      <div
        ref={contentRef}
        className="post-content"
        dangerouslySetInnerHTML={{ __html: note.content }}
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
