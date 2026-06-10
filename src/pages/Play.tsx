import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import SeoMeta from "../components/SeoMeta";
import { SITE } from "../data/site";
import { MascotDefaultSvg, MascotSurprisedSvg } from "../components/MascotSvg";
import { buildWordPool, type WordBuckets } from "../lib/wordPool";

const START_FALL_WPM = 8;
const MAX_FALL_WPM = 200;
const MAX_LIVES = 3;
// Fall-rate milestones — each one recolors Node and fires a celebration.
const MILESTONES = [10, 20, 40, 60, 80, 100, 120, 150, 200];
const MILESTONE_COLORS = [
  "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#f59e0b",
  "#14b8a6", "#ef4444", "#eab308", "#ff6b2b",
];
const FLOOR_OFFSET = 56; // px above the field bottom where words land
const BEST_KEY = "typist-best";

type Phase = "idle" | "playing" | "over";

interface FallingWord {
  id: number;
  text: string;
  xPct: number;
  y: number;
  pxPerMs: number;
}

interface DyingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  letters: { tx: number; ty: number; rot: number }[];
}

interface Laser {
  id: number;
  x: number;
  y: number;
  length: number;
  angle: number;
}

interface Milestone {
  wpm: number;
  color: string;
  key: number;
  burst: { tx: number; ty: number }[];
}

// Difficulty curve: one new word every 60000/wpm ms. Creeps 8→15 over the
// first handful of words, then ramps steadily toward 200.
function fallWpm(score: number): number {
  return Math.min(MAX_FALL_WPM, START_FALL_WPM + Math.floor(score ** 1.15));
}

function fallDurationMs(wpm: number): number {
  const t = (wpm - START_FALL_WPM) / (MAX_FALL_WPM - START_FALL_WPM);
  const base = 9000 - t * 5500;
  return base * (0.9 + Math.random() * 0.2);
}

function pickWord(pool: WordBuckets, wpm: number, active: FallingWord[]): string {
  const roll = Math.random();
  let bucket: string[];
  if (wpm < 15) bucket = pool.short;
  else if (wpm < 30) bucket = roll < 0.7 ? pool.short : pool.medium;
  else if (wpm < 60) bucket = roll < 0.4 ? pool.short : roll < 0.85 ? pool.medium : pool.long;
  else bucket = roll < 0.25 ? pool.short : roll < 0.7 ? pool.medium : pool.long;
  if (bucket.length === 0) bucket = pool.medium.length ? pool.medium : pool.short;

  // Prefer a word that doesn't share a first letter with an active word, so
  // lock-on targeting stays unambiguous. Give up after a few tries.
  const activeFirsts = new Set(active.map((w) => w.text[0]));
  const activeTexts = new Set(active.map((w) => w.text));
  for (let i = 0; i < 8; i++) {
    const word = bucket[Math.floor(Math.random() * bucket.length)];
    if (activeTexts.has(word)) continue;
    if (i < 5 && activeFirsts.has(word[0])) continue;
    return word;
  }
  return bucket[Math.floor(Math.random() * bucket.length)];
}

let uid = 0;

