import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePostHog } from "../lib/analytics";
import { MascotDefaultSvg, MascotSurprisedSvg } from "../components/MascotSvg";
import { tauntNode } from "../lib/nodeBrain";
import { rememberGame } from "../lib/nodeMemory";

// QWOP for a mascot with no legs: Node grows a pair and has to physically
// walk a deploy from localhost to production. Q/W drive the hips, O/P the
// knees. The physics is a tiny Verlet ragdoll — point masses + distance
// constraints + angular "muscles" — so every run is a wobbling disaster,
// which is the point.

const PX_PER_M = 30;
const FLOOR_FROM_BOTTOM = 64;
const TORSO_LEN = 55;
const THIGH_LEN = 38;
const SHIN_LEN = 38;
const GRAVITY = 1700; // px/s²
const DT = 1 / 60;
const BEST_KEY = "walk-best";
const PROD_M = 100;

const STAGES = [
  { at: 0, label: "localhost" },
  { at: 20, label: "ci" },
  { at: 50, label: "staging" },
  { at: PROD_M, label: "prod" },
];

type Phase = "idle" | "playing" | "over" | "shipped";

interface Pt {
  x: number;
  y: number;
  px: number;
  py: number;
}

const pt = (x: number, y: number): Pt => ({ x, y, px: x, py: y });

function constrain(a: Pt, b: Pt, len: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 0.0001;
  const diff = (d - len) / d / 2;
  a.x += dx * diff;
  a.y += dy * diff;
  b.x -= dx * diff;
  b.y -= dy * diff;
}

// Limb angle: 0 = hanging straight down, positive = swung forward (+x)
function angleOf(j: Pt, end: Pt): number {
  return Math.atan2(end.x - j.x, end.y - j.y);
}

function rotateAround(p: Pt, j: Pt, rot: number) {
  const dx = p.x - j.x;
  const dy = p.y - j.y;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  p.x = j.x + dx * c - dy * s;
  p.y = j.y + dx * s + dy * c;
}

// Rotates `end` (and anything attached below it) toward a target angle.
// Strength < 1 so muscles fight gravity and momentum rather than teleport.
function muscle(j: Pt, end: Pt, target: number, k: number, carry: Pt[] = []) {
  let d = target - angleOf(j, end);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  // rotateAround() decreases the atan2(dx, dy) angle for positive rot
  // (y grows downward), so drive it with the negated delta.
  const rot = -d * k;
  rotateAround(end, j, rot);
  for (const c of carry) rotateAround(c, j, rot);
}

interface World {
  neck: Pt;
  hip: Pt;
  lk: Pt;
  rk: Pt;
  lf: Pt;
  rf: Pt;
  startX: number;
  t: number; // elapsed seconds, drives the satellite-dot wobble
}

function makeWorld(floorY: number): World {
  const startX = 0;
  return {
    neck: pt(startX, floorY - TORSO_LEN - THIGH_LEN - SHIN_LEN),
    hip: pt(startX, floorY - THIGH_LEN - SHIN_LEN),
    lk: pt(startX + 5, floorY - SHIN_LEN),
    rk: pt(startX - 5, floorY - SHIN_LEN),
    lf: pt(startX + 11, floorY),
    rf: pt(startX - 11, floorY),
    startX,
    t: 0,
  };
}

function stageFor(m: number): string {
  let label = STAGES[0].label;
  for (const s of STAGES) if (m >= s.at) label = s.label;
  return label;
}

