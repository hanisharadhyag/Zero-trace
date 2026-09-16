import ExecutiveSummary from "./ExecutiveSummary";
import SeveritySummary from "./SeveritySummary";
import SeverityChart from "./SeverityChart";
import ComplianceChart from "./ComplianceChart";

export default function ReportPreview({ report }) {
  if (!report) return null;

  const charts = report.charts || {};
  const attack = charts.attack_surface || {};
  const findings = report.findings || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Executive Header */}
      <ExecutiveSummary report={report} />

      {/* KPI Cards */}
      <SeveritySummary report={report} />

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
        }}
      >
        <SeverityChart
          data={
            charts.severity || {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
            }
          }
        />

        <ComplianceChart
          data={
            charts.compliance || {
              passed: 0,
              failed: 0,
            }
          }
        />
      </div>

      {/* Attack Surface */}
      <div
        style={{
          background: "white",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#06142B",
          }}
        >
          Attack Surface Analytics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 18,
            marginTop: 20,
          }}
        >
          <Metric
            title="Interfaces"
            value={attack.interfaces || 0}
            color="#2563EB"
          />

          <Metric
            title="Services"
            value={attack.services || 0}
            color="#16A34A"
          />

          <Metric
            title="ACL Rules"
            value={attack.acl_rules || 0}
            color="#EA580C"
          />
        </div>
      </div>

      {/* Findings */}
      <div
        style={{
          background: "white",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#06142B",
          }}
        >
          Security Findings
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 18,
          }}
        >
          <thead>
            <tr style={{ background: "#1D4ED8", color: "white" }}>
              <th style={th}>Rule</th>
              <th style={th}>Severity</th>
              <th style={th}>Title</th>
              <th style={th}>Recommendation</th>
            </tr>
          </thead>

          <tbody>
            {findings.map((f, index) => (
              <tr key={index}>
                <td style={td}>{f.rule_id}</td>

                <td style={td}>
                  <span
                    style={{
                      background: severityColor(f.severity),
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {f.severity}
                  </span>
                </td>

                <td style={td}>{f.title}</td>

                <td style={td}>{f.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {findings.length === 0 && (
          <p style={{ marginTop: 18 }}>No security findings available.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ title, value, color }) {
  return (
    <div
      style={{
        background: "#F8FAFC",
        borderRadius: 14,
        padding: 20,
        borderTop: `5px solid ${color}`,
      }}
    >
      <p
        style={{
          color: "#64748B",
          margin: 0,
        }}
      >
        {title}
      </p>

      <h1
        style={{
          color,
          margin: "10px 0 0",
        }}
      >
        {value}
      </h1>
    </div>
  );
}

function severityColor(level) {
  switch (level) {
    case "CRITICAL":
      return "#DC2626";
    case "HIGH":
      return "#EA580C";
    case "MEDIUM":
      return "#EAB308";
    case "LOW":
      return "#16A34A";
    default:
      return "#64748B";
  }
}

const th = {
  padding: "14px",
  textAlign: "left",
  fontSize: 14,
};

const td = {
  padding: "14px",
  borderBottom: "1px solid #E5E7EB",
  verticalAlign: "top",
};
