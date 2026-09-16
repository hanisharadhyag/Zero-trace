import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFindings } from "../services/api";
import GlowBadge from "../components/GlowBadge";
import { toast } from "../components/Toast";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { Copy, Clock, ChevronDown, ChevronUp, ArrowRight, Wrench, Brain } from "lucide-react";

const PRIORITY = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

const FIX_TIME = { CRITICAL: "15 min", HIGH: "30 min", MEDIUM: "1 hour", LOW: "2 hours" };
const AI_CONFIDENCE = { CRITICAL: 98, HIGH: 94, MEDIUM: 88, LOW: 82 };

function getCLI(ruleId, title) {
  const base = `configure terminal
! Zero-Trace Automated Remediation — ${ruleId}
! Fix: ${title}`;

  const rules = {
    R01: `${base}
no service telnet
line vty 0 4
 transport input ssh
 login local
 exec-timeout 5 0
end`,
    R02: `${base}
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 2
crypto key generate rsa modulus 2048
end`,
    R03: `${base}
service password-encryption
enable secret 9 $9$HASH_REPLACE_THIS
line console 0
 password 7 HASH_REPLACE_THIS
end`,
    R04: `${base}
logging host 10.10.10.5
logging trap informational
logging buffered 32768 informational
service timestamps log datetime msec
end`,
    R05: `${base}
no snmp-server community public RO
no snmp-server community private RW
snmp-server community ZeroTrace!2026 RO
snmp-server host 10.10.10.5 ZeroTrace!2026
end`,
  };

  return rules[ruleId] || `${base}
! Apply vendor-specific hardening for ${ruleId}
! Refer to CIS Benchmark for ${ruleId}
service password-encryption
end`;
}

