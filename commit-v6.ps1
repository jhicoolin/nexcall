#!/usr/bin/env pwsh
Set-Location $PSScriptRoot
git add .gitignore desktop-ui/app.js docs/audits/MISATO_UI_WIRING_MATRIX.md app/api/misato/tasks/update/route.ts lib/misato/runtime/ai-gateway.ts lib/misato/runtime/service.ts commit-v6.ps1
$msg = @"
fix(misato): v6.4 audit - responseText, task update contract, AI schema guard, dead code removal

- desktop-ui/app.js: sendCommand reads data.responseText (priority chain)
- tasks/update: fix taskId/payload extraction (raw body was giving task_not_found)
- ai-gateway: sanitizeAiClassification validates model output shape before command pipeline
- service.ts: remove dead createApprovalForCommand and runMisatoMockCommand import
- .gitignore: add .misato-runtime/ (runtime state files, not source)
- commit-v6.ps1: use dynamic branch detection instead of hardcoded misato-claude-ui
- wiring matrix: update version to v6.4
"@
git commit -m $msg
$branch = git branch --show-current
git push origin $branch
Write-Host "Pushed to $branch." -ForegroundColor Green