export default function Play() {
  const posthog = usePostHog();
  const [phase, setPhase] = useState<Phase>("idle");
  const [words, setWords] = useState<FallingWord[]>([]);
  const [dying, setDying] = useState<DyingWord[]>([]);
  const [lasers, setLasers] = useState<Laser[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [lockedId, setLockedId] = useState<number | null>(null);
  const [typedCount, setTypedCount] = useState(0);
  const [typingWpm, setTypingWpm] = useState(0);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [tint, setTint] = useState<string | null>(null);
  const [hurt, setHurt] = useState(false);
  const [promptError, setPromptError] = useState(false);
  const [shotKey, setShotKey] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0));

  const fieldRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordEls = useRef(new Map<number, HTMLDivElement>());

  const phaseRef = useRef<Phase>("idle");
  const wordsRef = useRef<FallingWord[]>([]);
  const lockedRef = useRef<{ id: number; typed: number } | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const poolRef = useRef<WordBuckets | null>(null);
  const spawnAcc = useRef(0);
  const lastFrame = useRef(0);
  const rafId = useRef(0);
  const keystrokes = useRef<number[]>([]);
  const peakTypeWpm = useRef(0);
  const milestoneIdx = useRef(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafId.current);
      for (const t of timeouts.current) clearTimeout(t);
    };
  }, []);

  const setLock = useCallback((lock: { id: number; typed: number } | null) => {
    lockedRef.current = lock;
    setLockedId(lock?.id ?? null);
    setTypedCount(lock?.typed ?? 0);
  }, []);

  const removeWord = useCallback((id: number) => {
    wordsRef.current = wordsRef.current.filter((w) => w.id !== id);
    wordEls.current.delete(id);
    setWords(wordsRef.current.slice());
  }, []);

  const gameOver = useCallback(() => {
    phaseRef.current = "over";
    setPhase("over");
    setLock(null);
    wordsRef.current = [];
    wordEls.current.clear();
    setWords([]);
    const finalScore = scoreRef.current;
    setBest((prev) => {
      const next = Math.max(prev, finalScore);
      localStorage.setItem(BEST_KEY, String(next));
      return next;
    });
    posthog?.capture("typist_game_over", {
      score: finalScore,
      peak_typing_wpm: peakTypeWpm.current,
      fall_wpm: fallWpm(finalScore),
    });
  }, [posthog, setLock]);

  const loseLife = useCallback((word: FallingWord) => {
    removeWord(word.id);
    if (lockedRef.current?.id === word.id) setLock(null);
    livesRef.current -= 1;
    setLives(livesRef.current);
    setHurt(true);
    later(() => setHurt(false), 900);
    if (livesRef.current <= 0) gameOver();
  }, [removeWord, setLock, later, gameOver]);

  const destroyWord = useCallback((word: FallingWord) => {
    const field = fieldRef.current;
    const el = wordEls.current.get(word.id);
    const nodeEl = nodeRef.current;

    if (field && el && nodeEl) {
      const fieldRect = field.getBoundingClientRect();
      const wordRect = el.getBoundingClientRect();
      const nodeRect = nodeEl.getBoundingClientRect();
      const x1 = nodeRect.left + nodeRect.width / 2 - fieldRect.left;
      const y1 = nodeRect.top + nodeRect.height * 0.3 - fieldRect.top;
      const x2 = wordRect.left + wordRect.width / 2 - fieldRect.left;
      const y2 = wordRect.top + wordRect.height / 2 - fieldRect.top;
      const laser: Laser = {
        id: word.id,
        x: x1,
        y: y1,
        length: Math.hypot(x2 - x1, y2 - y1),
        angle: Math.atan2(y2 - y1, x2 - x1),
      };
      setLasers((prev) => [...prev, laser]);
      later(() => setLasers((prev) => prev.filter((l) => l.id !== laser.id)), 200);

      const corpse: DyingWord = {
        id: word.id,
        text: word.text,
        x: wordRect.left - fieldRect.left,
        y: wordRect.top - fieldRect.top,
        letters: word.text.split("").map(() => ({
          tx: (Math.random() - 0.5) * 60,
          ty: 60 + Math.random() * 80,
          rot: (Math.random() - 0.5) * 220,
        })),
      };
      setDying((prev) => [...prev, corpse]);
      later(() => setDying((prev) => prev.filter((d) => d.id !== corpse.id)), 900);
    }

    removeWord(word.id);
    setShotKey((k) => k + 1);
    scoreRef.current += 1;
    setScore(scoreRef.current);

    // Milestone check against the new fall rate
    const wpm = fallWpm(scoreRef.current);
    while (milestoneIdx.current < MILESTONES.length && wpm >= MILESTONES[milestoneIdx.current]) {
      const idx = milestoneIdx.current;
      milestoneIdx.current += 1;
      const color = MILESTONE_COLORS[idx % MILESTONE_COLORS.length];
      const celebration: Milestone = {
        wpm: MILESTONES[idx],
        color,
        key: idx,
        burst: Array.from({ length: 14 }, () => {
          const angle = Math.random() * Math.PI * 2;
          const dist = 50 + Math.random() * 70;
          return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
        }),
      };
      setMilestone(celebration);
      setTint(color);
      later(() => setMilestone((m) => (m?.key === idx ? null : m)), 2200);
      posthog?.capture("typist_milestone", { wpm: MILESTONES[idx] });
    }
  }, [removeWord, later, posthog]);

  const flashError = useCallback(() => {
    setPromptError(true);
    later(() => setPromptError(false), 250);
  }, [later]);

  const processChar = useCallback((raw: string) => {
    if (phaseRef.current !== "playing") return;
    const ch = raw.toLowerCase();
    if (!/^[a-z0-9-]$/.test(ch)) return;

    const lock = lockedRef.current;
    if (lock) {
      const word = wordsRef.current.find((w) => w.id === lock.id);
      if (!word) {
        setLock(null);
        return;
      }
      if (word.text[lock.typed] === ch) {
        keystrokes.current.push(performance.now());
        if (lock.typed + 1 >= word.text.length) {
          setLock(null);
          destroyWord(word);
        } else {
          setLock({ id: lock.id, typed: lock.typed + 1 });
        }
      } else {
        flashError();
      }
      return;
    }

    // No lock yet — target the lowest (most urgent) word starting with ch
    const candidates = wordsRef.current.filter((w) => w.text[0] === ch);
    if (candidates.length === 0) {
      flashError();
      return;
    }
    const target = candidates.reduce((a, b) => (a.y > b.y ? a : b));
    keystrokes.current.push(performance.now());
    setLock({ id: target.id, typed: 1 });
  }, [setLock, destroyWord, flashError]);

  const frame = useCallback((t: number) => {
    if (phaseRef.current !== "playing") return;
    const dt = lastFrame.current ? Math.min(t - lastFrame.current, 100) : 16;
    lastFrame.current = t;

    const field = fieldRef.current;
    if (field) {
      const floorY = field.clientHeight - FLOOR_OFFSET;
      const wpm = fallWpm(scoreRef.current);

      spawnAcc.current += dt;
      const interval = 60000 / wpm;
      if (spawnAcc.current >= interval && poolRef.current) {
        spawnAcc.current = 0;
        const duration = fallDurationMs(wpm);
        const spawned: FallingWord = {
          id: ++uid,
          text: pickWord(poolRef.current, wpm, wordsRef.current),
          xPct: 4 + Math.random() * 66,
          y: -28,
          pxPerMs: (floorY + 28) / duration,
        };
        wordsRef.current = [...wordsRef.current, spawned];
        setWords(wordsRef.current.slice());
      }

      const landed: FallingWord[] = [];
      for (const w of wordsRef.current) {
        w.y += w.pxPerMs * dt;
        if (w.y >= floorY) {
          landed.push(w);
        } else {
          const el = wordEls.current.get(w.id);
          if (el) el.style.transform = `translateY(${w.y}px)`;
        }
      }
      for (const w of landed) loseLife(w);

      // Rolling typing speed over the last 10 seconds
      const cutoff = performance.now() - 10000;
      keystrokes.current = keystrokes.current.filter((ts) => ts >= cutoff);
      const measured = Math.round((keystrokes.current.length / 5) * 6);
      peakTypeWpm.current = Math.max(peakTypeWpm.current, measured);
      setTypingWpm(measured);
    }

    rafId.current = requestAnimationFrame(frame);
  }, [loseLife]);

  const start = useCallback(() => {
    if (phaseRef.current === "playing") return;
    poolRef.current ??= buildWordPool();
    wordsRef.current = [];
    wordEls.current.clear();
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    milestoneIdx.current = 0;
    keystrokes.current = [];
    peakTypeWpm.current = 0;
    spawnAcc.current = 60000 / START_FALL_WPM; // first word appears immediately
    lastFrame.current = 0;
    setWords([]);
    setDying([]);
    setLasers([]);
    setScore(0);
    setLives(MAX_LIVES);
    setLock(null);
    setTypingWpm(0);
    setMilestone(null);
    setTint(null);
    setHurt(false);
    phaseRef.current = "playing";
    setPhase("playing");
    posthog?.capture("typist_game_started");
    inputRef.current?.focus();
    rafId.current = requestAnimationFrame(frame);
  }, [frame, posthog, setLock]);

  // Enter starts/restarts even when the hidden input isn't focused
  useEffect(() => {
    if (phase === "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, start]);

  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    e.currentTarget.value = "";
    for (const ch of value) processChar(ch);
  }, [processChar]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && phaseRef.current !== "playing") {
      start();
    } else if (e.key === "Backspace") {
      const lock = lockedRef.current;
      if (lock) setLock(lock.typed > 1 ? { id: lock.id, typed: lock.typed - 1 } : null);
    } else if (e.key === "Escape") {
      setLock(null);
    }
  }, [start, setLock]);

  const lockedWord = lockedId !== null ? words.find((w) => w.id === lockedId) : undefined;
  const wpm = fallWpm(score);

  return (
    <div className="typist-page">
      <SeoMeta
        title="Terminal Typist — a game with Node"
        description="Type the falling words — harvested from my writing — before they hit the prompt line. Node handles the lasers."
        url={`${SITE.url}/play`}
      />

      <div
        className="typist-window"
        onClick={() => inputRef.current?.focus()}
        onKeyDown={() => {}}
        role="presentation"
      >
        <div className="typist-titlebar">
          <span>node@rameez.co — terminal-typist</span>
          <span className="typist-hud">
            <span>score <strong>{score}</strong></span>
            <span>fall <strong>{wpm}</strong> wpm</span>
            <span>type <strong>{typingWpm}</strong> wpm</span>
            <span className="typist-lives">{"●".repeat(lives)}{"○".repeat(MAX_LIVES - lives)}</span>
          </span>
        </div>

        <div className="typist-field" ref={fieldRef}>
          {words.map((w) => (
            <div
              key={w.id}
              ref={(el) => {
                if (el) {
                  wordEls.current.set(w.id, el);
                  el.style.transform = `translateY(${w.y}px)`;
                } else {
                  wordEls.current.delete(w.id);
                }
              }}
              className={`typist-word${w.id === lockedId ? " typist-word-locked" : ""}`}
              style={{ left: `${w.xPct}%` }}
            >
              {w.id === lockedId ? (
                <>
                  <span className="typist-word-typed">{w.text.slice(0, typedCount)}</span>
                  {w.text.slice(typedCount)}
                </>
              ) : (
                w.text
              )}
            </div>
          ))}

          {dying.map((d) => (
            <div
              key={`dying-${d.id}`}
              className="typist-word typist-word-dying"
              style={{ left: d.x, top: d.y }}
            >
              {d.text.split("").map((ch, i) => (
                <span
                  key={`${d.id}-${i}-${ch}`}
                  style={{
                    "--tx": `${d.letters[i].tx}px`,
                    "--ty": `${d.letters[i].ty}px`,
                    "--rot": `${d.letters[i].rot}deg`,
                    animationDelay: `${i * 18}ms`,
                  } as React.CSSProperties}
                >
                  {ch}
                </span>
              ))}
            </div>
          ))}

          {lasers.map((l) => (
            <div
              key={`laser-${l.id}`}
              className="typist-laser"
              style={{
                left: l.x,
                top: l.y,
                width: l.length,
                transform: `rotate(${l.angle}rad)`,
              }}
            />
          ))}

          {milestone && (
            <div key={`banner-${milestone.key}`} className="typist-milestone-banner" style={{ color: milestone.color }}>
              ⚡ {milestone.wpm} wpm
            </div>
          )}

          <div
            className={`typist-node${hurt ? " typist-node-hurt" : ""}`}
            ref={nodeRef}
            style={tint ? ({ color: tint, "--accent": tint } as React.CSSProperties) : undefined}
          >
            {milestone && (
              <span key={`burst-${milestone.key}`} className="typist-burst">
                {milestone.burst.map((b, i) => (
                  <span
                    key={`${milestone.key}-${i}-${b.tx}`}
                    style={{
                      "--tx": `${b.tx}px`,
                      "--ty": `${b.ty}px`,
                      background: milestone.color,
                      animationDelay: `${i * 12}ms`,
                    } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
            <span key={shotKey} className="typist-node-inner">
              {hurt ? (
                <MascotSurprisedSvg width={56} height={56} />
              ) : (
                <MascotDefaultSvg width={56} height={56} />
              )}
            </span>
          </div>

          <div className="typist-floor" />

          {phase === "idle" && (
            <div className="typist-overlay">
              <MascotDefaultSvg width={72} height={72} />
              <h1 className="typist-overlay-title">Terminal Typist</h1>
              <p className="typist-overlay-desc">
                Words from my writing fall from the top. Type them before they
                hit the line — Node handles the lasers.
              </p>
              <button type="button" className="typist-start" onClick={start}>
                start [enter]
              </button>
              {best > 0 && <p className="typist-overlay-hint">best: {best}</p>}
            </div>
          )}

          {phase === "over" && (
            <div className="typist-overlay">
              <MascotSurprisedSvg width={72} height={72} />
              <h1 className="typist-overlay-title">node panicked</h1>
              <dl className="typist-stats">
                <div><dt>score</dt><dd>{score}</dd></div>
                <div><dt>best</dt><dd>{best}</dd></div>
                <div><dt>fall rate</dt><dd>{wpm} wpm</dd></div>
                <div><dt>peak typing</dt><dd>{peakTypeWpm.current} wpm</dd></div>
              </dl>
              <button type="button" className="typist-start" onClick={start}>
                again [enter]
              </button>
              <Link to="/" className="typist-overlay-hint typist-overlay-link">← back to safety</Link>
            </div>
          )}
        </div>

        <div className={`typist-prompt${promptError ? " typist-prompt-error" : ""}`}>
          <span className="typist-prompt-ps1">$</span>
          <span className="typist-prompt-text">
            {lockedWord ? lockedWord.text.slice(0, typedCount) : ""}
          </span>
          <span className="typist-cursor" />
          <input
            ref={inputRef}
            className="typist-hidden-input"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Type the falling words"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (phaseRef.current === "playing") {
                setTimeout(() => inputRef.current?.focus(), 0);
              }
            }}
          />
        </div>
      </div>

      <p className="typist-caption">
        Every word is harvested from my posts and notes — you're literally
        typing my writing back at me.
      </p>
    </div>
  );
}
