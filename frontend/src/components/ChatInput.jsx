import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "12px",
      }}
    >
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Ask Zero-Trace AI..."
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #334155",
          background: "#081224",
          color: "white",
        }}
      />

      <button
        onClick={submit}
        style={{
          background: "#2563EB",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "0 18px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Send
      </button>
    </div>
  );
}
