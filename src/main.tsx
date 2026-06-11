import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import { scheduleAnalytics } from "./lib/analytics";

// Loads posthog-js after idle, and only if the visitor consented to analytics
scheduleAnalytics();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent fail — PWA is progressive, not required
    });
  });
}
