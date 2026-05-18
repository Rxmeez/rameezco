import { Link } from "react-router-dom";

export default function NowSection() {
  return (
    <div className="now-section">
      <div className="now-badge">
        <span className="now-indicator" />
        Currently
      </div>
      <p className="now-section-text">
        Building scalable data platforms, writing about data engineering,
        and exploring the intersection of observability and infrastructure.
      </p>
      <Link to="/now" className="now-link">
        See what I'm up to &rarr;
      </Link>
    </div>
  );
}
