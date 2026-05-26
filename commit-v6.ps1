#!/usr/bin/env pwsh
# Run from C:\Users\pixel\nexcall to commit and push app.js v6 (audit pass)
Set-Location $PSScriptRoot
git add desktop-ui/app.js `
         docs/audits/MISATO_UI_WIRING_MATRIX.md `
         docs/agent-handoffs/claude-to-hermes.md `
         commit-v6.ps1
git commit -m "fix(desktop-ui): app.js v6 — final audit pass, full /api/misato/ alignment

Cross-lane audit findings patched (all blockers):

ENDPOINT ALIGNMENT:
- hermesApi() helper: all data+mutation routes now use /api/misato/* prefix
  (confirmed canonical in hermes-to-claude.md 2026-05-25)
- loadAllFromHermes: /agents /tasks /approvals /logs /watchtower /secrets
  all now correctly prefixed via hermesApi()
- SSE: hermesApi('events/stream') — was /events/stream (404 on Hermes)
- pollLogsFallback: hermesApi('logs') — was /logs (404 on Hermes)
- sendCommand: hermesApi('command') when Hermes up, endpoint('command') for Vercel
- resolveApproval: POST api/misato/approvals/action {approvalId, action}
  (was POST approvals/:id/:action — wrong path + body)
- createTask: POST api/misato/tasks/create {title,project,priority,status,agent}
  (was POST tasks — wrong path, no structured body)
- updateTask: POST api/misato/tasks/update {taskId, payload}
  (was PATCH tasks/:id — wrong method + path + body)
- deleteTask: POST api/misato/tasks/delete {taskId}
  (was DELETE tasks/:id — wrong method + path; no body)
- Sentinel scan: api/misato/sentinel/scan (was sentinel/scan)

HONESTY / FALSE SUCCESS:
- deleteTask catch: task now stays in list on failure with precise error toast
  (was: removed locally and shown 'sync pending' — silent data loss)
- updateTask offline toast: 'not persisted' — was 'will sync when Hermes connects'
  (no sync queue exists — toast was lying)
- deleteTask offline: 'will reappear on reconnect' — honest about local-only state

SSE TARGET DRIFT:
- saveHermesHostPort() now restarts SSE immediately when host/port changes
  (was: mutations went to new target, SSE events still came from old one)

RAW JSON IN FEED:
- buildFeedEntriesHTML: JSON.stringify fallback replaced with [event-type] placeholder
  (was: raw {JSON} rendered in live feed for unknown event types)

PORT / URL FIXES:
- hermesBase() fallback: '3000' → '3010' (canonical)
- saveHermesHostPort fallback: '3000' → '3010'
- Settings port input placeholder: '3000' → '3010'
- renderHermesStatusInline fallback: '3000' → '3010'
- INTEGRATIONS[0] static desc: removed stale localhost:3000 and flat route refs

SENTINEL:
- remediation normalized to array before .map() — Hermes may return string

DOCS:
- MISATO_UI_WIRING_MATRIX.md updated to v6 with full URL construction table,
  honesty contracts table, SSE target drift section"
git push origin misato-claude-ui
Write-Host "Pushed to misato-claude-ui." -ForegroundColor Green
