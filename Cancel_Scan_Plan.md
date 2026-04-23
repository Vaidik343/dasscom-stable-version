# Implementation Plan - Cancel Scan Feature

This plan outlines the steps to make the network scanning process interruptible. Users will be able to cancel a scan in progress, which is especially useful for large networks or slow scans.

## Proposed Changes

### 1. Backend: Scan Cancellation Logic (`src/main/arpScanner.js`)

- **Active Process Tracking:** Add a mechanism to track active `spawn` and `exec` processes.
- **Cancellation Flag:** Introduce a `isCancelled` flag.
- **`cancelAllScans()` Function:**
  - Set `isCancelled = true`.
  - Iterate through tracked processes and call `.kill()`.
  - Ensure the main `scanDevices` loop checks the flag before moving to the enrichment/online-check phase.
- **Cleanup:** Ensure processes are removed from tracking when they finish normally.

### 2. Main Process & Preload Bridge

- **`main.js`:** Add `ipcMain.handle("cancel-scan", ...)` which calls the backend cleanup logic.
- **`preload.js`:** Expose `cancelScan: () => ipcRenderer.invoke("cancel-scan")` to the renderer.

### 3. Frontend: User Interface

- **`useDeviceScan` Hook (`src/hooks/useDeviceScan.js`):**
  - Add a `cancelScan` function.
  - Ensure `loading` state is reset correctly when a scan is aborted.
- **`Controls` Component (`src/renderer/components/Controls.jsx`):**
  - When `scanning` is true, show a "Cancel" button next to (or replacing) the "Scan Network" button.
  - Use a distinct color (e.g., `btn-outline-danger`) for the Cancel button to make it clear.

## Verification Plan

### Automated Tests
- None at this stage.

### Manual Verification
1. Start a "Scan Network" or "Debug Scan".
2. Click the "Cancel" button while the spinner is active.
3. Verify that:
   - The UI returns to the idle state immediately.
   - The `nmap` process is terminated (can be checked in Task Manager).
   - No further "Scan completed" logs appear in the console.
   - Subsequent scans can be started without issues.
