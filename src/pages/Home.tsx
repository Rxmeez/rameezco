import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import Hero from "../components/Hero";
import NowSection from "../components/NowSection";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";

export default function Home() {
  const posthog = usePostHog();

  useEffect(() => {
    document.title = "Rameez Khan — Software Engineer";
  }, []);

  const recentPosts = [...mediumPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  return (
    <>
      <Hero />

      <div className="home-grid">
        <div className="home-card home-card-now">
          <NowSection />
        </div>

        <div className="home-card home-card-stats">
          <h3 className="home-card-head">Quick links</h3>
          <div className="home-stats">
            <Link to="/writing" className="home-stat">
              <span className="home-stat-num">7</span>
              <span className="home-stat-label">Articles</span>
            </Link>
            <Link to="/notes" className="home-stat">
              <span className="home-stat-num">4</span>
              <span className="home-stat-label">Notes</span>
            </Link>
            <Link to="/projects" className="home-stat">
              <span className="home-stat-num">3</span>
              <span className="home-stat-label">Projects</span>
            </Link>
            <Link to="/writing/graph" className="home-stat">
              <span className="home-stat-num">&infin;</span>
              <span className="home-stat-label">Graph</span>
            </Link>
          </div>
        </div>
      </div>

      <hr />

      <section>
        <h2 className="section-heading">
          Recent writing
          <Link to="/writing" className="section-link">All &rarr;</Link>
        </h2>
        <div className="home-notes">
          {recentPosts.map((post, i) => (
            <Link
              key={post.slug}
              to={`/writing/${post.slug}`}
              className="home-note stagger-item"
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => posthog?.capture("writing_post_clicked", { slug: post.slug, title: post.title, source: "home" })}
            >
              <span className="home-note-date">
                {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="home-note-title">{post.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <hr />

      <section>
        <h2 className="section-heading">
          Recent notes
          <Link to="/notes" className="section-link">All &rarr;</Link>
        </h2>
        <div className="home-notes">
          {recentNotes.map((note, i) => (
            <Link
              key={note.slug}
              to={`/notes/${note.slug}`}
              className="home-note stagger-item"
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => posthog?.capture("note_clicked", { slug: note.slug, title: note.title, source: "home" })}
            >
              <span className="home-note-date">
                {new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="home-note-title">{note.title}</span>
            </Link>
          ))}
        </div>
      </section>

    </>
  );
}
