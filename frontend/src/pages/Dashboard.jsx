import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDevice, getRiskScore } from "../services/api";
import AnimatedCounter from "../components/AnimatedCounter";
import { CardSkeleton } from "../components/LoadingSkeleton";
import GlassCard from "../components/GlassCard";
import GlowBadge from "../components/GlowBadge";
import DeviceTable from "../components/DeviceTable";
import ConfigurationDrift from "../components/ConfigurationDrift";
import SecurityStatusPanel from "../components/SecurityStatusPanel";
import AttackPathGraph from "../visualization/AttackPathGraph";
import { Shield, Server, Activity, AlertTriangle, AlertCircle, Info, TrendingUp } from "lucide-react";


/* ── Security Gauge ──────────────────────────────────────── */
function SecurityGauge({ score }) {
  const angle = (score / 100) * 251;
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#EAB308" : score >= 40 ? "#F97316" : "#EF4444";

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <svg width={180} height={110} viewBox="0 0 180 110">
        {/* Background arc */}
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <motion.path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${angle} 251`}
          initial={{ strokeDasharray: "0 251" }}
          animate={{ strokeDasharray: `${angle} 251` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Score text */}
        <text x={90} y={96} textAnchor="middle" fill="white" fontSize={34} fontWeight={800} fontFamily="Inter">
          {score}
        </text>
        <text x={90} y={108} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} fontFamily="Inter">
          out of 100
        </text>
      </svg>
    </div>
  );
}

/* ── KPI Card ────────────────────────────────────────────── */
function KPICard({ title, value, Icon, color, delay = 0, suffix = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -5, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${color}22` }}
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${color}33`,
        borderRadius: 20,
        padding: "22px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        boxShadow: `0 4px 24px rgba(0,0,0,0.25), 0 0 0 1px ${color}11`,
      }}
    >
      {/* Glow bg */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}22, transparent)`,
        borderRadius: "0 20px 0 100%",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          {title}
        </p>
        <div style={{
          width: 36, height: 36,
          background: `${color}20`,
          border: `1px solid ${color}40`,
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>

      <h2 style={{ fontSize: 38, fontWeight: 900, color, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
        <AnimatedCounter value={typeof value === "number" ? value : 0} />
        {suffix}
      </h2>
    </motion.div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState({ hostname: "", vendor: "", device_type: "", interfaces: [], services: [] });
  const [risk, setRisk] = useState({ score: 0, grade: "N/A", critical: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [deviceData, riskData] = await Promise.all([getDevice(), getRiskScore()]);
        if (deviceData?.hostname) {
          setDevice(deviceData);
          setRisk(riskData.risk_score);
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 36, width: 300, borderRadius: 10, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 18, width: 200, borderRadius: 8 }} />
        </div>
        <div className="grid grid-auto" style={{ marginBottom: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const gradeColor = {
    "A+": "#22C55E", A: "#22C55E", "B+": "#84CC16", B: "#84CC16",
    C: "#EAB308", D: "#F97316", F: "#EF4444", "N/A": "#64748B"
  }[risk.grade] || "#64748B";

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "0 0 6px" }}>
            Security <span className="text-gradient">Operations Center</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>
            Real-time security posture assessment for {device.hostname}
          </p>
        </div>
        <GlowBadge severity={risk.critical > 0 ? "CRITICAL" : risk.high > 0 ? "HIGH" : "LOW"}>
          {risk.critical > 0 ? "Critical Risk" : risk.high > 0 ? "High Risk" : "Low Risk"}
        </GlowBadge>
      </motion.div>

      {/* Top Row: Gauge + Device + KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, marginBottom: 24 }}>
        {/* Security Score Gauge */}
        <GlassCard style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Security Score
          </p>
          <SecurityGauge score={risk.score} />
          <div style={{
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: `${gradeColor}20`,
            border: `1px solid ${gradeColor}40`,
            borderRadius: 999,
            padding: "6px 16px",
          }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: gradeColor }}>{risk.grade}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Grade</span>
          </div>
        </GlassCard>

        {/* Device Profile */}
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48,
              background: "linear-gradient(135deg, #2563EB20, #06B6D420)",
              border: "1px solid rgba(37,99,235,0.3)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Server size={24} color="#60A5FA" />
            </div>
            <div>
              <h2 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 800 }}>{device.hostname}</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 13 }}>{device.vendor} • {device.device_type}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Interfaces", value: device.interfaces?.length || 0, color: "#3B82F6" },
              { label: "Services", value: device.services?.length || 0, color: "#06B6D4" },
              { label: "Active", value: device.services?.filter(s => s.enabled).length || 0, color: "#22C55E" },
            ].map((m) => (
              <div key={m.label} style={{
                background: `${m.color}10`,
                border: `1px solid ${m.color}25`,
                borderRadius: 12,
                padding: "12px 16px",
              }}>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</p>
                <h3 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color: m.color }}>
                  <AnimatedCounter value={m.value} />
                </h3>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-auto" style={{ marginBottom: 32 }}>
        <KPICard title="Risk Score"  value={risk.score}    Icon={TrendingUp}    color="#3B82F6" delay={0.05} suffix="/100" />
        <KPICard title="Critical"    value={risk.critical} Icon={AlertCircle}   color="#EF4444" delay={0.10} />
        <KPICard title="High"        value={risk.high}     Icon={AlertTriangle} color="#F97316" delay={0.15} />
        <KPICard title="Medium"      value={risk.medium}   Icon={Activity}      color="#EAB308" delay={0.20} />
        <KPICard title="Low"         value={risk.low}      Icon={Info}          color="#22C55E" delay={0.25} />
      </div>

      {/* Configuration Drift Section */}
      <ConfigurationDrift currentDevice={device} />

      {/* Zero Trust File Access & Audit Log Panel */}
      <SecurityStatusPanel />


      {/* Network Interfaces Table */}
      <GlassCard style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Activity size={18} color="#60A5FA" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0 }}>Network Interfaces</h2>
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 600,
            background: "rgba(37,99,235,0.15)",
            border: "1px solid rgba(37,99,235,0.3)",
            borderRadius: 999, padding: "3px 10px", color: "#60A5FA",
          }}>
            {device.interfaces?.length || 0} interfaces
          </span>
        </div>
        <DeviceTable device={device} />
      </GlassCard>

      {/* Attack Path Graph */}
      <GlassCard padding="0" style={{ overflow: "hidden" }}>
        <AttackPathGraph device={device} />
      </GlassCard>
    </div>
  );
}
