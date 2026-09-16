import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Network Topology ──────────────────────────────────────── */
const TOPOLOGY = [
  { id: "internet",  label: "INTERNET",  x: 90,  y: 200, icon: "🌐", type: "external",  risk: "extreme" },
  { id: "firewall",  label: "FIREWALL",  x: 260, y: 200, icon: "🔥", type: "firewall",  risk: "medium"  },
  { id: "router",    label: "ROUTER",    x: 450, y: 200, icon: "🔵", type: "router",    risk: "high"    },
  { id: "lan",       label: "LAN",       x: 640, y: 200, icon: "🖧",  type: "network",   risk: "medium"  },
  { id: "ssh",       label: "SSH",       x: 800, y: 100, icon: "🔑", type: "service",   risk: "low"     },
  { id: "snmp",      label: "SNMP",      x: 800, y: 185, icon: "📡", type: "service",   risk: "high"    },
  { id: "vlan10",    label: "VLAN 10",   x: 800, y: 270, icon: "📶", type: "vlan",      risk: "medium"  },
  { id: "vlan20",    label: "VLAN 20",   x: 800, y: 355, icon: "📶", type: "vlan",      risk: "medium"  },
  { id: "database",  label: "DATABASE",  x: 800, y: 440, icon: "🗄", type: "data",      risk: "extreme" },
];

const EDGES = [
  ["internet", "firewall"],
  ["firewall", "router"],
  ["router", "lan"],
  ["lan", "ssh"],
  ["lan", "snmp"],
  ["lan", "vlan10"],
  ["lan", "vlan20"],
  ["vlan10", "database"],
];

/* ── Attack Steps ──────────────────────────────────────────── */
const ATTACK_STEPS = [
  {
    id: 0, from: "internet", to: "firewall",
    label: "Reconnaissance",
    description: "Attacker performs port scanning and fingerprinting from the internet.",
    technique: "T1595 — Active Scanning",
    risk: "Firewall exposed with weak ACL rules. Multiple ports accessible.",
    color: "#F97316",
  },
  {
    id: 1, from: "firewall", to: "router",
    label: "Firewall Bypass",
    description: "Exploiting misconfigured ACL rules to reach the internal router.",
    technique: "T1562 — Impair Defenses",
    risk: "Telnet (port 23) is enabled. Credentials transmitted in cleartext.",
    color: "#EF4444",
  },
  {
    id: 2, from: "router", to: "snmp",
    label: "SNMP Exploitation",
    description: "Community string 'public' is used to extract device configuration.",
    technique: "T1046 — Network Service Scanning",
    risk: "SNMPv1/v2 with public string allows full MIB tree read access.",
    color: "#EF4444",
  },
  {
    id: 3, from: "router", to: "lan",
    label: "Lateral Movement",
    description: "Using extracted credentials to move laterally into the LAN segment.",
    technique: "T1021 — Remote Services",
    risk: "No VLAN isolation or micro-segmentation between segments.",
    color: "#DC2626",
  },
  {
    id: 4, from: "vlan10", to: "database",
    label: "Database Access",
    description: "Attacker reaches the database server via unprotected VLAN 10.",
    technique: "T1078 — Valid Accounts",
    risk: "CRITICAL: Database server reachable without authentication boundary.",
    color: "#7F1D1D",
  },
];

/* ── Node Colors ───────────────────────────────────────────── */
const NODE_COLOR = {
  external: "#EF4444",
  firewall: "#64748B",
  router: "#2563EB",
  network: "#0EA5E9",
  service: "#22C55E",
  vlan: "#8B5CF6",
  data: "#F97316",
};

const NODE_SIZE = {
  external: 32,
  firewall: 30,
  router: 36,
  network: 28,
  service: 22,
  vlan: 22,
  data: 28,
};

/* ── Animated Packet ───────────────────────────────────────── */
function AttackPacket({ from, to, nodes, color, playing, speed }) {
  const s = nodes.find((n) => n.id === from);
  const t = nodes.find((n) => n.id === to);
  if (!s || !t || !playing) return null;

  const dur = 3 / speed;

  return (
    <motion.circle
      r={5}
      fill={color}
      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
    >
      <animateMotion
        dur={`${dur}s`}
        repeatCount="indefinite"
        path={`M ${s.x} ${s.y} Q ${(s.x + t.x) / 2} ${s.y - 30} ${t.x} ${t.y}`}
      />
    </motion.circle>
  );
}

