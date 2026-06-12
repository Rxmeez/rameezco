import { useEffect, useRef, useState, useCallback } from "react";
import { MascotDefaultSvg, MascotSurprisedSvg, MascotThinkingSvg } from "./MascotSvg";
import { getReturningGreeting, rememberName, shouldAskName, markNameAsked } from "../lib/nodeMemory";

interface GuideState {
  showing: boolean;
  fadingOut: boolean;
  variant: "default" | "surprised" | "thinking";
  message: string;
  animation: "none" | "wave" | "celebrate";
  mode: "message" | "ask-name";
}

const SvgMap = {
  default: MascotDefaultSvg,
  surprised: MascotSurprisedSvg,
  thinking: MascotThinkingSvg,
};

export function triggerNodeGuide(
  message: string,
  variant: GuideState["variant"] = "default",
  animation: GuideState["animation"] = "none",
  duration = 3000,
) {
  window.dispatchEvent(
    new CustomEvent("node-guide:show", {
      detail: { message, variant, animation, duration },
    }),
  );
}

// Opens the bubble with an inline name input (consent-gated upstream)
export function triggerNodeAskName() {
  window.dispatchEvent(
    new CustomEvent("node-guide:show", {
      detail: {
        message: "By the way — what should I call you?",
        variant: "default",
        animation: "none",
        duration: 30000,
        mode: "ask-name",
      },
    }),
  );
}

export default function NodeGuide() {
  const [state, setState] = useState<GuideState>({
    showing: false,
    fadingOut: false,
    variant: "default",
    message: "",
    animation: "none",
    mode: "message",
  });
  const [nameInput, setNameInput] = useState("");
  const [hovered, setHovered] = useState(false);
  const [cursorRotation, setCursorRotation] = useState(0);
  const guideRef = useRef<HTMLOutputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(() => {
          const rect = guideRef.current?.getBoundingClientRect();
          if (rect) {
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rot = dist < 220 ? (dx / 220) * 10 : 0;
            setCursorRotation(rot);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const doHide = useCallback(() => {
    setState((s) => ({ ...s, fadingOut: true }));
    exitTimerRef.current = setTimeout(() => {
      setState({
        showing: false,
        fadingOut: false,
        variant: "default",
        message: "",
        animation: "none",
        mode: "message",
      });
    }, 250);
  }, []);

  useEffect(() => {
    function handleShow(e: Event) {
      const detail = (e as CustomEvent).detail as {
        message: string;
        variant: GuideState["variant"];
        animation: GuideState["animation"];
        duration: number;
        mode?: GuideState["mode"];
      };
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      const mode = detail.mode ?? "message";
      // Asking is a one-shot — even if they ignore it, don't nag next visit
      if (mode === "ask-name") markNameAsked();
      setState({
        showing: true,
        fadingOut: false,
        variant: detail.variant,
        message: detail.message,
        animation: detail.animation,
        mode,
      });
      timerRef.current = setTimeout(() => {
        doHide();
      }, detail.duration);
    }
    window.addEventListener("node-guide:show", handleShow);
    return () => {
      window.removeEventListener("node-guide:show", handleShow);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [doHide]);

  useEffect(() => {
    const waved = sessionStorage.getItem("node-waved");
    if (waved) return;
    const t = setTimeout(() => {
      // Consent-gated memory first ("last time you were reading…"),
      // generic greeting otherwise
      const remembered = getReturningGreeting();
      const lastVisit = Number(localStorage.getItem("node-last-visit") ?? 0);
      const daysAway = (Date.now() - lastVisit) / 86400000;
      const greeting =
        remembered ??
        (lastVisit && daysAway > 3
          ? "Welcome back! The graph missed you."
          : "Hey! I'm Node. Welcome!");
      const duration = remembered ? 6500 : 4000;
      triggerNodeGuide(greeting, "default", "wave", duration);
      sessionStorage.setItem("node-waved", "1");
      localStorage.setItem("node-last-visit", String(Date.now()));
      // Consented visitors we haven't named yet get asked, once, after the wave
      setTimeout(() => {
        if (shouldAskName()) triggerNodeAskName();
      }, duration + 800);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const submitName = useCallback(() => {
    if (!nameInput.trim()) {
      // Left blank = "no thanks" — already marked as asked, just close
      doHide();
      return;
    }
    const result = rememberName(nameInput);
    setNameInput("");
    doHide();
    if (!result) return;
    const reply = result.nicknamed
      ? `Let's keep it friendly — I'm calling you ${result.name} instead 😄`
      : `Nice to meet you, ${result.name}! I'll remember that.`;
    setTimeout(() => triggerNodeGuide(reply, "default", "celebrate", 5000), 350);
  }, [nameInput, doHide]);

  if (!state.showing && !state.fadingOut) return null;

  const animClass = state.fadingOut
    ? "node-guide-exit"
    : state.animation === "wave"
      ? "node-guide-wave"
      : state.animation === "celebrate"
        ? "node-guide-celebrate"
        : "node-guide-enter";

  const idleClass =
    !state.fadingOut && state.animation === "none" ? "node-guide-idle" : "";
  const hoverClass = hovered ? "node-guide-hover" : "";

  const imgStyle: React.CSSProperties = {
    transform: `rotate(${cursorRotation}deg)`,
  };

  return (
    <output
      ref={guideRef}
      className={`node-guide ${animClass} ${idleClass} ${hoverClass}`}
      aria-live="polite"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {state.animation === "celebrate" && !state.fadingOut && (
        <div className="node-guide-particles" aria-hidden="true">
          <span className="node-guide-particle" />
          <span className="node-guide-particle" />
          <span className="node-guide-particle" />
          <span className="node-guide-particle" />
          <span className="node-guide-particle" />
          <span className="node-guide-particle" />
        </div>
      )}
      <div className="node-guide-bubble">
        <span className="node-guide-text">{state.message}</span>
        {state.mode === "ask-name" && (
          <form
            className="node-guide-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitName();
            }}
          >
            <input
              className="node-guide-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") doHide();
              }}
              placeholder="Your name"
              maxLength={24}
              aria-label="Tell Node your name"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <button type="submit" className="node-guide-name-submit" aria-label="Save name">
              ↵
            </button>
          </form>
        )}
        <span className="node-guide-tail" aria-hidden="true" />
      </div>
      {(() => {
        const Svg = SvgMap[state.variant];
        return <Svg className={`node-guide-img mascot-animated-${state.variant}`} style={imgStyle} aria-hidden="true" />;
      })()}
    </output>
  );
}
