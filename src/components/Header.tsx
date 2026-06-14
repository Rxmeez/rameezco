import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV } from "../data/site";
import ThemeSelector from "./ThemeSelector";

interface HeaderProps {
  onSearchClick?: () => void;
}

function GraphIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="3" cy="3" r="2" fill="currentColor"/>
      <circle cx="13" cy="3" r="2" fill="currentColor"/>
      <circle cx="8" cy="13" r="2" fill="currentColor"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="9.7" y1="9.7" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function Header({ onSearchClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryNav = NAV.filter((item) => !item.icon);
  const iconNav = NAV.filter((item) => item.icon);

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo" viewTransition>
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
            <SearchIcon />
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
          {/* Primary text links */}
          {primaryNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              viewTransition
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          <span className="nav-sep" aria-hidden="true" />

          {/* Icon-only links (graph etc.) */}
          {iconNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              viewTransition
              className={({ isActive }) => `nav-link nav-link-icon${isActive ? " active" : ""}`}
              title={item.label}
              aria-label={item.label}
              onClick={() => setMenuOpen(false)}
            >
              <GraphIcon />
              <span className="nav-icon-label">{item.label}</span>
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
              <SearchIcon />
              <span className="search-trigger-text nav-icon-label">Search</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