function BeforeAfter({ ruleId, title }) {
  const [show, setShow] = useState(false);

  const beforeConfig = `! VULNERABLE CONFIGURATION
service telnet
no service password-encryption
snmp-server community public RO
logging buffered 4096
no ip ssh version 2`;

  const afterConfig = getCLI(ruleId, title);

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none",
          color: "#60A5FA", fontSize: 12, fontWeight: 600,
          cursor: "pointer", marginBottom: 10, padding: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {show ? "Hide" : "Show"} Before vs After Comparison
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
              {/* Before */}
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#FCA5A5" }}>❌ BEFORE (Vulnerable)</span>
                </div>
                <pre style={{ padding: "12px 14px", margin: 0, fontSize: 11, color: "#FCA5A5", fontFamily: "var(--font-mono)", lineHeight: 1.7, overflowX: "auto" }}>
                  {beforeConfig}
                </pre>
              </div>

              <ArrowRight size={20} color="#60A5FA" />

              {/* After */}
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", background: "rgba(34,197,94,0.1)", borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC" }}>✅ AFTER (Hardened)</span>
                </div>
                <pre style={{ padding: "12px 14px", margin: 0, fontSize: 11, color: "#86EFAC", fontFamily: "var(--font-mono)", lineHeight: 1.7, overflowX: "auto" }}>
                  {afterConfig}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RemediationCard({ f, index }) {
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const cli = getCLI(f.rule_id, f.title);
  const confidence = AI_CONFIDENCE[f.severity] || 85;
  const fixTime = FIX_TIME[f.severity] || "1 hour";

  const severityBg = {
    CRITICAL: "rgba(239,68,68,0.08)",
    HIGH:     "rgba(249,115,22,0.08)",
    MEDIUM:   "rgba(234,179,8,0.06)",
    LOW:      "rgba(34,197,94,0.06)",
  }[f.severity] || "rgba(255,255,255,0.04)";

  const severityBorder = {
    CRITICAL: "#EF444430",
    HIGH:     "#F9731630",
    MEDIUM:   "#EAB30830",
    LOW:      "#22C55E30",
  }[f.severity] || "rgba(255,255,255,0.08)";

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
      toast.success(`${f.rule_id} remediation simulated successfully!`);
    }, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      style={{
        background: severityBg,
        backdropFilter: "blur(20px)",
        border: `1px solid ${severityBorder}`,
        borderRadius: 22,
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      {/* Severity Ribbon */}
      <div style={{
        height: 4,
        background: {
          CRITICAL: "linear-gradient(90deg, #EF4444, #DC2626)",
          HIGH:     "linear-gradient(90deg, #F97316, #EA580C)",
          MEDIUM:   "linear-gradient(90deg, #EAB308, #CA8A04)",
          LOW:      "linear-gradient(90deg, #22C55E, #16A34A)",
        }[f.severity] || "linear-gradient(90deg, #64748B, #475569)",
      }} />

      <div style={{ padding: "22px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                color: "#60A5FA",
                background: "rgba(37,99,235,0.15)",
                border: "1px solid rgba(37,99,235,0.25)",
                borderRadius: 6, padding: "2px 8px",
              }}>{f.rule_id}</span>
              <GlowBadge severity={f.severity} />
            </div>
            <h3 style={{ color: "white", margin: 0, fontSize: 18, fontWeight: 700 }}>{f.title}</h3>
          </div>

          {/* Meta Badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#86EFAC" }}>
              <Brain size={13} />
              <span style={{ fontWeight: 600 }}>AI Confidence: {confidence}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#60A5FA" }}>
              <Clock size={13} />
              <span>Fix Time: {fixTime}</span>
            </div>
          </div>
        </div>

        {/* AI Confidence Bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ delay: index * 0.05 + 0.3, duration: 1, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, #22C55E, #06B6D4)", borderRadius: 999 }}
            />
          </div>
        </div>

        {/* AI Recommendation */}
        <div style={{
          background: "rgba(37,99,235,0.08)",
          border: "1px solid rgba(37,99,235,0.15)",
          borderRadius: 14, padding: 16, marginBottom: 16,
        }}>
          <h4 style={{ color: "#93C5FD", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
            🤖 AI Analysis & Recommendation
          </h4>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            {f.recommendation}
          </p>
        </div>

        {/* Before/After */}
        <BeforeAfter ruleId={f.rule_id} title={f.title} />

        {/* CLI Block */}
        <div style={{ marginTop: 16, background: "rgba(0,0,0,0.3)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 16px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#86EFAC" }}>⚙ Cisco IOS Remediation Commands</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.clipboard.writeText(cli).then(() => toast.success("CLI copied!"));
              }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 8, padding: "5px 12px",
                color: "#86EFAC", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Copy size={12} /> Copy
            </motion.button>
          </div>
          <pre style={{ padding: 16, margin: 0, fontSize: 12, lineHeight: 1.7, color: "#86EFAC", fontFamily: "var(--font-mono)", overflowX: "auto" }}>
            {cli}
          </pre>
        </div>

        {/* Apply Simulation Button */}
        <div style={{ marginTop: 16 }}>
          <motion.button
            whileHover={!applied ? { scale: 1.02 } : undefined}
            whileTap={!applied ? { scale: 0.98 } : undefined}
            onClick={handleApply}
            disabled={applied || applying}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 12, cursor: applied ? "default" : "pointer",
              background: applied
                ? "rgba(34,197,94,0.2)"
                : applying
                  ? "rgba(37,99,235,0.2)"
                  : "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.2))",
              color: applied ? "#86EFAC" : "white",
              fontSize: 14, fontWeight: 700,
              border: applied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(37,99,235,0.3)",
              fontFamily: "var(--font-sans)",
              transition: "all 0.3s ease",
            }}
          >
            {applied ? "✅ Remediation Applied (Simulated)" : applying ? "⚙ Applying Simulation..." : "▶ Simulate Apply Remediation"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Remediation() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getFindings()
      .then((data) => {
        const sorted = [...data].sort((a, b) => (PRIORITY[a.severity] || 5) - (PRIORITY[b.severity] || 5));
        setFindings(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 36, width: 320, borderRadius: 10, marginBottom: 8 }} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>AI <span className="text-gradient">Remediation Center</span></h1>
          <p>Palo Alto Cortex-style prioritized remediation workflow — {findings.length} findings</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          <Wrench size={14} />
          Auto-sorted by severity
        </div>
      </div>

      {findings.map((f, i) => (
        <RemediationCard key={f.rule_id || i} f={f} index={i} />
      ))}
    </div>
  );
}
