// renderer/components/GlobalLoaderOverlay.jsx
import { useState, useEffect } from "react";
import { useDeviceContext } from "../context/DeviceContext";
import Loader from "./Loader";

export default function GlobalLoaderOverlay() {
  const { loading, isInitialScan } = useDeviceContext();
  const [showSplash, setShowSplash] = useState(isInitialScan);

  // Keep the splash screen visible for 3 seconds on startup
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  if (!loading && !showSplash) return null;

  // 1) Full Splash Screen mode (Welcome Msg)
  if (showSplash) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "#EBF2F6", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ textAlign: "center", color: "#1a73e8", maxWidth: "90%", padding: "20px" }}>
          <h1 style={{ marginBottom: "2rem", fontWeight: "300", fontSize: "2rem" }}>
            Welcome to Dasscom Configuration Tool
          </h1>
          <Loader size={150} />
        </div>
      </div>
    );
  }

  // 2) Non-intrusive Loader mode (Active background scanning)
  if (loading) {
    return (
      <div style={{
        position: "fixed", bottom: "80px", right: "20px",
        zIndex: 9999, pointerEvents: "none" // Ensures users can still click the UI behind it
      }}>
        <div style={{
          background: "white", padding: "10px", borderRadius: "50%",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "60px", height: "60px"
        }}>
          <Loader size={40} />
        </div>
      </div>
    );
  }

  return null;
}
