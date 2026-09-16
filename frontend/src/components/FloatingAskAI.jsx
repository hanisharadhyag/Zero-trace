import { useState, useRef, useCallback, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, X, Minus, Maximize2, Minimize2, Send,
  Bot, User, Copy, Check, RotateCcw, Terminal
} from "lucide-react";
import { askCopilot } from "../services/api";
import { toast } from "./Toast";

/* ── Suggested Prompts ──────────────────────────────────── */
const SUGGESTED = [
  "Explain this finding",
  "How do I fix R12?",
  "Generate secure Cisco CLI",
  "Show attack path risks",
  "Explain CVSS scoring",
  "Generate executive summary",
];

/* ── Code Block renderer ─────────────────────────────────── */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, "");
  const isInline = !className && !text.includes("\n");

  if (isInline) {
    return (
      <code style={{
        background: "rgba(37,99,235,0.18)", color: "#93C5FD",
        padding: "2px 6px", borderRadius: 5,
        fontFamily: "var(--font-mono)", fontSize: "0.87em",
        border: "1px solid rgba(37,99,235,0.24)",
      }}>
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      background: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 10, margin: "10px 0", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 10px", background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.45)", fontSize: 10.5 }}>
          <Terminal size={11} color="#60A5FA" />
          {className ? className.replace("language-", "").toUpperCase() : "CLI"}
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: copied ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.10)"}`,
            borderRadius: 5, padding: "2px 7px",
            color: copied ? "#86EFAC" : "rgba(255,255,255,0.6)",
            fontSize: 10.5, cursor: "pointer",
          }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "10px 12px", overflowX: "auto", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.55, color: "#E2E8F0" }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ── Typing indicator ────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px" }}>
      <div style={{
        width: 26, height: 26,
        background: "linear-gradient(135deg,#2563EB,#8B5CF6)",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Bot size={14} color="white" />
      </div>
      <div style={{
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "4px 14px 14px 14px", padding: "10px 14px",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B5CF6", display: "block" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Message Bubble ──────────────────────────────────────── */
const MessageBubble = memo(function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 12,
        padding: "0 12px",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg,#2563EB,#06B6D4)"
          : "linear-gradient(135deg,#2563EB,#8B5CF6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 2,
      }}>
        {isUser ? <User size={13} color="white" /> : <Bot size={13} color="white" />}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "78%",
          background: isUser
            ? "linear-gradient(135deg,rgba(37,99,235,0.28),rgba(8,145,178,0.22))"
            : "rgba(255,255,255,0.055)",
          border: `1px solid ${isUser ? "rgba(37,99,235,0.28)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding: "9px 13px",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isUser) e.currentTarget.querySelector(".copy-btn")?.style.setProperty("opacity", "1");
        }}
        onMouseLeave={(e) => {
          if (!isUser) e.currentTarget.querySelector(".copy-btn")?.style.setProperty("opacity", "0");
        }}
      >
        {isUser ? (
          <p style={{ margin: 0, fontSize: 13, color: "white", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {msg.text}
          </p>
        ) : (
          <div className="markdown-body" style={{ fontSize: 12.5, lineHeight: 1.65, color: "rgba(255,255,255,0.88)" }}>
            <ReactMarkdown
              components={{
                code: ({ node, inline, className, children, ...props }) => (
                  <CodeBlock className={className}>{children}</CodeBlock>
                ),
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && (
          <button
            className="copy-btn"
            onClick={handleCopy}
            style={{
              position: "absolute", top: 6, right: 6,
              width: 20, height: 20, borderRadius: 5,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: copied ? "#86EFAC" : "rgba(255,255,255,0.5)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.18s ease",
            }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
          </button>
        )}
      </div>
    </motion.div>
  );
});

/* ── Main Floating Ask AI Component ──────────────────────── */
export default function FloatingAskAI() {
  const [isOpen, setIsOpen]         = useState(false);
  const [minimized, setMinimized]   = useState(false);
  const [maximized, setMaximized]   = useState(false);
  const [messages, setMessages]     = useState([{
    role: "assistant",
    text: "👋 Hi! I'm your Zero-Trace AI security assistant. Ask me anything about your network findings, vulnerabilities, or remediation strategies.",
    timestamp: Date.now(),
  }]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [streaming, setStreaming]   = useState(false);
  const [position, setPosition]     = useState({ x: 0, y: 0 });
  const [dragging, setDragging]     = useState(false);
  const dragStart                   = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const endRef                      = useRef(null);
  const inputRef                    = useRef(null);

  /* Auto scroll */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Streaming word-by-word effect */
  const streamResponse = useCallback((fullText) => {
    setStreaming(true);
    const words = fullText.split(" ");
    let idx = 0;

    setMessages((p) => [...p, { role: "assistant", text: "", timestamp: Date.now() }]);

    const iv = setInterval(() => {
      idx += 5;
      const current = words.slice(0, idx).join(" ");
      setMessages((p) => {
        const next = [...p];
        next[next.length - 1] = { ...next[next.length - 1], text: current };
        return next;
      });
      if (idx >= words.length) {
        clearInterval(iv);
        setStreaming(false);
        setMessages((p) => {
          const next = [...p];
          next[next.length - 1] = { ...next[next.length - 1], text: fullText };
          return next;
        });
      }
    }, 22);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim();
    if (!question || loading || streaming) return;

    setMessages((p) => [...p, { role: "user", text: question, timestamp: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      const result = await askCopilot(question);
      const answer = result.answer || result.response || result.message
        || "I couldn't generate a response. Please try rephrasing.";
      setLoading(false);
      streamResponse(answer);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || "Backend connection failed. Ensure the server is running.";
      setMessages((p) => [...p, { role: "assistant", text: `⚠️ **Error:** ${errMsg}`, timestamp: Date.now() }]);
      toast.error("AI Copilot unreachable");
    } finally {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, streaming, streamResponse]);

  const clearChat = useCallback(() => {
    setMessages([{
      role: "assistant",
      text: "Chat cleared. Ready for your next security question.",
      timestamp: Date.now(),
    }]);
  }, []);

  /* Drag handlers */
  const onDragStart = useCallback((e) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y };
  }, [position]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setPosition({
        x: dragStart.current.px + e.clientX - dragStart.current.mx,
        y: dragStart.current.py + e.clientY - dragStart.current.my,
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  /* Panel size */
  const panelW = maximized ? "min(700px, 95vw)" : "400px";
  const panelH = maximized ? "80vh" : minimized ? "52px" : "min(580px, 72vh)";

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsOpen(true); setMinimized(false); }}
            className="floating-ai-btn"
            style={{ position: "fixed", bottom: 28, right: 28, zIndex: 300 }}
          >
            <Sparkles size={16} />
            Ask AI
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.24, ease: [0.34, 1.2, 0.64, 1] }}
            style={{
              position: "fixed",
              bottom: 90,
              right: 28,
              zIndex: 400,
              width: panelW,
              height: panelH,
              background: "rgba(6, 14, 27, 0.96)",
              backdropFilter: "blur(36px)",
              WebkitBackdropFilter: "blur(36px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              boxShadow: "0 24px 64px rgba(0,0,0,0.60), 0 0 0 1px rgba(139,92,246,0.10)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transform: `translate(${position.x}px,${position.y}px)`,
              transition: dragging ? "none" : "width 0.3s ease, height 0.3s ease",
              userSelect: dragging ? "none" : "auto",
            }}
          >
            {/* Panel Header (Draggable) */}
            <div
              onMouseDown={onDragStart}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px",
                background: "linear-gradient(135deg,rgba(37,99,235,0.20),rgba(139,92,246,0.14))",
                borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.08)",
                cursor: dragging ? "grabbing" : "grab",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#2563EB,#8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Bot size={15} color="white" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white" }}>Zero-Trace AI</p>
                {!minimized && (
                  <p style={{ margin: 0, fontSize: 10.5, color: "rgba(255,255,255,0.42)" }}>
                    Security Copilot
                  </p>
                )}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }} onMouseDown={(e) => e.stopPropagation()}>
                <ActionBtn icon={<RotateCcw size={12} />} title="Clear chat" onClick={clearChat} />
                <ActionBtn
                  icon={minimized ? <Maximize2 size={12} /> : <Minus size={12} />}
                  title={minimized ? "Restore" : "Minimize"}
                  onClick={() => setMinimized((v) => !v)}
                />
                <ActionBtn
                  icon={maximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  title={maximized ? "Restore size" : "Maximize"}
                  onClick={() => { setMaximized((v) => !v); setMinimized(false); }}
                />
                <ActionBtn icon={<X size={12} />} title="Close" danger onClick={() => setIsOpen(false)} />
              </div>
            </div>

            {/* Messages */}
            {!minimized && (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 0 8px" }}>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}
                  {loading && <TypingDots />}
                  <div ref={endRef} />
                </div>

                {/* Suggested Prompts */}
                {messages.length <= 1 && (
                  <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {SUGGESTED.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        style={{
                          padding: "5px 11px",
                          background: "rgba(139,92,246,0.12)",
                          border: "1px solid rgba(139,92,246,0.25)",
                          borderRadius: 999, color: "#C4B5FD",
                          fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          transition: "background 0.18s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(139,92,246,0.22)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(139,92,246,0.12)"}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div style={{
                  padding: "10px 12px",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", gap: 8, alignItems: "flex-end",
                  flexShrink: 0,
                }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask about findings, remediation, CLI…"
                    rows={1}
                    style={{
                      flex: 1, resize: "none", overflow: "hidden",
                      background: "rgba(255,255,255,0.055)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 11, padding: "8px 12px",
                      color: "white", fontFamily: "var(--font-sans)", fontSize: 13,
                      outline: "none", lineHeight: 1.5, minHeight: 36,
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(139,92,246,0.50)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
                  />
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading || streaming}
                    style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: input.trim() && !loading && !streaming
                        ? "linear-gradient(135deg,#2563EB,#8B5CF6)"
                        : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "white", cursor: input.trim() && !loading ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Icon button helper ──────────────────────────────────── */
function ActionBtn({ icon, title, onClick, danger }) {
  return (
    <motion.button
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      title={title}
      onClick={onClick}
      style={{
        width: 22, height: 22, borderRadius: 6,
        background: danger ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.07)",
        border: `1px solid ${danger ? "rgba(239,68,68,0.20)" : "rgba(255,255,255,0.10)"}`,
        color: danger ? "#FCA5A5" : "rgba(255,255,255,0.6)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </motion.button>
  );
}
