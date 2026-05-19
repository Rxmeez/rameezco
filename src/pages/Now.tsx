import { useEffect } from "react";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";

const sections = [
  {
    icon: "⚙",
    title: "Work",
    content: "Building data pipelines at scale. Currently designing a real-time event ingestion system processing 50M+ events/day across multiple regions with sub-second latency. Stack: Kafka, Flink, and a lot of YAML.",
  },
  {
    icon: "→",
    title: "Side Project",
    content: "Building oh-my-openagent — a multi-agent harness for OpenCode that orchestrates Claude, GPT, Gemini, and open-source models. The big focus right now is Ralph Loop, a self-referential agent loop that doesn't stop until the task is truly done.",
  },
  {
    icon: "★",
    title: "Learning",
    content: "Deep into Rust. Not for work — for fun. Building a tiny CLI tool that benchmarks serialization formats (JSON, MessagePack, Avro, Parquet) against real-world data shapes. The borrow checker is humbling in the best way.",
  },
  {
    icon: "☗",
    title: "Reading",
    items: [
      "Designing Data-Intensive Applications — rereading for the third time. Still finding new things.",
      "Staff Engineer by Will Larson — thinking about the next step.",
    ],
  },
  {
    icon: "♨",
    title: "Outside Tech",
    items: [
      "Running again. 5K three times a week. Slow but consistent.",
      "Cooking through an Iranian cookbook. The rice section alone is worth it.",
      "Learning to make better coffee. Currently on a V60, considering an espresso machine.",
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
        Last updated: May 2025
      </p>

      <div className="now-grid">
        {sections.map((s, i) => (
          <div key={s.title} className="now-card" style={{ "--i": i } as React.CSSProperties}>
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
