export default function ExecutiveSummary({ report }) {
  const device = report.device || {};
  const risk = report.risk_score || {};
  const stats = report.statistics || {};

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 28,
        marginBottom: 24,
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      }}
    >
      {/* ================= HEADER ================= */}
      <div
        style={{
          background: "linear-gradient(90deg,#06142B,#0F2F6B)",
          borderRadius: 14,
          padding: 22,
          color: "white",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Zero-Trace Executive Report</h1>

        <p
          style={{
            margin: "8px 0",
            opacity: 0.9,
          }}
        >
          Enterprise AI Network Security Assessment
        </p>

        <p
          style={{
            fontSize: 13,
            opacity: 0.8,
            margin: 0,
          }}
        >
          Generated: {report.generated_at}
        </p>
      </div>

      {/* ================= DEVICE INFO ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <Info title="Hostname" value={device.hostname} />
        <Info title="Vendor" value={device.vendor} />
        <Info title="Device Type" value={device.device_type} />
        <Info title="Security Grade" value={risk.grade} />
      </div>

      {/* ================= SCORE + SUMMARY ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 22,
        }}
      >
        <div
          style={{
            background: "#EFF6FF",
            borderRadius: 14,
            padding: 20,
            borderLeft: "6px solid #2563EB",
          }}
        >
          <h3
            style={{
              color: "#1D4ED8",
              marginTop: 0,
            }}
          >
            Executive Summary
          </h3>

          <p
            style={{
              lineHeight: 1.8,
              color: "#334155",
            }}
          >
            Zero-Trace analyzed the uploaded{" "}
            <strong>{device.vendor}</strong>{" "}
            configuration against enterprise security compliance policies.
            The device achieved a security score of{" "}
            <strong>{risk.score}/100</strong>{" "}
            with an overall grade of{" "}
            <strong>{risk.grade}</strong>.
            The assessment identified{" "}
            <strong>{stats.failed_rules}</strong>{" "}
            failed security rules while maintaining a compliance rate of{" "}
            <strong>{stats.pass_rate}%</strong>.
          </p>
        </div>

        <div
          style={{
            background: "#06142B",
            borderRadius: 14,
            padding: 22,
            color: "white",
            textAlign: "center",
          }}
        >
          <p
            style={{
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Security Score
          </p>

          <h1
            style={{
              fontSize: 54,
              margin: "6px 0",
              color: "#3B82F6",
            }}
          >
            {risk.score}
          </h1>

          <p
            style={{
              marginBottom: 16,
              opacity: 0.85,
            }}
          >
            out of 100
          </p>

          <div
            style={{
              background: "#2563EB",
              borderRadius: 999,
              padding: "8px 18px",
              display: "inline-block",
              fontWeight: "bold",
            }}
          >
            Grade {risk.grade}
          </div>

          <hr
            style={{
              borderColor: "#334155",
              margin: "18px 0",
            }}
          />

          <p style={{ margin: 4 }}>Pass Rate</p>

          <h2
            style={{
              margin: 0,
              color: "#22C55E",
            }}
          >
            {stats.pass_rate}%
          </h2>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div
      style={{
        background: "#F8FAFC",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748B",
          fontSize: 13,
        }}
      >
        {title}
      </p>

      <h3
        style={{
          margin: "8px 0 0 0",
          color: "#0F172A",
        }}
      >
        {value || "-"}
      </h3>
    </div>
  );
}
