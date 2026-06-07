import { useEffect, useRef, useState, useCallback } from "react";

interface GuideState {
  visible: boolean;
  variant: "default" | "surprised" | "thinking";
  message: string;
  animation: "none" | "wave" | "celebrate";
}

const svgMap = {
  default: "/mascot.svg",
  surprised: "/mascot-surprised.svg",
  thinking: "/mascot-thinking.svg",
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
    visible: false,
    variant: "default",
    message: "",
    animation: "none",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
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
      setState({
        visible: true,
        variant: detail.variant,
        message: detail.message,
        animation: detail.animation,
      });
      timerRef.current = setTimeout(() => {
        hide();
      }, detail.duration);
    }
    window.addEventListener("node-guide:show", handleShow);
    return () => {
      window.removeEventListener("node-guide:show", handleShow);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hide]);

  useEffect(() => {
    const waved = sessionStorage.getItem("node-waved");
    if (waved) return;
    const t = setTimeout(() => {
      triggerNodeGuide("Hey! I'm Node. Welcome!", "default", "wave", 4000);
      sessionStorage.setItem("node-waved", "1");
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  if (!state.visible) return null;

  const animationClass =
    state.animation === "wave"
      ? "node-guide-wave"
      : state.animation === "celebrate"
        ? "node-guide-celebrate"
        : "";

  return (
    <output
      className={`node-guide ${animationClass}`}
      aria-live="polite"
    >
      <div className="node-guide-bubble">
        <span className="node-guide-text">{state.message}</span>
        <span className="node-guide-tail" aria-hidden="true" />
      </div>
      <img
        src={svgMap[state.variant]}
        alt=""
        width={48}
        height={48}
        className={`node-guide-img mascot-animated-${state.variant}`}
        aria-hidden="true"
      />
    </output>
  );
}