export default function WalkToProd() {
  const posthog = usePostHog();
  const [phase, setPhase] = useState<Phase>("idle");
  const [distance, setDistance] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0));
  const [taunt, setTaunt] = useState<string | null>(null);
  const [touch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [heldKeys, setHeldKeys] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const worldRef = useRef<World | null>(null);
  const keysRef = useRef(new Set<string>());
  const rafId = useRef(0);
  const lastFrame = useRef(0);
  const acc = useRef(0);
  const distRef = useRef(0);
  const maxDistRef = useRef(0);
  const stageIdx = useRef(0);
  const floorYRef = useRef(0);

  const finish = useCallback((shipped: boolean) => {
    phaseRef.current = shipped ? "shipped" : "over";
    setPhase(phaseRef.current);
    const finalM = Math.round(Math.max(distRef.current, maxDistRef.current) * 10) / 10;
    setBest((prev) => {
      const next = Math.max(prev, finalM);
      localStorage.setItem(BEST_KEY, String(next));
      return next;
    });
    posthog?.capture("walk_game_over", { distance: finalM, shipped });
    rememberGame(finalM);
    setTaunt(null);
    tauntNode(finalM, 0, shipped ? "walk-shipped" : "walk")
      .then((line) => {
        if (line && phaseRef.current !== "playing") setTaunt(line);
      })
      .catch(() => {});
  }, [posthog]);

  const step = useCallback((world: World) => {
    const floorY = floorYRef.current;
    const keys = keysRef.current;
    const pts = [world.neck, world.hip, world.lk, world.rk, world.lf, world.rf];
    world.t += DT;

    // Verlet integration with capped velocity so the ragdoll can't explode
    for (const p of pts) {
      let vx = (p.x - p.px) * 0.995;
      let vy = (p.y - p.py) * 0.995;
      vx = Math.max(-22, Math.min(22, vx));
      vy = Math.max(-22, Math.min(22, vy));
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + GRAVITY * DT * DT;
    }

    // Muscles. Thigh targets are relative to the torso axis (lean carries
    // into the stride, QWOP-style); knees are relative to their thigh.
    const torsoA = angleOf(world.neck, world.hip);
    const q = keys.has("q");
    const w = keys.has("w");
    const o = keys.has("o");
    const p = keys.has("p");

    const lThigh = torsoA + (q ? 1.0 : w ? -0.7 : 0.1);
    const rThigh = torsoA + (w ? 1.0 : q ? -0.7 : -0.1);
    muscle(world.hip, world.lk, lThigh, q || w ? 0.1 : 0.12, [world.lf]);
    muscle(world.hip, world.rk, rThigh, q || w ? 0.1 : 0.12, [world.rf]);

    const lShin = angleOf(world.hip, world.lk) + (o ? 0.9 : p ? -0.9 : 0);
    const rShin = angleOf(world.hip, world.rk) + (p ? 0.9 : o ? -0.9 : 0);
    muscle(world.lk, world.lf, lShin, o || p ? 0.1 : 0.12);
    muscle(world.rk, world.rf, rShin, o || p ? 0.1 : 0.12);

    // Upright reflex — enough to stand idle, overpowered once you wobble
    muscle(world.hip, world.neck, Math.PI, 0.05);

    // Rigid limbs
    for (let i = 0; i < 6; i++) {
      constrain(world.neck, world.hip, TORSO_LEN);
      constrain(world.hip, world.lk, THIGH_LEN);
      constrain(world.lk, world.lf, SHIN_LEN);
      constrain(world.hip, world.rk, THIGH_LEN);
      constrain(world.rk, world.rf, SHIN_LEN);
    }

    // Ground: feet grip hard, knees skid, torso hitting the floor is a fall
    for (const part of pts) {
      if (part.y > floorY) {
        part.y = floorY;
        const grip = part === world.lf || part === world.rf ? 0.99 : 0.4;
        part.x -= (part.x - part.px) * grip;
      }
    }

    distRef.current = (world.hip.x - world.startX) / PX_PER_M;
    maxDistRef.current = Math.max(maxDistRef.current, distRef.current);

    // Stage milestones
    while (
      stageIdx.current < STAGES.length - 1 &&
      distRef.current >= STAGES[stageIdx.current + 1].at
    ) {
      stageIdx.current += 1;
      posthog?.capture("walk_stage_reached", { stage: STAGES[stageIdx.current].label });
    }

    if (distRef.current >= PROD_M) {
      finish(true);
    } else if (world.neck.y > floorY - 38 || world.hip.y > floorY - 22) {
      // Head or hip on the deck — the deploy is over
      finish(false);
    }
  }, [finish, posthog]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const world = worldRef.current;
    if (!canvas || !world) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const fg = css.getPropertyValue("--fg").trim() || "#222";
    const accent = css.getPropertyValue("--accent").trim() || "#ff6b2b";
    const dim = css.getPropertyValue("--muted").trim() || fg;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const floorY = floorYRef.current;
    const camX = world.hip.x - W * 0.38;
    ctx.save();
    ctx.translate(-camX, 0);

    // Floor + meter ruler + stage flags
    ctx.strokeStyle = fg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camX - 50, floorY + 1);
    ctx.lineTo(camX + W + 50, floorY + 1);
    ctx.stroke();

    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    const firstTick = Math.floor((camX - 50) / PX_PER_M / 10) * 10;
    for (let m = Math.max(0, firstTick); m * PX_PER_M < camX + W + 50; m += 10) {
      const x = world.startX + m * PX_PER_M;
      ctx.strokeStyle = dim;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, floorY + 1);
      ctx.lineTo(x, floorY + 7);
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = dim;
      ctx.fillText(`${m}m`, x, floorY + 20);
      ctx.globalAlpha = 1;
    }
    for (const s of STAGES) {
      const x = world.startX + s.at * PX_PER_M;
      const isProd = s.at === PROD_M;
      ctx.strokeStyle = isProd ? accent : fg;
      ctx.lineWidth = isProd ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x, floorY - 34);
      ctx.stroke();
      ctx.fillStyle = isProd ? accent : fg;
      ctx.beginPath();
      ctx.moveTo(x, floorY - 34);
      ctx.lineTo(x + 14, floorY - 29);
      ctx.lineTo(x, floorY - 24);
      ctx.closePath();
      ctx.fill();
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(s.label, x, floorY + 34);
    }

    // Legs — same stroke style as the mascot
    ctx.strokeStyle = fg;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [k, f] of [
      [world.lk, world.lf],
      [world.rk, world.rf],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(world.hip.x, world.hip.y);
      ctx.lineTo(k.x, k.y);
      ctx.lineTo(f.x, f.y);
      ctx.stroke();
      // Little foot
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + 8, f.y);
      ctx.stroke();
    }

    // Torso: Node's rounded-rect body drawn along the neck→hip axis,
    // satellite dots wobbling like the real mascot
    const midX = (world.neck.x + world.hip.x) / 2;
    const midY = (world.neck.y + world.hip.y) / 2;
    const tilt = Math.atan2(world.hip.x - world.neck.x, world.hip.y - world.neck.y);
    const crashed = phaseRef.current === "over";
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(-tilt + (crashed ? 0.2 : 0));
    ctx.strokeStyle = fg;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-26, -25, 52, 50, 21);
    ctx.stroke();
    const wob = world.t;
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(Math.sin(wob * 2.1) * 2, -34 + Math.sin(wob * 2.6) * 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-21 + Math.sin(wob * 1.8) * 1.5, 29, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(21 + Math.sin(wob * 2.3) * 1.5, 29, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(Math.sin(wob * 2.4) * 2.5, Math.cos(wob * 2.2) * 2.5, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.restore();
  }, []);

  const frame = useCallback((t: number) => {
    if (phaseRef.current !== "playing") return;
    const dt = lastFrame.current ? Math.min(t - lastFrame.current, 60) : 16;
    lastFrame.current = t;
    acc.current += dt / 1000;
    const world = worldRef.current;
    if (world) {
      while (acc.current >= DT && phaseRef.current === "playing") {
        acc.current -= DT;
        step(world);
      }
      draw();
      setDistance(Math.round(distRef.current * 10) / 10);
    }
    if (phaseRef.current === "playing") {
      rafId.current = requestAnimationFrame(frame);
    } else {
      draw(); // final pose under the overlay
    }
  }, [step, draw]);

  const start = useCallback(() => {
    if (phaseRef.current === "playing") return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (wrap && canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
      floorYRef.current = wrap.clientHeight - FLOOR_FROM_BOTTOM;
    }
    worldRef.current = makeWorld(floorYRef.current);
    keysRef.current.clear();
    setHeldKeys([]);
    distRef.current = 0;
    maxDistRef.current = 0;
    stageIdx.current = 0;
    lastFrame.current = 0;
    acc.current = 0;
    setDistance(0);
    setTaunt(null);
    phaseRef.current = "playing";
    setPhase("playing");
    posthog?.capture("walk_game_started");
    rafId.current = requestAnimationFrame(frame);
  }, [frame, posthog]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // Keyboard: QWOP keys while playing, Enter to start/restart
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (phaseRef.current !== "playing" && (k === "enter" || k === " ")) {
        e.preventDefault();
        start();
        return;
      }
      if (["q", "w", "o", "p"].includes(k)) {
        e.preventDefault();
        if (!keysRef.current.has(k)) {
          keysRef.current.add(k);
          setHeldKeys([...keysRef.current]);
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keysRef.current.delete(k)) setHeldKeys([...keysRef.current]);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start]);

  const holdKey = useCallback((k: string, held: boolean) => {
    if (held) keysRef.current.add(k);
    else keysRef.current.delete(k);
    setHeldKeys([...keysRef.current]);
  }, []);

  const meters = Math.round(distance * 10) / 10;

  return (
    <div className="typist-page">
      <div className="typist-window">
        <div className="typist-titlebar">
          <span>node@rameez.co — walk-to-prod</span>
          <span className="typist-hud">
            <span>dist <strong>{meters.toFixed(1)}m</strong></span>
            <span>stage <strong>{stageFor(meters)}</strong></span>
            <span>best <strong>{best.toFixed(1)}m</strong></span>
          </span>
        </div>

        <div className="walk-field" ref={wrapRef}>
          <canvas ref={canvasRef} className="walk-canvas" />

          {phase === "idle" && (
            <div className="typist-overlay">
              <MascotDefaultSvg width={72} height={72} />
              <h1 className="typist-overlay-title">Walk to Prod</h1>
              <p className="typist-overlay-desc">
                Node grew legs and has to walk this deploy to production —
                100m past ci and staging. <strong>Q/W</strong> drive the hips,{" "}
                <strong>O/P</strong> the knees. It's harder than your last
                on-call shift.
              </p>
              <button type="button" className="typist-start" onClick={start}>
                start [enter]
              </button>
              {best > 0 && <p className="typist-overlay-hint">best: {best.toFixed(1)}m</p>}
            </div>
          )}

          {phase === "over" && (
            <div className="typist-overlay">
              <MascotSurprisedSvg width={72} height={72} />
              <h1 className="typist-overlay-title">ROLLBACK!</h1>
              {taunt && <p className="typist-taunt">“{taunt}”</p>}
              <dl className="typist-stats">
                <div><dt>distance</dt><dd>{Math.max(meters, 0).toFixed(1)}m</dd></div>
                <div><dt>stage</dt><dd>{stageFor(Math.max(maxDistRef.current, 0))}</dd></div>
                <div><dt>best</dt><dd>{best.toFixed(1)}m</dd></div>
              </dl>
              <button type="button" className="typist-start" onClick={start}>
                redeploy [enter]
              </button>
              <Link to="/" className="typist-overlay-hint typist-overlay-link">← back to safety</Link>
            </div>
          )}

          {phase === "shipped" && (
            <div className="typist-overlay">
              <MascotDefaultSvg width={72} height={72} />
              <h1 className="typist-overlay-title">SHIPPED TO PROD 🚀</h1>
              {taunt && <p className="typist-taunt">“{taunt}”</p>}
              <dl className="typist-stats">
                <div><dt>distance</dt><dd>{PROD_M}m</dd></div>
                <div><dt>status</dt><dd>deployed</dd></div>
              </dl>
              <button type="button" className="typist-start" onClick={start}>
                ship again [enter]
              </button>
            </div>
          )}

          {touch && phase === "playing" && (
            <div className="walk-touch" aria-hidden="true">
              {(["q", "w", "o", "p"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`walk-touch-btn${heldKeys.includes(k) ? " walk-touch-held" : ""}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    holdKey(k, true);
                  }}
                  onPointerUp={() => holdKey(k, false)}
                  onPointerLeave={() => holdKey(k, false)}
                >
                  {k.toUpperCase()}
                  <small>{k === "q" || k === "w" ? "hip" : "knee"}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="typist-prompt">
          <span className="typist-prompt-ps1">$</span>
          <span className="typist-prompt-text">
            {phase === "playing"
              ? `deploying... [${heldKeys.length ? heldKeys.join("+").toUpperCase() : "Q/W hips · O/P knees"}]`
              : "./deploy.sh --walk"}
          </span>
          <span className="typist-cursor" />
        </div>
      </div>

      <p className="typist-caption">
        Node has no legs. This is what happens when you ask him to walk a
        deploy to production anyway.
      </p>
    </div>
  );
}
