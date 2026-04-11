## Dasscom React + Electron (Development Guide)

This document explains how to **develop, debug, integrate, package, and troubleshoot** this project.

### Quick facts
- **Frontend (renderer)**: React + Vite (`src/main.jsx`, `src/App.jsx`)
- **Desktop shell (main process)**: Electron (`src/main/main.js`)
- **Secure bridge**: `contextIsolation: true` + preload API (`src/preload/preload.js`) exposing `window.api`
- **Network discovery**: Nmap subnet sweep + ARP parsing + optional subnet ping scan (`src/main/arpScanner.js`, `src/main/subnetScanner.js`)
- **Device integrations**: IP Phone + Speaker + PBX + WiFi AP APIs (IPC handlers in `src/main/main.js`, clients in `src/api/*`)
- **Export**: Excel via `exceljs` (`src/utils/exportToExcel.js`)
- **Packaging**: `electron-builder` (Windows NSIS), includes `binaries/**` (bundled Nmap) (`package.json`)

---

## Architecture overview

### Process model

```mermaid
flowchart LR
  User[User] --> Renderer["Renderer (React/Vite)"]
  Renderer -->|window.api.*| Preload["Preload (contextBridge)"]
  Preload -->|ipcRenderer.invoke(channel)| Main["Electron Main Process"]
  Main -->|LAN scan: Nmap/ARP/ping| Network["Local Network"]
  Main -->|HTTP/HTTPS device APIs| Devices["Devices (IPPhone/Speaker/PBX/WiFi)"]
  Main -->|Excel export| FileSystem["File system"]
```

### Key folders & files
- **Main process**: `src/main/main.js`
- **Preload bridge**: `src/preload/preload.js`
- **Renderer (UI)**: `src/renderer/**` and `src/App.jsx`
- **Hooks**: `src/hooks/**` (scan, filter, device details)
- **Discovery**: `src/main/arpScanner.js`, `src/main/nmapScanner.js`, `src/main/subnetScanner.js`
- **API clients**: `src/api/dasscomClient.js`, `src/api/pbxClient.js`, `src/api/wifiClient.js`
- **Utilities**: `src/utils/*` (`credentialsStore.js`, `exportToExcel.js`, `arpUtils.js`, `deviceUtils.js`)
- **Bundled binaries**: `binaries/<platform>/...` (notably `binaries/win32/nmap.exe`)

---

## Local development workflow (Windows-first)

### Prerequisites
- **Node.js** (use the version compatible with your Electron version)
- **npm** (comes with Node)
- **Network access**: device discovery requires an active Wi‑Fi/Ethernet interface
- **Optional**: system-installed `nmap` (project also bundles Nmap under `binaries/`)

### Install dependencies

```bash
npm install
```

### Run in browser (renderer only)

```bash
npm run dev
```

Then open the URL shown by Vite (default: `http://localhost:5173`).

### Run as Electron desktop app (recommended)

```bash
npm run electron-dev
```

What happens:
- Starts Vite dev server
- Waits for `http://localhost:5173`
- Launches Electron with `NODE_ENV=development`
- The Electron window loads the Vite URL in dev mode (see `src/main/main.js`)

### Build renderer

```bash
npm run build
```

Outputs Vite build into `dist/` (see `vite.config.js`).

### Package installer

```bash
npm run dist
```

Creates a Windows installer via NSIS (configured in `package.json` under `build.win` and `build.nsis`).

---

## Runtime workflow (end-to-end)

### App startup flow
- Electron creates a BrowserWindow (`src/main/main.js`) with:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `preload: src/preload/preload.js`
- Dev mode loads `http://localhost:5173`
- Production loads `dist/index.html` from the packaged app

### UI flow
- `src/App.jsx` wraps the UI in `DeviceProvider` (`src/renderer/context/DeviceContext.jsx`)
- `DeviceList` triggers an initial scan on mount (`scanDevices({ useNmap: true })`)
- `Controls` provides:
  - search/filter UI
  - scan button
  - export button
  - online/offline counts
