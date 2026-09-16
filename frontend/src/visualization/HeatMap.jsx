import React from "react";

export default function HeatMap({ interfaces }) {

  if (!interfaces) return null;

  return (

    <div className="heatmap-grid">

      {interfaces.map((iface,index)=>(

        <div
          key={index}
          className={`heat-box ${
            iface.status==="up" ? "healthy" : "risky"
          }`}
        >

          <h4>{iface.name}</h4>

          <p>{iface.ip_address || "No IP"}</p>

          <strong>{iface.status}</strong>

        </div>

      ))}

    </div>

  );

}
