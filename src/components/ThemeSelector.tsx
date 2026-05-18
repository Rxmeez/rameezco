import { useEffect, useRef, useState } from "react";

const THEMES = ["industrial", "paper", "neon", "mono", "sepia"];

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
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    setTheme(t);
    setOpen(false);
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
        onClick={() => setOpen(!open)}
      >
        <span className="theme-select-label">theme</span>
        <span className="theme-select-chevron" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
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
