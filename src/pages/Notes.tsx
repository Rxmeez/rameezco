import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { notes } from "../data/notes";
import { readingTimeMinutes } from "../lib/readingTime";

export default function Notes() {
  useEffect(() => {
    document.title = "Notes — Rameez Khan";
  }, []);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const sorted = [...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const note of sorted) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [sorted]);

  const filteredNotes = activeTag
    ? sorted.filter((n) => n.tags.includes(activeTag))
    : sorted;

  return (
    <div className="notes-page">
      <h1>/notes</h1>
      <p className="page-subtitle">
        Quick thoughts, code snippets, learnings, and things too small for a full post.
      </p>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <button
            type="button"
            className={`tag-filter-btn ${activeTag === null ? "active" : ""}`}
            onClick={() => setActiveTag(null)}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={`tag-filter-btn ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <hr />

      <div className="notes-list">
        {filteredNotes.map((note, i) => (
          <article key={note.slug} className="notes-item" style={{ "--i": i } as React.CSSProperties}>
            <div className="notes-item-meta">
              <time dateTime={note.date}>
                {new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </time>
              <span className="post-meta-read">{readingTimeMinutes(note.content)} min read</span>
            </div>
            <h3 className="notes-item-title">
              <Link to={`/notes/${note.slug}`}>{note.title}</Link>
            </h3>
            <div className="notes-tags">
              {note.tags.map((tag) => (
                <span key={tag} className="notes-tag">{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
