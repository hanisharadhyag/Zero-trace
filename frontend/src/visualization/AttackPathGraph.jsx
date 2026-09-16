/**
 * AttackPathGraph.jsx — V3.0 Premium Enterprise 3D Network Topology
 * 
 * Uses the same node-locked camera model as AttackSimulator.
 * World coordinates are stable across zoom/pan/hover.
 * Features isometric depth, packet flow animation, breach visualization,
 * floating particles, and enterprise device icons.
 */
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Shield, Server, Layers, Lock, Cpu, Radio,
  Activity, Play, RotateCcw, ZoomIn, ZoomOut
} from "lucide-react";

/* ── Device type → Icon + color mapping ─────────────────── */
const DEVICE_META = {
  External: { icon: Globe,  color: "#EF4444", shape: "circle" },
  Firewall: { icon: Shield, color: "#3B82F6", shape: "rect"   },
  Router:   { icon: Server, color: "#0EA5E9", shape: "rect"   },
  Network:  { icon: Layers, color: "#6366F1", shape: "rect"   },
  Interface:{ icon: Radio,  color: "#10B981", shape: "rect"   },
  Service:  { icon: Lock,   color: "#EAB308", shape: "circle" },
  default:  { icon: Cpu,    color: "#64748B", shape: "rect"   },
};

