import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Mail, Eye, EyeOff, Check, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "../components/Toast";
import { loginUser } from "../services/api";

const DEMO_EMAIL = "admin@zerotrace.ai";
const DEMO_PASS  = "admin123";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(() => localStorage.getItem("zero_trace_remember_email") || DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASS);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("zero_trace_remember") === "true");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {

    e?.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginUser(email.trim(), password);
      if (res && res.access_token) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("zero_trace_auth", "true");
        storage.setItem("zero_trace_token", res.access_token);
        storage.setItem("zero_trace_user", JSON.stringify(res.user));

        if (rememberMe) {
          localStorage.setItem("zero_trace_remember", "true");
          localStorage.setItem("zero_trace_remember_email", email);
        } else {
          localStorage.removeItem("zero_trace_remember");
          localStorage.removeItem("zero_trace_remember_email");
        }

        toast.success(`Authentication successful! Logged in as ${res.user.role}.`);
        onLogin();
      }
    } catch (err) {
      setLoading(false);
      const msg = err?.response?.data?.detail || "Authentication failed. Please verify credentials.";
      setError(msg);
      toast.error(msg);
    }
  };


  const autoFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError("");
    toast.info("Demo credentials loaded!");
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 20%, #0c1838 0%, #030712 100%)",
      padding: 20,
    }}>
      {/* Dynamic Background Glowing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [-20, 20, -20],
          y: [-10, 15, -10],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "15%",
          left: "25%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.2, 0.45, 0.2],
          x: [20, -20, 20],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "10%",
          right: "20%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid Pattern Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 440,
          background: "rgba(10, 17, 34, 0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 0 32px rgba(37, 99, 235, 0.2)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              borderRadius: 20,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37, 99, 235, 0.4)",
              position: "relative",
            }}
          >
            <Shield size={32} color="white" />
            <motion.div
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: 22,
                border: "2px solid rgba(96, 165, 250, 0.5)",
              }}
            />
          </motion.div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 999,
            background: "rgba(37,99,235,0.15)",
            border: "1px solid rgba(37,99,235,0.3)",
            marginBottom: 10,
          }}>
            <Sparkles size={12} color="#60A5FA" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#93C5FD", textTransform: "uppercase" }}>
              SIH 2026 Enterprise Edition
            </span>
          </div>

          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: "white",
            margin: "4px 0 6px",
            letterSpacing: "-0.02em",
          }}>
            Zero-Trace
          </h1>
          <p style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            margin: 0,
            lineHeight: 1.5,
          }}>
            AI-Powered Multi-Vendor Network Security Auditor
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 18 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 12,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#FCA5A5",
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Email field */}
          <div>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.4)",
                display: "flex",
              }}>
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zerotrace.ai"
                required
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B82F6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Password
              </label>
              <button
                type="button"
                onClick={autoFillDemo}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60A5FA",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Auto-fill demo
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.4)",
                display: "flex",
              }}>
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 42px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B82F6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              userSelect: "none",
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: "#3B82F6",
                  width: 15,
                  height: 15,
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                Remember session
              </span>
            </label>

            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Role: Security Auditor
            </span>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(37,99,235,0.45)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #06B6D4 100%)",
              border: "none",
              borderRadius: 14,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
              marginTop: 6,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                  }}
                />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Access Security Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Credentials Footer */}
        <div style={{
          marginTop: 26,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed rgba(255,255,255,0.12)",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Demo: <code style={{ color: "#93C5FD", fontFamily: "var(--font-mono)" }}>admin@zerotrace.ai</code>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Pass: <code style={{ color: "#93C5FD", fontFamily: "var(--font-mono)" }}>admin123</code>
            </p>
          </div>
          <button
            type="button"
            onClick={autoFillDemo}
            style={{
              padding: "6px 12px",
              background: "rgba(37,99,235,0.2)",
              border: "1px solid rgba(37,99,235,0.35)",
              borderRadius: 8,
              color: "#93C5FD",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Quick Fill
          </button>
        </div>
      </motion.div>
    </div>
  );
}
