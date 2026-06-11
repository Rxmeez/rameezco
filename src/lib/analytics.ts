import type { PostHog } from "posthog-js";
import { allowsAnalytics } from "./cookieConsent";

type EventProps = Record<string, unknown>;

// Lazy PostHog: the ~200KB posthog-js bundle is only downloaded after the
// visitor has consented to analytics, and only once the browser is idle.
// Events captured before the library arrives are queued and flushed.
let client: PostHog | null = null;
let loading: Promise<void> | null = null;
const queue: { event: string; props?: EventProps }[] = [];

function loadPostHog(): Promise<void> {
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: "2026-01-30",
      });
      client = posthog;
      for (const { event, props } of queue.splice(0)) {
        client.capture(event, props);
      }
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}

export function scheduleAnalytics() {
  if (!allowsAnalytics() || client || loading) return;
  const kick = () => void loadPostHog();
  if ("requestIdleCallback" in window) {
    requestIdleCallback(kick, { timeout: 5000 });
  } else {
    setTimeout(kick, 2000);
  }
}

const facade = {
  capture(event: string, props?: EventProps) {
    if (!allowsAnalytics()) return;
    if (client) {
      client.capture(event, props);
    } else {
      queue.push({ event, props });
      void loadPostHog();
    }
  },
};

// Drop-in replacement for @posthog/react's usePostHog — every call site uses
// `posthog?.capture(...)`, which works unchanged against the facade.
export function usePostHog() {
  return facade;
}
