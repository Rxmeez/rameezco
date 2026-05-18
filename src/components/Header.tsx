import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV } from "../data/site";
import ThemeSelector from "./ThemeSelector";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">
          RK
        </NavLink>
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
        </nav>
      </div>
    </header>
  );
}