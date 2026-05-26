#!/usr/bin/env pwsh
Set-Location $PSScriptRoot
git add desktop-ui/app.js docs/audits/MISATO_UI_WIRING_MATRIX.md commit-v6.ps1
git commit -m "fix(desktop-ui): app.js v6.2 - completeness pass, all gaps closed

- apiGet: reject HTML at any status (was: only rejecting HTML when !res.ok)
- hermesMutate: content-type check on success response before json parse
- pollLogsFallback: content-type check before json parse
- SSE onmessage: normalize dot-notation event types (task.updated -> task_updated)
- SSE: trigger loadAllFromHermes on approval_resolved event
- normalizeCouncilAgent: agentId/riskTier/lastActivityAt/currentTaskId mapped
- loadAllFromHermes: fetch /api/misato/status -> state.runtimeCtx
- sendCommand: loadAllFromHermes 1.5s after successful command
- INTEGRATIONS desc: localhost:3010 -> 127.0.0.1:3010"
git push origin misato-claude-ui
Write-Host "Pushed to misato-claude-ui." -ForegroundColor Green
