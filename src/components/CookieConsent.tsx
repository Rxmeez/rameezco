import { useState, useEffect } from "react";
import { getConsent, setConsent, type ConsentLevel } from "../lib/cookieConsent";
import { scheduleAnalytics } from "../lib/analytics";
import { triggerNodeAskName } from "./NodeGuide";
import { shouldAskName } from "../lib/nodeMemory";

export default function CookieConsent() {
  const [consent, setConsentState] = useState<ConsentLevel>("none");
  const [visible, setVisible] = useState(false);

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
    // Consent granted — start loading the analytics bundle now
    scheduleAnalytics();
    // Node can now keep a local memory; introduce himself properly
    setTimeout(() => {
      if (shouldAskName()) triggerNodeAskName();
    }, 800);
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
