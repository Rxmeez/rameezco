import { allowsAnalytics } from "./cookieConsent";

// Node's visitor memory: a small, local-only record of what a returning
// visitor read, asked, and played, so Node can greet them personally.
// Strictly consent-gated — only written under "accept all", never sent
// anywhere, and purged the moment consent is withdrawn.
const MEMORY_KEY = "node-memory";
const MAX_READS = 10;
const MAX_CHATS = 5;
// Re-opening the site within this window counts as the same visit
const SAME_VISIT_MS = 30 * 60 * 1000;

interface ReadEntry {
  kind: "post" | "note";
  slug: string;
  title: string;
  at: number;
}

interface ChatEntry {
  q: string;
  at: number;
}

interface GameEntry {
  best: number;
  at: number;
}

interface NodeMemory {
  visits: number;
  lastVisit: number;
  reads: ReadEntry[];
  chats: ChatEntry[];
  game?: GameEntry;
  name?: string;
  nameAsked?: boolean;
}

function load(): NodeMemory | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!allowsAnalytics()) {
      // Consent withdrawn (or never given) — forget everything
      if (raw) localStorage.removeItem(MEMORY_KEY);
      return null;
    }
    if (!raw) return null;
    return JSON.parse(raw) as NodeMemory;
  } catch {
    return null;
  }
}

function save(memory: NodeMemory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Storage full or blocked — memory is a nicety, not a requirement
  }
}

function loadOrCreate(): NodeMemory | null {
  const existing = load(); // load() purges the store when consent is withdrawn
  if (!allowsAnalytics()) return null;
  return existing ?? { visits: 0, lastVisit: 0, reads: [], chats: [] };
}

export function rememberRead(kind: "post" | "note", slug: string, title: string) {
  const memory = loadOrCreate();
  if (!memory) return;
  memory.reads = [
    { kind, slug, title, at: Date.now() },
    ...memory.reads.filter((r) => r.slug !== slug),
  ].slice(0, MAX_READS);
  save(memory);
}

export function rememberChat(question: string) {
  const memory = loadOrCreate();
  if (!memory) return;
  const q = question.trim().slice(0, 80);
  if (!q) return;
  memory.chats = [{ q, at: Date.now() }, ...memory.chats].slice(0, MAX_CHATS);
  save(memory);
}

export function rememberGame(score: number) {
  const memory = loadOrCreate();
  if (!memory) return;
  memory.game = { best: Math.max(memory.game?.best ?? 0, score), at: Date.now() };
  save(memory);
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// --- Visitor name -----------------------------------------------------------

const NICKNAMES = [
  "Segfault", "Null Pointer", "Kernel Panic", "Rubber Duck", "Sudo",
  "Race Condition", "Heisenbug", "Stack Trace", "Merge Conflict",
  "Edge Case", "Infinite Loop", "Off-By-One", "Garbage Collector",
  "Big O", "Captain Hotfix", "Mainframe",
];

// Names containing these (after leetspeak normalisation) get a nickname
// instead. Substring matching means the odd false positive — that's fine,
// the fallback is a fun nickname, not a rejection.
const BLOCKLIST = [
  "fuck", "shit", "bitch", "cunt", "dick", "cock", "pussy", "penis",
  "vagina", "asshole", "arsehole", "bastard", "wanker", "twat", "prick",
  "bollock", "whore", "slut", "douche", "retard", "nigg", "fag", "spastic",
  "cum", "jizz", "anal", "rape", "hitler", "nazi",
];

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
  "@": "a", "$": "s", "!": "i",
};

function normalizeForFilter(name: string): string {
  return name
    .toLowerCase()
    .replace(/[01345 7@$!]/g, (c) => LEET[c] ?? "")
    .replace(/[^a-z]/g, "");
}

export function isExplicitName(name: string): boolean {
  const n = normalizeForFilter(name);
  return BLOCKLIST.some((w) => n.includes(w));
}

export function techieNickname(): string {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
}

export interface NameResult {
  name: string;
  nicknamed: boolean;
}

// Stores the visitor's name (consent-gated). Rude or unusable input gets a
// techie nickname instead — returns what was actually stored.
export function rememberName(raw: string): NameResult | null {
  const memory = loadOrCreate();
  if (!memory) return null;
  const clean = raw.replace(/[^\p{L}\p{N} '.-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24);
  const result: NameResult =
    !clean || isExplicitName(clean)
      ? { name: techieNickname(), nicknamed: true }
      : { name: clean, nicknamed: false };
  memory.name = result.name;
  memory.nameAsked = true;
  save(memory);
  return result;
}

export function getVisitorName(): string | null {
  return load()?.name ?? null;
}

// Ask once, only with full consent, and only if we don't already have a name
export function shouldAskName(): boolean {
  const memory = loadOrCreate();
  return !!memory && !memory.name && !memory.nameAsked;
}

export function markNameAsked() {
  const memory = loadOrCreate();
  if (!memory) return;
  memory.nameAsked = true;
  save(memory);
}

// Returns a personalised greeting for a returning visitor (or null when
// there's nothing worth recalling), and stamps the new visit either way.
export function getReturningGreeting(): string | null {
  const memory = loadOrCreate();
  if (!memory) return null;

  const previousVisit = memory.lastVisit;
  const now = Date.now();
  const isNewVisit = now - previousVisit > SAME_VISIT_MS;
  if (isNewVisit) {
    memory.visits += 1;
    memory.lastVisit = now;
    save(memory);
  }
  if (!previousVisit || !isNewVisit) return null;

  // Greet with whatever they did most recently — reading, asking, or playing
  const hello = memory.name ? `Welcome back, ${memory.name}!` : "Welcome back!";
  const signals: { at: number; message: string }[] = [];
  const lastRead = memory.reads[0];
  if (lastRead) {
    signals.push({
      at: lastRead.at,
      message: `${hello} Last time you were reading “${truncate(lastRead.title)}” — pick up where you left off?`,
    });
  }
  const lastChat = memory.chats[0];
  if (lastChat) {
    signals.push({
      at: lastChat.at,
      message: `${hello} We were chatting about “${truncate(lastChat.q)}” — I'm still here if you have more questions.`,
    });
  }
  if (memory.game) {
    signals.push({
      at: memory.game.at,
      message: `${hello} Your Terminal Typist best is ${memory.game.best} WPM — think you can beat it?`,
    });
  }

  if (signals.length === 0) return memory.name ? `${hello} Good to see you again.` : null;
  signals.sort((a, b) => b.at - a.at);
  return signals[0].message;
}
