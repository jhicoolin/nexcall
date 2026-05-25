#!/usr/bin/env pwsh
# Run from C:\Users\pixel\nexcall to commit and push app.js v5.2
Set-Location $PSScriptRoot
git add desktop-ui/app.js desktop-ui/styles.css `
         docs/agent-handoffs/claude-to-hermes.md `
         docs/audits/MISATO_UI_WIRING_MATRIX.md
git commit -m "feat(desktop-ui): app.js v5.2 — full wiring pass complete

Port: canonical localhost:3000 — no 3010 conflict.

v5:
- hermesMutate(): all writes surface URL+reason on failure
- resolveApproval(): POST /approvals/:id/approve|reject|defer
- createTask() / updateTask(): task CRUD, optimistic update
- Modal system: create-task + assign-task
- Runtime status badge (LOCAL SOLO / VERCEL PREVIEW / DISCONNECTED)
- sendCommand: error shows attempted URL

v5.1:
- Live feed: uses state.logs when Hermes up + SSE silent (no fake MOCK)
- pollLogsFallback(): polls /logs every 15s when SSE is down
- sseLiveLabel: LIVE / POLLING / HERMES / MOCK
- deleteTask(): low-risk = DELETE optimistic; high-risk = approval record
- Sentinel Scan Now: POST /sentinel/scan
- refreshTopBarUI(): replaces full .topbar-right (runtime badge syncs)
- sendCommand: explicit not-connected message in thread
- Command Center: runtime strip shows mode + mutation mode + SSE/POLLING
- Kanban: delete button (✕) per card, kc-delete style

v5.2:
- Quick prompts: always route to Command Center, sendCommand handles state
- Logs screen: severity filter wired (ALL/INFO/WARN/ERROR via state.logFilter)
- Logs Refresh button wired
- All previously display-only filter buttons are now functional"
git push origin misato-claude-ui
Write-Host "Pushed to misato-claude-ui." -ForegroundColor Green
