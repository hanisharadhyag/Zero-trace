export default function ChatBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "14px",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "12px 14px",
          borderRadius: "14px",
          background: isUser ? "#2563EB" : "#16264A",
          color: "white",
          whiteSpace: "pre-wrap",
          lineHeight: "1.5",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            opacity: 0.7,
            marginBottom: "6px",
          }}
        >
          {isUser ? "You" : "🤖 Zero-Trace AI"}
        </div>

        {text}
      </div>
    </div>
  );
}
