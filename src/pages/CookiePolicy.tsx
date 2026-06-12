import { useEffect } from "react";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";
import { resetConsent } from "../lib/cookieConsent";

export default function CookiePolicy() {
  useEffect(() => {
    document.title = "Cookie Policy — Rameez Khan";
  }, []);

  function handleReset() {
    resetConsent();
    window.location.reload();
  }

  return (
    <div className="cookie-policy-page">
      <SeoMeta
        title="Cookie Policy — Rameez Khan"
        description="How this site uses cookies and what data is collected."
        url={`${SITE.url}/cookies`}
      />
      <h1>/cookies</h1>

      <section className="cookie-policy-section">
        <h2>What are cookies?</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how people use the content.</p>
      </section>

      <section className="cookie-policy-section">
        <h2>What this site uses</h2>
        <table className="cookie-policy-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Purpose</th>
              <th>Lifespan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Essential</strong></td>
              <td>Theme preference (light/dark mode), cookie consent choice, skip-to-content preference. No personal data.</td>
              <td>LocalStorage, no expiry</td>
            </tr>
            <tr>
              <td><strong>Analytics</strong></td>
              <td>PostHog — anonymous page views, clicks, and scroll depth to understand which content resonates. No third-party ad tracking.</td>
              <td>Session + 1 year</td>
            </tr>
            <tr>
              <td><strong>Node's memory</strong></td>
              <td>Lets the site mascot greet returning visitors — remembers your last visit, recently read posts, recent chat questions, and your game high score. Stored only in your browser, never sent anywhere, and erased if you switch to essentials only.</td>
              <td>LocalStorage, no expiry</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="cookie-policy-section">
        <h2>What PostHog collects</h2>
        <ul>
          <li>Page views and navigation paths</li>
          <li>Click events on links and buttons</li>
          <li>Scroll depth on articles</li>
          <li>Device type (mobile/desktop) and browser</li>
          <li>Approximate location (country level)</li>
        </ul>
        <p>No personally identifiable information is collected. IP addresses are not stored.</p>
      </section>

      <section className="cookie-policy-section">
        <h2>Your choices</h2>
        <p><strong>Essentials only:</strong> The site works normally — theme switching, navigation, and the knowledge graph all function. Analytics are disabled.</p>
        <p><strong>Accept all:</strong> Everything above plus anonymous analytics that help me understand what content to write more of, and a local-only memory so Node recognises you when you return.</p>
      </section>

      <section className="cookie-policy-section">
        <h2>Manage your preference</h2>
        <button type="button" className="cookie-btn cookie-btn-primary" onClick={handleReset}>
          Reset cookie preference
        </button>
        <p className="cookie-policy-hint">This will clear your choice and show the banner again on your next visit.</p>
      </section>
    </div>
  );
}
