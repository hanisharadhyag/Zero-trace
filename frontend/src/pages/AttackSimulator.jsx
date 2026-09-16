import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2, Compass,
  ShieldAlert, AlertTriangle, Terminal, Activity, Zap, Server,
  Globe, Lock, Layers, Eye, RefreshCw, Cpu, Radio, Shield, Crosshair
} from "lucide-react";
import { getAttackPath } from "../services/api";
import { toast } from "../components/Toast";

/* ── Enterprise Network Nodes Definition ─────────────────── */
const DEFAULT_NODES = [
  {
    id: "internet",
    label: "Internet",
    sublabel: "Threat Actor",
    ip: "198.51.100.44",
    x: 100,
    y: 280,
    z: 0,
    type: "external",
    icon: Globe,
    defaultColor: "#EF4444",
    risk: "CRITICAL",
    ports: ["WAN"],
    cvss: 9.8,
  },
  {
    id: "firewall",
    label: "Firewall",
    sublabel: "Next-Gen Perimeter",
    ip: "203.0.113.1",
    x: 310,
    y: 280,
    z: 15,
    type: "security",
    icon: Shield,
    defaultColor: "#3B82F6",
    risk: "HIGH",
    ports: ["eth0", "eth1"],
    cvss: 7.5,
  },
  {
    id: "router",
    label: "Branch Router",
    sublabel: "Cisco Catalyst 9300",
    ip: "10.0.0.1",
    x: 550,
    y: 280,
    z: 30,
    type: "router",
    icon: Server,
    defaultColor: "#0EA5E9",
    risk: "CRITICAL",
    ports: ["mgmt0", "vlan1"],
    cvss: 9.1,
  },
  {
    id: "gig0",
    label: "GigabitEthernet0/0",
    sublabel: "WAN Gateway",
    ip: "203.0.113.2",
    x: 550,
    y: 110,
    z: 20,
    type: "interface",
    icon: Radio,
    defaultColor: "#64748B",
    risk: "LOW",
    ports: ["1 Gbps"],
    cvss: 3.2,
  },
  {
    id: "gig1",
    label: "GigabitEthernet0/1",
    sublabel: "LAN Uplink Trunk",
    ip: "10.0.1.1",
    x: 550,
    y: 450,
    z: 20,
    type: "interface",
    icon: Radio,
    defaultColor: "#64748B",
    risk: "LOW",
    ports: ["1 Gbps"],
    cvss: 3.2,
  },
  {
    id: "ssh",
    label: "SSH",
    sublabel: "TCP Port 22",
    ip: "10.0.0.1:22",
    x: 810,
    y: 110,
    z: 45,
    type: "service",
    icon: Lock,
    defaultColor: "#EAB308",
    risk: "CRITICAL",
    ports: ["Port 22"],
    cvss: 8.8,
  },
  {
    id: "snmp",
    label: "SNMP",
    sublabel: "UDP Port 161 (v2c)",
    ip: "10.0.0.1:161",
    x: 810,
    y: 230,
    z: 45,
    type: "service",
    icon: Cpu,
    defaultColor: "#F97316",
    risk: "HIGH",
    ports: ["Port 161"],
    cvss: 7.9,
  },
  {
    id: "lan",
    label: "LAN",
    sublabel: "Corporate Workstations",
    ip: "10.0.1.0/24",
    x: 810,
    y: 350,
    z: 45,
    type: "network",
    icon: Layers,
    defaultColor: "#10B981",
    risk: "MEDIUM",
    ports: ["VLAN 10"],
    cvss: 5.5,
  },
  {
    id: "gig2",
    label: "GigabitEthernet0/2",
    sublabel: "DMZ Database Segment",
    ip: "10.0.2.1",
    x: 810,
    y: 470,
    z: 45,
    type: "interface",
    icon: Radio,
    defaultColor: "#DC2626",
    risk: "CRITICAL",
    ports: ["DMZ"],
    cvss: 9.4,
  },
];

