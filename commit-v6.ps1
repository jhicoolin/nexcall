#!/usr/bin/env pwsh
Set-Location $PSScriptRoot
git add desktop-ui/app.js docs/audits/MISATO_UI_WIRING_MATRIX.md commit-v6.ps1
git commit -m "fix(desktop-ui): app.js v6.1 - 127.0.0.1 canonical, JSON content-type guards everywhere"
git push origin misato-claude-ui
Write-Host "Pushed to misato-claude-ui." -ForegroundColor Green
