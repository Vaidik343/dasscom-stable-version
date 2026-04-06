import { useMemo } from "react";
import { useDeviceContext } from "../renderer/context/DeviceContext";

export const useDeviceFilter = () => {
  const { devices, searchQuery, deviceType, showOffline } = useDeviceContext();

  const filtered = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return (devices || []).filter(d => {
      const matchesSearch = !q ||
        (d.ip && d.ip.toLowerCase().includes(q)) ||
        (d.mac && d.mac.toLowerCase().includes(q)) ||
        (d.hostname && d.hostname.toLowerCase().includes(q));
      const matchesType = !deviceType || (d.type || "unknown").toLowerCase() === deviceType.toLowerCase();
      const isOnline = d.online === true;
      return matchesSearch && matchesType && (showOffline || isOnline);
    });
  }, [devices, searchQuery, deviceType, showOffline]);

  return filtered;
};
