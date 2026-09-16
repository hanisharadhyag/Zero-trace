export default function SeveritySummary({ report }) {
  const risk = report?.risk_score || {};
  const stats = report?.statistics || {};

  const cards = [
    {
      title: "Security Score",
      value: risk.score ?? 0,
      color: "#2563EB",
    },
    {
      title: "Grade",
      value: risk.grade ?? "-",
      color: "#16A34A",
    },
    {
      title: "Pass Rate",
      value: `${stats.pass_rate ?? 0}%`,
      color: "#0EA5E9",
    },
    {
      title: "Critical",
      value: risk.critical ?? 0,
      color: "#DC2626",
    },
    {
      title: "High",
      value: risk.high ?? 0,
      color: "#EA580C",
    },
    {
      title: "Medium",
      value: risk.medium ?? 0,
      color: "#EAB308",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 18,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            borderTop: `5px solid ${card.color}`,
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#64748B",
              fontSize: 14,
            }}
          >
            {card.title}
          </p>

          <h1
            style={{
              margin: "12px 0 0",
              color: card.color,
              fontSize: 36,
            }}
          >
            {card.value}
          </h1>
        </div>
      ))}
    </div>
  );
}
