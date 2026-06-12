// Regenerates public/cv.pdf from the live /cv page (print stylesheet applied).
// Run after editing src/data/cv.ts:  npm run cv:pdf
// Fails if the CV no longer fits a single A4 page.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const PORT = 4287;

const server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  stdio: ["ignore", "pipe", "inherit"],
});

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("vite dev server timed out")), 20000);
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("Local:")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", () => reject(new Error("vite dev server exited early")));
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/cv`);
  await page.waitForSelector(".cv-name");
  await page.waitForTimeout(800); // let webfonts settle
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages !== 1) {
    console.error(`✗ CV is ${pages} pages — trim content or print CSS before committing.`);
    process.exitCode = 1;
  } else {
    writeFileSync("public/cv.pdf", pdf);
    console.log("✓ public/cv.pdf written (1 page)");
  }
} finally {
  server.kill();
}
