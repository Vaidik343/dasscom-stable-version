import React from "react";
import { DeviceProvider } from "./renderer/context/DeviceContext";
import Controls from "./renderer/components/Controls";
import LogsPanel from "./renderer/components/LogsPanel";
import DeviceList from "./renderer/components/DeviceList";
import DeviceModal from "./renderer/components/DeviceModal";
import GlobalLoaderOverlay from './renderer/components/GlobalLoaderOverlay';
export default function App() {
  return (
    <DeviceProvider>
      <div className="title-drag-region"></div>
      <div className="app-container">
        <Controls />
        {/* <LogsPanel /> */}
        <DeviceList />
        <DeviceModal />
        <GlobalLoaderOverlay />
        <footer
          className="fixed-bottom py-3 text-center border-top shadow-sm"
          style={{ background: "#ffffff", width: "100%", zIndex: 1000 }}
        >
          <p className="text-secondary mb-0">
            Copyright ©2026 . All Rights Reserved | <a href="https://www.dasscom.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8", textDecoration: "none" }}>www.dasscom.com</a>
          </p>
        </footer>
      </div>
    </DeviceProvider>
  );
}
