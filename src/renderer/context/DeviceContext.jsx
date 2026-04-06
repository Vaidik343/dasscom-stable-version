import React, { createContext, useContext, useState, useEffect } from "react";

const DeviceContext = createContext(null);

export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  console.log("🚀 ~ DeviceProvider ~ devices:", devices)
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [viewMode, setViewMode] = useState(localStorage.getItem("viewMode") || "card");
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceType, setDeviceType] = useState("");

  const [loading, setLoading] = useState(false);
  const [isInitialScan, setIsInitialScan] = useState(true);
  const [showOffline, setShowOffline] = useState(false); // Developer override

    // Simulate loading (2–3 sec)
 
  const value = {
    devices,
 loading, setLoading,
    setDevices,
    selectedDevice,
    setSelectedDevice,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    deviceType,
    setDeviceType,
    isInitialScan,
    setIsInitialScan,
    showOffline,
    setShowOffline
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

export const useDeviceContext = () => {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDeviceContext must be used inside DeviceProvider");
  return ctx;
};
