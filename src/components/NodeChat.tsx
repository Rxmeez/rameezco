import { useState, useRef, useEffect, useCallback } from "react";
import { MascotDefaultSvg } from "./MascotSvg";
import { initKnowledgeBase, initEmbedder, askNode, getLoadError, resetLoadError } from "../lib/nodeBrain";
import { getCurrentPageContext, getSuggestedQuestions } from "../lib/pageContext";

interface Message {
  id: string;
  role: "user" | "node";
  text: string;
  sources?: string[];
  streaming?: boolean;
}

let messageIdCounter = 0;

function createMessage(role: Message["role"], text: string, sources?: string[]): Message {
  messageIdCounter += 1;
  return { id: `msg-${messageIdCounter}`, role, text, sources };
}

export default function NodeChat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    createMessage("node", "Hey! I'm Node. Ask me anything about Rameez's work, projects, or writing."),
  ]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pageContext = getCurrentPageContext();
  const suggestedQuestions = getSuggestedQuestions(pageContext);

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
      await initEmbedder();
      setReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to initialize Node:", msg);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [ready, loading]);

  const sendQuestion = useCallback(async (question: string) => {
    if (streamingId) return;

    setInput("");
    setMessages((prev) => [...prev, createMessage("user", question)]);

    const streamMsg = createMessage("node", "", []);
    streamMsg.streaming = true;
    setMessages((prev) => [...prev, streamMsg]);
    setStreamingId(streamMsg.id);

    try {
      if (!ready) await doInit();

      const { answer, sources } = await askNode(
        question,
        (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamMsg.id
                ? { ...msg, text: msg.text + token }
                : msg,
            ),
          );
        },
        pageContext,
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamMsg.id
            ? { ...msg, text: answer || "I'm not sure about that one.", sources, streaming: false }
            : msg,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsg.id
            ? { ...m, text: `Error: ${msg}`, streaming: false }
            : m,
        ),
      );
    } finally {
      setStreamingId(null);
    }
  }, [streamingId, ready, doInit, pageContext]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendQuestion(input.trim());
  }, [input, sendQuestion]);

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
            {messages
              .filter((msg) => msg.id !== streamingId)
              .map((msg) => (
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

            {streamingId && (
              <div className="node-chat-message node-chat-message-node node-chat-streaming">
                <MascotDefaultSvg width={28} height={28} className="node-chat-avatar" />
                <div className="node-chat-bubble">
                  <div className="node-chat-text node-chat-streaming-text">
                    {messages.find((m) => m.id === streamingId)?.text}
                    <span className="node-chat-cursor" />
                  </div>
                </div>
              </div>
            )}

            {loading && !ready && !loadError && (
              <div className="node-chat-loading">
                <div className="node-chat-loading-text">
                  Loading Node's brain...
                </div>
                <div className="node-chat-loading-hint">
                  This may take a few seconds on first visit.
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

          {suggestedQuestions.length > 0 && !streamingId && (
            <div className="node-chat-suggestions">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="node-chat-suggestion"
                  onClick={() => sendQuestion(q)}
                  disabled={!ready}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="node-chat-input-wrap">
            <input
              type="text"
              className="node-chat-input"
              placeholder={ready ? "Ask me anything..." : loadError ? "Reload failed — click Retry" : "Loading..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!ready || !!streamingId}
            />
            <button
              type="button"
              className="node-chat-send"
              onClick={handleSend}
              disabled={!ready || !input.trim() || !!streamingId}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
