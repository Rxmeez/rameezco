import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { posts } from "../data/posts";
import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";
import { projects } from "../data/projects";
import { stripHtml } from "../lib/readingTime";

interface SearchItem {
  title: string;
  path: string;
  type: "post" | "medium" | "note" | "project";
  excerpt: string;
  tags: string[];
  date?: string;
}

const index: SearchItem[] = [
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Search({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
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
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return index
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.excerpt.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [query]);

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

        {query.trim() && results.length === 0 && (
          <div className="search-empty">No results for "{query}"</div>
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

        <div className="search-footer">
          <span className="search-hint">
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
