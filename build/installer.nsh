; installer.nsh
!macro customInstall
  ; Fix Apps & Features icon — point DisplayIcon to the bundled .ico file
  WriteRegStr SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" \
    "DisplayIcon" "$INSTDIR\resources\icon.ico"
!macroend