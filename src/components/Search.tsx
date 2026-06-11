import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";
import { projects } from "../data/projects";
import { MascotThinkingSvg } from "./MascotSvg";
import { stripHtml } from "../lib/readingTime";
import { searchNode } from "../lib/nodeBrain";

interface SearchItem {
  title: string;
  path: string;
  type: "post" | "medium" | "note" | "project";
  excerpt: string;
  tags: string[];
  date?: string;
}

function buildSearchIndex(): SearchItem[] {
  return [
    ...posts.map((p) => ({
      title: p.title,
      path: `/writing/${p.slug}`,
      type: "post" as const,
      excerpt: p.excerpt,
      tags: p.tags,
      date: p.date,
    })),
    ...mediumPosts.map((p) => ({
      title: p.title,
      path: `/writing/${p.slug}`,
      type: "medium" as const,
      excerpt: p.excerpt,
      tags: p.tags,
      date: p.date,
    })),
    ...notes.map((n) => ({
      title: n.title,
      path: `/notes/${n.slug}`,
      type: "note" as const,
      excerpt: `${stripHtml(n.content).slice(0, 160)}...`,
      tags: n.tags,
      date: n.date,
    })),
    ...projects.map((p) => ({
      title: p.title,
      path: "/projects",
      type: "project" as const,
      excerpt: p.description,
      tags: p.tags,
    })),
  ];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Search({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [indexReady, setIndexReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const indexRef = useRef<SearchItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      document.body.style.overflow = "hidden";
      // Build index on first open, not at module init
      if (!indexRef.current.length) {
        requestIdleCallback(() => {
          indexRef.current = buildSearchIndex();
          setIndexReady(true);
        });
      } else {
        setIndexReady(true);
      }
      // Focus after a short delay to allow render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim() || !indexReady) return [];
    const q = query.toLowerCase();
    return indexRef.current
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.excerpt.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [query, indexReady]);

  // Semantic layer: after a typing pause, ask the worker to match by meaning.
  // Surfaces content that keyword matching misses ("testing data pipelines"
  // → the dbt posts). Results already found by keyword are dropped.
  const [semantic, setSemantic] = useState<SearchItem[]>([]);
  useEffect(() => {
    setSemantic([]);
    const q = query.trim();
    if (!isOpen || q.length < 4) return;
    const timer = setTimeout(() => {
      searchNode(q)
        .then((found) => {
          const items = found
            .map((r) => indexRef.current.find((item) => item.title === r.title))
            .filter((item): item is SearchItem => Boolean(item))
            .slice(0, 4);
          setSemantic(items);
        })
        .catch(() => {});
    }, 450);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const semanticExtra = semantic.filter(
    (s) => !results.some((r) => r.path === s.path && r.title === s.title),
  );

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <button type="button" className="search-backdrop" onClick={onClose} aria-label="Close search" />
      <div className="search-modal">
        <div className="search-input-wrap">
          <span className="search-icon">/</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search posts, notes, projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery("")}>
              Clear
            </button>
          )}
        </div>

        {!indexReady && (
          <div className="search-empty">Loading search index...</div>
        )}

        {indexReady && query.trim() && results.length === 0 && semanticExtra.length === 0 && (
          <div className="search-empty">
            <MascotThinkingSvg
              width={48}
              height={48}
              className="mascot-animated-thinking"
              style={{ marginBottom: "0.5rem" }}
              aria-hidden="true"
            />
            <div>No results for "{query}"</div>
          </div>
        )}

        {results.length > 0 && (
          <ul className="search-results">
            {results.map((item) => (
              <li key={`${item.type}-${item.path}`}>
                <Link to={item.path} className="search-result-link" onClick={onClose}>
                  <span className={`search-result-type search-result-type-${item.type}`}>
                    {item.type}
                  </span>
                  <div className="search-result-body">
                    <div className="search-result-title">{item.title}</div>
                    <div className="search-result-excerpt">{item.excerpt}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {semanticExtra.length > 0 && (
          <>
            <div className="search-section-label">By meaning ✨</div>
            <ul className="search-results">
              {semanticExtra.map((item) => (
                <li key={`sem-${item.type}-${item.path}`}>
                  <Link to={item.path} className="search-result-link" onClick={onClose}>
                    <span className={`search-result-type search-result-type-${item.type}`}>
                      {item.type}
                    </span>
                    <div className="search-result-body">
                      <div className="search-result-title">{item.title}</div>
                      <div className="search-result-excerpt">{item.excerpt}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="search-footer">
          <span className="search-hint">
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