- Clicking a device opens `DeviceModal` with “Advanced Data”, fetched via device-type-specific APIs (`src/hooks/useDeviceDetails.js`)

---

## Network discovery & enrichment pipeline

### High-level discovery algorithm

```mermaid
flowchart TD
  start[scanDevices(options)] --> subnets[getLocalNetworkSubnets()]
  subnets --> nmapTry{useNmap?}
  nmapTry -->|yes| nmapScan[scanWithNmap(subnetCidr)\n- sn -PR -oX - -T4 ...]
  nmapTry -->|no| arpOnly[Skip subnet sweep]
  nmapScan --> arpRefresh[Refresh ARP table\n(Windows: arp -d * then wait)]
  arpOnly --> arpRefresh
  arpRefresh --> arpRead[Read ARP table\nwin: arp -a\nunix: arp -n]
  arpRead --> combine[Combine results\nDeduplicate by IP\nPrefer Nmap MACs]
  combine --> dasscomFilter{debugMode?}
  dasscomFilter -->|yes| allDevices[Return ALL devices]
  dasscomFilter -->|no| onlyDasscom[Filter MAC prefix 8C:1F:64]
  allDevices --> ping[checkOnlineStatus(ip)\n(ping -n/-c)]
  onlyDasscom --> ping
  ping --> enrich[enrichDevice(...)\nadds normalized mac/vendor/type/online]
  enrich --> done[Return enriched devices]
```

### Subnet selection
`src/main/arpScanner.js` uses OS network interfaces to compute one or more IPv4 subnets, then scans them in parallel with Nmap.

If no suitable interface is found, it throws:
> “No suitable network interfaces found. Please make sure you are connected to a local network (Wi‑Fi or Ethernet cable).”

### Discovery methods
- **Nmap (preferred coverage)**: subnet sweep uses `-sn -PR -oX - -T4 --min-rate 1000 --max-retries 1 --host-timeout 5s`.
- **ARP parsing (always used)**:
  - Windows parses `arp -a` output grouped by interface
  - Non-Windows parses `arp -n`
  - Vendor lookup is via OUI DB `assets/data/oui.txt` when present, falling back to `src/config/device-mappings.json` (`src/utils/arpUtils.js`)
- **Optional subnet ping scan**: `src/main/subnetScanner.js` can probe every host in a subnet using the `ping` npm package (enabled via `useSubnetScan` option).

### Dasscom filtering
By default, discovery returns **only Dasscom devices** by filtering on normalized MAC prefix `8C:1F:64` in `src/main/arpScanner.js`.

If `debugMode: true` is passed, the scan returns **all** devices (useful for field testing and tuning).

### Online/offline
Online status is computed by pinging each device:
- Windows: `ping -n 1 -w 2000 <ip>`
- Others: `ping -c 1 -W 2 <ip>`

Result is stored as boolean `online` in the returned device model.

### Renderer-side type detection
After IPC returns `rawDevices`, the renderer further enriches:
- `enrichDevice(d)` normalizes MAC casing/format, ensures `online` exists
- `detectDeviceTypeDynamic(device, openPorts)` tries in order:
  - API login heuristics for Dasscom MAC prefix (PBX, Speaker, IP Phone, WiFi)
  - Per-host Nmap service scan (`window.api.nmapScan(ip)`)
  - Vendor mapping rules from `src/config/device-mappings.json`

Note: Nmap “openPorts” in the UI comes from the per-host Nmap scan output parsing rather than the subnet discovery phase.

---

## Integrations (device APIs)

### IP Phone
- **Login**: `POST http://<ip>/action/login?username=...&password=...` (`src/api/dasscomClient.js`)
- **Generic API**: `ipPhoneApi(ip, endpoint, method, body)` uses Basic Auth `admin:admin`
- **Legacy info endpoints** are wired as dedicated IPC channels (see Appendix)

