export type ConsentLevel = "none" | "essential" | "all";

const CONSENT_KEY = "cookie_consent";
const POLICY_VERSION = "1";

interface ConsentState {
  level: ConsentLevel;
  version: string;
  date: string;
}

export function getConsent(): ConsentLevel {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return "none";
    const state = JSON.parse(raw) as ConsentState;
    // Re-prompt if policy version changed
    if (state.version !== POLICY_VERSION) return "none";
    return state.level;
  } catch {
    return "none";
  }
}

export function setConsent(level: ConsentLevel) {
  const state: ConsentState = {
    level,
    version: POLICY_VERSION,
    date: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
}

export function hasConsented(): boolean {
  return getConsent() !== "none";
}

export function allowsAnalytics(): boolean {
  return getConsent() === "all";
}

export function resetConsent() {
  localStorage.removeItem(CONSENT_KEY);
}
