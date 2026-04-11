# Implementation Plan - External Redirect with Protocol Detection

This plan adds a "Redirect" feature to open device web configurations in the system's default browser (e.g., Chrome, Edge) while automatically detecting the correct protocol (HTTP vs HTTPS).

## User Review Required

> [!IMPORTANT]
> - **External Redirect:** This feature uses `shell.openExternal`, which bypasses Electron and opens the URL in the user's primary desktop browser. 
> - **Protocol Detection:** The app will perform a background check (ping) on the device's IP to determine if it responds better to `https://` or `http://` before opening the link.

## Proposed Changes

### [Electron Bridge]

#### [MODIFY] [preload.js](file:///c:/electron/dasscom12febcommit/dasscom_react_electron/src/preload/preload.js)
- Expose a new function `openExternal(url)` to the renderer process.

#### [MODIFY] [main.js](file:///c:/electron/dasscom12febcommit/dasscom_react_electron/src/main/main.js)
- Add the `ipcMain.handle("open-external", ...)` listener that uses `electron.shell.openExternal`.

### [Frontend Utility]

#### [NEW] [redirectUtils.js](file:///c:/electron/dasscom12febcommit/dasscom_react_electron/src/renderer/utils/redirectUtils.js)
- Create a utility function `handleExternalRedirect(ip, deviceType, openPorts)` that:
  - Tests `https://[ip]` first (especially for PBX or if port 443 is detected).
  - Falls back to `http://[ip]`.
  - Calls `window.api.openExternal`.

### [Components]

#### [MODIFY] [DeviceTable.jsx](file:///c:/electron/dasscom12febcommit/dasscom_react_electron/src/renderer/components/DeviceTable.jsx)
- Add a "Redirect" (External) icon next to the "Web View" icon.
- Bind it to the new redirect utility.

#### [MODIFY] [DeviceCard.jsx](file:///c:/electron/dasscom12febcommit/dasscom_react_electron/src/renderer/components/DeviceCard.jsx)
- Add a "Redirect to Browser" link or icon in the card actions.

## Open Questions
- Do you prefer a separate button for "Redirect", or should the existing "Web View" become the redirect button? (Planning for two separate icons for now to give users the choice).

## Verification Plan

### Automated Tests
- Run `npm run dev` and verify that clicking the new icon triggers the system's browser.
- Mock a device that only supports HTTPS and verify the redirect handles the protocol correctly.

### Manual Verification
- Test with a known PBX (HTTPS) and a standard IP Phone (HTTP).
- Verify that both open in the **external browser** (Chrome/Edge/Safari) instead of an Electron sub-window.
