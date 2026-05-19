import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV } from "../data/site";
import ThemeSelector from "./ThemeSelector";

interface HeaderProps {
  onSearchClick?: () => void;
}

export default function Header({ onSearchClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">
          RK
        </NavLink>
        {onSearchClick && (
          <button
            type="button"
            className="search-toggle"
            onClick={() => { onSearchClick(); setMenuOpen(false); }}
            aria-label="Search"
            title="Search"
          >
            <span className="search-toggle-icon">&#8981;</span>
          </button>
        )}
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-label="Menu"
          aria-controls="main-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="nav-toggle-icon" />
        </button>
        <nav id="main-nav" className={`nav ${menuOpen ? "nav-open" : ""}`}>
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <ThemeSelector />
          {onSearchClick && (
            <button
              type="button"
              className="search-trigger"
              onClick={() => { onSearchClick(); setMenuOpen(false); }}
              aria-label="Search"
              title="Search (Ctrl+K)"
            >
              <span className="search-trigger-icon">/</span>
              <span className="search-trigger-text">Search</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}