### Speaker
- **Login**: `POST http://<ip>/api/login` returns a token
- **API**: requests include `Authorization: <token>` header

### PBX
- **Login**: `POST https://<ip>/pbx/auth/login` (self-signed cert allowed via https agent)
- **API**: `GET https://<ip>/<endpoint>` with `Authorization: Bearer <token>`

### WiFi / Access Point
- **Login**: `POST http://<ip>/cgi-bin/login?funname=1&action=1&username=...&password=...`
- **API**: `POST http://<ip>/<endpoint>?funname=<fn>&action=<act>` with cookie `stork=<token>`

---

## IPC & preload API contract

### Design rules
- Renderer **never** imports Electron directly.
- Renderer calls `window.api.*`, which is exposed by `contextBridge` (`src/preload/preload.js`).
- Preload calls `ipcRenderer.invoke(channel, ...)`.
- Main process implements `ipcMain.handle(channel, ...)` in `src/main/main.js`.

### Stability expectations
- Treat channel names as an API surface: changing them is a breaking change.
- Add new channels rather than reusing existing ones with incompatible payloads.

---

## Credentials storage

Credentials are stored in the user profile:
- Path: `app.getPath('userData')/device-credentials.json`
- Passwords are encrypted using Electron `safeStorage` before writing (`src/utils/credentialsStore.js`)

Main process uses stored credentials first for login IPC handlers, and falls back to provided/default credentials if stored ones fail.

---

## Export to Excel

Export is initiated from the renderer (`ExportButton`) and executed in the main process:
- Main opens a Save Dialog
- `src/utils/exportToExcel.js` writes an `.xlsx` using `exceljs`
- If the file is locked (e.g., opened in Excel), it falls back to a timestamped filename

Columns written include IP, MAC, hostname, status, vendor, type, open ports, response time.

---

## Packaging & distribution (electron-builder)

### What is packaged
From `package.json` → `build.files`:
- `dist/**` (Vite output)
- `src/**` (main + preload + runtime JS)
- `public/**` (icons/assets)

From `package.json` → `build.extraResources`:
- `binaries/` copied to the app’s resources folder as `binaries/`
- `public/wifi.ico` copied to resources as `wifi.ico`

From `package.json` → `build.asarUnpack`:
- `binaries/**` is unpacked from ASAR so native executables can run.

### Bundled Nmap resolution (dev vs prod)
Discovery uses a bundled Nmap if present:
- **Dev**: `path.join(app.getAppPath(), 'binaries', <platform>, nmap(.exe))`
- **Packaged**: `path.join(process.resourcesPath, 'binaries', <platform>, nmap(.exe))`

If bundled Nmap is missing, it may fall back to `nmap` in system PATH (see `src/main/arpScanner.js` and `src/main/nmapScanner.js`).

### Windows installer configuration
`package.json` → `build.win` / `build.nsis`:
- NSIS target, x64 only
- `oneClick: false` (wizard style)
- `perMachine: true`
- custom installer/uninstaller icons

### Packaged-build verification checklist
- App launches and loads `dist/index.html`
- `src/preload/preload.js` is present and `window.api` is defined
- `binaries/win32/nmap.exe` exists under app resources and is runnable
- Excel export save dialog works
- Icons show correctly in the window and installer

---

## Troubleshooting playbook

### “No suitable network interfaces found”
- **Cause**: `getLocalNetworkSubnets()` did not find a non-internal IPv4 interface.
- **Fix**:
  - Confirm you are connected to Wi‑Fi/Ethernet
  - Disable VPN adapters temporarily (they can confuse interface selection)
  - Run the packaged app “as Administrator” if discovery tools are restricted

### Nmap not found / Nmap fails to execute
- **Symptoms**:
  - scan returns few/no devices
  - logs mention bundled binary missing or spawn errors
