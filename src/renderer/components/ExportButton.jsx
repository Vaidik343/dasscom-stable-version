import React from "react";
import { useDeviceContext } from "../context/DeviceContext";

export default function ExportButton() {
  const { devices } = useDeviceContext();

  const handleExport = async () => {
    if (!devices || devices.length === 0) {
      alert("⚠️ No devices found to export!");
      return;
    }

    try {
      const result = await window.api.exportToExcel(devices);
      if (result.success) {
        alert(`✅ Exported successfully to:\n${result.path}`);
      } else if (result.error !== "User cancelled") {
        alert(`❌ Export failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert(`❌ Error exporting file: ${err.message}`);
    }
  };

  return (
    <button onClick={handleExport} className="btn btn-success d-flex align-items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
      </svg>
      Export to Excel
    </button>
  );
}
