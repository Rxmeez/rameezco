import { useEffect } from "react";
import { Link } from "react-router-dom";
import { notes } from "../data/notes";

export default function Notes() {
  useEffect(() => {
    document.title = "Notes — Rameez Khan";
  }, []);

  const sorted = [...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
      <h1>/notes</h1>
      <p className="page-subtitle">
        Quick thoughts, code snippets, learnings, and things too small for a full post.
      </p>
      <hr />

      <div className="notes-list">
        {sorted.map((note) => (
          <article key={note.slug} className="notes-item">
            <div className="notes-item-meta">
              <time dateTime={note.date}>
                {new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </time>
              {note.tags.map((tag) => (
                <span key={tag} className="notes-tag">{tag}</span>
              ))}
            </div>
            <h3 className="notes-item-title">
              <Link to={`/notes/${note.slug}`}>{note.title}</Link>
            </h3>
          </article>
        ))}
      </div>
    </>
  );
}
