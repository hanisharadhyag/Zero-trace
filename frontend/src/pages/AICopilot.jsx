import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { askCopilot, getDevice, getRiskScore, getFindings } from "../services/api";
import { toast } from "../components/Toast";
import {
  Copy, Send, Bot, User, Sparkles, RefreshCw,
  Terminal, Check, ChevronDown, ShieldCheck, ShieldAlert
} from "lucide-react";

const SMART_CHIPS = [
  "Explain my risk score",
  "Why is Telnet dangerous?",
  "Show attack path risks",
  "How to fix R08?",
  "Summarize all findings",
  "Generate executive summary",
  "Explain VLAN risks",
  "Reduce my attack surface",
  "What is SNMPv3?",
  "Best practices for SSH",
];

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      toast.success("Command copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isInline = !className && !codeText.includes("\n");

  if (isInline) {
    return (
      <code style={{
        background: "rgba(37,99,235,0.18)",
        color: "#93C5FD",
        padding: "2px 6px",
        borderRadius: 6,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.88em",
        border: "1px solid rgba(37,99,235,0.25)",
      }}>
        {children}
      </code>
    );
  }

  return (
    <div style={{
      background: "rgba(6, 11, 25, 0.85)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      margin: "12px 0",
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 11,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)" }}>
          <Terminal size={12} color="#60A5FA" />
          <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
            {className ? className.replace("language-", "").toUpperCase() : "CLI / CONFIG"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)",
            border: "1px solid " + (copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"),
            borderRadius: 6,
            padding: "3px 8px",
            color: copied ? "#86EFAC" : "rgba(255,255,255,0.7)",
            fontSize: 11,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy CLI"}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: "12px 16px",
        overflowX: "auto",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 12.5,
        lineHeight: 1.55,
        color: "#E2E8F0",
      }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
      <div style={{
        width: 32, height: 32,
        background: "linear-gradient(135deg, #2563EB, #06B6D4)",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 0 12px rgba(37,99,235,0.4)",
      }}>
        <Bot size={16} color="white" />
      </div>
      <div style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "4px 18px 18px 18px",
        padding: "12px 18px",
        display: "flex", gap: 6, alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#60A5FA", display: "block",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const timeStr = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 10,
        marginBottom: 16,
        padding: "0 16px",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #7C3AED, #4F46E5)"
          : "linear-gradient(135deg, #2563EB, #06B6D4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isUser ? "0 0 12px rgba(124,58,237,0.4)" : "0 0 12px rgba(37,99,235,0.4)",
        alignSelf: "flex-start",
        marginTop: 4,
      }}>
        {isUser ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
      </div>

      <div style={{ flex: 1, maxWidth: "84%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        {/* Role label + timestamp */}
        <div style={{
          display: "flex", gap: 8, alignItems: "center", marginBottom: 5,
          flexDirection: isUser ? "row-reverse" : "row",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isUser ? "#A78BFA" : "#60A5FA" }}>
            {isUser ? "Security Auditor" : "Zero-Trace AI"}
          </span>
          {timeStr && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{timeStr}</span>}
        </div>

        {/* Bubble */}
        <div
          style={{
            background: isUser
              ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.25))"
              : "rgba(12, 20, 42, 0.75)",
            border: isUser
              ? "1px solid rgba(124,58,237,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
            borderRadius: isUser
              ? "18px 4px 18px 18px"
              : "4px 18px 18px 18px",
            padding: "14px 18px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            position: "relative",
            boxShadow: isUser
              ? "0 4px 18px rgba(124,58,237,0.25)"
              : "0 4px 20px rgba(0,0,0,0.35)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {isUser ? (
            <p style={{ color: "white", margin: 0, fontSize: 14, lineHeight: 1.6 }}>{msg.text}</p>
          ) : (
            <div className="markdown-body" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.65 }}>
              <ReactMarkdown
                components={{
                  code: CodeBlock,
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={copyText}
            title="Copy message"
            type="button"
            style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, padding: "4px 6px",
              color: copied ? "#86EFAC" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AICopilot() {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [riskInfo, setRiskInfo]     = useState(null);
  const [findingCount, setFindingCount] = useState(0);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `## 🛡️ Zero-Trace AI Copilot
Welcome! I'm your enterprise security co-analyst loaded with real-time telemetry from your scanned network configuration.

**Active Capabilities:**
- 🔍 **Vulnerability Triage:** In-depth root cause analysis & CVSS breakdown
- ⚡ **Automated Remediation:** Vendor-specific CLI rollback scripts (Cisco, Fortinet, Palo Alto)
- 🌐 **Attack Path Simulation:** MITRE ATT&CK technique mapping & lateral pivot prevention
- 📊 **Executive Reporting:** Boardroom-ready threat posture summaries

Select any suggestion below or ask a specific question regarding your network posture.`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef          = useRef(null);
  const inputRef                = useRef(null);

  // Load audit context
  useEffect(() => {
    Promise.allSettled([getDevice(), getRiskScore(), getFindings()])
      .then(([devRes, riskRes, findRes]) => {
        if (devRes.status === "fulfilled" && devRes.value) {
          setDeviceInfo(devRes.value);
        }
        if (riskRes.status === "fulfilled" && riskRes.value) {
          setRiskInfo(riskRes.value);
        }
        if (findRes.status === "fulfilled" && Array.isArray(findRes.value)) {
          setFindingCount(findRes.value.length);
        }
      });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streaming, scrollToBottom]);

  // Simulated chunk streaming for responsive LLM experience
  const streamResponse = (fullText) => {
    setStreaming(true);
    let index = 0;
    const chunkSize = 4; // words per tick
    const words = fullText.split(" ");
    
    // Add empty assistant bubble
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "", timestamp: Date.now() },
    ]);

    const interval = setInterval(() => {
      index += chunkSize;
      const currentText = words.slice(0, index).join(" ");
      
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          text: currentText,
        };
        return next;
      });

      if (index >= words.length) {
        clearInterval(interval);
        setStreaming(false);
        // Ensure exact final text
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            text: fullText,
          };
          return next;
        });
      }
    }, 25);
  };

  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim();
    if (!question || loading || streaming) return;

    const userMsg = { role: "user", text: question, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await askCopilot(question);
      const answer = result.answer || result.response || result.message || "I couldn't generate a response for that query. Please try rephrasing.";
      setLoading(false);
      streamResponse(answer);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || "Backend connection failed. Please ensure the server is running.";
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ **Error:** ${errMsg}`, timestamp: Date.now() }]);
      toast.error("Failed to reach AI Copilot");
    } finally {
      inputRef.current?.focus();
    }
  }, [input, loading, streaming]);

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      text: "Chat cleared. Ready for your next network security query.",
      timestamp: Date.now(),
    }]);
    toast.info("Conversation reset");
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", height: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, flexWrap: "wrap", gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(37,99,235,0.45)",
          }}>
            <Bot size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.01em" }}>
              Zero-Trace <span className="text-gradient">AI Copilot</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
              Enterprise conversational security auditor & CLI generator
            </p>
          </div>
        </div>

        {/* Context telemetry bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {deviceInfo?.hostname ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#93C5FD",
              background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)",
              borderRadius: 999, padding: "5px 12px",
            }}>
              <ShieldCheck size={13} color="#60A5FA" />
              <span>{deviceInfo.hostname}</span>
              {riskInfo?.score !== undefined && (
                <strong style={{ color: riskInfo.score > 70 ? "#86EFAC" : "#F87171" }}>
                  • {riskInfo.score}/100 ({riskInfo.grade})
                </strong>
              )}
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#86EFAC",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 999, padding: "5px 12px",
            }}>
              <Sparkles size={12} />
              Context Synchronized
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "6px 12px", color: "rgba(255,255,255,0.6)",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            <RefreshCw size={12} /> Clear
          </motion.button>
        </div>
      </motion.div>

      {/* Smart Chips */}
      <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SMART_CHIPS.slice(0, 7).map((chip) => (
          <motion.button
            key={chip}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => sendMessage(chip)}
            disabled={loading || streaming}
            style={{
              background: "rgba(37,99,235,0.1)",
              border: "1px solid rgba(37,99,235,0.25)",
              borderRadius: 999, padding: "5px 12px",
              color: "#93C5FD", fontSize: 11, fontWeight: 500,
              cursor: (loading || streaming) ? "default" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {chip}
          </motion.button>
        ))}
      </div>

      {/* Chat Messages Panel */}
      <div style={{
        flex: 1,
        background: "rgba(10, 17, 34, 0.72)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 22,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 8px 10px",
        }}>
          {messages.map((m, idx) => (
            <MessageBubble key={idx} msg={m} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{
          padding: "14px 18px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(6, 11, 24, 0.8)",
        }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Zero-Trace AI anything about your network audit or configuration..."
              disabled={loading || streaming}
              style={{
                flex: 1,
                padding: "13px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                color: "white",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3B82F6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.12)";
                e.target.style.boxShadow = "none";
              }}
            />

            <motion.button
              type="submit"
              disabled={loading || streaming || !input.trim()}
              whileHover={input.trim() ? { scale: 1.05 } : undefined}
              whileTap={input.trim() ? { scale: 0.95 } : undefined}
              style={{
                width: 46, height: 46,
                background: input.trim() && !loading && !streaming
                  ? "linear-gradient(135deg, #2563EB, #06B6D4)"
                  : "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !loading && !streaming ? "pointer" : "not-allowed",
                color: "white",
                boxShadow: input.trim() && !loading && !streaming ? "0 4px 14px rgba(37,99,235,0.4)" : "none",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
