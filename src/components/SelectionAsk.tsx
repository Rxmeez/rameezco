import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MascotDefaultSvg } from "./MascotSvg";
import { usePostHog } from "../lib/analytics";

// Select text inside a post → a small "Ask Node" button floats up next to
// the selection. Clicking it opens the chat pre-seeded with the passage.
export default function SelectionAsk() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const selectedText = useRef("");
  const location = useLocation();
  const posthog = usePostHog();

  const onArticlePage = /^\/(writing|notes)\/[^/]+$/.test(location.pathname);

  const updateFromSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (
      !selection ||
      selection.isCollapsed ||
      text.length < 12 ||
      text.length > 600 ||
      !(selection.anchorNode?.parentElement?.closest(".post-content"))
    ) {
      setPos(null);
      return;
    }
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    selectedText.current = text;
    setPos({
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 90),
      y: rect.top - 10,
    });
  }, []);

  useEffect(() => {
    if (!onArticlePage) {
      setPos(null);
      return;
    }
    const handle = () => {
      // Let the browser finish updating the selection first
      setTimeout(updateFromSelection, 10);
    };
    document.addEventListener("pointerup", handle);
    document.addEventListener("keyup", handle);
    const clearOnScroll = () => setPos(null);
    window.addEventListener("scroll", clearOnScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerup", handle);
      document.removeEventListener("keyup", handle);
      window.removeEventListener("scroll", clearOnScroll);
    };
  }, [onArticlePage, updateFromSelection]);

  if (!pos) return null;

  return (
    <button
      type="button"
      className="selection-ask"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => {
        const passage = selectedText.current.slice(0, 400);
        posthog?.capture("selection_ask_clicked", { length: passage.length });
        window.dispatchEvent(
          new CustomEvent("node-chat:ask", {
            detail: { question: `Explain this part of the page: "${passage}"` },
          }),
        );
        window.getSelection()?.removeAllRanges();
        setPos(null);
      }}
    >
      <MascotDefaultSvg width={20} height={20} />
      <span>Ask Node</span>
    </button>
  );
}
