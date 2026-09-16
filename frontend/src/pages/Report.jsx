import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getReport } from "../services/api";
import { CardSkeleton } from "../components/LoadingSkeleton";
import GlowBadge from "../components/GlowBadge";
import AnimatedCounter from "../components/AnimatedCounter";
import { toast } from "../components/Toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar } from "recharts";
import { Download, Shield, Server, TrendingUp, AlertCircle, AlertTriangle, Activity, Info, CheckCircle, Printer } from "lucide-react";

const SEVER_COLOR = { CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#22C55E" };

function SeverityDonut({ data }) {
  const chartData = [
    { name: "Critical", value: data.critical || 0, color: "#EF4444" },
    { name: "High",     value: data.high     || 0, color: "#F97316" },
    { name: "Medium",   value: data.medium   || 0, color: "#EAB308" },
    { name: "Low",      value: data.low      || 0, color: "#22C55E" },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}55)` }} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "rgba(6,14,27,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
            labelStyle={{ color: "white" }}
            itemStyle={{ color: "rgba(255,255,255,0.7)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComplianceRadial({ passed, failed }) {
  const total = passed + failed || 1;
  const pct   = Math.round((passed / total) * 100);
  const data  = [{ name: "Passed", value: pct, fill: "#22C55E" }];

  return (
    <div style={{ height: 200, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.06)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#22C55E" }}>{pct}%</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Compliance</div>
      </div>
    </div>
  );
}

function KPICard({ label, value, Icon, color, suffix = "" }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      style={{
        background: `${color}12`,
        border: `1px solid ${color}25`,
        borderRadius: 18, padding: "20px",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          {label}
        </p>
        <Icon size={16} color={color} />
      </div>
      <h2 style={{ margin: 0, fontSize: 34, fontWeight: 900, color, letterSpacing: "-0.03em" }}>
        <AnimatedCounter value={typeof value === "number" ? value : 0} />{suffix}
      </h2>
    </motion.div>
  );
}

export default function Report() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport()
      .then((data) => setReport(data))
      .catch(() => setReport({ success: false }))
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Brand Header Banner
      doc.setFillColor(6, 14, 27);
      doc.rect(0, 0, 210, 42, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ZERO-TRACE", 14, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(147, 197, 253);
      doc.text("AI-Powered Multi-Vendor Network Security Auditor", 14, 25);

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Generated: ${report?.generated_at || new Date().toLocaleString()}`, 14, 34);

      // Audit Summary Box
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(14, 48, 182, 38, 3, 3, "F");

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("EXECUTIVE AUDIT SUMMARY", 20, 57);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Device Hostname: ${device.hostname || "Unknown"} | Vendor: ${device.vendor || "Cisco"} | Type: ${device.device_type || "Router"}`, 20, 65);
      doc.text(`Security Score: ${risk.score ?? 0}/100 | Grade: ${risk.grade || "F"} | Risk Level: ${risk.risk_level || "Critical"}`, 20, 72);
      doc.text(`Audit Status: ${stats.total_rules || findings.length} Rules Evaluated | ${findings.length} Vulnerabilities Detected`, 20, 79);

      // Findings Table
      const tableRows = findings.map((f, i) => [
        f.id || `VULN-${i + 1}`,
        f.severity || "MEDIUM",
        f.title || "Security Finding",
        f.recommendation || "Review and remediate according to hardening guide"
      ]);

      autoTable(doc, {
        startY: 94,
        head: [["ID", "Severity", "Finding Title", "AI Remediation Recommendation"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 22, fontStyle: "bold" },
          2: { cellWidth: 56 },
          3: { cellWidth: 82 }
        },
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 1) {
            const sev = data.cell.raw;
            if (sev === "CRITICAL") data.cell.styles.textColor = [220, 38, 38];
            else if (sev === "HIGH") data.cell.styles.textColor = [234, 88, 12];
            else if (sev === "MEDIUM") data.cell.styles.textColor = [202, 138, 4];
            else if (sev === "LOW") data.cell.styles.textColor = [22, 163, 74];
          }
        }
      });

      const filename = `ZeroTrace_Security_Report_${device.hostname || "Audit"}.pdf`;
      doc.save(filename);
      toast.success("Security Report PDF downloaded successfully!");
    } catch (err) {
      console.warn("jsPDF fallback to print:", err);
      window.print();
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 40, width: 350, borderRadius: 10, marginBottom: 10 }} />
        </div>
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!report?.success) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <Shield size={64} color="rgba(255,255,255,0.15)" style={{ marginBottom: 20 }} />
        <h2 style={{ color: "white", marginBottom: 10 }}>No Scan Available</h2>
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Please upload and scan a configuration first.</p>
      </div>
    );
  }

  const device   = report.device       || {};
  const risk     = report.risk_score   || {};
  const stats    = report.statistics   || {};
  const charts   = report.charts       || {};
  const severity = charts.severity     || {};
  const compliance = charts.compliance || {};
  const attack   = charts.attack_surface || {};
  const findings = report.findings     || [];

  const gradeColor = { "A+": "#22C55E", A: "#22C55E", "B+": "#84CC16", B: "#84CC16", C: "#EAB308", D: "#F97316", F: "#EF4444" }[risk.grade] || "#64748B";

  return (
    <div id="executive-report" style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Controls — hidden on print */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", margin: "0 0 6px" }}>
            Executive <span className="text-gradient">Security Report</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>
            Generated: {report.generated_at || "N/A"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={printReport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "10px 18px",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Printer size={15} /> Print / Save
          </motion.button>
          <motion.button
            whileHover={{ y: -2, boxShadow: "0 0 30px rgba(37,99,235,0.6)" }}
            whileTap={{ scale: 0.97 }}
            onClick={downloadPDF}
            className="btn btn-primary"
            style={{ gap: 8 }}
          >
            <Download size={16} /> Download PDF
          </motion.button>
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #06142B 0%, #0F2851 50%, #06142B 100%)",
          border: "1px solid rgba(37,99,235,0.3)",
          borderRadius: 24, padding: "32px 36px",
          marginBottom: 24,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(37,99,235,0.3), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 160, height: 160, background: "radial-gradient(circle, rgba(6,182,212,0.2), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Shield size={28} color="#60A5FA" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Zero-Trace Enterprise Security Assessment
              </span>
            </div>
            <h2 style={{ color: "white", fontSize: 28, fontWeight: 900, margin: "0 0 8px" }}>{device.hostname || "Network Device"}</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", margin: 0, fontSize: 14 }}>
              {device.vendor} • {device.device_type} • SIH 2026 Audit
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60, fontWeight: 900, color: gradeColor, lineHeight: 1, textShadow: `0 0 30px ${gradeColor}` }}>
              {risk.grade || "—"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Security Grade</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#60A5FA", marginTop: 6 }}>{risk.score}/100</div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <KPICard label="Security Score" value={risk.score}         Icon={TrendingUp}    color="#3B82F6" suffix="/100" />
        <KPICard label="Critical"       value={risk.critical || 0} Icon={AlertCircle}   color="#EF4444" />
        <KPICard label="High"           value={risk.high || 0}     Icon={AlertTriangle} color="#F97316" />
        <KPICard label="Pass Rate"      value={stats.pass_rate || 0} Icon={CheckCircle} color="#22C55E" suffix="%" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Severity Donut */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "24px" }}>
          <h3 style={{ color: "white", margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} color="#60A5FA" /> Severity Distribution
          </h3>
          <SeverityDonut data={severity} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
            {["Critical", "High", "Medium", "Low"].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEVER_COLOR[s.toUpperCase()], display: "block" }} />
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{s}: {severity[s.toLowerCase()] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Radial */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "24px" }}>
          <h3 style={{ color: "white", margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} color="#22C55E" /> Compliance Rate
          </h3>
          <ComplianceRadial passed={compliance.passed || 0} failed={compliance.failed || 0} />
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#22C55E" }}>{compliance.passed || 0}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Rules Passed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#EF4444" }}>{compliance.failed || 0}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Rules Failed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Surface */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "24px", marginBottom: 24 }}>
        <h3 style={{ color: "white", margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>⚡ Attack Surface Analytics</h3>
        <div className="grid grid-3">
          {[
            { label: "Network Interfaces", value: attack.interfaces || 0, color: "#3B82F6", Icon: Server },
            { label: "Active Services",    value: attack.services   || 0, color: "#06B6D4", Icon: Activity },
            { label: "ACL Rules",          value: attack.acl_rules  || 0, color: "#F97316", Icon: Shield },
          ].map((m) => (
            <div key={m.label} style={{ background: `${m.color}10`, border: `1px solid ${m.color}25`, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <m.Icon size={24} color={m.color} />
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{m.label}</p>
                <h3 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: m.color }}>{m.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Executive Summary */}
      {report.ai_posture_assessment && (
        <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 22, padding: "24px", marginBottom: 24 }}>
          <h3 style={{ color: "#93C5FD", margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🤖 AI Security Posture Assessment</h3>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
            {report.ai_posture_assessment}
          </p>
        </div>
      )}

      {/* Findings Table */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "24px", marginBottom: 24 }}>
        <h3 style={{ color: "white", margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>🛡 Security Findings Summary</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="glass-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Severity</th>
                <th>Title</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#60A5FA",
                      background: "rgba(37,99,235,0.15)", padding: "2px 8px", borderRadius: 6 }}>
                      {f.rule_id}
                    </span>
                  </td>
                  <td><GlowBadge severity={f.severity} /></td>
                  <td style={{ color: "white", fontWeight: 500, fontSize: 13 }}>{f.title}</td>
                  <td style={{ fontSize: 12, maxWidth: 300, lineHeight: 1.5 }}>{f.recommendation}</td>
                </tr>
              ))}
              {findings.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "30px 0" }}>
                    No findings available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remediation Roadmap */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "24px" }}>
        <h3 style={{ color: "white", margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>🗺 Remediation Roadmap</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { phase: "Immediate (0–24h)",  color: "#EF4444", items: ["Disable Telnet", "Enable SSHv2", "Change SNMP community strings"] },
            { phase: "Short Term (1–7d)",  color: "#F97316", items: ["Enable centralized logging", "Apply ACL hardening", "Patch firmware"] },
            { phase: "Medium Term (1–4w)", color: "#EAB308", items: ["Implement NTP", "Review VLANs", "Enable SNMPv3"] },
            { phase: "Long Term (>1m)",    color: "#22C55E", items: ["Security awareness training", "Periodic audits", "Zero-trust architecture"] },
          ].map((row) => (
            <div key={row.phase} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                minWidth: 160, padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: `${row.color}15`, border: `1px solid ${row.color}30`, color: row.color, textAlign: "center",
              }}>
                {row.phase}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {row.items.map((item) => (
                  <span key={item} style={{
                    fontSize: 12, color: "rgba(255,255,255,0.6)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "4px 12px",
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
