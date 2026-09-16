import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, LayoutDashboard, ShieldAlert, Wrench,
  FileText, Crosshair, ChevronLeft, ChevronRight
} from "lucide-react";

/* ── Navigation items (AI Copilot removed per V2.1 spec) ─── */
const MENU = [
  { id: "upload",      label: "Upload",         icon: Upload },
  { id: "dashboard",   label: "Dashboard",      icon: LayoutDashboard },
  { id: "findings",    label: "Findings",       icon: ShieldAlert },
  { id: "remediation", label: "AI Remediation", icon: Wrench },
  { id: "simulator",   label: "Attack Sim",     icon: Crosshair },
  { id: "report",      label: "Exec Report",    icon: FileText },
];

function formatSidebarDate() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const Sidebar = memo(function Sidebar({ page, changePage, collapsed, setCollapsed }) {
  const W = collapsed ? 72 : 220;

  return (
    <motion.aside
      animate={{ width: W }}
      transition={{ duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}
      style={{
        background: "rgba(6, 14, 27, 0.82)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        minHeight: "calc(100vh - 72px)",
        padding: "20px 12px 16px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "4px 0 20px rgba(0,0,0,0.22)",
      }}
    >
      {/* Collapse Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          top: 20,
          right: -13,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(37, 99, 235, 0.88)",
          border: "2px solid rgba(255,255,255,0.14)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          boxShadow: "0 3px 10px rgba(37,99,235,0.35)",
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </motion.button>

      {/* Navigation label */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ marginBottom: 24, paddingLeft: 8 }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Navigation
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: collapsed ? 40 : 0 }}>
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => changePage(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%",
                padding: collapsed ? "13px" : "11px 14px",
                borderRadius: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive
                  ? "linear-gradient(135deg, rgba(37,99,235,0.28), rgba(6,182,212,0.12))"
                  : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.48)",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                fontFamily: "var(--font-sans)",
                transition: "all 0.22s ease",
                position: "relative",
                border: isActive
                  ? "1px solid rgba(37,99,235,0.30)"
                  : "1px solid transparent",
                boxShadow: isActive ? "0 0 14px rgba(37,99,235,0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.82)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.48)";
                }
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: "55%",
                    background: "linear-gradient(180deg, #3B82F6, #06B6D4)",
                    borderRadius: "0 3px 3px 0",
                    boxShadow: "0 0 8px rgba(59,130,246,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                size={17}
                color={isActive ? "#60A5FA" : "currentColor"}
                style={{ flexShrink: 0 }}
              />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom: Date + System Status */}
      <AnimatePresence>
        {!collapsed ? (
          <motion.div
            key="expanded-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-status"
          >
            {/* Date */}
            <p style={{
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.38)",
              marginBottom: 8,
              paddingLeft: 4,
              letterSpacing: "0.01em",
            }}>
              {formatSidebarDate()}
            </p>

            {/* System Online indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, paddingLeft: 4 }}>
              <div className="status-dot-green" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#86EFAC", letterSpacing: "0.02em" }}>
                System Online
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: "auto", paddingTop: 16, display: "flex", justifyContent: "center" }}
          >
            <div className="status-dot-green" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
});

export default Sidebar;
