import { NavLink } from "react-router-dom";
import { NAV } from "../data/site";
import ThemeSelector from "./ThemeSelector";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">
          RK
        </NavLink>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <ThemeSelector />
      </div>
    </header>
  );
}
