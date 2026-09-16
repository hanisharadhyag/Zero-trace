import { memo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Settings, LogOut, ChevronDown, Camera } from "lucide-react";

/* ── Load persisted user profile from localStorage ─────── */
function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem("zero_trace_user_profile") || "{}");
  } catch {
    return {};
  }
}

const INITIALS = "ZT";

export default memo(function Navbar({ onLogout, onOpenProfile }) {
  const [profile, setProfile]       = useState(loadProfile);
  const [dropOpen, setDropOpen]     = useState(false);
  const dropRef                     = useRef(null);

  /* Sync profile if another tab/component changes localStorage */
  useEffect(() => {
    const handler = () => setProfile(loadProfile());
    window.addEventListener("storage", handler);
    window.addEventListener("zero_trace_profile_update", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("zero_trace_profile_update", handler);
    };
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropOpen]);

  const handleOpenProfile = useCallback(() => {
    setDropOpen(false);
    onOpenProfile?.();
  }, [onOpenProfile]);

  const handleLogout = useCallback(() => {
    setDropOpen(false);
    onLogout?.();
  }, [onLogout]);

  const displayName = profile.displayName || "Admin User";
  const email       = profile.email || "admin@zerotrace.ai";
  const avatarSrc   = profile.avatarSrc || null;

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.34, 1.2, 0.64, 1] }}
      style={{
        height: 66,
        background: "rgba(6, 14, 27, 0.88)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <motion.div
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(37,99,235,0.40)",
            flexShrink: 0,
          }}
        >
          <Shield size={19} color="white" strokeWidth={2.5} />
        </motion.div>

        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Zero-Trace
          </h2>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>
            AI Network Security Auditor
          </p>
        </div>
      </div>

      {/* ── Right: Badges + Profile ───────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* API Online badge */}
        <motion.div
          animate={{ opacity: [1, 0.65, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(22, 163, 74, 0.10)",
            border: "1px solid rgba(22, 163, 74, 0.28)",
            borderRadius: 999,
            padding: "5px 12px",
            fontSize: 11.5,
            fontWeight: 600,
            color: "#86EFAC",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#22C55E", display: "block",
            boxShadow: "0 0 6px rgba(34,197,94,0.8)",
          }} />
          API Online
        </motion.div>

        {/* Version badge */}
        <div style={{
          background: "rgba(37, 99, 235, 0.10)",
          border: "1px solid rgba(37, 99, 235, 0.28)",
          borderRadius: 999,
          padding: "5px 12px",
          fontSize: 11.5,
          fontWeight: 600,
          color: "#93C5FD",
        }}>
          v3.0
        </div>

        {/* Profile Avatar with Dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setDropOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 999,
              padding: "5px 12px 5px 5px",
              cursor: "pointer",
              color: "white",
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              overflow: "hidden",
              background: avatarSrc ? "transparent" : "linear-gradient(135deg,#2563EB,#8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "white",
              flexShrink: 0,
              animation: "avatar-ring 3s ease-in-out infinite",
              boxShadow: "0 0 0 2px rgba(37,99,235,0.40)",
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : INITIALS
              }
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.82)", whiteSpace: "nowrap" }}>
              {displayName.split(" ")[0]}
            </span>
            <motion.div animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} color="rgba(255,255,255,0.5)" />
            </motion.div>
          </motion.button>

          {/* Glass Dropdown */}
          <AnimatePresence>
            {dropOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.34, 1.3, 0.64, 1] }}
                className="profile-dropdown"
              >
                {/* User Summary Header */}
                <div style={{
                  padding: "14px 16px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: avatarSrc ? "transparent" : "linear-gradient(135deg,#2563EB,#8B5CF6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "white",
                      flexShrink: 0,
                    }}>
                      {avatarSrc
                        ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : INITIALS
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayName}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: "6px 0" }}>
                  <button className="profile-dropdown-item" onClick={handleOpenProfile}>
                    <Camera size={14} style={{ flexShrink: 0 }} />
                    Profile & Avatar
                  </button>
                  <button className="profile-dropdown-item" onClick={handleOpenProfile}>
                    <User size={14} style={{ flexShrink: 0 }} />
                    Account Details
                  </button>
                  <button className="profile-dropdown-item" onClick={() => setDropOpen(false)}>
                    <Settings size={14} style={{ flexShrink: 0 }} />
                    Settings
                  </button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 12px" }} />
                  <button className="profile-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={14} style={{ flexShrink: 0 }} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
});
