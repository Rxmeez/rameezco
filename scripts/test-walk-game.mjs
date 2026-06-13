// Verifies Walk to Prod: tabs, stable idle stance, movement under input,
// fall detection, and grabs screenshots for a visual check.
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4291;
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  stdio: ["ignore", "pipe", "inherit"],
});
const fail = (m) => {
  console.error(`✗ ${m}`);
  process.exitCode = 1;
};
const pass = (m) => console.log(`✓ ${m}`);

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("preview timed out")), 20000);
    server.stdout.on("data", (c) => {
      if (c.toString().includes("Local:")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", () => reject(new Error("preview exited early")));
  });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  page.on("pageerror", (e) => fail(`page error: ${e.message}`));

  // Tabs present, typist is default
  await page.goto(`http://localhost:${PORT}/play`);
  await page.waitForSelector(".play-tab");
  const tabs = await page.locator(".play-tab").allTextContents();
  if (tabs.length === 2 && (await page.locator(".typist-overlay-title").textContent()) === "Terminal Typist") {
    pass(`tabs render, typist default: ${tabs.join(" | ")}`);
  } else {
    fail(`unexpected tabs/default: ${tabs.join(" | ")}`);
  }

  // Switch to walk tab
  await page.click(".play-tab:nth-child(2)");
  await page.waitForSelector(".walk-canvas");
  const title = await page.locator(".typist-overlay-title").textContent();
  if (title === "Walk to Prod") pass("walk tab loads");
  else fail(`walk tab title: ${title}`);
  if (new URL(page.url()).searchParams.get("g") === "walk") pass("deep link ?g=walk set");

  // Start: ragdoll must stand idle without falling for 5s
  await page.click(".typist-start");
  await page.waitForTimeout(5000);
  const idleDist = await page.locator(".typist-hud strong").first().textContent();
  const fellIdle = await page.locator(".typist-overlay").count();
  if (fellIdle === 0) pass(`stands idle for 5s (drift: ${idleDist})`);
  else fail(`fell over with no input — overlay: ${await page.locator(".typist-overlay-title").textContent()}`);
  await page.screenshot({ path: "/tmp/walk-idle.png" });

  // QWOP stride: alternate Q+O / W+P; expect some forward movement
  const stride = async (k1, k2, ms) => {
    await page.keyboard.down(k1);
    await page.keyboard.down(k2);
    await page.waitForTimeout(ms);
    await page.keyboard.up(k1);
    await page.keyboard.up(k2);
  };
  let walked = 0;
  for (let i = 0; i < 14 && (await page.locator(".typist-overlay").count()) === 0; i++) {
    await stride("q", "p", 230);
    if (await page.locator(".typist-overlay").count()) break;
    await stride("w", "o", 230);
    const d = await page.locator(".typist-hud strong").first().textContent();
    walked = Number.parseFloat(d);
    if (i === 4) await page.screenshot({ path: "/tmp/walk-mid.png" });
  }
  console.log(`  walked: ${walked}m`);
  if (walked > 0.5) pass(`moves forward under input (${walked}m)`);
  else fail(`barely moved: ${walked}m`);

  // Force a fall by yanking both hips one way
  await page.keyboard.down("q");
  await page.waitForTimeout(2500);
  await page.keyboard.up("q");
  await page.waitForTimeout(1500);
  const overlayCount = await page.locator(".typist-overlay").count();
  if (overlayCount > 0) {
    const overTitle = await page.locator(".typist-overlay-title").textContent();
    pass(`fall detected → overlay: ${overTitle}`);
    await page.screenshot({ path: "/tmp/walk-over.png" });
  } else {
    fail("no fall after sustained one-sided input");
    await page.screenshot({ path: "/tmp/walk-nofall.png" });
  }

  // Restart works
  const startBtn = page.locator(".typist-start");
  if ((await startBtn.count()) > 0) {
    await startBtn.click();
    await page.waitForTimeout(700);
    if ((await page.locator(".typist-overlay").count()) === 0) pass("restart works");
  }

  await browser.close();
} finally {
  server.kill();
}
