import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePostHog } from "@posthog/react";
import { MascotDefaultSvg } from "./MascotSvg";
import { askNode } from "../lib/nodeBrain";
import { getCurrentPageContext, getSuggestedQuestions, getContentLinks, getSourceUrl, linkifyContent } from "../lib/pageContext";
import { formatMarkdown } from "../lib/markdown";

interface Message {
  id: string;
  role: "user" | "node";
  text: string;
  sources?: string[];
  streaming?: boolean;
  error?: boolean;
  retryFor?: string;
}

let messageIdCounter = 0;

const THINKING_PHRASES = [
  "Searching knowledge base",
  "Running vector search",
  "Ranking relevant chunks",
  "Querying the model",
  "Synthesizing an answer",
  "Parsing context",
  "Traversing the graph",
];

function createMessage(role: Message["role"], text: string, sources?: string[]): Message {
  messageIdCounter += 1;
  return { id: `msg-${messageIdCounter}`, role, text, sources };
}

export default function NodeChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    createMessage("node", "Hey! I'm Node. Ask me anything about Rameez's work, projects, or writing."),
  ]);
  const [input, setInput] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [buttonExpanded, setButtonExpanded] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const posthog = usePostHog();
  const navigate = useNavigate();
  const location = useLocation();
  const contentLinks = getContentLinks();

  const handleMessageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest("a.node-chat-link, a.node-chat-source-chip");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href?.startsWith("/")) {
        e.preventDefault();
        posthog?.capture("node_chat_link_clicked", { href });
        navigate(href);
        setOpen(false);
        setButtonExpanded(false);
      }
    },
    [navigate, posthog],
  );

  const streamingText = streamingId
    ? messages.find((m) => m.id === streamingId)?.text ?? ""
    : "";
  const showThinking = streamingId !== null && streamingText.length === 0;

  useEffect(() => {
    if (!showThinking) return;
    let i = 0;
    setThinkingPhrase(THINKING_PHRASES[0]);
    const interval = setInterval(() => {
      i = (i + 1) % THINKING_PHRASES.length;
      setThinkingPhrase(THINKING_PHRASES[i]);
    }, 1400);
    return () => clearInterval(interval);
  }, [showThinking]);

  const pageContext = getCurrentPageContext();
  // Suggestions are an on-ramp, not a persistent menu — hide them once the
  // user has asked something.
  const hasUserMessages = messages.some((m) => m.role === "user");
  const suggestedQuestions = hasUserMessages ? [] : getSuggestedQuestions(pageContext);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const sendQuestion = useCallback(async (question: string, opts?: { echoUser?: boolean }) => {
    if (streamingId) return;

    posthog?.capture("node_chat_question_sent", {
      question,
      page_title: pageContext?.title,
      page_type: pageContext?.type,
    });

    setInput("");
    if (opts?.echoUser !== false) {
      setMessages((prev) => [...prev, createMessage("user", question)]);
    }

    const streamMsg = createMessage("node", "", []);
    streamMsg.streaming = true;
    setMessages((prev) => [...prev, streamMsg]);
    setStreamingId(streamMsg.id);

    try {
      const history = messagesRef.current
        .slice(1)
        .filter((m) => !m.streaming && !m.error && m.text);

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
        history,
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
      posthog?.capture("node_chat_error", { error: msg, question });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsg.id
            ? {
                ...m,
                text: "I hit a snag answering that. Give it another try?",
                streaming: false,
                error: true,
                retryFor: question,
              }
            : m,
        ),
      );
    } finally {
      setStreamingId(null);
    }
  }, [streamingId, pageContext, posthog]);

  const handleRetry = useCallback((msg: Message) => {
    if (!msg.retryFor || streamingId) return;
    posthog?.capture("node_chat_retry_clicked", { question: msg.retryFor });
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    sendQuestion(msg.retryFor, { echoUser: false });
  }, [sendQuestion, streamingId, posthog]);

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

  // Node is busy starring in the game on /play — don't show two of him.
  if (location.pathname === "/play") return null;

  return (
    <>
      <button
        type="button"
        className={`node-chat-button ${buttonExpanded ? "node-chat-button-expanded" : ""}`}
        onClick={() => {
          const isMobile = window.innerWidth <= 520;
          if (isMobile && !buttonExpanded && !open) {
            setButtonExpanded(true);
            return;
          }
          const nextOpen = !open;
          setOpen(nextOpen);
          if (!nextOpen) setButtonExpanded(false);
          posthog?.capture(nextOpen ? "node_chat_opened" : "node_chat_closed");
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
              <div className="node-chat-title-text">
                <span>Ask Node</span>
                <span className="node-chat-subtitle">AI guide to this site · can make mistakes</span>
              </div>
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

          <div className="node-chat-messages" ref={scrollRef} onClick={handleMessageClick} onKeyDown={() => {}} role="presentation">
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
                  <div className={`node-chat-bubble${msg.error ? " node-chat-bubble-error" : ""}`}>
                    {msg.role === "node" && !msg.error ? (
                      <div
                        className="node-chat-text"
                        dangerouslySetInnerHTML={{
                          __html: linkifyContent(formatMarkdown(msg.text), contentLinks),
                        }}
                      />
                    ) : (
                      <div className="node-chat-text">{msg.text}</div>
                    )}
                    {msg.error && (
                      <button
                        type="button"
                        className="node-chat-retry"
                        onClick={() => handleRetry(msg)}
                        disabled={!!streamingId}
                      >
                        Retry
                      </button>
                    )}
                    {!msg.error && msg.sources && msg.sources.length > 0 && (
                      <div className="node-chat-sources">
                        <span className="node-chat-sources-label">Related</span>
                        {msg.sources.map((src) => {
                          const url = getSourceUrl(src);
                          return url ? (
                            <a key={src} className="node-chat-source-chip" href={url}>
                              {src}
                            </a>
                          ) : (
                            <span key={src} className="node-chat-source-chip">
                              {src}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {streamingId && (
              <div className="node-chat-message node-chat-message-node node-chat-streaming">
                <MascotDefaultSvg width={28} height={28} className="node-chat-avatar" />
                <div className="node-chat-bubble">
                  {showThinking ? (
                    <div className="node-chat-thinking">
                      <span className="node-chat-thinking-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="node-chat-thinking-text">{thinkingPhrase}…</span>
                    </div>
                  ) : (
                    <div
                      className="node-chat-text node-chat-streaming-text"
                      dangerouslySetInnerHTML={{
                        __html: `${formatMarkdown(streamingText)}<span class="node-chat-cursor"></span>`,
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {suggestedQuestions.length > 0 && !streamingId && !input.trim() && (
            <div className="node-chat-suggestions">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="node-chat-suggestion"
                  onClick={() => {
                    posthog?.capture("node_chat_suggested_clicked", {
                      suggestion: q,
                      page_title: pageContext?.title,
                    });
                    sendQuestion(q);
                  }}
                  disabled={!!streamingId}
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
              placeholder={streamingId ? "Node is thinking..." : "Ask me anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!streamingId}
            />
            <button
              type="button"
              className="node-chat-send"
              onClick={handleSend}
              disabled={!input.trim() || !!streamingId}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
