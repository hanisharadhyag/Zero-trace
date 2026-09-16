import { motion } from "framer-motion";

/**
 * EmptyState — Premium empty state with glass card
 * Props: icon, title, description, action (element)
 */
export default function EmptyState({ icon = "🛡️", title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 40px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(37,99,235,0.4))" }}>
        {icon}
      </div>
      <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        {title}
      </h2>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 400, lineHeight: 1.6 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 28 }}>{action}</div>}
    </motion.div>
  );
}
