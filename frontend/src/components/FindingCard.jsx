export default function FindingCard({ finding }) {
  const severityColors = {
    CRITICAL: "#DC2626",
    HIGH: "#EA580C",
    MEDIUM: "#D97706",
    LOW: "#16A34A",
  };

  const color =
    severityColors[finding.severity?.toUpperCase()] || "#64748B";

  return (
    <div
      style={{
        background: "#111827",
        color: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "18px",
        borderLeft: `6px solid ${color}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ margin: 0 }}>{finding.title}</h3>

        <span
          style={{
            background: color,
            color: "white",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {finding.severity}
        </span>
      </div>

      <p style={{ color: "#D1D5DB", marginBottom: "16px" }}>
        {finding.description}
      </p>

      <div
        style={{
          background: "#1F2937",
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "12px",
        }}
      >
        <strong style={{ color: "#93C5FD" }}>Evidence</strong>
        <p style={{ marginTop: "6px", color: "#E5E7EB" }}>
          {finding.evidence}
        </p>
      </div>

      <div
        style={{
          background: "#052E16",
          borderRadius: "10px",
          padding: "12px",
        }}
      >
        <strong style={{ color: "#86EFAC" }}>Recommended Fix</strong>
        <p style={{ marginTop: "6px", color: "#D1FAE5" }}>
          {finding.recommendation}
        </p>
      </div>
    </div>
  );
}
