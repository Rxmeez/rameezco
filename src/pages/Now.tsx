import { useEffect } from "react";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";

const sections = [
  {
    icon: "⚙",
    title: "Work",
    content: "Managing Data Infrastructure at RVU for the money.co.uk brand. Improving data pipelines using dbt-core and SQL, and writing Python/TypeScript for ingestion pipelines. Also improving money.co.uk backend internal apps and implementing AI to improve processes across the money.co.uk team and wider FS team.",
  },
  {
    icon: "→",
    title: "Side Project",
    content: "Looking into what a mini AI-first platform would look like to standardise how AI is deployed for multiple teams.",
  },
  {
    icon: "★",
    title: "Learning",
    content: "Continuing to work on learning Go. I've built mini CLI applications but looking to build something bigger in it.",
  },
  {
    icon: "☗",
    title: "Reading",
    items: [
      "Designing Data-Intensive Applications — the new edition.",
      "Manning's Designing AI Systems.",
    ],
  },
  {
    icon: "♨",
    title: "Outside Tech",
    items: [
      "Playing 007 First Light game.",
    ],
  },
];

export default function Now() {
  useEffect(() => {
    document.title = "Now — Rameez Khan";
  }, []);

  return (
    <div className="now-page">
      <SeoMeta
        title="Now — Rameez Khan"
        description="What I'm focused on right now."
        url={`${SITE.url}/now`}
      />
      <div className="now-header">
        <div className="now-status">
          <span className="now-pulse" />
          <span className="now-status-label">Currently</span>
        </div>
        <h1>/now</h1>
        <p className="now-intro">
          What I'm focused on right now. Inspired by{" "}
          <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer">nownownow.com</a>.
        </p>
      </div>

      <p className="now-footer">
        Last updated: June 2025
      </p>

      <div className="now-grid">
        {sections.map((s) => (
          <div key={s.title} className="now-card">
            <h3 className="now-card-head">
              <span className="now-card-icon">{s.icon}</span>
              {s.title}
            </h3>
            {"content" in s ? (
              <p className="now-card-text">{s.content}</p>
            ) : (
              <ul className="now-card-list">
                {s.items!.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
