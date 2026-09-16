import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

// Toast store — simple module-level singleton
let _addToast = null;
const listeners = new Set();

export function toast(message, type = "success", duration = 3500) {
  const id = Date.now();
  listeners.forEach((fn) => fn({ id, message, type, duration }));
  return id;
}

toast.success = (msg, dur) => toast(msg, "success", dur);
toast.error   = (msg, dur) => toast(msg, "error", dur);
toast.info    = (msg, dur) => toast(msg, "info", dur);

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration);
    };

    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  const icons = {
    success: <CheckCircle size={16} color="#86EFAC" />,
    error:   <AlertTriangle size={16} color="#FCA5A5" />,
    info:    <Info size={16} color="#93C5FD" />,
  };

  const colors = {
    success: { border: "rgba(34, 197, 94, 0.3)", glow: "rgba(34, 197, 94, 0.15)" },
    error:   { border: "rgba(239, 68, 68, 0.3)",  glow: "rgba(239, 68, 68, 0.15)" },
    info:    { border: "rgba(59, 130, 246, 0.3)",  glow: "rgba(59, 130, 246, 0.15)" },
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              background: "rgba(6, 14, 30, 0.9)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${colors[t.type]?.border || colors.info.border}`,
              borderRadius: 14,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${colors[t.type]?.glow || colors.info.glow}`,
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              maxWidth: 360,
              cursor: "pointer",
            }}
            onClick={() => remove(t.id)}
          >
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
            <X size={14} color="rgba(255,255,255,0.4)" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
