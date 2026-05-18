import { Link } from "react-router-dom";
import { SITE } from "../data/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-line">
          <span>&copy; {year} {SITE.author}</span>
          <span className="footer-sep" />
          <span>{SITE.role}</span>
          <span className="footer-sep" />
          <span className="footer-links">
            {SITE.socials.github && (
              <a
                className="footer-link"
                href={SITE.socials.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            )}
            {SITE.socials.github && SITE.socials.linkedin && " / "}
            {SITE.socials.linkedin && (
              <a
                className="footer-link"
                href={SITE.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            )}
          </span>
        </div>
        <div className="footer-line">
          <Link to="/writing" className="footer-link">
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}
