import { motion } from "framer-motion";
import { ATTACK_STEPS } from "./AnimatedAttackGraph";
import { AlertCircle, ShieldAlert } from "lucide-react";

export default function AttackTimeline({ currentStep, compromised }) {
  return (
    <div style={{ padding: "0 4px" }}>
      <h3 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <ShieldAlert size={16} color="#F97316" />
        Attack Timeline
      </h3>

      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute", left: 14, top: 16, bottom: 0,
          width: 2,
          background: "rgba(255,255,255,0.07)",
        }} />

        {ATTACK_STEPS.map((step, i) => {
          const isPast    = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture  = i > currentStep;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: isFuture ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 16,
                alignItems: "flex-start",
              }}
            >
              {/* Dot */}
              <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                <motion.div
                  animate={isCurrent ? {
                    boxShadow: [`0 0 0 0 ${step.color}55`, `0 0 0 8px transparent`],
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{
                    width: 28, height: 28,
                    borderRadius: "50%",
                    background: isPast
                      ? `${step.color}30`
                      : isCurrent
                        ? step.color
                        : "rgba(255,255,255,0.05)",
                    border: `2px solid ${isPast || isCurrent ? step.color : "rgba(255,255,255,0.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "white", fontWeight: 700,
                    zIndex: 1,
                  }}
                >
                  {isPast ? "✓" : i + 1}
                </motion.div>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                background: isCurrent
                  ? `${step.color}10`
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isCurrent ? step.color + "30" : "rgba(255,255,255,0.05)"}`,
                borderRadius: 12,
                padding: "10px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? step.color : "rgba(255,255,255,0.8)" }}>
                    {step.label}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 4, padding: "2px 6px",
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    {step.technique.split(" — ")[0]}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 6px", lineHeight: 1.5 }}>
                  {step.description}
                </p>

                {isCurrent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      paddingTop: 8, marginTop: 4,
                      display: "flex", alignItems: "flex-start", gap: 6,
                    }}
                  >
                    <AlertCircle size={12} color={step.color} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 11, color: step.color, lineHeight: 1.5 }}>
                      {step.risk}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
