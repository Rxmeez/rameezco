import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rssPlugin from "./vite-rss-plugin";

export default defineConfig({
  plugins: [react(), rssPlugin()],
  base: "/",
});
