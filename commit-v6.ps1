#!/usr/bin/env pwsh
Set-Location $PSScriptRoot
git add desktop-ui/app.js docs/audits/MISATO_UI_WIRING_MATRIX.md docs/agent-handoffs/claude-to-hermes.md commit-v6.ps1
git commit -m "fix(desktop-ui): app.js v6 - full /api/misato/ alignment, audit fixes, honest failure states"
git push origin misato-claude-ui
Write-Host "Pushed to misato-claude-ui." -ForegroundColor Green
