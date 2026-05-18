import { SITE } from "../data/site";

export default function Hero() {
  return (
    <div className="hero">
      <div className="hero-bracket hero-bracket-top">/*</div>
      <div className="hero-content">
        <p className="hero-greeting">Hi, I'm</p>
        <h1 className="hero-name">{SITE.author}</h1>
        <div className="hero-divider">
          <span className="hero-divider-line" />
          <span className="hero-divider-role">{SITE.role}</span>
          <span className="hero-divider-line" />
        </div>
        <p className="hero-tagline">
          I build data infrastructure that scales. This is my corner of the web —
          a collection of projects, writing, notes, and whatever has my attention.
        </p>
        <div className="hero-links">
          <a href="/projects" className="hero-cta">See my projects</a>
          <a href="/writing" className="hero-cta hero-cta-ghost">Read my writing</a>
        </div>
      </div>
      <div className="hero-bracket hero-bracket-bottom">*/</div>
    </div>
  );
}
