# Implementation Plan - Enable Installer Cancel Button via EULA

This plan outlines the steps to add a professional Software License Agreement (EULA) to the Windows installer. Adding this step ensures the installer pauses before copying files, guaranteeing the "Cancel" button remains fully active and giving the user a standard, professional installation experience.

## User Review Required

> [!NOTE]
> - **Client Approval:** You need the client to approve this approach and provide the actual text for the "Terms of Use" or "End User License Agreement" (EULA).
> - **No Cost:** This does **not** involve code signing or purchasing certificates.

## Proposed Changes

### [Build Resources]

#### [NEW] [license.txt](file:///c:/electron/dasscom12febcommit/dasscom_react_electron/build/license.txt)
- Create a new text file inside the `build` directory.
- `electron-builder` automatically detects this file and injects a new "License Agreement" screen as the very first step of the NSIS installer.
- Populate this file with the client-approved Terms of Service.

## Open Questions
- Does Dasscom have a standard Terms of Service / Privacy Policy they want to use, or should we generate a basic placeholder template for them?

## Verification Plan

### Automated Tests
- None required for this packaging configuration.

### Manual Verification
1. Run `npm run dist` to build the new `.exe` installer.
2. Launch the installer.
3. Verify that the very first screen is "License Agreement".
4. Verify that the **Cancel** button is active and correctly aborts the installation.
