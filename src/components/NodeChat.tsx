import { useState, useRef, useEffect, useCallback } from "react";
import { MascotDefaultSvg } from "./MascotSvg";
import { initKnowledgeBase, initModels, askNode } from "../lib/nodeBrain";

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

  const init = useCallback(async () => {
    if (ready || loading) return;
    setLoading(true);

    try {
      await initKnowledgeBase();
      await initModels((p) => setLoadProgress(p));
      setReady(true);
    } catch (err) {
      console.error("Failed to initialize Node:", err);
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
      if (!ready) await init();

      let answer = "";
      const { answer: fullAnswer, sources } = await askNode(question, (token) => {
        answer += token;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "node" && last.text === answer.slice(0, -token.length)) {
            return [...prev.slice(0, -1), createMessage("node", answer, sources)];
          }
          return [...prev, createMessage("node", answer, sources)];
        });
      });

      setMessages((prev) => {
        const filtered = prev.filter((m, i) => !(m.role === "node" && i === prev.length - 1 && m.text === ""));
        return [...filtered, createMessage("node", fullAnswer || answer, sources)];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage("node", "Sorry, my circuits got tangled. Try asking again?"),
      ]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, ready, init]);

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
          if (!ready && !loading) {
            init();
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
            {messages.map((msg, i) => (
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

            {loading && !ready && (
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
              </div>
            )}
          </div>

          <div className="node-chat-input-wrap">
            <input
              type="text"
              className="node-chat-input"
              placeholder={ready ? "Ask me anything..." : "Loading..."}
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
