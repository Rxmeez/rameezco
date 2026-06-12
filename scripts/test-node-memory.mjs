// One-off verification for Node's consent-gated visitor memory.
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4289;

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  stdio: ["ignore", "pipe", "inherit"],
});

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};
const pass = (msg) => console.log(`✓ ${msg}`);

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("preview server timed out")), 20000);
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("Local:")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", () => reject(new Error("preview server exited early")));
  });

  const browser = await chromium.launch();

  // --- Scenario 1: accept all → read a post → memory recorded ---
  const ctx1 = await browser.newContext();
  const p1 = await ctx1.newPage();
  await p1.goto(`http://localhost:${PORT}/`);
  await p1.click(".cookie-btn-primary"); // Accept all
  await p1.goto(`http://localhost:${PORT}/writing`);
  const firstPost = p1.locator(".main-content a[href^='/writing/']").first();
  const postHref = await firstPost.getAttribute("href");
  await p1.goto(`http://localhost:${PORT}${postHref}`);
  await p1.waitForTimeout(500);
  let mem = await p1.evaluate(() => localStorage.getItem("node-memory"));
  if (mem && JSON.parse(mem).reads.length > 0) {
    pass(`memory recorded after reading: ${JSON.parse(mem).reads[0].title}`);
  } else {
    fail(`no memory after accepting all + reading a post: ${mem}`);
  }

  // --- Scenario 2: returning visit → personalised greeting ---
  await p1.evaluate(() => {
    const m = JSON.parse(localStorage.getItem("node-memory"));
    m.lastVisit = Date.now() - 2 * 86400000; // 2 days ago
    localStorage.setItem("node-memory", JSON.stringify(m));
    localStorage.removeItem("node-waved-day");
  });
  await p1.goto(`http://localhost:${PORT}/`);
  await p1.waitForSelector(".node-guide-text", { timeout: 5000 });
  const greeting = await p1.textContent(".node-guide-text");
  if (greeting.includes("Last time you were reading")) {
    pass(`personalised greeting: ${greeting}`);
  } else {
    fail(`greeting not personalised: ${greeting}`);
  }
  // Visit counter advanced
  mem = JSON.parse(await p1.evaluate(() => localStorage.getItem("node-memory")));
  if (mem.visits >= 1 && Date.now() - mem.lastVisit < 60000) {
    pass(`visit stamped (visits=${mem.visits})`);
  } else {
    fail(`visit not stamped: ${JSON.stringify(mem)}`);
  }
  await ctx1.close();

  // --- Scenario 3: essentials only → nothing stored ---
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`http://localhost:${PORT}/`);
  await p2.click(".cookie-btn-ghost"); // Essentials only
  await p2.goto(`http://localhost:${PORT}${postHref}`);
  await p2.waitForTimeout(500);
  const mem2 = await p2.evaluate(() => localStorage.getItem("node-memory"));
  if (mem2 === null) {
    pass("essentials only: no memory written");
  } else {
    fail(`memory written without full consent: ${mem2}`);
  }

  // --- Scenario 4: consent withdrawn → memory purged ---
  const purged = await p2.evaluate(() => {
    localStorage.setItem(
      "node-memory",
      JSON.stringify({ visits: 3, lastVisit: 1, reads: [], chats: [] }),
    );
    return true;
  });
  if (purged) {
    await p2.evaluate(() => localStorage.removeItem("node-waved-day"));
    await p2.goto(`http://localhost:${PORT}/`);
    await p2.waitForSelector(".node-guide-text", { timeout: 5000 });
    const after = await p2.evaluate(() => localStorage.getItem("node-memory"));
    if (after === null) {
      pass("stale memory purged when consent is not 'all'");
    } else {
      fail(`stale memory survived: ${after}`);
    }
  }
  await ctx2.close();

  // --- Scenario 5: first ever visit → normal greeting, no crash ---
  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.goto(`http://localhost:${PORT}/`);
  await p3.waitForSelector(".node-guide-text", { timeout: 5000 });
  const hello = await p3.textContent(".node-guide-text");
  if (hello.includes("I'm Node")) {
    pass(`first visit greeting unchanged: ${hello}`);
  } else {
    fail(`unexpected first-visit greeting: ${hello}`);
  }

  // --- Scenario 6: refresh + reopened tab → no repeat greeting same day ---
  await p3.reload();
  await p3.waitForTimeout(2500); // past the 1.2s greeting delay
  const onReload = await p3.evaluate(() => document.querySelector(".node-guide-text")?.textContent ?? null);
  const p3b = await ctx3.newPage(); // fresh tab, same browser profile
  await p3b.goto(`http://localhost:${PORT}/`);
  await p3b.waitForTimeout(2500);
  const onNewTab = await p3b.evaluate(() => document.querySelector(".node-guide-text")?.textContent ?? null);
  if (onReload === null && onNewTab === null) {
    pass("no repeat greeting on refresh or reopened tab (same day)");
  } else {
    fail(`greeting repeated — reload: ${onReload}, new tab: ${onNewTab}`);
  }

  // --- Scenario 7: next day → greets again ---
  await p3b.evaluate(() => {
    localStorage.setItem("node-waved-day", new Date(Date.now() - 86400000).toDateString());
  });
  await p3b.reload();
  await p3b.waitForSelector(".node-guide-text", { timeout: 5000 });
  const nextDay = await p3b.textContent(".node-guide-text");
  pass(`greets again the next day: ${nextDay}`);
  await ctx3.close();

  await browser.close();
} finally {
  server.kill();
}
