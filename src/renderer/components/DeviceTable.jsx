import React from "react";
import "../style/DeviceTable.css";
import webViewArrow from "../../assets/icons/arrow-up-right-from-square-solid-full.svg";

export default function DeviceTable({ devices, onRowClick, onIpClick }) {
  return (
    <div className="table-responsive" id="table-container">
      <table className="table table-bordered table-hover align-middle">
        <thead>
          <tr>
            <th>IP Address</th>
            <th>MAC Address</th>
            <th>Type</th>
            {/* <th>Status</th> */}
            <th>Web View</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.ip} onClick={() => onRowClick(device)}>
              <td
                className="ip-cell"
                onClick={(e) => {
                  e.stopPropagation();
                  onIpClick(device);
                }}
              >
                {device.ip}
              </td>
              <td>{device.mac || "Unknown"}</td>
              <td>{device.type || "Unknown"}</td>
              {/* <td>
                <span
                  style={{
                    color: device.online ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}
                >
                  {device.online ? 'Online' : 'Offline'}
                </span>
              </td> */}
              <td
                className="web-view-cell"
                onClick={(e) => {
                  e.stopPropagation();
                  const isPBX = String(device.type || "").toLowerCase().includes("pbx");
                  const hasHttpsPort = device.openPorts && device.openPorts.includes(443);
                  const hasHttpPort = device.openPorts && (device.openPorts.includes(80) || device.openPorts.includes(8080));
                  
                  // If we know the open ports but none are web ports, warn the user
                  if (device.openPorts && !hasHttpsPort && !hasHttpPort) {
                    alert(`Web configuration not detected on ${device.ip}.\n\nThis device may not support a web interface or its ports are closed.`);
                    return;
                  }
                  
                  if (isPBX) {
                    alert(`Note: PBX systems have strict security settings that may block this built-in viewer.\n\nIf the screen shows up blank, please open your normal web browser (like Chrome or Edge) and type this address into the top bar:\n\nhttps://${device.ip}`);
                  }

                  if (isPBX || hasHttpsPort) {
                    window.open(`https://${device.ip}`, "_blank");
                  } else {
                    window.open(`http://${device.ip}`, "_blank");
                  }
                }}
                style={{ textAlign: "center", cursor: "pointer" }}
              >
                <img
                  src={webViewArrow}
                  alt="redirect icon"
                  style={{ width: 14, height: 14 }}
                  title="Open Web Interface"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
