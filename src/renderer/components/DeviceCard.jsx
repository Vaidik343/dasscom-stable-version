import React, { useState } from "react";
import webViewArrow from "../../assets/icons/arrow-up-right-from-square-solid-full.svg";
import "bootstrap/dist/css/bootstrap.min.css";
import '../style/DeviceCard.css';
import { handleExternalRedirect } from "../utils/redirectUtils";

export default function DeviceCard({ device, onClick, onContextMenu }) {
  const [isLoadingWebView, setIsLoadingWebView] = useState(false);
  const onlineStatus = device.online ? "online" : "offline";
  const borderColor = device.online ? "#28a745" : "#dc3545"; // Green for online, red for offline

  return (

    <div className="DeviceCard col-3 mb-4">
      <div
        className="card shadow-sm border-0"
        style={{
          borderRadius: "12px",
          cursor: "pointer",
          border: `2px solid ${borderColor}`,
          position: "relative"
        }}
        onClick={() => onClick(device)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu && onContextMenu(device, e);
        }}
      >
        <div
          className="online-indicator"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            // backgroundColor: device.online ? "#28a745" : "#dc3545",
            border: "2px solid white"
          }}
          title={onlineStatus}
        ></div>
        <div className="card-body cardDesign">
          <h6
            className="card-title  mb-1"
            title="Fetch device details"
            onClick={(e) => {
              e.stopPropagation();
              onClick(device);
            }}
            style={{ cursor: "pointer", color: "#0c5460" }}
          >
            <strong>IP:</strong> {device.ip}
          </h6>

          <p className="card-text mb-1">
            <strong style={{ color: "#0c5460" }}>MAC: </strong> {device.mac || "Unknown"}

          </p>
          <p className="card-text mb-1">
            <strong style={{ color: "#0c5460" }}>Type:</strong> {device.type || "Unknown"}

          </p>
          <hr />
          <div className="d-flex align-items-center mt-3 mb-0">
            <p
              className="mb-0"
              style={{
                color: "#31ae5f",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLoadingWebView(true);
                setTimeout(() => {
                  setIsLoadingWebView(false);
                }, 2000);

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
              title="Open Web Interface (Internal)"
            >
              <strong>Web view:</strong>
              {isLoadingWebView ? (
                <span
                  className="spinner-border spinner-border-sm text-primary"
                  role="status"
                  style={{ width: "12px", height: "12px", marginLeft: "5px", marginRight: "10px", verticalAlign: "middle" }}
                ></span>
              ) : (
                <img
                  src={webViewArrow}
                  alt="redirect icon"
                  style={{
                    width: 12,
                    height: 12,
                    marginLeft: 5,
                    marginRight: 10,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </p>
            <span style={{ color: "#ccc", margin: "0 5px" }}>|</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleExternalRedirect(device);
              }}
              style={{
                cursor: "pointer",
                marginLeft: "5px",
                color: "#1a73e8",
                fontWeight: 500,
                fontSize: "14px"
              }}
              title="Open in Default Browser"
            >
              <strong>Redirect</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
