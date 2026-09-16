import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, User, Mail, Check, Upload } from "lucide-react";
import { toast } from "./Toast";

/* ── Persist profile to localStorage & fire custom event ─── */
function saveProfile(data) {
  localStorage.setItem("zero_trace_user_profile", JSON.stringify(data));
  window.dispatchEvent(new Event("zero_trace_profile_update"));
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem("zero_trace_user_profile") || "{}");
  } catch {
    return {};
  }
}

export default function ProfileModal({ isOpen, onClose }) {
  const stored          = loadProfile();
  const [name, setName]         = useState(stored.displayName || "Admin User");
  const [email, setEmail]       = useState(stored.email || "admin@zerotrace.ai");
  const [avatarSrc, setAvatar]  = useState(stored.avatarSrc || null);
  const [saved, setSaved]       = useState(false);
  const fileRef                 = useRef(null);

  const handleAvatarUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload PNG, JPG, GIF or WebP images only.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      toast.success("Avatar preview loaded! Click Save to apply.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    saveProfile({ displayName: name.trim(), email: email.trim(), avatarSrc });
    setSaved(true);
    toast.success("Profile saved successfully!");
    setTimeout(() => {
      setSaved(false);
      onClose?.();
    }, 1200);
  }, [name, email, avatarSrc, onClose]);

  const handleRemoveAvatar = useCallback(() => {
    setAvatar(null);
    toast.info("Avatar removed. Default initials will be shown.");
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.60)",
              backdropFilter: "blur(8px)",
              zIndex: 900,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.34, 1.3, 0.64, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              width: "min(480px, 94vw)",
              background: "rgba(6, 14, 27, 0.97)",
              backdropFilter: "blur(36px)",
              WebkitBackdropFilter: "blur(36px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 24,
              boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "white" }}>
                  User Profile
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.42)" }}>
                  Customize your display name and avatar
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px" }}>
              {/* Avatar Section */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                {/* Avatar Preview */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    overflow: "hidden",
                    background: avatarSrc ? "transparent" : "linear-gradient(135deg,#2563EB,#8B5CF6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, fontWeight: 900, color: "white",
                    border: "3px solid rgba(37,99,235,0.40)",
                    boxShadow: "0 0 20px rgba(37,99,235,0.20)",
                  }}>
                    {avatarSrc
                      ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "ZT"
                    }
                  </div>
                  {/* Camera button overlay */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#2563EB",
                      border: "2px solid rgba(6,14,27,0.9)",
                      color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Camera size={12} />
                  </button>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "white", margin: "0 0 4px" }}>
                    Profile Photo
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", margin: "0 0 12px" }}>
                    PNG, JPG, GIF, or WebP · Max 5 MB
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileRef.current?.click()}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px",
                        background: "rgba(37,99,235,0.18)",
                        border: "1px solid rgba(37,99,235,0.35)",
                        borderRadius: 10, color: "#93C5FD",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <Upload size={13} />
                      Upload
                    </motion.button>
                    {avatarSrc && (
                      <button
                        onClick={handleRemoveAvatar}
                        style={{
                          padding: "7px 14px",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.20)",
                          borderRadius: 10, color: "#FCA5A5",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    style={{ display: "none" }}
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>

              {/* Display Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <User size={12} />
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  placeholder="Your display name"
                  className="input-glass"
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <Mail size={12} />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                  placeholder="your@email.com"
                  className="input-glass"
                />
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: saved
                    ? "linear-gradient(135deg,#16A34A,#22C55E)"
                    : "linear-gradient(135deg,#2563EB,#8B5CF6)",
                  border: "none",
                  borderRadius: 14,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: saved
                    ? "0 0 20px rgba(22,163,74,0.35)"
                    : "0 0 20px rgba(37,99,235,0.30)",
                  transition: "background 0.3s ease",
                }}
              >
                {saved ? (
                  <>
                    <Check size={16} />
                    Saved!
                  </>
                ) : (
                  "Save Profile"
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