- **Checks**:
  - Dev: confirm `binaries/win32/nmap.exe` exists in the repo
  - Packaged: confirm `resources/binaries/win32/nmap.exe` exists
  - If relying on system Nmap, confirm `nmap --version` works in a terminal
- **Notes**:
  - The project is configured to copy `binaries/` into app resources and unpack it from ASAR (`package.json`).

### ARP table empty / ARP parsing returns 0 devices
- **Cause**: ARP tables may be empty until the OS has communicated with hosts.
- **What the app does**:
  - Windows attempts `arp -d *` to refresh, then re-reads `arp -a`
- **Fixes**:
  - Ensure the machine can reach the subnet (no guest isolation)
  - Try a second scan after a few seconds (ARP warms up)

### Online/offline seems wrong
- **Cause**: ping may be blocked by host firewall or ICMP filtering.
- **Mitigations**:
  - Treat `online=false` as “ping unreachable”, not definitive “device down”
  - Prefer API reachability (login success) as a stronger signal for device health

### Renderer loads blank / “did-fail-load” errors
- **Where to look**:
  - Main forwards load failures on the `load-error` channel (see `LogsPanel.jsx`)
- **Common causes**:
  - Dev mode: Vite not running, wrong port, or blocked localhost
  - Prod mode: missing `dist/` build files

### Export fails or file is locked
- **Cause**: `.xlsx` opened in Excel locks the file.
- **Behavior**:
  - Export falls back to a timestamped filename (`src/utils/exportToExcel.js`)

### CORS / mixed content / local device web UIs
- Main window is configured with `webSecurity: false` in `src/main/main.js`.
- Keep in mind this broadens what the renderer can load; prefer using the IPC bridge + API clients for device access.

---

## Appendix A: `window.api` surface (renderer → preload)

Defined in `src/preload/preload.js` and available as `window.api.*` in the renderer.

### Discovery & export
- `scanDevices(options)`
- `nmapScan(ip)`
- `exportToExcel(devices)`

### Credential management
- `setDeviceCredentials(ip, username, password)`
- `getDeviceCredentials(ip)`
- `getAllDeviceCredentials()`
- `removeDeviceCredentials(ip)`
- `hasDeviceCredentials(ip)`

### Device enrichment
- `enrichDevice(device, credentials)`

### IP Phone (generic + legacy helpers)
- `loginDevice(ip, user, pass, options)`
- `ipPhoneApi(ip, endpoint, method, body)`
- `fetchSystemInfo(ip, token)`
- `fetchSvnVersion(ip)`
- `fetchIpAddress(ip)`
- `fetchAccountInfo(ip)`
- `fetchDNS(ip)`
- `fetchGetway(ip)`
- `fetchNetMask(ip)`
- `fetchAccountStatus(ip)`
- `fetchAllAcountInformation(ip)`
- `fetchTemperature(ip)`

### Speaker
- `speakerLogin(ip, user, pass)`
- `speakerApi(ip, token, endpoint)`

### PBX
- `pbxLogin(ip, user, pass)`
- `pbxApi(ip, token, endpoint)`
- `fetchPbxSystemTime(ip, token)`
- `fetchPbxVersion(ip, token)`
- `fetchPbxCpu(ip, token)`
- `fetchPbxMem(ip, token)`
- `fetchPbxDisk(ip, token)`
- `fetchPbxCalls(ip, token)`
- `fetchPbxExtensionStatus(ip, token)`
- `fetchPbxTrunkInfo(ip, token)`
- `fetchPbxSearchExtensions(ip, token)`
- `fetchPbxExtensionInfo(ip, token)`
- `fetchPbxExtensionAvailable(ip, token, exten)`

