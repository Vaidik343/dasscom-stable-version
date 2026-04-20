export const handleExternalRedirect = async (device) => {
  const isPBX = String(device.type || "").toLowerCase().includes("pbx");
  const hasHttpsPort = device.openPorts && device.openPorts.includes(443);
  const hasHttpPort = device.openPorts && (device.openPorts.includes(80) || device.openPorts.includes(8080));

  // If we know the open ports but none are web ports, warn the user
  if (device.openPorts && !hasHttpsPort && !hasHttpPort) {
    alert(`Web configuration not detected on ${device.ip}.\n\nThis device may not support a web interface or its ports are closed.`);
    return;
  }

  // Determine protocol
  let protocol = "http://";
  if (isPBX || hasHttpsPort) {
    protocol = "https://";
  }

  const url = `${protocol}${device.ip}`;
  await window.api.openExternal(url);
};