export default function AnimatedAttackGraph({
  playing, currentStep, compromised, speed = 1,
  onNodeClick,
}) {
  const nodes = TOPOLOGY;

  const getNodeColor = (node) => {
    if (compromised.includes(node.id)) return "#EF4444";
    return NODE_COLOR[node.type] || "#64748B";
  };

  const getNodeGlow = (node) => {
    if (compromised.includes(node.id)) return `drop-shadow(0 0 12px #EF4444)`;
    if (node.id === ATTACK_STEPS[currentStep]?.to) return `drop-shadow(0 0 14px #F97316)`;
    return `drop-shadow(0 0 5px ${NODE_COLOR[node.type]}88)`;
  };

  const activeStep = ATTACK_STEPS[currentStep];

  return (
    <svg
      viewBox="0 0 920 540"
      style={{ width: "100%", background: "#040D1A", borderRadius: 16 }}
    >
      <defs>
        {/* Grid pattern */}
        <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(37,99,235,0.08)" strokeWidth={0.5} />
        </pattern>

        {/* Glow filter */}
        <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Red pulse filter for compromised */}
        <filter id="red-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background grid */}
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Zone Labels */}
      <text x={30}  y={30} fill="rgba(239,68,68,0.5)"   fontSize={10} fontWeight={700} fontFamily="Inter" letterSpacing="2">EXTERNAL ZONE</text>
      <text x={340} y={30} fill="rgba(37,99,235,0.5)"   fontSize={10} fontWeight={700} fontFamily="Inter" letterSpacing="2">INTERNAL ZONE</text>
      <text x={720} y={30} fill="rgba(139,92,246,0.5)"  fontSize={10} fontWeight={700} fontFamily="Inter" letterSpacing="2">SERVICES ZONE</text>

      {/* Zone boundaries */}
      <rect x={20} y={40} width={200} height={320} fill="rgba(239,68,68,0.03)" stroke="rgba(239,68,68,0.08)" strokeWidth={1} strokeDasharray="6,4" rx={8} />
      <rect x={230} y={40} width={390} height={320} fill="rgba(37,99,235,0.03)" stroke="rgba(37,99,235,0.08)" strokeWidth={1} strokeDasharray="6,4" rx={8} />
      <rect x={740} y={40} width={170} height={440} fill="rgba(139,92,246,0.03)" stroke="rgba(139,92,246,0.08)" strokeWidth={1} strokeDasharray="6,4" rx={8} />

      {/* Edges */}
      {EDGES.map(([fromId, toId], i) => {
        const s = nodes.find((n) => n.id === fromId);
        const t = nodes.find((n) => n.id === toId);
        if (!s || !t) return null;
        const isActive = activeStep?.from === fromId && activeStep?.to === toId;
        const isCompromised = compromised.includes(fromId) && compromised.includes(toId);

        return (
          <g key={i}>
            <line
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={isCompromised ? "#EF444430" : isActive ? "#F9731630" : "rgba(59,130,246,0.15)"}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeDasharray={isActive ? "0" : "6,4"}
            />
          </g>
        );
      })}

      {/* Attack Packets */}
      {playing && activeStep && (
        <AttackPacket
          from={activeStep.from}
          to={activeStep.to}
          nodes={nodes}
          color={activeStep.color}
          playing={playing}
          speed={speed}
        />
      )}

      {/* Nodes */}
      {nodes.map((node) => {
        const r = NODE_SIZE[node.type] || 24;
        const color = getNodeColor(node);
        const isCompromised = compromised.includes(node.id);
        const isTarget = activeStep?.to === node.id && playing;

        return (
          <g key={node.id} onClick={() => onNodeClick?.(node)} style={{ cursor: "pointer" }}>
            {/* Outer pulse ring for active/compromised */}
            {(isCompromised || isTarget) && (
              <circle cx={node.x} cy={node.y} r={r + 10} fill="none" stroke={isCompromised ? "#EF4444" : "#F97316"} strokeWidth={1.5} opacity={0.4}>
                <animate attributeName="r" values={`${r + 8};${r + 18};${r + 8}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Node circle */}
            <circle
              cx={node.x} cy={node.y} r={r}
              fill={isCompromised ? "#EF444420" : `${color}20`}
              stroke={color}
              strokeWidth={isCompromised ? 2.5 : 1.5}
              filter={isCompromised ? "url(#red-glow)" : "url(#node-glow)"}
            />

            {/* Icon */}
            <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={r * 0.65} style={{ userSelect: "none" }}>
              {node.icon}
            </text>

            {/* Label */}
            <text
              x={node.x} y={node.y + r + 16}
              textAnchor="middle"
              fontSize={10} fontWeight={700}
              fill={isCompromised ? "#FCA5A5" : "rgba(255,255,255,0.7)"}
              fontFamily="Inter"
              letterSpacing="1"
            >
              {node.label}
            </text>

            {/* Compromised badge */}
            {isCompromised && (
              <text x={node.x + r - 4} y={node.y - r + 4} textAnchor="middle" fontSize={14}>⚠️</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export { ATTACK_STEPS, TOPOLOGY };
