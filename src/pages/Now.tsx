import { useEffect, useState } from "react";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";

type Tone = "active" | "live" | "idle";

interface Section {
  id: string;
  icon: string;
  title: string;
  tag: string;
  tone: Tone;
  content?: string;
  items?: string[];
}

const LAST_UPDATED = "June 2025";

const sections: Section[] = [
  {
    id: "work",
    icon: "⚙",
    title: "work",
    tag: "active",
    tone: "active",
    content:
      "Leading data infrastructure at RVU for the money.co.uk brand. Modernising data pipelines with dbt-core and SQL, building ingestion systems in Python and TypeScript, and improving backend internal applications. Currently focused on implementing AI solutions to streamline processes across the money.co.uk and wider Financial Services teams.",
  },
  {
    id: "side-project",
    icon: "→",
    title: "side project",
    tag: "building",
    tone: "active",
    content:
      "Exploring what a mini AI-first platform could look like — standardising how AI tools and agents are deployed and managed across multiple teams, with a focus on reproducibility and governance.",
  },
  {
    id: "learning",
    icon: "★",
    title: "learning",
    tag: "in progress",
    tone: "active",
    content:
      "Continuing to work on learning Go. I've built mini CLI applications but looking to build something bigger in it. The goal is to get comfortable enough with Go's concurrency model and standard library to ship a production-grade service.",
  },
  {
    id: "reading",
    icon: "☗",
    title: "reading",
    tag: "2 open",
    tone: "live",
    items: [
      "Designing Data-Intensive Applications — the new edition.",
      "Manning's Designing AI Systems.",
    ],
  },
  {
    id: "outside-tech",
    icon: "♨",
    title: "outside tech",
    tag: "playing",
    tone: "live",
    items: ["Playing 007 First Light game."],
  },
];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/London",
  });
  const zone =
    now
      .toLocaleTimeString("en-GB", { timeZoneName: "short", timeZone: "Europe/London" })
      .split(" ")
      .pop() ?? "GMT";
  return { time, zone };
}

export default function Now() {
  const { time, zone } = useClock();

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

      <div className="now-head">
        <h1 className="now-title">/now</h1>
        <p className="now-intro">
          A snapshot of what has my attention right now — inspired by{" "}
          <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer">
            nownownow.com
          </a>
          .
        </p>
      </div>

      <div className="now-term">
        <div className="now-term-bar">
          <span className="now-term-id">node@rameez.co — now --status</span>
          <span className="now-term-clock" aria-label="Current local time in London">
            {time} {zone}
          </span>
        </div>

        <div className="now-statusline">
          <span className="now-pulse" aria-hidden="true" />
          <span className="now-statusline-state">ONLINE</span>
          <span className="now-statusline-sep">·</span>
          <span>London, UK</span>
          <span className="now-statusline-sep">·</span>
          <span className="now-statusline-dim">snapshot: {LAST_UPDATED}</span>
        </div>

        <ul className="now-procs">
          {sections.map((s, i) => (
            <li
              key={s.id}
              className="now-proc"
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className="now-proc-head">
                <span className={`now-dot now-dot-${s.tone}`} aria-hidden="true" />
                <span className="now-proc-icon" aria-hidden="true">{s.icon}</span>
                <span className="now-proc-name">{s.title}</span>
                <span className={`now-proc-tag now-proc-tag-${s.tone}`}>{s.tag}</span>
              </div>
              {s.content ? (
                <p className="now-proc-body">{s.content}</p>
              ) : (
                <ul className="now-proc-list">
                  {s.items!.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="now-term-foot">
          <span className="now-term-prompt">$</span>
          <span className="now-term-cmd">whoami — {SITE.description.toLowerCase()}</span>
          <span className="now-term-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
