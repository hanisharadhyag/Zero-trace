export default function RiskCard({ title, value, color }) {
  const colors = {
    green: "#22c55e",
    blue: "#3b82f6",
    red: "#ef4444",
    orange: "#f97316",
    yellow: "#eab308",
    gray: "#64748b",
  };

  const accent = colors[color] || "#3b82f6";

  return (
    <div
      className="risk-card"
      style={{
        borderTop: `5px solid ${accent}`,
        background: "#111827",
        borderRadius: "16px",
        padding: "20px",
        color: "white",
        minWidth: "180px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <p
        style={{
          color: "#9ca3af",
          fontSize: "14px",
          marginBottom: "12px",
        }}
      >
        {title}
      </p>

      <h1
        style={{
          color: accent,
          fontSize: "42px",
          fontWeight: "700",
          margin: 0,
        }}
      >
        {value}
      </h1>
    </div>
  );
}
