import React, { useEffect, useState } from "react";
import { useDeviceContext } from "../context/DeviceContext";
import { useDeviceFilter } from "../../hooks/useDeviceFilter";
import { useDeviceDetails } from "../../hooks/useDeviceDetails";
import { useDeviceScan } from "../../hooks/useDeviceScan";
import DeviceCard from "./DeviceCard";
import DeviceTable from "./DeviceTable";
import CredentialsModal from "./CredentialsModal";
import { Dropdown } from "react-bootstrap";

export default function DeviceList() {
  const { viewMode, setIsInitialScan } = useDeviceContext();
  const filteredDevices = useDeviceFilter();
  const { fetchDetails } = useDeviceDetails();
  const { scanDevices } = useDeviceScan();
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  useEffect(() => {
    scanDevices({ useNmap: true })
      .catch(err => console.error("Initial scan failed:", err))
      .finally(() => setIsInitialScan(false));
  }, [scanDevices, setIsInitialScan]);

  const handleContextMenu = (device, event) => {
    setSelectedDevice(device);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedDevice(null);
  };

  const handleSetCredentials = () => {
    setShowCredentialsModal(true);
    handleCloseContextMenu();
  };

  const handleCredentialsSaved = () => {
    setShowCredentialsModal(false);
    // Optionally refresh device details if needed
  };

  return (
    <div className="scrollable-content p-3">
      {viewMode === "card" ? (
        <div className="card-container row mx-0">
          {filteredDevices.map(d => (
            <DeviceCard
              key={d.ip}
              device={d}
              onClick={fetchDetails}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      ) : (
        <DeviceTable
          devices={filteredDevices}
          onRowClick={fetchDetails}
          onIpClick={fetchDetails}
        />
      )}
    </div>
  );
}
