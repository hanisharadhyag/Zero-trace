import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadConfig } from "../services/api";
import { toast } from "../components/Toast";
import { Upload as UploadIcon, FileCheck, Cpu, Shield, Zap, CheckCircle } from "lucide-react";

const VENDORS = [
  { id: "Cisco",     label: "Cisco",      logo: "🔵", desc: "IOS / IOS-XE / NX-OS" },
  { id: "Fortinet",  label: "Fortinet",   logo: "🔴", desc: "FortiOS / FortiGate" },
  { id: "Palo Alto", label: "Palo Alto",  logo: "🟠", desc: "PAN-OS / Panorama" },
  { id: "Juniper",   label: "Juniper",    logo: "🟢", desc: "JunOS / SRX" },
];

function FloatingParticle({ style }) {
  return (
    <motion.div
      initial={{ y: "100vh", opacity: 0, rotate: 0 }}
      animate={{ y: "-120px", opacity: [0, 0.5, 0.5, 0], rotate: 360 }}
      transition={{ duration: Math.random() * 8 + 8, ease: "linear", repeat: Infinity, delay: Math.random() * 5 }}
      style={{
        position: "absolute",
        width: Math.random() * 6 + 3,
        height: Math.random() * 6 + 3,
        borderRadius: "50%",
        background: `rgba(${Math.random() > 0.5 ? "37,99,235" : "6,182,212"},0.6)`,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

export default function Upload({ selectedFile, setSelectedFile, lastFile, onScanSuccess }) {
  const [vendor, setVendor]     = useState("Cisco");
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess]   = useState(false);
  const fileInputRef            = useRef(null);
  const progressRef             = useRef(null);

  const particles = Array.from({ length: 18 }, (_, i) => i);

  const simulateProgress = () => {
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 12 + 3;
      if (p >= 90) { p = 90; clearInterval(progressRef.current); }
      setProgress(Math.round(p));
    }, 200);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a configuration file.");
      return;
    }

    try {
      setLoading(true);
      simulateProgress();

      const formData = new FormData();
      formData.append("vendor", vendor);
      formData.append("file", selectedFile);

      const result = await uploadConfig(formData);

      setProgress(100);
      clearInterval(progressRef.current);

      if (result.success) {
        setSuccess(true);
        toast.success("Configuration scanned successfully!");
        setTimeout(() => {
          onScanSuccess(selectedFile.name);
          setSelectedFile(null);
          setSuccess(false);
        }, 1800);
      } else {
        toast.error(result.message || "Scan failed.");
      }
    } catch (err) {
      clearInterval(progressRef.current);
      setProgress(0);
      if (err.response) {
        toast.error(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else {
        toast.error("Backend connection failed. Is the server running?");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, [setSelectedFile]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(progressRef.current), []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
      {/* Background Particles */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {particles.map((i) => (
          <FloatingParticle
            key={i}
            style={{ left: `${(i / particles.length) * 100}%` }}
          />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(37,99,235,0.5)",
            }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.03em" }}>
                Security Audit <span className="text-gradient">Configuration</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: 0 }}>
                Upload your network device configuration for AI-powered analysis
              </p>
            </div>
          </div>

          {/* Feature Pills */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            {[
              { icon: <Cpu size={13} />, label: "15 Security Rules" },
              { icon: <Zap size={13} />, label: "AI Risk Scoring" },
              { icon: <Shield size={13} />, label: "Multi-Vendor Support" },
            ].map((f) => (
              <span key={f.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(37,99,235,0.12)",
                border: "1px solid rgba(37,99,235,0.25)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 12, fontWeight: 500, color: "#93C5FD",
              }}>
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Vendor Selection */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ marginBottom: 28 }}
        >
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            Select Vendor
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {VENDORS.map((v) => (
              <motion.button
                key={v.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setVendor(v.id)}
                style={{
                  padding: "16px 12px",
                  border: vendor === v.id
                    ? "1px solid rgba(37,99,235,0.6)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  background: vendor === v.id
                    ? "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.1))"
                    : "rgba(255,255,255,0.04)",
                  color: vendor === v.id ? "white" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(16px)",
                  boxShadow: vendor === v.id ? "0 0 24px rgba(37,99,235,0.25)" : "none",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{v.logo}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.label}</div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3 }}>{v.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging
              ? "2px dashed #3B82F6"
              : selectedFile
                ? "2px solid rgba(34,197,94,0.5)"
                : "2px dashed rgba(255,255,255,0.15)",
            borderRadius: 24,
            padding: "48px 32px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging
              ? "rgba(37,99,235,0.1)"
              : selectedFile
                ? "rgba(34,197,94,0.05)"
                : "rgba(255,255,255,0.03)",
            backdropFilter: "blur(16px)",
            transition: "all 0.25s ease",
            boxShadow: isDragging ? "0 0 40px rgba(37,99,235,0.25), inset 0 0 60px rgba(37,99,235,0.05)" : "none",
            position: "relative",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.cfg,.conf"
            style={{ display: "none" }}
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <FileCheck size={52} color="#22C55E" style={{ marginBottom: 14 }} />
                <p style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 6 }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={isDragging ? { scale: 1.15 } : { y: [0, -8, 0] }}
                  transition={isDragging ? { duration: 0.2 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ marginBottom: 16 }}
                >
                  <UploadIcon size={52} color={isDragging ? "#3B82F6" : "rgba(255,255,255,0.25)"} />
                </motion.div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 6 }}>
                  {isDragging ? "Drop your configuration file" : "Drag & Drop Configuration File"}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                  or click to browse • .txt, .cfg, .conf files accepted
                </p>
                {lastFile && (
                  <p style={{ marginTop: 14, fontSize: 12, color: "rgba(34,197,94,0.7)" }}>
                    ✔ Last scanned: {lastFile}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Progress Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  Analyzing configuration...
                </span>
                <span style={{ fontSize: 13, color: "#60A5FA", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {progress}%
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #2563EB, #06B6D4)",
                    borderRadius: 999,
                    boxShadow: "0 0 12px rgba(37,99,235,0.6)",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                {["Parsing config", "Applying rules", "AI scoring", "Building report"].map((step, i) => (
                  <span key={step} style={{ fontSize: 11, color: progress > i * 25 ? "#60A5FA" : "rgba(255,255,255,0.25)", fontWeight: 500 }}>
                    {progress > i * 25 ? "✓" : "○"} {step}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Animation */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 22px",
                background: "rgba(22,163,74,0.15)",
                border: "1px solid rgba(22,163,74,0.4)",
                borderRadius: 16,
                marginBottom: 20,
                boxShadow: "0 0 30px rgba(22,163,74,0.2)",
              }}
            >
              <CheckCircle size={24} color="#22C55E" />
              <div>
                <p style={{ color: "white", fontWeight: 700, margin: 0 }}>Scan Completed Successfully</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>Navigating to Security Dashboard...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        <motion.button
          whileHover={!loading ? { y: -2, boxShadow: "0 0 40px rgba(37,99,235,0.7)" } : undefined}
          whileTap={!loading ? { scale: 0.98 } : undefined}
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          style={{
            width: "100%",
            padding: "18px",
            border: "none",
            borderRadius: 16,
            background: loading || !selectedFile
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #2563EB, #06B6D4)",
            color: loading || !selectedFile ? "rgba(255,255,255,0.35)" : "white",
            fontSize: 17,
            fontWeight: 700,
            cursor: loading || !selectedFile ? "not-allowed" : "pointer",
            boxShadow: loading || !selectedFile ? "none" : "0 0 24px rgba(37,99,235,0.4)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.01em",
            transition: "all 0.25s ease",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block", fontSize: 18 }}
              >
                ⚙️
              </motion.span>
              Scanning Configuration...
            </span>
          ) : "🛡️ Upload & Scan Configuration"}
        </motion.button>
      </div>
    </div>
  );
}
