import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, FileCheck, EyeOff, FileText, History, RefreshCw } from "lucide-react";
import { getZeroTrustStatus, getAuditLogs } from "../services/api";
import GlassCard from "./GlassCard";

export default function SecurityStatusPanel() {
  const [status, setStatus] = useState({
    sensitivity: "Confidential",
    access: "Protected (Zero Trust)",
    integrity: "SHA-256 Verified",
    secrets: "Masked (Sanitized)",
    audit_logging: "Enabled & Persisted",
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stData, logsData] = await Promise.all([
        getZeroTrustStatus(),
        getAuditLogs(),
      ]);
      if (stData) setStatus(stData);
      if (logsData) setAuditLogs(logsData);
    } catch (err) {
      console.error("Security Status Panel Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard style={{ marginBottom: 28, position: "relative" }}>
      {/* Panel Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(6,182,212,0.2))",
            border: "1px solid rgba(34,197,94,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <ShieldCheck size={20} color="#4ADE80" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
              Zero Trust Security & Audit Log
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              Continuous file access verification, SHA-256 integrity, & audit stream
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "6px 12px",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Security Status Badges Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24
      }}>
        {/* Sensitivity */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
            <FileText size={14} color="#60A5FA" />
            <span>Sensitivity</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#93C5FD" }}>
            {status.sensitivity}
          </p>
        </div>

        {/* Access */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
            <Lock size={14} color="#4ADE80" />
            <span>Access Control</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>
            {status.access}
          </p>
        </div>

        {/* Integrity */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
            <FileCheck size={14} color="#FBBF24" />
            <span>File Integrity</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#FBBF24" }}>
            {status.integrity}
          </p>
        </div>

        {/* Secrets */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
            <EyeOff size={14} color="#A78BFA" />
            <span>Secrets</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#C084FC" }}>
            {status.secrets}
          </p>
        </div>

        {/* Audit Logging */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>
            <History size={14} color="#F472B6" />
            <span>Audit Logging</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#F472B6" }}>
            {status.audit_logging}
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{ marginTop: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <History size={16} color="#60A5FA" />
          <span>Real-time Audit Log Stream</span>
        </h3>

        <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                <th style={{ padding: "10px 14px" }}>User</th>
                <th style={{ padding: "10px 14px" }}>Action</th>
                <th style={{ padding: "10px 14px" }}>Result</th>
                <th style={{ padding: "10px 14px" }}>Reason</th>
                <th style={{ padding: "10px 14px" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.slice(0, 10).map((log) => {
                  const isAllowed = log.result === "ALLOWED";
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "white" }}>
                        {log.username}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#60A5FA", fontFamily: "var(--font-mono)" }}>
                        {log.action}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                          background: isAllowed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: isAllowed ? "#4ADE80" : "#F87171",
                          border: `1px solid ${isAllowed ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`
                        }}>
                          {log.result}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.6)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.reason}
                      </td>
                      <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)" }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No audit log events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
}
