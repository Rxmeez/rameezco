import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rssPlugin from "./vite-rss-plugin";

export default defineConfig({
  plugins: [react(), rssPlugin()],
  base: "/",
  optimizeDeps: {
    exclude: ["@xenova/transformers"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          graph: ["d3"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
