import React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap
} from "reactflow";
import "reactflow/dist/style.css";

export default function TopologyGraph({ topology }) {

  if (!topology) {
    return <p>No topology available.</p>;
  }

  const nodes = topology.nodes.map((node, index) => ({
    id: node.id,
    data: { label: node.label },
    position: {
      x: 100 + (index % 3) * 220,
      y: 60 + Math.floor(index / 3) * 130
    }
  }));

  const edges = topology.edges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source,
    target: edge.target,
    animated: true
  }));

  return (
    <div style={{ height: 450, background: "#fff", borderRadius: 10 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