/* ── Floating particles for ambient depth ────────────────── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  cx: 60 + Math.random() * 880,
  cy: 40 + Math.random() * 540,
  r: 1 + Math.random() * 2,
  dur: 4 + Math.random() * 6,
  delay: Math.random() * 5,
  opacity: 0.08 + Math.random() * 0.14,
}));

/* ── Single Node element ─────────────────────────────────── */
const NetNode = memo(function NetNode({ node, isSelected, isBreached, isInsecure, onClick, simulate }) {
  const meta = DEVICE_META[node.type] || DEVICE_META.default;
  const Icon = meta.icon;
  const color = isBreached
    ? "#EF4444"
    : isInsecure
    ? "#F97316"
    : node.color || meta.color;

  const size = node.type === "Router" ? 58 : node.type === "External" ? 54 : 46;
  const isCircle = meta.shape === "circle";

  return (
    <motion.div
      onClick={() => onClick(node)}
      whileHover={{ scale: 1.12 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        transform: "translate(-50%, -50%)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: isSelected ? 20 : 10,
      }}
    >
      {/* Pulse ring on breach */}
      {(isBreached || (simulate && isInsecure)) && (
        <motion.div
          animate={{ scale: [1, 1.8, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: -(size * 0.18),
            borderRadius: isCircle ? "50%" : 12,
            border: `2px solid ${color}`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Device shell */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: isCircle ? "50%" : 14,
          background: isBreached
            ? `radial-gradient(circle at 35% 30%, rgba(239,68,68,0.55) 0%, rgba(10,18,36,0.96) 72%)`
            : `radial-gradient(circle at 35% 30%, ${color}50 0%, rgba(10,18,36,0.95) 72%)`,
          border: `1.5px solid ${color}${isSelected ? "FF" : "77"}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${color}44, 0 8px 22px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.12)`
            : `0 6px 20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.09)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}
      >
        {/* Metallic sheen */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: "55%", height: "42%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 100%)",
          borderRadius: "inherit", pointerEvents: "none",
        }} />
        <Icon size={size * 0.38} color={color} strokeWidth={1.7} />
        {/* LED */}
        <div style={{
          position: "absolute", top: 3, right: 3,
          width: 8, height: 8, borderRadius: "50%",
          background: isBreached ? "#EF4444" : "#22C55E",
          border: "1.5px solid rgba(6,14,27,0.9)",
          boxShadow: `0 0 5px ${isBreached ? "rgba(239,68,68,0.8)" : "rgba(34,197,94,0.8)"}`,
        }} />
      </div>

      {/* Drop shadow */}
      <div style={{
        width: size * 0.75, height: 6,
        background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 80%)",
        borderRadius: "50%", marginTop: 2, filter: "blur(2px)",
        pointerEvents: "none",
      }} />

      {/* Label */}
      <div style={{ textAlign: "center", marginTop: 4, pointerEvents: "none", maxWidth: 90 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: isBreached ? "#FCA5A5" : "white",
          textShadow: "0 1px 6px rgba(0,0,0,0.9)", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis", maxWidth: 88,
        }}>
          {node.label}
        </div>
        <div style={{
          fontSize: 9, color: "rgba(255,255,255,0.42)",
          fontFamily: "var(--font-mono)", marginTop: 1,
        }}>
          {node.type}
        </div>
      </div>
    </motion.div>
  );
});

/* ── Main Component ──────────────────────────────────────── */
export default function AttackPathGraph({ device }) {
  const [selected, setSelected]     = useState(null);
  const [simulate, setSimulate]     = useState(false);
  const [zoom, setZoom]             = useState(0.92);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [dragging, setDragging]     = useState(false);
  const dragStart                   = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const [rotX]                      = useState(10);   /* fixed isometric tilt */

  /* Build graph nodes from device data */
  const nodes = useMemo(() => {
    const graph = [
      { id: "internet", label: "Internet",                  x: 90,  y: 220, color: "#DC2626", type: "External"  },
      { id: "fw",       label: "Firewall",                  x: 240, y: 220, color: "#3B82F6", type: "Firewall"  },
      { id: "router",   label: device?.hostname || "Router",x: 430, y: 220, color: "#0EA5E9", type: "Router"    },
      { id: "lan",      label: "LAN Segment",               x: 630, y: 220, color: "#6366F1", type: "Network"   },
    ];

    let iy = 380;
    device?.interfaces?.slice(0, 4).forEach((iface, i) => {
      graph.push({
        id: `if${i}`,
        label: iface.name,
        x: 300 + i * 90,
        y: iy,
        color: iface.status === "UP" ? "#10B981" : "#991B1B",
        type: "Interface",
        data: iface,
      });
      iy = 380;
    });

    let sy = 80;
    device?.services?.filter((s) => s.enabled).slice(0, 5).forEach((svc, i) => {
      graph.push({
        id: `svc${i}`,
        label: svc.name,
        x: 800,
        y: sy,
        color: svc.secure ? "#22C55E" : "#F97316",
        type: "Service",
        data: svc,
        insecure: !svc.secure,
      });
      sy += 80;
    });

    return graph;
  }, [device]);

  const edges = useMemo(() => {
    const e = [
      ["internet", "fw"],
      ["fw", "router"],
      ["router", "lan"],
    ];
    device?.interfaces?.slice(0, 4).forEach((_, i) => e.push(["router", `if${i}`]));
    device?.services?.filter((s) => s.enabled).slice(0, 5).forEach((_, i) => e.push(["router", `svc${i}`]));
    return e;
  }, [device]);

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [nodes]);

  /* Camera drag */
  const onMouseDown = useCallback((e) => {
    if (e.target.closest(".apg-node")) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => setPan({
      x: dragStart.current.px + e.clientX - dragStart.current.mx,
      y: dragStart.current.py + e.clientY - dragStart.current.my,
    });
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.0008, 0.5), 2.2));
  }, []);

  const resetView = () => { setZoom(0.92); setPan({ x: 0, y: 0 }); };

  /* Determine breach state */
  const getBreached = useCallback((id) => {
    if (!simulate) return false;
    const order = ["internet", "fw", "router", "lan"];
    return order.includes(id);
  }, [simulate]);

  return (
    <div style={{
      background: "radial-gradient(ellipse at 50% 30%, #0a1b38 0%, #030a16 100%)",
      borderRadius: 22,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg,#2563EB,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 10px rgba(37,99,235,0.35)",
          }}>
            <Activity size={17} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "white" }}>
              Enterprise Attack Graph
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.42)" }}>
              3D topology · Scroll to zoom · Drag to pan
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.12, 2.2))}
            style={navBtn}
          ><ZoomIn size={14} /></button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.12, 0.5))}
            style={navBtn}
          ><ZoomOut size={14} /></button>
          <button onClick={resetView} style={navBtn}><RotateCcw size={13} /></button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSimulate((s) => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px",
              background: simulate
                ? "rgba(239,68,68,0.18)"
                : "linear-gradient(135deg,rgba(37,99,235,0.7),rgba(6,182,212,0.6))",
              border: `1px solid ${simulate ? "rgba(239,68,68,0.35)" : "rgba(37,99,235,0.40)"}`,
              borderRadius: 10,
              color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Play size={12} />
            {simulate ? "Stop Breach" : "Simulate Breach"}
          </motion.button>
        </div>
      </div>

      {/* Canvas viewport */}
      <div
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        style={{
          height: 480,
          position: "relative",
          overflow: "hidden",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        {/* Background grid (isometric tilt) */}
        <div style={{
          position: "absolute", inset: -80,
          backgroundImage: `
            linear-gradient(to right, rgba(37,99,235,0.055) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37,99,235,0.055) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: `perspective(900px) rotateX(${rotX}deg)`,
          pointerEvents: "none",
        }} />

        {/* Ambient light orbs */}
        <div style={{
          position: "absolute", top: "15%", left: "20%",
          width: 400, height: 280,
          background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none",
        }} />
        {simulate && (
          <div style={{
            position: "absolute", bottom: "20%", right: "15%",
            width: 360, height: 260,
            background: "radial-gradient(circle, rgba(239,68,68,0.10) 0%, transparent 70%)",
            filter: "blur(50px)", pointerEvents: "none",
          }} />
        )}

        {/* Pan + Zoom wrapper */}
        <div style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: dragging ? "none" : "transform 0.08s ease-out",
          overflow: "visible",
        }}>
          {/* Inner world with isometric perspective */}
          <div style={{
            position: "absolute",
            width: 960, height: 520,
            left: "calc(50% - 480px)",
            top: "calc(50% - 260px)",
            transform: `perspective(900px) rotateX(${rotX}deg)`,
            transformStyle: "preserve-3d",
          }}>
            {/* SVG edges + particles + packet animations */}
            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
            >
              <defs>
                <linearGradient id="apg-edge-normal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.20" />
                </linearGradient>
                <linearGradient id="apg-edge-breach" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.80" />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity="0.60" />
                </linearGradient>
                <filter id="apg-packet-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Floating ambient particles */}
              {PARTICLES.map((p) => (
                <circle key={p.id} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={p.opacity}>
                  <animate
                    attributeName="cy"
                    values={`${p.cy};${p.cy - 20};${p.cy}`}
                    dur={`${p.dur}s`}
                    begin={`${p.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values={`${p.opacity};${p.opacity * 2};${p.opacity}`}
                    dur={`${p.dur}s`}
                    begin={`${p.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}

              {/* Edges */}
              {edges.map(([a, b], i) => {
                const s = nodeMap[a];
                const t = nodeMap[b];
                if (!s || !t) return null;
                const breached = simulate && getBreached(a) && getBreached(b);

                return (
                  <g key={i}>
                    {/* Shadow edge */}
                    <line
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke="rgba(0,0,0,0.50)" strokeWidth={5}
                    />
                    {/* Main edge */}
                    <line
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke={breached ? "url(#apg-edge-breach)" : "url(#apg-edge-normal)"}
                      strokeWidth={breached ? 2.5 : 1.5}
                      strokeDasharray={breached ? "none" : "5 4"}
                    />

                    {/* Animated data packets */}
                    <circle
                      r={breached ? 7 : 5}
                      fill={breached ? "#EF4444" : "#38BDF8"}
                      filter="url(#apg-packet-glow)"
                    >
                      <animateMotion
                        path={`M ${s.x} ${s.y} L ${t.x} ${t.y}`}
                        dur={breached ? "1.2s" : "2.8s"}
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Second packet (offset) */}
                    <circle
                      r={breached ? 5 : 3}
                      fill={breached ? "#F97316" : "rgba(56,189,248,0.5)"}
                    >
                      <animateMotion
                        path={`M ${s.x} ${s.y} L ${t.x} ${t.y}`}
                        dur={breached ? "1.2s" : "2.8s"}
                        begin={breached ? "0.5s" : "1.4s"}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Nodes — world-locked positions, hover scale on inner element */}
            {nodes.map((node) => (
              <div key={node.id} className="apg-node">
                <NetNode
                  node={node}
                  isSelected={selected?.id === node.id}
                  isBreached={simulate && getBreached(node.id)}
                  isInsecure={node.insecure}
                  simulate={simulate}
                  onClick={setSelected}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Breach legend badge */}
        <AnimatePresence>
          {simulate && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                position: "absolute",
                top: 12, right: 12,
                background: "rgba(239,68,68,0.14)",
                border: "1px solid rgba(239,68,68,0.30)",
                borderRadius: 10,
                padding: "6px 12px",
                display: "flex", alignItems: "center", gap: 6,
                color: "#FCA5A5", fontSize: 11.5, fontWeight: 700,
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }}
              />
              BREACH ACTIVE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected node details */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
            <div style={{
              padding: "14px 20px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
            }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "white" }}>
                  {selected.label}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.50)" }}>
                  Type: <span style={{ color: "#93C5FD" }}>{selected.type}</span>
                  {selected.data?.ip_address && <> &nbsp;·&nbsp; IP: <code style={{ color: "#86EFAC", fontFamily: "var(--font-mono)" }}>{selected.data.ip_address}</code></>}
                  {selected.data?.status && <> &nbsp;·&nbsp; Status: <span style={{ color: selected.data.status === "UP" ? "#22C55E" : "#EF4444" }}>{selected.data.status}</span></>}
                  {selected.data?.port && <> &nbsp;·&nbsp; Port: {selected.data.port}</>}
                  {selected.data?.secure !== undefined && (
                    <> &nbsp;·&nbsp; <span style={{ color: selected.data.secure ? "#22C55E" : "#F97316" }}>
                      {selected.data.secure ? "🔒 Encrypted" : "⚠ Unencrypted"}
                    </span></>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 11,
                  padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-sans)", flexShrink: 0,
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const navBtn = {
  width: 30, height: 30, borderRadius: 8,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
