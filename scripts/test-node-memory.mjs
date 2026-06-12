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
    sessionStorage.removeItem("node-waved");
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
    await p2.evaluate(() => sessionStorage.removeItem("node-waved"));
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

  // --- Scenario 6: accept all → Node asks for a name → polite name stored ---
  await p3.click(".cookie-btn-primary");
  await p3.waitForSelector(".node-guide-name-input", { timeout: 5000 });
  pass("name prompt appeared after accepting all cookies");
  await p3.fill(".node-guide-name-input", "Rameez");
  await p3.press(".node-guide-name-input", "Enter");
  await p3.waitForFunction(
    () => document.querySelector(".node-guide-text")?.textContent?.includes("Nice to meet you"),
    { timeout: 5000 },
  );
  const niceReply = await p3.textContent(".node-guide-text");
  pass(`polite name accepted: ${niceReply}`);
  let mem3 = JSON.parse(await p3.evaluate(() => localStorage.getItem("node-memory")));
  if (mem3.name === "Rameez" && mem3.nameAsked) {
    pass("name stored in memory");
  } else {
    fail(`name not stored: ${JSON.stringify(mem3)}`);
  }

  // --- Scenario 7: returning greeting includes the name ---
  await p3.evaluate(() => {
    const m = JSON.parse(localStorage.getItem("node-memory"));
    m.lastVisit = Date.now() - 86400000;
    localStorage.setItem("node-memory", JSON.stringify(m));
    sessionStorage.removeItem("node-waved");
  });
  await p3.goto(`http://localhost:${PORT}/`);
  await p3.waitForSelector(".node-guide-text", { timeout: 5000 });
  const named = await p3.textContent(".node-guide-text");
  if (named.includes("Welcome back, Rameez!")) {
    pass(`returning greeting uses name: ${named}`);
  } else {
    fail(`name missing from greeting: ${named}`);
  }
  await ctx3.close();

  // --- Scenario 8: rude name → techie nickname instead ---
  const ctx4 = await browser.newContext();
  const p4 = await ctx4.newPage();
  await p4.goto(`http://localhost:${PORT}/`);
  await p4.click(".cookie-btn-primary");
  await p4.waitForSelector(".node-guide-name-input", { timeout: 5000 });
  await p4.fill(".node-guide-name-input", "Sh1tHead");
  await p4.press(".node-guide-name-input", "Enter");
  await p4.waitForFunction(
    () => document.querySelector(".node-guide-text")?.textContent?.includes("keep it friendly"),
    { timeout: 5000 },
  );
  const rudeReply = await p4.textContent(".node-guide-text");
  const mem4 = JSON.parse(await p4.evaluate(() => localStorage.getItem("node-memory")));
  if (!/sh1t|shit/i.test(mem4.name)) {
    pass(`rude name replaced with nickname "${mem4.name}": ${rudeReply}`);
  } else {
    fail(`rude name stored verbatim: ${mem4.name}`);
  }
  await ctx4.close();

  await browser.close();
} finally {
  server.kill();
}
