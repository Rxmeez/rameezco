import { useState, useEffect } from "react";
import { getConsent, setConsent, allowsAnalytics, type ConsentLevel } from "../lib/cookieConsent";
import { usePostHog } from "@posthog/react";

export default function CookieConsent() {
  const [consent, setConsentState] = useState<ConsentLevel>("none");
  const [visible, setVisible] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    const current = getConsent();
    setConsentState(current);
    if (current === "none") {
      // Delay banner slightly so it doesn't appear before content
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAcceptEssential() {
    setConsent("essential");
    setConsentState("essential");
    setVisible(false);
  }

  function handleAcceptAll() {
    setConsent("all");
    setConsentState("all");
    setVisible(false);
    // Opt into PostHog capturing if already initialized
    posthog?.opt_in_capturing();
  }

  if (!visible || consent !== "none") return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          This site uses cookies. Essentials keep things working. Analytics helps me understand what content resonates.
        </p>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn cookie-btn-ghost"
            onClick={handleAcceptEssential}
          >
            Essentials only
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={handleAcceptAll}
          >
            Accept all
          </button>
        </div>
        <a href="/cookies" className="cookie-banner-link">Cookie policy</a>
      </div>
    </div>
  );
}
