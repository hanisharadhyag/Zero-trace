/**
 * GlowBadge — Severity badge with animated glow
 * Props: severity ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW"), children
 */
export default function GlowBadge({ severity, children, style = {} }) {
  const config = {
    CRITICAL: { cls: "badge-critical", dot: "#EF4444", label: children || "Critical" },
    HIGH:     { cls: "badge-high",     dot: "#F97316", label: children || "High" },
    MEDIUM:   { cls: "badge-medium",   dot: "#EAB308", label: children || "Medium" },
    LOW:      { cls: "badge-low",      dot: "#22C55E", label: children || "Low" },
  };

  const cfg = config[severity?.toUpperCase()] || config.LOW;

  return (
    <span className={`badge ${cfg.cls}`} style={style}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          display: "inline-block",
          boxShadow: `0 0 6px ${cfg.dot}`,
          animation: "pulse-glow 2s ease-in-out infinite",
        }}
      />
      {cfg.label}
    </span>
  );
}
