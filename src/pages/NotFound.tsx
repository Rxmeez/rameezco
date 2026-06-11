import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SeoMeta from "../components/SeoMeta";
import { MascotSurprisedSvg } from "../components/MascotSvg";
import { SITE } from "../data/site";
import { searchNode, type SearchResult } from "../lib/nodeBrain";
import { getSourceUrl } from "../lib/pageContext";

export default function NotFound() {
  const location = useLocation();
  const [guesses, setGuesses] = useState<SearchResult[]>([]);

  // Ask the worker to embed the broken path and guess what the visitor
  // was actually looking for.
  useEffect(() => {
    const words = location.pathname
      .replace(/\.[a-z0-9]+$/i, "")
      .split(/[/\-_+.]+/)
      .filter(Boolean)
      .join(" ");
    if (words.length < 3) return;
    let cancelled = false;
    searchNode(words)
      .then((results) => {
        if (cancelled) return;
        setGuesses(results.filter((r) => getSourceUrl(r.title)).slice(0, 2));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return (
    <div className="not-found">
      <SeoMeta
        title="404 — Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        url={SITE.url}
      />
      <div className="not-found-mascot">
        <MascotSurprisedSvg width={72} height={72} />
      </div>
      <div className="not-found-bracket">[404]</div>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-desc">
        Node searched the whole graph — that page isn't in it.
      </p>
      {guesses.length > 0 && (
        <div className="not-found-guesses">
          <p className="not-found-guess-label">Were you looking for…</p>
          {guesses.map((g) => (
            <Link
              key={g.title}
              to={getSourceUrl(g.title) ?? "/"}
              viewTransition
              className="not-found-guess"
            >
              {g.title} →
            </Link>
          ))}
        </div>
      )}
      <nav className="not-found-nav">
        <Link to="/" className="not-found-link" viewTransition>&larr; Back to home</Link>
        <Link to="/writing" className="not-found-link" viewTransition>Browse writing</Link>
        <Link to="/notes" className="not-found-link" viewTransition>Browse notes</Link>
        <Link to="/projects" className="not-found-link" viewTransition>View projects</Link>
      </nav>
      <p className="not-found-play">
        Or stick around — <Link to="/play" className="not-found-link" viewTransition>play Terminal Typist with Node →</Link>
      </p>
    </div>
  );
}
