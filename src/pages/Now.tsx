import { useEffect } from "react";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";

const sections = [
  {
    icon: "⚙",
    title: "Work",
    content: "Leading data infrastructure at RVU for the money.co.uk brand. Modernising data pipelines with dbt-core and SQL, building ingestion systems in Python and TypeScript, and improving backend internal applications. Currently focused on implementing AI solutions to streamline processes across the money.co.uk and wider Financial Services teams.",
  },
  {
    icon: "→",
    title: "Side Project",
    content: "Exploring what a mini AI-first platform could look like — standardising how AI tools and agents are deployed and managed across multiple teams, with a focus on reproducibility and governance.",
  },
  {
    icon: "★",
    title: "Learning",
    content: "Continuing to work on learning Go. I've built mini CLI applications but looking to build something bigger in it. The goal is to get comfortable enough with Go's concurrency model and standard library to ship a production-grade service.",
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
                {s.items!.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
