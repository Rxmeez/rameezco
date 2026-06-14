import { useEffect, useRef, useState } from "react";
import { triggerNodeGuide } from "./NodeGuide";

const THEMES = ["industrial", "paper", "neon", "mono", "sepia"];

const THEME_REACTIONS: Record<string, string> = {
  industrial: "Industrial. Built different.",
  paper: "Paper mode — easy on the eyes.",
  neon: "Ooh, neon! My dots are glowing.",
  mono: "Mono. Strictly business.",
  sepia: "Sepia — very vintage of you.",
};

export default function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("industrial");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "industrial";
    document.documentElement.setAttribute("data-theme", saved);
    setTheme(saved);
  }, []);

  function select(t: string) {
    const changed = t !== theme;
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    setTheme(t);
    setOpen(false);
    if (changed && THEME_REACTIONS[t]) {
      triggerNodeGuide(THEME_REACTIONS[t], "default", "none", 2800);
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="theme-select-wrapper">
      <button
        type="button"
        className="theme-select-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Select theme"
        title="Theme"
        onClick={() => setOpen(!open)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="5" cy="4" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="11" cy="12" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="theme-select-dropdown">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`theme-select-option${t === theme ? " active" : ""}`}
              onClick={() => select(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
