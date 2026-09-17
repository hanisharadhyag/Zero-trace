import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, ChevronDown, RefreshCw } from "lucide-react";
import { compareDrift, getDeviceVersions, getProjectFiles } from "../services/api";
import GlassCard from "./GlassCard";
import GlowBadge from "./GlowBadge";
import { toast } from "./Toast";

export default function ConfigurationDrift({ currentDevice }) {
  const [deviceHostname, setDeviceHostname] = useState(currentDevice?.hostname || "Router-01");
  const [availableFiles, setAvailableFiles] = useState([]);
  const [oldFileId, setOldFileId] = useState("");
  const [newFileId, setNewFileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [driftResult, setDriftResult] = useState(null);
  const [activeTab, setActiveTab] = useState("diff"); // 'diff' | 'security' | 'remediation'

  useEffect(() => {
    if (currentDevice?.hostname) {
      setDeviceHostname(currentDevice.hostname);
    }
  }, [currentDevice]);

  useEffect(() => {
    fetchFileVersions();
  }, [deviceHostname]);

  const fetchFileVersions = async () => {
    try {
      const files = await getProjectFiles();
      setAvailableFiles(files || []);
      if (files && files.length >= 2) {
        setOldFileId(files[files.length - 1].id.toString());
        setNewFileId(files[0].id.toString());
      } else if (files && files.length === 1) {
        setOldFileId(files[0].id.toString());
        setNewFileId(files[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    }
  };

  const handleCompare = async () => {
    setLoading(true);
    setDriftResult(null);

    try {
      let payload = {};
      if (oldFileId && newFileId) {
        payload = {
          old_file_id: parseInt(oldFileId),
          new_file_id: parseInt(newFileId),
          vendor: currentDevice?.vendor || "Cisco",
        };
      } else {
        toast.error("Please upload or select two configuration versions to compare.");
        setLoading(false);
        return;
      }

      const res = await compareDrift(payload);
      setDriftResult(res);
      toast.success(`Drift analysis complete! ${res.total_changes} line changes identified.`);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Drift comparison failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedOld = availableFiles.find(f => f.id.toString() === oldFileId);
  const selectedNew = availableFiles.find(f => f.id.toString() === newFileId);

  return (
    <GlassCard style={{ marginBottom: 28, position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.2))",
            border: "1px solid rgba(37,99,235,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <GitCompare size={20} color="#60A5FA" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
              Configuration Drift Detection
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              Compare configuration versions & security posture delta
            </p>
          </div>
        </div>

        <button
          onClick={fetchFileVersions}
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
          <span>Refresh Files</span>
        </button>
      </div>

      {/* Control Bar */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
        background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "16px 20px", marginBottom: 24
      }}>
        {/* Device Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            Target Device
          </label>
          <div style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 600, minWidth: 140
          }}>
            {deviceHostname}
          </div>
        </div>

        {/* Old Version Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            Old Version
          </label>
          <select
            value={oldFileId}
            onChange={(e) => setOldFileId(e.target.value)}
            style={{
              background: "#0A1122", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, outline: "none", minWidth: 160
            }}
          >
            <option value="">Select Old Config</option>
            {availableFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.device_hostname} ({f.version_label})
              </option>
            ))}
          </select>
        </div>

        <ArrowRight size={18} color="rgba(255,255,255,0.3)" style={{ marginTop: 16 }} />

        {/* New Version Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            New Version
          </label>
          <select
            value={newFileId}
            onChange={(e) => setNewFileId(e.target.value)}
            style={{
              background: "#0A1122", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, outline: "none", minWidth: 160
            }}
          >
            <option value="">Select New Config</option>
            {availableFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.device_hostname} ({f.version_label})
              </option>
            ))}
          </select>
        </div>

        {/* Compare Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCompare}
          disabled={loading}
          className="btn btn-primary"
          style={{ marginTop: 16, padding: "10px 24px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}
        >
          {loading ? (
            <span>Comparing...</span>
          ) : (
            <>
              <GitCompare size={16} />
              <span>Compare Drift</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Upload Metadata Preview if available */}
      {(selectedOld || selectedNew) && (
        <div style={{ display: "flex", gap: 24, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
          {selectedOld && (
            <div>
              <span style={{ color: "#93C5FD", fontWeight: 600 }}>Old Version ({selectedOld.version_label}):</span> Uploaded by {selectedOld.uploaded_by} on {new Date(selectedOld.created_at).toLocaleDateString()}
            </div>
          )}
          {selectedNew && (
            <div>
              <span style={{ color: "#34D399", fontWeight: 600 }}>New Version ({selectedNew.version_label}):</span> Uploaded by {selectedNew.uploaded_by} on {new Date(selectedNew.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Comparison Results */}
      {driftResult && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Security Impact Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            {/* Compliance Before */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Compliance Before</p>
              <h3 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: "white" }}>
                {driftResult.security_impact.compliance_before}%
              </h3>
            </div>

            {/* Compliance After */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Compliance After</p>
              <h3 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: "white" }}>
                {driftResult.security_impact.compliance_after}%
              </h3>
            </div>

            {/* Score Delta */}
            <div style={{
              background: driftResult.security_impact.score_difference < 0 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              border: `1px solid ${driftResult.security_impact.score_difference < 0 ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
              borderRadius: 14, padding: "14px 16px"
            }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Score Difference</p>
              <h3 style={{
                margin: "4px 0 0", fontSize: 24, fontWeight: 800,
                color: driftResult.security_impact.score_difference < 0 ? "#EF4444" : "#22C55E"
              }}>
                {driftResult.security_impact.score_difference > 0 ? `+${driftResult.security_impact.score_difference}` : driftResult.security_impact.score_difference} pts
              </h3>
            </div>

            {/* Total Line Changes */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Line Changes</p>
              <h3 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: "#60A5FA" }}>
                {driftResult.total_changes}
              </h3>
            </div>
          </div>

          {/* Result Tabs */}
          <div style={{ display: "flex", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
            <button
              onClick={() => setActiveTab("diff")}
              style={{
                background: "none", border: "none", borderBottom: activeTab === "diff" ? "2px solid #3B82F6" : "2px solid transparent",
                color: activeTab === "diff" ? "white" : "rgba(255,255,255,0.5)", padding: "8px 16px", fontWeight: 700, cursor: "pointer"
              }}
            >
              Line Diffs ({driftResult.diff_view?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("security")}
              style={{
                background: "none", border: "none", borderBottom: activeTab === "security" ? "2px solid #3B82F6" : "2px solid transparent",
                color: activeTab === "security" ? "white" : "rgba(255,255,255,0.5)", padding: "8px 16px", fontWeight: 700, cursor: "pointer"
              }}
            >
              Security Impact ({driftResult.security_impact.total_new_issues} new / {driftResult.security_impact.total_resolved_issues} resolved)
            </button>
            <button
              onClick={() => setActiveTab("remediation")}
              style={{
                background: "none", border: "none", borderBottom: activeTab === "remediation" ? "2px solid #3B82F6" : "2px solid transparent",
                color: activeTab === "remediation" ? "white" : "rgba(255,255,255,0.5)", padding: "8px 16px", fontWeight: 700, cursor: "pointer"
              }}
            >
              Remediation Suggestions ({driftResult.security_impact.remediations.length})
            </button>
          </div>

          {/* TAB 1: Line Diff Viewer */}
          {activeTab === "diff" && (
            <div style={{
              background: "#030712", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14, padding: 16, fontFamily: "var(--font-mono)", fontSize: 13,
              maxHeight: 360, overflowY: "auto"
            }}>
              {driftResult.diff_view && driftResult.diff_view.length > 0 ? (
                driftResult.diff_view.map((item, idx) => {
                  let bgColor = "transparent";
                  let textColor = "rgba(255,255,255,0.7)";
                  let prefix = "  ";

                  if (item.type === "added") {
                    bgColor = "rgba(34, 197, 94, 0.15)";
                    textColor = "#4ADE80";
                    prefix = "+ ";
                  } else if (item.type === "removed") {
                    bgColor = "rgba(239, 68, 68, 0.15)";
                    textColor = "#F87171";
                    prefix = "- ";
                  }

                  return (
                    <div key={idx} style={{ background: bgColor, color: textColor, padding: "2px 8px", borderRadius: 4, whiteSpace: "pre-wrap" }}>
                      {prefix}{item.line}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 20 }}>
                  No line changes detected between selected configurations.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Security Impact */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* New Security Findings */}
              <div>
                <h4 style={{ color: "#EF4444", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
                  <ShieldAlert size={16} /> New Security Findings Introduced ({driftResult.security_impact.new_findings.length})
                </h4>
                {driftResult.security_impact.new_findings.length > 0 ? (
                  driftResult.security_impact.new_findings.map((f, i) => (
                    <div key={i} style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "white" }}>{f.rule_id} — {f.title}</span>
                        <GlowBadge severity={f.severity}>{f.severity}</GlowBadge>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "6px 0 0" }}>{f.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>No new security issues introduced in this version change.</p>
                )}
              </div>

              {/* Resolved Security Findings */}
              <div>
                <h4 style={{ color: "#22C55E", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: "10px 0 10px" }}>
                  <CheckCircle2 size={16} /> Resolved Security Issues ({driftResult.security_impact.resolved_findings.length})
                </h4>
                {driftResult.security_impact.resolved_findings.length > 0 ? (
                  driftResult.security_impact.resolved_findings.map((f, i) => (
                    <div key={i} style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "white" }}>{f.rule_id} — {f.title}</span>
                        <span style={{ fontSize: 11, color: "#4ADE80", fontWeight: 600 }}>FIXED</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>No previously failing issues were resolved in this change.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Remediation */}
          {activeTab === "remediation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {driftResult.security_impact.remediations.length > 0 ? (
                driftResult.security_impact.remediations.map((rem, i) => (
                  <div key={i} style={{ background: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(37, 99, 235, 0.25)", borderRadius: 12, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: "#93C5FD", marginBottom: 6 }}>
                      Remediation for {rem.rule_id}: {rem.title}
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 10px" }}>{rem.recommendation}</p>
                    {rem.cli_commands?.length > 0 && (
                      <div style={{ background: "#030712", padding: 10, borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "#4ADE80" }}>
                        {rem.cli_commands.join("\n")}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No remediation actions required for new changes.</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </GlassCard>
  );
}
