import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ComplianceChart({ data }) {
  const chart = [
    { name: "Passed", value: data.passed },
    { name: "Failed", value: data.failed },
  ];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 22,
        marginBottom: 24,
      }}
    >
      <h2>Compliance Status</h2>

      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={chart}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2563EB" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
