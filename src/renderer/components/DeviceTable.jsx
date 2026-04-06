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
                  window.open(`http://${device.ip}`, "_blank");
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
