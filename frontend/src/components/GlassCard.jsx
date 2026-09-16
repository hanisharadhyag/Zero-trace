import { motion } from "framer-motion";

/**
 * GlassCard — Reusable frosted glass panel
 * Props: className, style, hover (bool), padding, children, onClick
 */
export default function GlassCard({
  children,
  className = "",
  style = {},
  hover = true,
  padding = "24px",
  onClick,
}) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={
        hover
          ? { y: -4, boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" }
          : undefined
      }
      className={`glass-card ${className}`}
      style={{
        padding,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
