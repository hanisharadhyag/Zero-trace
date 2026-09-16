import React from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function SecurityScoreChart({ score }) {

  const data = [
    { stage: "Ideal", value: 100 },
    { stage: "Current", value: score || 0 }
  ];

  return (

    <div style={{ width: "100%", height: 300, background: "#fff" }}>

      <ResponsiveContainer>

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3"/>

          <XAxis dataKey="stage"/>

          <YAxis domain={[0,100]}/>

          <Tooltip/>

          <Line
            type="monotone"
            dataKey="value"
            stroke="#7c3aed"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}
