import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFindings } from "../services/api";
import GlowBadge from "../components/GlowBadge";
import AnimatedCounter from "../components/AnimatedCounter";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { toast } from "../components/Toast";
import {
  Search, Filter, ChevronDown, ChevronUp, Copy,
  AlertCircle, AlertTriangle, Activity, Info,
  ShieldAlert, TrendingDown
} from "lucide-react";

const SEVERITY_ORDER = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

const CLI_TEMPLATE = (ruleId, title) => `! Zero-Trace Auto-Remediation — ${ruleId}
! ${title}
configure terminal
no service telnet
ip ssh version 2
service password-encryption
logging host 10.10.10.5
logging trap informational
no snmp-server community public RO
snmp-server community ZeroTrace001 RO
ip access-list extended MGMT-ACL
 permit tcp 10.0.0.0 0.0.0.255 any eq 22
 deny ip any any log
interface Loopback0
 ip address 10.255.255.1 255.255.255.0
end
write memory`;

function StatCard({ label, value, Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: 18,
        padding: "18px 22px",
        display: "flex", alignItems: "center", gap: 14,
        backdropFilter: "blur(16px)",
      }}
    >
      <div style={{
        width: 42, height: 42,
        background: `${color}20`,
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</p>
        <h2 style={{ margin: "2px 0 0", fontSize: 30, fontWeight: 900, color, letterSpacing: "-0.03em" }}>
          <AnimatedCounter value={value} />
        </h2>
      </div>
    </motion.div>
  );
}

function FindingCard({ f, index }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor = {
    CRITICAL: "#EF4444",
    HIGH: "#F97316",
    MEDIUM: "#EAB308",
    LOW: "#22C55E",
  }[f.severity] || "#64748B";

  const cli = CLI_TEMPLATE(f.rule_id, f.title);

  const copyCliText = () => {
    navigator.clipboard.writeText(cli).then(() => toast.success("Cisco CLI copied to clipboard!"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "0 20px 20px 0",
        marginBottom: 14,
        overflow: "hidden",
        boxShadow: `0 4px 20px rgba(0,0,0,0.25), -2px 0 0 ${borderColor}`,
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                color: "#60A5FA",
                background: "rgba(37,99,235,0.15)",
                border: "1px solid rgba(37,99,235,0.25)",
                borderRadius: 6, padding: "2px 8px",
              }}>
                {f.rule_id}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{f.category}</span>
            </div>
            <h3 style={{ color: "white", margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{f.title}</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <GlowBadge severity={f.severity} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(!expanded)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "7px 14px",
                color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              {expanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Details</>}
            </motion.button>
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "10px 0 0", lineHeight: 1.6 }}>
          {f.description}
        </p>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                {/* Evidence */}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 16 }}>
                  <h4 style={{ color: "#60A5FA", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                    📋 Evidence
                  </h4>
                  <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {f.evidence || "No specific evidence provided."}
                  </p>
                </div>

                {/* Business Impact */}
                <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 14, padding: 16, border: "1px solid rgba(239,68,68,0.1)" }}>
                  <h4 style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                    ⚠ Business Impact
                  </h4>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                    {f.severity === "CRITICAL"
                      ? "Potential for complete network compromise. Immediate C-suite notification required."
                      : f.severity === "HIGH"
                        ? "Significant risk of unauthorized access and data breach. Escalation needed."
                        : f.severity === "MEDIUM"
                          ? "Moderate risk increasing attack surface. Address within 30 days."
                          : "Low-risk configuration gap. Schedule remediation in next maintenance window."}
                  </p>
                </div>
              </div>

              {/* AI Recommendation */}
              <div style={{ background: "rgba(37,99,235,0.08)", borderRadius: 14, padding: 16, border: "1px solid rgba(37,99,235,0.15)", marginBottom: 16 }}>
                <h4 style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                  🤖 AI Recommendation
                </h4>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                  {f.recommendation}
                </p>
              </div>

              {/* CLI Block */}
              <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#86EFAC" }}>⚙ Cisco CLI Remediation</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyCliText}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: 8, padding: "5px 12px",
                      color: "#86EFAC", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Copy size={12} /> Copy CLI
                  </motion.button>
                </div>
                <pre style={{
                  padding: 16, margin: 0,
                  fontSize: 12, lineHeight: 1.7,
                  color: "#86EFAC",
                  fontFamily: "var(--font-mono)",
                  overflowX: "auto",
                }}>
                  {cli}
                </pre>
              </div>

              {/* Risk Reduction Indicator */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <TrendingDown size={14} color="#22C55E" />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  Estimated risk reduction:
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>
                  {f.severity === "CRITICAL" ? "−25 pts" : f.severity === "HIGH" ? "−15 pts" : f.severity === "MEDIUM" ? "−8 pts" : "−3 pts"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");

  useEffect(() => {
    getFindings()
      .then((data) => {
        const sorted = [...data].sort((a, b) => (SEVERITY_ORDER[a.severity] || 5) - (SEVERITY_ORDER[b.severity] || 5));
        setFindings(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => findings.filter((f) => {
    const matchSev = filter === "ALL" || f.severity === filter;
    const text = `${f.rule_id} ${f.title} ${f.category}`.toLowerCase();
    return matchSev && text.includes(search.toLowerCase());
  }), [findings, filter, search]);

  const count = (sev) => findings.filter((f) => f.severity === sev).length;

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 36, width: 280, borderRadius: 10, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 8 }} />
        </div>
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 14 }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>Security <span className="text-gradient">Findings</span></h1>
        <p>Enterprise Vulnerability Assessment — {findings.length} rules evaluated</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Critical" value={count("CRITICAL")} Icon={AlertCircle}   color="#EF4444" />
        <StatCard label="High"     value={count("HIGH")}     Icon={AlertTriangle} color="#F97316" />
        <StatCard label="Medium"   value={count("MEDIUM")}   Icon={Activity}      color="#EAB308" />
        <StatCard label="Low / Total" value={findings.length} Icon={Info}         color="#3B82F6" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, position: "relative", minWidth: 220 }}>
          <Search size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            className="input-glass"
            placeholder="Search findings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <Filter size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-glass"
            style={{ paddingLeft: 34, paddingRight: 16, cursor: "pointer", appearance: "none", width: 160 }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: 16, fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
        Showing {filtered.length} of {findings.length} findings
        {filter !== "ALL" && <span style={{ marginLeft: 8, color: "#60A5FA" }}>• Filtered: {filter}</span>}
      </div>

      {/* Finding Cards */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}
        >
          <ShieldAlert size={48} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16 }}>No findings match your filter</p>
        </motion.div>
      ) : (
        filtered.map((f, i) => <FindingCard key={f.rule_id || i} f={f} index={i} />)
      )}
    </div>
  );
}