/* ── Network Topology Interconnections ──────────────────── */
const TOPOLOGY_EDGES = [
  { id: "e-inet-fw", from: "internet", to: "firewall", label: "External Ingress" },
  { id: "e-fw-router", from: "firewall", to: "router", label: "Core Trunk" },
  { id: "e-router-gig0", from: "router", to: "gig0", label: "Port 0/0" },
  { id: "e-router-gig1", from: "router", to: "gig1", label: "Port 0/1" },
  { id: "e-router-ssh", from: "router", to: "ssh", label: "Remote Admin" },
  { id: "e-router-snmp", from: "router", to: "snmp", label: "SNMP Telemetry" },
  { id: "e-router-lan", from: "router", to: "lan", label: "Subnet Route" },
  { id: "e-router-gig2", from: "router", to: "gig2", label: "DMZ Interface" },
];

/* ── Sequential Stages of the Adversarial Breach ─────────── */
const SIMULATION_STAGES = [
  {
    stage: 0,
    name: "Standby / Perimeter Recon",
    location: "Internet (External Hostile Subnet)",
    tactic: "TA0001: Initial Access / Recon",
    technique: "T1595 — Active Scanning & Port Enumeration",
    description: "Adversary probes perimeter edge, discovering exposed stateful firewall rules and public-facing gateways.",
    cvss: 0.0,
    risk: "LOW",
    packets: [],
    compromised: ["internet"],
    flashingNodes: [],
    pulsingNodes: [],
  },
  {
    stage: 1,
    name: "Perimeter Ingress",
    location: "Perimeter Firewall (Ingress Edge)",
    tactic: "TA0001: Initial Access",
    technique: "T1190 — Exploit Public-Facing Application",
    description: "Hostile SYN flood and payload packet traverses firewall perimeter via misconfigured permissive ACL.",
    cvss: 7.2,
    risk: "HIGH",
    packets: [{ id: "p1", from: "internet", to: "firewall", color: "#EF4444" }],
    compromised: ["internet"],
    flashingNodes: ["firewall"],
    pulsingNodes: [],
  },
  {
    stage: 2,
    name: "Firewall Breach & Core Penetration",
    location: "Core Branch Router (IOS / Junos Edge)",
    tactic: "TA0002: Execution & Defense Evasion",
    technique: "T1562 — Impair Defenses & ACL Bypass",
    description: "Firewall flashes amber under evasion exploit. Malicious packet punches through into core Branch Router.",
    cvss: 8.6,
    risk: "CRITICAL",
    packets: [{ id: "p2", from: "firewall", to: "router", color: "#F59E0B" }],
    compromised: ["internet", "firewall"],
    flashingNodes: ["firewall"],
    pulsingNodes: ["router"],
  },
  {
    stage: 3,
    name: "Branch Router Compromise",
    location: "Branch Router (Privilege Escalation)",
    tactic: "TA0004: Privilege Escalation",
    technique: "T1068 — Unauthenticated Remote Privilege Escalation",
    description: "Core Branch Router compromised! System triggers alarm pulses as attacker gains root/enable EXEC mode.",
    cvss: 9.3,
    risk: "CRITICAL",
    packets: [],
    compromised: ["internet", "firewall", "router"],
    flashingNodes: [],
    pulsingNodes: ["router"],
  },
  {
    stage: 4,
    name: "Simultaneous Multi-Vector Fan-Out",
    location: "Simultaneous Lateral Pivots (SSH / SNMP / DMZ)",
    tactic: "TA0008: Lateral Movement",
    technique: "T1021.004 (SSH) + T1046 (SNMP) + T1078 (DMZ)",
    description: "Attack splits into 3 parallel streams simultaneously targeting SSH administration, SNMP secrets, and GigabitEthernet0/2 DMZ.",
    cvss: 9.8,
    risk: "EXTREME",
    packets: [
      { id: "p-ssh", from: "router", to: "ssh", color: "#EF4444" },
      { id: "p-snmp", from: "router", to: "snmp", color: "#F97316" },
      { id: "p-gig2", from: "router", to: "gig2", color: "#DC2626" },
    ],
    compromised: ["internet", "firewall", "router"],
    flashingNodes: ["ssh", "snmp", "gig2"],
    pulsingNodes: ["router", "ssh", "snmp", "gig2"],
  },
  {
    stage: 5,
    name: "Full DMZ & Asset Takeover",
    location: "Complete Network Segment Breach",
    tactic: "TA0010: Exfiltration",
    technique: "T1041 — Exfiltration Over Command & Control",
    description: "SSH keys harvested, SNMP community strings cracked, and GigabitEthernet0/2 DMZ database segment fully breached.",
    cvss: 10.0,
    risk: "CATASTROPHIC",
    packets: [],
    compromised: ["internet", "firewall", "router", "ssh", "snmp", "gig2"],
    flashingNodes: [],
    pulsingNodes: ["ssh", "snmp", "gig2", "router"],
  },
];

