import { useEffect, useRef, useState, useCallback } from "react";
import { MascotDefaultSvg, MascotSurprisedSvg, MascotThinkingSvg } from "./MascotSvg";

interface GuideState {
  showing: boolean;
  fadingOut: boolean;
  variant: "default" | "surprised" | "thinking";
  message: string;
  animation: "none" | "wave" | "celebrate";
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

export default function NodeGuide() {
  const [state, setState] = useState<GuideState>({
    showing: false,
    fadingOut: false,
    variant: "default",
    message: "",
    animation: "none",
  });
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
      };
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setState({
        showing: true,
        fadingOut: false,
        variant: detail.variant,
        message: detail.message,
        animation: detail.animation,
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
      triggerNodeGuide("Hey! I'm Node. Welcome!", "default", "wave", 4000);
      sessionStorage.setItem("node-waved", "1");
    }, 1200);
    return () => clearTimeout(t);
  }, []);

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
        <span className="node-guide-tail" aria-hidden="true" />
      </div>
      {(() => {
        const Svg = SvgMap[state.variant];
        return <Svg className={`node-guide-img mascot-animated-${state.variant}`} style={imgStyle} aria-hidden="true" />;
      })()}
    </output>
  );
}
