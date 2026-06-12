import { useEffect } from "react";
import SeoMeta from "../components/SeoMeta";
import { triggerNodeGuide } from "../components/NodeGuide";
import { usePostHog } from "../lib/analytics";
import { cv, stripBoldMarkers } from "../data/cv";
import { SITE } from "../data/site";

function cvJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: cv.name,
    url: `${SITE.url}/cv`,
    jobTitle: cv.headline,
    email: `mailto:${cv.email}`,
    address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "University of Leeds" },
    worksFor: { "@type": "Organization", name: cv.roles[0].company },
    knowsAbout: [...cv.languages, ...cv.technologies],
    hasCredential: cv.certifications.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.title,
    })),
    sameAs: [SITE.socials.github, SITE.socials.linkedin].filter(Boolean),
  });
}

// Renders **marked** spans from the CV data as <strong>
function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 === 1 ? <strong key={`b-${part.slice(0, 24)}`}>{part}</strong> : part,
      )}
    </>
  );
}

export default function Cv() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("cv_viewed");
    // Touch devices have no ⌘P — point them at the Download button instead
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const isMac = /Mac/.test(navigator.userAgent);
    const tip = touch
      ? "Tap “Download PDF” to keep a copy — or ask me anything about the CV!"
      : `Tip: ${isMac ? "⌘P" : "Ctrl+P"} saves this as a PDF — or ask me anything about the CV!`;
    const t = setTimeout(() => {
      triggerNodeGuide(tip, "default", "wave", 7000);
    }, 1500);
    return () => clearTimeout(t);
  }, [posthog]);

  return (
    <article className="cv-page">
      <SeoMeta
        title={`CV — ${cv.name}`}
        description={stripBoldMarkers(cv.summary)}
        url={`${SITE.url}/cv`}
      />
      <script type="application/ld+json">{cvJsonLd()}</script>

      <header className="cv-header">
        <a
          className="cv-action cv-action-primary cv-download"
          href="/cv.pdf"
          download="Rameez-Khan-CV.pdf"
          onClick={() => posthog?.capture("cv_pdf_downloaded")}
        >
          ↓ Download PDF
        </a>
        <h1 className="cv-name">{cv.name}</h1>
        <p className="cv-headline">{cv.headline}</p>
        <p className="cv-contact">
          <span>{cv.location}</span>
          <span className="cv-contact-sep" aria-hidden="true">·</span>
          <a href={`mailto:${cv.email}`}>{cv.email}</a>
          <span className="cv-contact-sep" aria-hidden="true">·</span>
          <a href={SITE.socials.linkedin} target="_blank" rel="noopener noreferrer">linkedin/in/rxmeez</a>
          <span className="cv-contact-sep" aria-hidden="true">·</span>
          <a href={SITE.socials.github} target="_blank" rel="noopener noreferrer">github/Rxmeez</a>
        </p>
        <p className="cv-summary"><Bold text={cv.summary} /></p>
      </header>

      <section className="cv-section">
        <h2 className="cv-section-title">Work Experience</h2>
        {cv.roles.map((role) => (
          <div key={`${role.company}-${role.title}-${role.period}`} className="cv-role">
            <div className="cv-role-head">
              <h3 className="cv-role-title">{role.title}</h3>
              <span className="cv-role-company">
                {role.companyUrl ? (
                  <a href={role.companyUrl} target="_blank" rel="noopener noreferrer">
                    {role.company}
                  </a>
                ) : (
                  role.company
                )}
              </span>
              <span className="cv-role-period">{role.period}</span>
            </div>
            <ul className="cv-role-highlights">
              {role.highlights.map((h) => (
                <li key={h.slice(0, 40)}><Bold text={h} /></li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="cv-section">
        <h2 className="cv-section-title">Education &amp; Certifications</h2>
        <ul className="cv-flat-list">
          {cv.certifications.map((c) => (
            <li key={c.title}>
              <span>{c.title}</span>
              <span className="cv-role-period">{c.year}</span>
            </li>
          ))}
          {cv.education.map((e) => (
            <li key={e.degree}>
              <span>
                {e.degree}, {e.institution}
                {e.result ? ` — ${e.result}` : ""}
              </span>
              <span className="cv-role-period">{e.period}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cv-section">
        <h2 className="cv-section-title">Technologies &amp; Languages</h2>
        <div className="cv-tags">
          {cv.languages.map((l) => (
            <span key={l} className="cv-tag cv-tag-lang">{l}</span>
          ))}
          {cv.technologies.map((t) => (
            <span key={t} className="cv-tag">{t}</span>
          ))}
        </div>
      </section>

      <p className="cv-print-hint">
        Press <kbd>⌘P</kbd> / <kbd>Ctrl+P</kbd> to save as PDF · or ask Node about anything here
      </p>
    </article>
  );
}
