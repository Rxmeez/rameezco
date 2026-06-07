import { useState, useRef, useEffect, useCallback } from "react";
import { MascotDefaultSvg } from "./MascotSvg";
import { initKnowledgeBase, initModels, askNode, getLoadError, resetLoadError } from "../lib/nodeBrain";

interface Message {
  id: string;
  role: "user" | "node";
  text: string;
  sources?: string[];
}

let messageIdCounter = 0;

function createMessage(role: Message["role"], text: string, sources?: string[]): Message {
  messageIdCounter += 1;
  return { id: `msg-${messageIdCounter}`, role, text, sources };
}

export default function NodeChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    createMessage("node", "Hey! I'm Node. Ask me anything about Rameez's work, projects, or writing."),
  ]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const doInit = useCallback(async () => {
    if (ready || loading) return;
    setLoading(true);
    setLoadError(null);
    resetLoadError();

    try {
      await initKnowledgeBase();
      await initModels((p) => setLoadProgress(p));
      setReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to initialize Node:", msg);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [ready, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || thinking) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, createMessage("user", question)]);
    setThinking(true);

    try {
      if (!ready) await doInit();

      const { answer, sources } = await askNode(question);

      setMessages((prev) => [...prev, createMessage("node", answer || "I'm not sure about that one.", sources)]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        createMessage("node", `Error: ${msg}`),
      ]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, ready, doInit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        type="button"
        className="node-chat-button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!ready && !loading && !loadError) {
            doInit();
          }
        }}
        aria-label="Chat with Node"
      >
        <MascotDefaultSvg width={40} height={40} className="node-chat-button-icon" />
        <span className="node-chat-button-label">Ask Node</span>
      </button>

      {open && (
        <div className="node-chat-panel">
          <div className="node-chat-header">
            <div className="node-chat-title">
              <MascotDefaultSvg width={28} height={28} />
              <span>Ask Node</span>
            </div>
            <button
              type="button"
              className="node-chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="node-chat-messages" ref={scrollRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`node-chat-message node-chat-message-${msg.role}`}
              >
                {msg.role === "node" && (
                  <MascotDefaultSvg width={28} height={28} className="node-chat-avatar" />
                )}
                <div className="node-chat-bubble">
                  <div className="node-chat-text">{msg.text}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="node-chat-sources">
                      From: {msg.sources.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="node-chat-message node-chat-message-node">
                <MascotDefaultSvg width={28} height={28} className="node-chat-avatar" />
                <div className="node-chat-bubble">
                  <div className="node-chat-typing">
                    <span className="node-chat-dot" />
                    <span className="node-chat-dot" />
                    <span className="node-chat-dot" />
                  </div>
                </div>
              </div>
            )}

            {loading && !ready && !loadError && (
              <div className="node-chat-loading">
                <div className="node-chat-loading-bar">
                  <div
                    className="node-chat-loading-fill"
                    style={{ width: `${loadProgress * 100}%` }}
                  />
                </div>
                <div className="node-chat-loading-text">
                  Loading Node's brain... {Math.round(loadProgress * 100)}%
                </div>
                <div className="node-chat-loading-hint">
                  This may take up to 2 minutes on first visit. Models are cached afterward.
                </div>
              </div>
            )}

            {loadError && (
              <div className="node-chat-error">
                <div className="node-chat-error-text">{loadError}</div>
                <button
                  type="button"
                  className="node-chat-retry"
                  onClick={() => {
                    setLoadError(null);
                    doInit();
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="node-chat-input-wrap">
            <input
              type="text"
              className="node-chat-input"
              placeholder={ready ? "Ask me anything..." : loadError ? "Reload failed — click Retry" : "Loading models..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!ready || thinking}
            />
            <button
              type="button"
              className="node-chat-send"
              onClick={handleSend}
              disabled={!ready || !input.trim() || thinking}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
