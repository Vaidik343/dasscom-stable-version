import React, { useState } from "react";
import { useDeviceContext } from "../context/DeviceContext";
import { useDeviceScan } from "../../hooks/useDeviceScan";
import ExportButton from "./ExportButton";
import CredentialsManager from "./CredentialsManager";
export default function Controls() {
  const {
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    deviceType, setDeviceType,
    devices
  } = useDeviceContext();

  const { scanDevices, cancelScan, loading: scanning } = useDeviceScan();
  const [showCredentialsManager, setShowCredentialsManager] = useState(false);


  const uniqueTypes = Array.from(new Set(devices.map(d => (d.type || "unknown").toLowerCase()))).sort();
  const handleExport = async () => {
    if (!devices || devices.length === 0) {
      alert("No devices to export.");
      return;
    }

    // Default export path (Documents folder)
    const defaultPath = "C:\\Users\\Public\\Network Scan.xlsx";

    try {
      const result = await window.api.exportToExcel(devices, defaultPath);
      if (result.success) {
        alert(`✅ Exported successfully to:\n${result.path}`);
      } else {
        alert(`❌ Export failed: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Error exporting file: ${err.message}`);
    }
  };

  const onlineCount = devices.filter(d => d.online).length;
  const offlineCount = devices.filter(d => !d.online).length;

  return (
    <>
      <div className="title-container text-center p-1">
        <h1 className="h3 mb-2 text-success" style={{ fontWeight: "600", /*color: "#1a73e8" */ }}>
          Dasscom Configuration Tool</h1>
      </div>
      <div className="controls d-flex flex-wrap p-2 mx-1  gap-2 align-items-center">
        {/* Search Input - Expands but has limits */}
        <div className="position-relative flex-grow-1" style={{ minWidth: "220px", maxWidth: "550px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search IP/MAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-1"
              onClick={() => setSearchQuery("")}
              style={{ zIndex: 2 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Device Type Select */}
        <div className="selectDevice" style={{ width: "130px" }}>
          <select className="form-select" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
            <option value="">All Types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* View Mode Buttons */}
        <div className="btn-group">
          <button
            onClick={() => setViewMode("card")}
            className={`btn btn-outline-success ${viewMode === "card" ? "active" : ""}`}
            title="Card View"
          >
            Card
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`btn btn-outline-success ${viewMode === "table" ? "active" : ""}`}
            title="Table View"
          >
            Table
          </button>
        </div>

        {/* Action Buttons Group */}
        <div className="d-flex gap-3">
          <button
            onClick={async () => {
              try {
                await scanDevices({ useNmap: true })
              } catch (err) {
                if (err.message.includes('No suitable network interfaces')) {
                  alert("⚠️ Local network not found.");
                } else {
                  alert("❌ Scan error: " + err.message);
                }
              }
            }}
            disabled={scanning}
            className="btn btn-primary d-flex align-items-center gap-2 white-space-nowrap"
          >
            {scanning ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
              </svg>
            )}
            <span className="d-none d-lg-inline">Scan Network</span>
            <span className="d-lg-none">Scan</span>
          </button>

          {scanning && (
            <button
              onClick={cancelScan}
              className="btn btn-outline-danger d-flex align-items-center gap-2 white-space-nowrap"
              title="Cancel ongoing scan"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5v-3z" />
              </svg>
              <span>Cancel</span>
            </button>
          )}

          <ExportButton />
        </div>

        {/* Stats Badges - Pushed to the right on large, wraps on small */}
        <div className="discovery-stats d-flex flex-nowrap gap-2 ms-auto">
          <div className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border px-2 py-2 d-flex align-items-center" title="Total Devices">
            <svg width="10" height="10" className="me-1" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="7" />
            </svg>
            Total: {devices.length}
          </div>

          {/* <div className="badge rounded-pill bg-success-subtle text-success-emphasis border px-2 py-2 d-flex align-items-center" title="Online Devices">
            <svg width="12" height="12" className="me-1" viewBox="0 0 16 16" fill="currentColor">
              <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3 12.444 12.444 0 0 0 .663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049z" />
              <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.455 9.455 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.482.482 0 0 0-.063.745.522.522 0 0 0 .674.059A8.46 8.46 0 0 1 8 7c1.659 0 3.184.477 4.555 1.33a.522.522 0 0 0 .674-.059z" />
              <path d="M11.073 10.427a.48.48 0 0 0-.084-.753A6.463 6.463 0 0 0 8 9c-1.305 0-2.48.384-3.489 1.04a.48.48 0 0 0-.071.724.53.53 0 0 0 .712.067c.787-.517 1.726-.831 2.848-.831 1.122 0 2.061.314 2.848.831a.53.53 0 0 0 .725-.067z" />
              <path d="M8 12.917c.621 0 1.125-.514 1.125-1.148s-.504-1.148-1.125-1.148c-.621 0-1.125.514-1.125 1.148s.504 1.148 1.125 1.148z" />
            </svg>
            Active: {onlineCount}
          </div> */}
        </div>
      </div>

      {/* 
      <CredentialsManager
        show={showCredentialsManager}
        onHide={() => setShowCredentialsManager(false)}
      />
      */}
    </>
  );
}
