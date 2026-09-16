export default function DeviceTable({ device }) {
  const interfaces = device?.interfaces || [];

  return (
    <div
      style={{
        background: "#071633",
        borderRadius: "24px",
        padding: "24px",
        color: "white",
        marginTop: "10px",
      }}
    >
      <h2 style={{ marginBottom: "18px" }}>Network Interfaces</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          color: "#111827",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#2752CC", color: "white" }}>
            <th style={th}>Interface</th>
            <th style={th}>IP Address</th>
            <th style={th}>Subnet</th>
            <th style={th}>Status</th>
            <th style={th}>VLAN</th>
          </tr>
        </thead>

        <tbody>
          {interfaces.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#6B7280",
                }}
              >
                No interfaces detected
              </td>
            </tr>
          ) : (
            interfaces.map((intf, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={td}>{intf.name}</td>
                <td style={td}>{intf.ip_address || "-"}</td>
                <td style={td}>{intf.subnet_mask || "-"}</td>
                <td style={td}>
                  <span
                    style={{
                      background:
                        intf.status === "UP" ? "#16A34A" : "#991B1B",
                      color: "white",
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontWeight: "700",
                      fontSize: "13px",
                    }}
                  >
                    {intf.status}
                  </span>
                </td>
                <td style={td}>{intf.vlan ?? "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: "16px",
  textAlign: "left",
  fontSize: "18px",
  fontWeight: "700",
};

const td = {
  padding: "16px",
  fontSize: "15px",
};
