import React from "react";

export default function DeviceRelationship({ device }) {

  if (!device) return null;

  return (

    <div className="relationship">

      <h2>Device Relationship</h2>

      <div className="tree">

        <div className="node internet">
          Internet
        </div>

        <div className="line"/>

        <div className="node firewall">
          {device.hostname}
        </div>

        <div className="line"/>

        <div className="children">

          {device.interfaces?.map((iface,index)=>(

            <div key={index} className="node interface">

              {iface.name}

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}
