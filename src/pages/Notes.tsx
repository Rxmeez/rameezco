import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SeoMeta from "../components/SeoMeta";
import { notes } from "../data/notes";
import { readingTimeMinutes } from "../lib/readingTime";
import { SITE } from "../data/site";

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
      for (const tag of note.tags) tagSet.add(tag);
    }
    return Array.from(tagSet).sort();
  }, [sorted]);

  const filteredNotes = activeTag
    ? sorted.filter((n) => n.tags.includes(activeTag))
    : sorted;

  return (
    <div className="notes-page">
      <SeoMeta
        title="Notes — Rameez Khan"
        description="Quick thoughts, code snippets, learnings, and things too small for a full post."
        url={`${SITE.url}/notes`}
      />

      <div className="feed-head">
        <h1 className="feed-title">/notes</h1>
      </div>

      <div className="feed-term">
        <div className="feed-term-bar">
          <span className="feed-term-id">node@rameez.co — tail -f notes/feed.log</span>
          <span className="feed-term-count">{sorted.length} entries</span>
        </div>

        {allTags.length > 0 && (
          <div className="feed-filter-bar">
            <button
              type="button"
              className={`feed-filter-btn ${activeTag === null ? "active" : ""}`}
              onClick={() => setActiveTag(null)}
            >
              all
            </button>
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`feed-filter-btn ${activeTag === tag ? "active" : ""}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="feed-entries">
          {filteredNotes.map((note, i) => (
            <article
              key={note.slug}
              className="note-row"
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className="note-row-meta">
                <time dateTime={note.date}>
                  {new Date(note.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
                <span className="note-row-sep">·</span>
                <span>{readingTimeMinutes(note.content)}m</span>
              </div>
              <span className="note-row-arrow" aria-hidden="true">›</span>
              <h3 className="note-row-title">
                <Link to={`/notes/${note.slug}`}>{note.title}</Link>
              </h3>
              <div className="note-row-tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="note-tag">{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="feed-term-foot">
          <span className="feed-prompt">$</span>
          <span className="feed-term-cmd">
            {filteredNotes.length} of {sorted.length} entries
            {activeTag ? ` — filtered: ${activeTag}` : ""}
          </span>
          <span className="feed-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