### WiFi / AP
- `wifiLogin(ip, user, pass)`
- `wifiApi(ip, cookie, endpoint, funname, action, body)`
- `fetchWifiWirelessInfo(ip, cookie)`
- `fetchWifiTimeoutInfo(ip, cookie)`
- `fetchWifiUserList(ip, cookie)`
- `fetchWifiWirelessParams(ip, cookie)`
- `fetchWifiSystemLogInfo(ip, cookie)`
- `fetchWifiSystemLogFiles(ip, cookie)`
- `fetchWifiConfigManagement(ip, cookie)`
- `fetchWifiLanguageSettings(ip, cookie)`
- `fetchWifiScheduledRestart(ip, cookie)`
- `fetchWifiDeviceSystemInfo(ip, cookie)`
- `fetchWifiDeviceBasicInfo(ip, cookie)`

### Event subscription (main → renderer)
- `receive(channel, func)` (used for `"console-log"` and `"load-error"` in `LogsPanel.jsx`)

---

## Appendix B: IPC channel index (preload → main)

Implemented by `ipcMain.handle(...)` in `src/main/main.js`.

### Core
- `scan-devices`
- `nmap-scan`
- `export-to-excel`

### Credentials
- `set-device-credentials`
- `get-device-credentials`
- `get-all-device-credentials`
- `remove-device-credentials`
- `has-device-credentials`

### Enrichment
- `enrich-device`

### IP Phone (generic + legacy helpers)
- `login-device`
- `ip-phone-api`
- `fetch-system-info`
- `fetch-svn-version`
- `fetch-ip-address`
- `fetch-account-info`
- `fetch-dns`
- `fetch-gateway`
- `fetch-netmask`
- `fetch-account-status`
- `fetch-all-account-info`
- `fetch-temperature`

### Speaker
- `speaker-login`
- `speaker-api`

### PBX
- `pbx-login`
- `pbx-api`
- `fetch-pbx-system-time`
- `fetch-pbx-version`
- `fetch-pbx-cpu`
- `fetch-pbx-mem`
- `fetch-pbx-disk`
- `fetch-pbx-calls`
- `fetch-pbx-extension-status`
- `fetch-pbx-trunk-info`
- `fetch-pbx-search-extensions`
- `fetch-pbx-extension-info`
- `fetch-pbx-extension-available`

### WiFi / AP
- `wifi-login`
- `wifi-api`
- `fetch-wifi-wireless-info`
- `fetch-wifi-timeout-info`
- `fetch-wifi-user-list`
- `fetch-wifi-wireless-params`
- `fetch-wifi-system-log-info`
- `fetch-wifi-system-log-files`
- `fetch-wifi-config-management`
- `fetch-wifi-language-settings`
- `fetch-wifi-scheduled-restart`
- `fetch-wifi-device-system-info`
- `fetch-wifi-device-basic-info`

---

## Appendix C: Key file map (where to edit what)

### Scanning & device detection
- `src/main/arpScanner.js`: subnet discovery, Nmap sweep + ARP parsing, Dasscom filtering, online ping
- `src/main/nmapScanner.js`: per-host Nmap service scan
- `src/main/subnetScanner.js`: full subnet ping probing (optional mode)
- `src/utils/arpUtils.js`: vendor/OUI lookup and OUI file path resolution
- `src/config/device-mappings.json`: vendor/type mapping rules and MAC prefix overrides
- `src/utils/deviceUtils.js`: renderer-side device normalization and type detection

### Electron app wiring
- `src/main/main.js`: BrowserWindow config + IPC handlers + export dialog
- `src/preload/preload.js`: `window.api` surface

### UI / UX
- `src/App.jsx`: page composition
- `src/renderer/context/DeviceContext.jsx`: shared UI state
- `src/hooks/useDeviceScan.js`: scan orchestration and renderer enrichment
- `src/hooks/useDeviceDetails.js`: “Advanced Data” fetching by device type
- `src/hooks/useDeviceFilter.js`: search + type filtering
- `src/renderer/components/*`: controls, list/table, modal, export

