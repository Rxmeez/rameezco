import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-bracket">[404]</div>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <nav className="not-found-nav">
        <Link to="/" className="not-found-link">&larr; Back to home</Link>
        <Link to="/writing" className="not-found-link">Browse writing</Link>
        <Link to="/notes" className="not-found-link">Browse notes</Link>
        <Link to="/projects" className="not-found-link">View projects</Link>
      </nav>
    </div>
  );
}
