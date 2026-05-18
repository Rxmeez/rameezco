import { useEffect, useRef } from "react";

const THEMES = ["industrial", "paper", "neon", "mono", "sepia"];

export default function ThemeSelector() {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "industrial";
    document.documentElement.setAttribute("data-theme", saved);
    if (selectRef.current) {
      selectRef.current.value = saved;
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const theme = e.target.value;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  return (
    <select
      ref={selectRef}
      className="theme-select"
      onChange={handleChange}
      aria-label="Select theme"
    >
      {THEMES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