export default function AttackSimulator() {
  /* ── State Management ──────────────────────────────────── */
  const [stageIndex, setStageIndex]     = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [speed, setSpeed]               = useState(1);
  const [elapsedSeconds, setElapsed]   = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode]   = useState(null);

  /* ── 3D Viewport & Camera State ────────────────────────── */
  const [zoom, setZoom]                 = useState(1.05);
  const [pan, setPan]                   = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]     = useState(false);
  const [dragStart, setDragStart]       = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate]     = useState(true);
  const [rotY, setRotY]                 = useState(-8);
  const [rotX, setRotX]                 = useState(14);

  const containerRef = useRef(null);

  /* ── Live Backend Integration ──────────────────────────── */
  const [nodes, setNodes] = useState(DEFAULT_NODES);

  useEffect(() => {
    getAttackPath()
      .then((data) => {
        if (data?.success && data?.topology?.nodes?.length) {
          const backendNodes = data.topology.nodes;
          setNodes((prev) =>
            prev.map((n) => {
              const bNode = backendNodes.find(
                (bn) =>
                  bn.id === n.id ||
                  (bn.data?.label && bn.data.label.toLowerCase().includes(n.id.toLowerCase())) ||
                  (bn.data?.type && bn.data.type.toLowerCase() === n.type.toLowerCase())
              );
              if (bNode) {
                const bPos = bNode.position;
                const dynamicX = bPos?.x ? Math.max(90, Math.min(860, bPos.x * 1.35 + 40)) : n.x;
                const dynamicY = bPos?.y ? Math.max(90, Math.min(500, bPos.y * 1.25 + 20)) : n.y;
                return {
                  ...n,
                  label: bNode.data?.label || bNode.label || n.label,
                  sublabel: bNode.data?.vendor
                    ? `${bNode.data.vendor} ${bNode.data.type || "Device"}`
                    : bNode.data?.ip
                    ? `IP: ${bNode.data.ip}`
                    : n.sublabel,
                  ip: bNode.data?.ip || n.ip,
                  risk: bNode.data?.risk ? String(bNode.data.risk).toUpperCase() : n.risk,
                  x: dynamicX,
                  y: dynamicY,
                };
              }
              return n;
            })
          );
        }
      })
      .catch((err) => console.warn("Attack path telemetry:", err));
  }, []);

  /* ── Simulation Timer & Progress ───────────────────────── */
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    const delay = Math.max(2200 / speed, 1000);
    const timer = setTimeout(() => {
      setStageIndex((curr) => {
        if (curr < SIMULATION_STAGES.length - 1) {
          return curr + 1;
        } else {
          setIsPlaying(false);
          toast.success("Adversarial simulation completed all target breaches!");
          return curr;
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, stageIndex, speed]);

  /* ── Auto Rotate Parallax Motion ───────────────────────── */
  useEffect(() => {
    if (!autoRotate) return;
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.02;
      setRotY(Math.sin(angle) * 10 - 4);
      setRotX(12 + Math.cos(angle * 0.7) * 4);
    }, 40);
    return () => clearInterval(interval);
  }, [autoRotate]);

  /* ── Camera Mouse Event Handlers ───────────────────────── */
  const handleMouseDown = (e) => {
    if (e.target.closest(".interactive-node") || e.target.closest(".floating-panel")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0010;
    setZoom((z) => Math.min(Math.max(z + zoomDelta, 0.6), 2.4));
  };

  const handleDoubleClick = () => {
    if (hoveredNode || selectedNode) {
      const target = hoveredNode || selectedNode;
      setPan({
        x: (480 - target.x) * zoom,
        y: (300 - target.y) * zoom,
      });
      toast.info(`Centered camera on ${target.label}`);
    } else {
      setZoom(1.05);
      setPan({ x: 0, y: 0 });
      setRotX(14);
      setRotY(-8);
    }
  };

  /* ── Camera Action Controls ────────────────────────────── */
  const zoomIn = () => setZoom((z) => Math.min(z + 0.18, 2.4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.18, 0.5));
  const resetView = () => {
    setZoom(1.05);
    setPan({ x: 0, y: 0 });
    setRotX(14);
    setRotY(-8);
    toast.info("Camera view reset to origin.");
  };
  const fitNetwork = () => {
    setZoom(0.92);
    setPan({ x: 0, y: 0 });
    toast.info("Viewport aligned to full network boundary.");
  };

  /* ── Simulation Playback Actions ───────────────────────── */
  const currentStage = SIMULATION_STAGES[stageIndex];

  const handleStart = () => {
    if (stageIndex >= SIMULATION_STAGES.length - 1) {
      setStageIndex(0);
      setElapsed(0);
    }
    setIsPlaying(true);
    toast.info("Breach simulation sequence engaged.");
  };

  const handlePause = () => {
    setIsPlaying(false);
    toast.info("Simulation paused.");
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStageIndex(0);
    setElapsed(0);
    setSelectedNode(null);
    toast.info("Simulation reset to initial state.");
  };

  const stepForward = () => {
    if (stageIndex < SIMULATION_STAGES.length - 1) {
      setStageIndex((s) => s + 1);
    }
  };

  /* ── Node Coordinate Map Helper ────────────────────────── */
  const nodeMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nodes]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 100px)",
        minHeight: 640,
        background: "radial-gradient(ellipse at 50% 35%, #0a1b38 0%, #030a16 100%)",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        boxShadow: "0 24px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Dynamic Cyber Matrix Grid Background */}
      <div
        style={{
          position: "absolute",
          inset: -100,
          backgroundImage: `
            linear-gradient(to right, rgba(37, 99, 235, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          transform: `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(-40px)`,
          transition: autoRotate ? "none" : "transform 0.3s ease-out",
          pointerEvents: "none",
        }}
      />

      {/* Subtle Dynamic Ambient Lighting Orbs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "25%",
          width: 500,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "20%",
          width: 450,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      {/* ── 3D Interactive World Canvas ────────────────────── */}
      {/* IMPORTANT: Zoom is applied here on the outer container so it
          doesn't affect node world coordinates. Node (x,y) positions
          are in world space and do NOT change on zoom or hover. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          /* Pan via translate, zoom via scale — keeps nodes locked */
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.08s ease-out",
        }}
      >
        {/* Inner world — perspective & rotation applied here separately */}
        <div
          style={{
            position: "absolute",
            width: 960,
            height: 600,
            left: "calc(50% - 480px)",
            top: "calc(50% - 300px)",
            transform: `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transformStyle: "preserve-3d",
            transition: isDragging ? "none" : "transform 0.12s ease-out",
          }}
        >
        {/* SVG Vector Edges & Packet Animations */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            <linearGradient id="edge-default" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="edge-breached" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.6" />
            </linearGradient>
            <filter id="packet-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render Topology Connection Lines */}
          {TOPOLOGY_EDGES.map((edge) => {
            const src = nodeMap[edge.from];
            const dst = nodeMap[edge.to];
            if (!src || !dst) return null;

            const isTraversed = currentStage.compromised.includes(edge.to) && currentStage.compromised.includes(edge.from);
            const isTargeted = currentStage.packets.some((p) => p.from === edge.from && p.to === edge.to);

            return (
              <g key={edge.id}>
                {/* Back shadow edge */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={6}
                />
                {/* Active edge line */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke={isTraversed ? "url(#edge-breached)" : isTargeted ? "#F59E0B" : "url(#edge-default)"}
                  strokeWidth={isTraversed || isTargeted ? 2.5 : 1.5}
                  strokeDasharray={isTraversed ? "none" : isTargeted ? "6 4" : "4 4"}
                />

                {/* Animated traveling packets across edge */}
                {isTargeted && (
                  <circle r={6} fill="#EF4444" filter="url(#packet-glow)">
                    <animateMotion
                      path={`M ${src.x} ${src.y} L ${dst.x} ${dst.y}`}
                      dur={isPlaying ? `${1.4 / speed}s` : "0s"}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Render Enterprise Network Device Nodes */}
        {nodes.map((node) => {
          const isCompromised = currentStage.compromised.includes(node.id);
          const isFlashing    = currentStage.flashingNodes.includes(node.id);
          const isPulsing     = currentStage.pulsingNodes.includes(node.id);
          const isSelected    = selectedNode?.id === node.id;
          const IconComponent = node.icon;

          const nodeColor = isCompromised
            ? "#EF4444"
            : isFlashing
            ? "#EAB308"
            : node.defaultColor;

          return (
            /* LOCKED WORLD POSITION: left/top are NEVER changed by zoom, hover, or rotation.
               Only the INNER visual scales on hover — preventing coordinate drift. */
            <div
              key={node.id}
              className="interactive-node"
              onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                /* World position is set by transform: translate(-50%,-50%) ONLY.
                   translateZ is for depth layering but does NOT shift x/y. */
                transform: `translate(-50%, -50%) translateZ(${node.z}px)`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                /* NO scale here — hover scale is on the inner element below */
              }}
            >
              {/* Pulse ring — breach indicator */}
              {(isCompromised || isPulsing || isFlashing) && (
                <motion.div
                  animate={{ scale: [1, 1.7, 1], opacity: [0.65, 0, 0.65] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: "50%",
                    border: `2px solid ${nodeColor}`,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Enterprise 3D Device Shell — scale on hover handled internally */}
              <motion.div
                whileHover={{ scale: 1.14 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: node.type === "external" ? "50%" : 14,
                  background: isCompromised
                    ? `radial-gradient(circle at 35% 30%, rgba(239,68,68,0.55) 0%, rgba(15,23,42,0.95) 75%)`
                    : isFlashing
                    ? `radial-gradient(circle at 35% 30%, rgba(234,179,8,0.45) 0%, rgba(15,23,42,0.95) 75%)`
                    : `radial-gradient(circle at 35% 30%, ${nodeColor}55 0%, rgba(10,18,36,0.96) 75%)`,
                  border: `1.5px solid ${nodeColor}${isSelected ? "FF" : "88"}`,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${nodeColor}55, 0 6px 18px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.12)`
                    : `0 6px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                  position: "relative",
                  /* Metallic sheen pseudo-highlight via inner gradient */
                  overflow: "hidden",
                }}
              >
                {/* Specular sheen overlay */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: "50%", height: "45%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
                  borderRadius: "inherit",
                  pointerEvents: "none",
                }} />

                <IconComponent size={24} color={nodeColor} strokeWidth={1.8} />

                {/* Status LED badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: isCompromised ? "#EF4444" : isFlashing ? "#EAB308" : "#22C55E",
                    border: "1.5px solid rgba(6,14,27,0.9)",
                    boxShadow: `0 0 5px ${isCompromised ? "rgba(239,68,68,0.7)" : "rgba(34,197,94,0.7)"}`,
                  }}
                />
              </motion.div>

              {/* Drop shadow beneath device */}
              <div style={{
                width: 44, height: 8,
                background: "radial-gradient(ellipse,rgba(0,0,0,0.55) 0%,transparent 80%)",
                borderRadius: "50%",
                marginTop: 2,
                filter: "blur(2px)",
                pointerEvents: "none",
              }} />

              {/* Node Label */}
              <div style={{ marginTop: 4, textAlign: "center", pointerEvents: "none" }}>
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: isCompromised ? "#FCA5A5" : "white",
                  letterSpacing: "0.02em",
                  textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                }}>
                  {node.label}
                </div>
                <div style={{
                  fontSize: 9.5,
                  color: "rgba(255,255,255,0.48)",
                  fontFamily: "var(--font-mono, monospace)",
                  marginTop: 1,
                }}>
                  {node.ip}
                </div>
              </div>

              {/* Hover Tooltip */}
              <AnimatePresence>
                {hoveredNode?.id === node.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                    animate={{ opacity: 1, y: -6, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.92 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      width: 210,
                      background: "rgba(6, 20, 43, 0.96)",
                      backdropFilter: "blur(22px)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: 14,
                      padding: "10px 14px",
                      boxShadow: "0 16px 36px rgba(0,0,0,0.65)",
                      zIndex: 100,
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ color: "white", fontSize: 12 }}>{node.label}</strong>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isCompromised ? "#EF4444" : "#22C55E" }}>
                        {isCompromised ? "BREACHED" : "ONLINE"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      <div>Type: <span style={{ color: "#93C5FD" }}>{node.sublabel}</span></div>
                      <div>IP: <code style={{ color: "#86EFAC", fontFamily: "var(--font-mono)" }}>{node.ip}</code></div>
                      <div>CVSS: <strong style={{ color: node.cvss >= 9 ? "#EF4444" : "#F59E0B" }}>{node.cvss} / 10</strong></div>
                      <div>Ports: <span style={{ color: "rgba(255,255,255,0.8)" }}>{node.ports.join(", ")}</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        </div> {/* end inner world */}
      </div> {/* end outer pan+zoom container */}

      {/* ── Top Header Controls Bar ────────────────────────── */}
      <div
        className="floating-panel"
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "auto",
          zIndex: 30,
        }}
      >
        {/* Title & Badge */}
        <div
          style={{
            background: "rgba(6, 20, 43, 0.78)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #DC2626, #F97316)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(220,38,38,0.5)",
            }}
          >
            <Crosshair size={20} color="white" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>
                Enterprise 3D Breach Simulator
              </h2>
              <span
                style={{
                  background: isPlaying ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
                  border: `1px solid ${isPlaying ? "#EF4444" : "#22C55E"}`,
                  color: isPlaying ? "#FCA5A5" : "#86EFAC",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  textTransform: "uppercase",
                }}
              >
                {isPlaying ? "Breach Active" : "Standby"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Multi-vector lateral pivot & egress telemetry (120 FPS accelerated)
            </p>
          </div>
        </div>

        {/* Playback Simulation Buttons */}
        <div
          style={{
            background: "rgba(6, 20, 43, 0.78)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <button
            onClick={isPlaying ? handlePause : handleStart}
            type="button"
            style={{
              background: isPlaying
                ? "rgba(234,179,8,0.2)"
                : "linear-gradient(135deg, #DC2626, #EF4444)",
              border: `1px solid ${isPlaying ? "#EAB308" : "#EF4444"}`,
              color: "white",
              borderRadius: 12,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: isPlaying ? "none" : "0 0 16px rgba(239,68,68,0.5)",
              transition: "all 0.2s",
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause Breach" : stageIndex === 0 ? "Start Breach" : "Resume Breach"}
          </button>

          <button
            onClick={stepForward}
            disabled={isPlaying || stageIndex >= SIMULATION_STAGES.length - 1}
            title="Step Forward"
            type="button"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 12px",
              color: "white",
              fontSize: 12,
              cursor: isPlaying ? "not-allowed" : "pointer",
              opacity: isPlaying ? 0.5 : 1,
            }}
          >
            Step ➔
          </button>

          <button
            onClick={handleReset}
            title="Reset Simulation"
            type="button"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={15} />
          </button>

          {/* Speed Selector */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 2 }}>
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                type="button"
                style={{
                  background: speed === s ? "rgba(37,99,235,0.5)" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  color: speed === s ? "white" : "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Left Floating Telemetry & Timeline Panel ───────── */}
      <div
        className="floating-panel"
        style={{
          position: "absolute",
          top: 86,
          left: 20,
          width: 320,
          maxHeight: "calc(100% - 110px)",
          background: "rgba(6, 20, 43, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 22,
          padding: 18,
          color: "white",
          boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
          overflowY: "auto",
          zIndex: 30,
          pointerEvents: "auto",
        }}
      >
        {/* Live Attack Telemetry Header */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#60A5FA", letterSpacing: "0.05em" }}>
              Adversarial State
            </span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono, monospace)", color: "#86EFAC" }}>
              ⏱ {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#FCA5A5", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#EF4444",
                boxShadow: "0 0 10px #EF4444",
                display: "inline-block",
              }}
            />
            {currentStage.location}
          </div>

          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
            {currentStage.description}
          </div>
        </div>

        {/* Real-time KPI Matrix */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Compromised</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#EF4444" }}>
              {currentStage.compromised.length} / {nodes.length}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>CVSS Impact</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: currentStage.cvss >= 9 ? "#EF4444" : "#F59E0B" }}>
              {currentStage.cvss} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>/ 10</span>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Risk Rating</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: currentStage.risk === "CATASTROPHIC" || currentStage.risk === "EXTREME" ? "#EF4444" : "#F59E0B" }}>
              {currentStage.risk}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Stage Step</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#93C5FD" }}>
              {stageIndex + 1} / {SIMULATION_STAGES.length}
            </div>
          </div>
        </div>

        {/* MITRE ATT&CK Tactic Badge */}
        <div
          style={{
            background: "rgba(37,99,235,0.12)",
            border: "1px solid rgba(37,99,235,0.3)",
            borderRadius: 12,
            padding: "8px 12px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 10, color: "#93C5FD", fontWeight: 700, textTransform: "uppercase" }}>
            MITRE ATT&CK Tactic
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "white", marginTop: 2 }}>
            {currentStage.tactic}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
            {currentStage.technique}
          </div>
        </div>

        {/* Stepped Attack Timeline */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 8 }}>
            Kill-Chain Progression
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SIMULATION_STAGES.map((s, idx) => {
              const isPast = idx < stageIndex;
              const isCurr = idx === stageIndex;

              return (
                <div
                  key={s.stage}
                  onClick={() => setStageIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: isCurr ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.02)",
                    border: isCurr ? "1px solid rgba(239,68,68,0.35)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: isPast ? "#22C55E" : isCurr ? "#EF4444" : "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "white",
                      boxShadow: isCurr ? "0 0 8px #EF4444" : "none",
                      flexShrink: 0,
                    }}
                  >
                    {isPast ? "✓" : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isCurr ? "#FCA5A5" : isPast ? "#86EFAC" : "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right Floating Camera Controls ─────────────────── */}
      <div
        className="floating-panel"
        style={{
          position: "absolute",
          top: 86,
          right: 20,
          background: "rgba(6, 20, 43, 0.78)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          zIndex: 30,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={zoomIn}
          title="Zoom In (+)"
          type="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={zoomOut}
          title="Zoom Out (−)"
          type="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={resetView}
          title="Reset View"
          type="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={fitNetwork}
          title="Fit Network"
          type="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Maximize2 size={16} />
        </button>

        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.1)" }} />

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Auto Rotate 3D View"
          type="button"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: autoRotate ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${autoRotate ? "#3B82F6" : "rgba(255,255,255,0.1)"}`,
            color: autoRotate ? "#93C5FD" : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: autoRotate ? "0 0 12px rgba(59,130,246,0.4)" : "none",
          }}
        >
          <Compass size={18} />
        </button>
      </div>

      {/* ── Bottom-Right Interactive Mini Map ──────────────── */}
      <div
        className="floating-panel"
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 210,
          height: 135,
          background: "rgba(6, 20, 43, 0.88)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 8,
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          zIndex: 30,
          pointerEvents: "auto",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, padding: "0 4px" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
            Network Topology Minimap
          </span>
          <span style={{ fontSize: 9, color: "#60A5FA" }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Scaled Mini SVG Graph */}
        <div style={{ position: "relative", width: "100%", height: 105, background: "rgba(0,0,0,0.4)", borderRadius: 10, overflow: "hidden" }}>
          <svg viewBox="0 0 960 600" style={{ width: "100%", height: "100%" }}>
            {TOPOLOGY_EDGES.map((e) => {
              const s = nodeMap[e.from];
              const d = nodeMap[e.to];
              if (!s || !d) return null;
              return (
                <line
                  key={e.id}
                  x1={s.x}
                  y1={s.y}
                  x2={d.x}
                  y2={d.y}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={3}
                />
              );
            })}
            {nodes.map((n) => {
              const isComp = currentStage.compromised.includes(n.id);
              return (
                <circle
                  key={n.id}
                  cx={n.x}
                  cy={n.y}
                  r={isComp ? 20 : 16}
                  fill={isComp ? "#EF4444" : n.defaultColor}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            })}
          </svg>

          {/* Viewport Camera Frustum Rectangle */}
          <div
            style={{
              position: "absolute",
              left: `${Math.max(0, Math.min(60, 25 - pan.x * 0.05))}%`,
              top: `${Math.max(0, Math.min(60, 25 - pan.y * 0.05))}%`,
              width: `${Math.min(100, 50 / zoom)}%`,
              height: `${Math.min(100, 50 / zoom)}%`,
              border: "1.5px solid #3B82F6",
              borderRadius: 4,
              background: "rgba(59,130,246,0.15)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
