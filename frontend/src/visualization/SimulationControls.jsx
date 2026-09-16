import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward, Gauge } from "lucide-react";

export default function SimulationControls({
  playing, onPlay, onPause, onReset, onNext,
  currentStep, totalSteps, speed, onSpeedChange,
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18, padding: "18px 22px",
    }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
            Attack Progress
          </span>
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#60A5FA", fontWeight: 700 }}>
            Step {currentStep + 1} / {totalSteps}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #EF4444, #F97316)",
              borderRadius: 999,
              boxShadow: "0 0 10px rgba(239,68,68,0.5)",
            }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <ControlBtn onClick={onReset} title="Reset" color="#64748B">
          <RotateCcw size={18} />
        </ControlBtn>

        <ControlBtn
          onClick={playing ? onPause : onPlay}
          title={playing ? "Pause" : "Play"}
          color={playing ? "#EAB308" : "#22C55E"}
          large
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </ControlBtn>

        <ControlBtn onClick={onNext} title="Next Step" color="#3B82F6" disabled={currentStep >= totalSteps - 1}>
          <SkipForward size={18} />
        </ControlBtn>
      </div>

      {/* Speed Control */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Gauge size={14} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>Speed</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: "#3B82F6", cursor: "pointer" }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", fontFamily: "var(--font-mono)", minWidth: 28 }}>
          {speed}x
        </span>
      </div>
    </div>
  );
}

function ControlBtn({ onClick, title, color, children, large = false, disabled = false }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.08, boxShadow: `0 0 20px ${color}55` } : undefined}
      whileTap={!disabled ? { scale: 0.93 } : undefined}
      onClick={disabled ? undefined : onClick}
      title={title}
      style={{
        width: large ? 56 : 44,
        height: large ? 56 : 44,
        borderRadius: "50%",
        background: `${color}15`,
        border: `2px solid ${color}${disabled ? "20" : "40"}`,
        color: disabled ? "rgba(255,255,255,0.2)" : color,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `0 4px 12px ${color}25`,
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
}
