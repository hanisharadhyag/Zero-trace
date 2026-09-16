import { useState, useCallback } from "react";
import "./styles/globals.css";

import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Findings from "./pages/Findings";
import Remediation from "./pages/Remediation";
import Report from "./pages/Report";
import AttackSimulator from "./pages/AttackSimulator";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import PageTransition from "./components/PageTransition";
import ProfileModal from "./components/ProfileModal";
import FloatingAskAI from "./components/FloatingAskAI";
import { ToastProvider } from "./components/Toast";
import { motion } from "framer-motion";

export default function App() {
  const [page, setPage] = useState(() => {
    const isAuth =
      localStorage.getItem("zero_trace_auth") ||
      sessionStorage.getItem("zero_trace_auth");
    return isAuth ? "upload" : "login";
  });
  const [selectedFile, setSelectedFile]     = useState(null);
  const [lastFile, setLastFile]             = useState("");
  const [hasScanned, setHasScanned]         = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("zero_trace_auth");
    sessionStorage.removeItem("zero_trace_auth");
    setPage("login");
  }, []);

  if (page === "login") {
    return (
      <>
        <Login onLogin={() => setPage("upload")} />
        <ToastProvider />
      </>
    );
  }

  return (
    <div className="app">
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        onLogout={handleLogout}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div className="layout">
        <Sidebar
          page={page}
          changePage={setPage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main>
          <PageTransition pageKey={page}>
            {page === "upload" && (
              <Upload
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                lastFile={lastFile}
                onScanSuccess={(filename) => {
                  setLastFile(filename);
                  setSelectedFile(null);
                  setHasScanned(true);
                  setPage("dashboard");
                }}
              />
            )}

            {page === "dashboard" &&
              (hasScanned ? <Dashboard /> : <NoScan onUpload={() => setPage("upload")} />)}

            {page === "findings" &&
              (hasScanned ? <Findings /> : <NoScan onUpload={() => setPage("upload")} />)}

            {page === "remediation" &&
              (hasScanned ? <Remediation /> : <NoScan onUpload={() => setPage("upload")} />)}

            {page === "report" &&
              (hasScanned ? <Report /> : <NoScan onUpload={() => setPage("upload")} />)}

            {page === "simulator" &&
              (hasScanned ? <AttackSimulator /> : <NoScan onUpload={() => setPage("upload")} />)}
          </PageTransition>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Floating Ask AI — always visible in authenticated state */}
      <FloatingAskAI />

      <ToastProvider />
    </div>
  );
}

function NoScan({ onUpload }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        textAlign: "center",
        gap: 20,
      }}
    >
      <div style={{ fontSize: 72, filter: "drop-shadow(0 0 20px rgba(37,99,235,0.4))" }}>🛡️</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "white" }}>
        No Configuration Scanned
      </h1>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, maxWidth: 420, lineHeight: 1.6 }}>
        Upload a Cisco, Fortinet, or Palo Alto configuration file to begin the security audit.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onUpload}
        className="btn btn-primary"
        style={{ fontSize: 16, padding: "14px 32px" }}
      >
        Upload Configuration
      </motion.button>
    </motion.div>
  );
}
