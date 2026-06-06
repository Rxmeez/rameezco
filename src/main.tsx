import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

import posthog from "posthog-js";
import { PostHogProvider, PostHogErrorBoundary } from "@posthog/react";
import { getConsent } from "./lib/cookieConsent";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});

// Opt out of capturing if user hasn't explicitly accepted all
if (getConsent() !== "all") {
  posthog.opt_out_capturing();
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <PostHogProvider client={posthog}>
    <PostHogErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PostHogErrorBoundary>
  </PostHogProvider>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent fail — PWA is progressive, not required
    });
  });
}
