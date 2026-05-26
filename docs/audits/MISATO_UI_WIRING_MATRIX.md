# MISATO UI Wiring Matrix

**Version:** app.js v6.3 (production hardening pass)
**Branch:** misato-claude-ui
**Date:** 2026-05-26

This matrix documents every interactive control in the MISATO Mission Control desktop UI, what it calls, and whether it is live-wired or a no-op.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully wired — calls Hermes or performs local state change |
| ⚠️ | Partially wired — local state only, Hermes call may fail |
| 🔒 | Blocked by Hermes — endpoint not yet implemented |
| ❌ | No-op / not yet wired |
| 🟡 | Mock-only — always shows fallback data |

---

## Global Controls

| Control | Handler | Notes |
|---------|---------|-------|
| Nav items | `data-nav` → `render()` | ✅ All 13 screens |
| Settings toggle | `data-nav="config"` | ✅ |
| Find Hermes | `discoverHermes()` | ✅ Probes flat `/health` |
| Disconnect Hermes | `stopSSE()` + state reset | ✅ |
| Feed filter pills | `state.feedFilter` + `refreshFeedUI()` | ✅ |
| Pause / Follow Live | `state.feedPaused` toggle | ✅ |

---

## Settings Panel

| Control | Handler | Notes |
|---------|---------|-------|
| Host / Port inputs | `saveHermesHostPort()` | ✅ persists to localStorage; restarts SSE if target changed |
| Find Hermes button | `discoverHermes()` | ✅ |
| Save Config (Advanced) | `saveConfig()` | ✅ token guard active |
| Test Connection | `testConnection()` | ✅ Vercel path |

---

## Overview

| Control | Handler | Notes |
|---------|---------|-------|
| Refresh button | `loadAllFromHermes()` | ✅ |
| Agent Status → View all | `data-nav="agentdex"` | ✅ |
| Active Work → Kanban | `data-nav="kanban"` | ✅ |
| Recent Alerts → Logs | `data-nav="logs"` | ✅ |
| Approval Backlog → Review | `data-nav="approvals"` | ✅ |
| Sentinel → Sentinel | `data-nav="sentinel"` | ✅ |
| Try Again (Hermes setup card) | `discoverHermes()` | ✅ |

---

## Command Center

| Control | Handler | Notes |
|---------|---------|-------|
| Send button | `sendCommand()` | ✅ POST /api/misato/command when Hermes up; Vercel path otherwise |
| Ctrl+Enter | `sendCommand()` | ✅ |
| Quick action buttons | `sendCommand(prompt)` | ✅ |
| Clear messages | `state.messages = []` | ✅ |
| Clear timeline | `state.commandTimeline = []` | ✅ |
| Mode label | `runtimeStatus()` | ✅ topbar runtime badge |

---

## AgentDex

| Control | Handler | Notes |
|---------|---------|-------|
| Filter pills (all/active/etc.) | `state.agentFilter` + `render()` | ✅ |
| Agent card click | Opens agent drawer | ✅ |
| Close drawer | `state.selectedAgent = null` | ✅ |
| + Assign Task | Opens modal `assign-task` | ✅ |
| Modal confirm | `createTask()` → POST /api/misato/tasks/create | ✅ |

---

## Schedule

| Control | Handler | Notes |
|---------|---------|-------|
| + New Task | `id="btn-add-task"` → modal | ✅ |
| View toggle (Day/Agenda/Week) | No handler | ❌ No-op |
| Live schedule items | `normalizeScheduleItems()` | 🔒 Hermes needs `scheduledAt` field |

---

## Kanban

| Control | Handler | Notes |
|---------|---------|-------|
| + Add Task | `id="btn-add-task"` → modal | ✅ |
| Card → status cycle | `data-task-status` → `updateTask()` | ✅ POST /api/misato/tasks/update |
| Card → priority cycle | `data-task-priority` → `updateTask()` | ✅ POST /api/misato/tasks/update |
| Card → delete | `data-task-delete` → `deleteTask()` | ✅ POST /api/misato/tasks/delete; high-risk → approval gate |

---

## Watchtower

| Control | Handler | Notes |
|---------|---------|-------|
| Refresh | `loadAllFromHermes()` | ✅ |
| Data source | `/api/misato/watchtower` Hermes or MOCK | ⚠️ Falls back to mock |

---

## Secret Sentinel

| Control | Handler | Notes |
|---------|---------|-------|
| Scan Now | `hermesMutate('POST', 'api/misato/sentinel/scan')` | ✅ wired, 🔒 Hermes must implement endpoint |
| Findings display | `state.sentinel` or MOCK | ✅ No raw secrets rendered; remediation normalized to array |

---

## Logs

| Control | Handler | Notes |
|---------|---------|-------|
| Refresh | `loadAllFromHermes()` | ✅ |
| Export | No handler | ❌ No-op |
| Severity filters (ALL/INFO/WARN/ERROR) | `state.logFilter` + `render()` | ✅ |
| Log entries | `state.logs` via `/api/misato/logs` or MOCK | ✅ |

---

## Integrations

| Control | Handler | Notes |
|---------|---------|-------|
| Configure buttons | No handler | ❌ No-op |
| Test buttons | No handler | ❌ No-op |
| Live Hermes card | `buildLiveIntegrations()` | ✅ runtime-aware |

---

## Lanes

| Control | Handler | Notes |
|---------|---------|-------|
| Lane cards | Display only | ✅ Live if Hermes agents have branch/lane fields |

---

## Approvals

| Control | Handler | Notes |
|---------|---------|-------|
| Approve | `resolveApproval(id, 'approve')` | ✅ POST /api/misato/approvals/action {approvalId, action} |
| Reject | `resolveApproval(id, 'reject')` | ✅ |
| Defer | `resolveApproval(id, 'defer')` | ✅ |
| Optimistic removal | On approve/reject, removes from list; refreshes in background | ✅ |
| Live data | `state.approvals` from `/api/misato/approvals` | ✅ |

---

## Obsidian Mirror

| Control | Handler | Notes |
|---------|---------|-------|
| Folder tree | `data-obfolder` → `state.obsidianFolder` | ✅ |
| Open in Obsidian | No handler | ❌ Requires Tauri shell command |

---

## Design Library

| Control | Handler | Notes |
|---------|---------|-------|
| Tab navigation | `data-dltab` | ✅ |

---

## Mutation API Summary (v6)

All Hermes write operations go through `hermesMutate(method, path, body)`.
The `api/misato/` prefix is included in the path argument; `hermesMutate` prepends `hermesBase()`.

| Operation | Method | Path | Body | Status |
|-----------|--------|------|------|--------|
| Send command | POST | `api/misato/command` | `{ command }` | ✅ |
| Approve | POST | `api/misato/approvals/action` | `{ approvalId, action:'approve' }` | ✅ |
| Reject | POST | `api/misato/approvals/action` | `{ approvalId, action:'reject' }` | ✅ |
| Defer | POST | `api/misato/approvals/action` | `{ approvalId, action:'defer' }` | ✅ |
| Create task | POST | `api/misato/tasks/create` | `{ title, project, priority, status, agent }` | ✅ |
| Update task | POST | `api/misato/tasks/update` | `{ taskId, payload }` | ✅ |
| Delete task (low risk) | POST | `api/misato/tasks/delete` | `{ taskId }` | ✅ |
| Delete task (high risk) | — | creates local approval record | — | ✅ approval gate |
| Sentinel scan | POST | `api/misato/sentinel/scan` | `{}` | ✅ wired, 🔒 Hermes endpoint needed |

All mutations surface `Attempted: <url>` on error. No tokens in URLs or logs.

---

## URL Construction (v6)

| Helper | URL produced | Used for |
|--------|-------------|---------|
| `hermesBase()` | `http://{host}:{port}` | Base — never used raw |
| `hermesApi(path)` | `http://{host}:{port}/api/misato/{path}` | All data + mutation routes |
| `/health` (direct) | `http://{host}:{port}/health` | Boot discovery, health ping (flat, unauthenticated) |

Port 3010 is canonical. `hermesBase()` and `normalizeHermesPort()` both default to 3010. Stored `3000`/`3020` values are upgraded to `3010` at boot.

---

## Runtime Status (v6)

`runtimeStatus()` returns:

| Field | Source |
|-------|--------|
| `runtimeMode` | `LOCAL SOLO` / `VERCEL PREVIEW` / `DISCONNECTED` |
| `hermesConnected` | `state.hermesState === 'connected'` |
| `sseAvailable` | `state.sseState === 'connected'` |
| `allowedMutationMode` | `full CRUD` when Hermes up, `read-only` otherwise |
| `productionLocked` | always `true` |

---

## Live Feed Strategy (v6)

Priority chain: SSE events → polled `/api/misato/logs` (when Hermes up, SSE down) → MOCK_LOGS (fully offline).

- SSE connected → badge `● LIVE`
- SSE error, Hermes up → `pollLogsFallback()` every 15 s, badge `● POLLING`
- Hermes up, no SSE events yet → `state.logs` shown (not mock), badge `● HERMES`
- Fully disconnected → MOCK_LOGS dimmed, badge `● MOCK`

Feed entries with no human-readable field show `[event-type]` placeholder — never raw JSON.

---

## SSE Reconnect / Target Drift (v6)

- `saveHermesHostPort()` restarts SSE immediately if host or port changes while connected.
- SSE errors escalate after 3 failures: `discoverHermes()` re-probes `/health`.
- Health ping every 30 s detects mid-session Hermes shutdown.

---

## Honesty Contracts (v6)

| Scenario | UI behaviour |
|----------|-------------|
| DELETE task fails | Task stays in list — failure toast with URL |
| UPDATE task offline | Applied locally — "not persisted" warning |
| DELETE task offline | Removed locally — "will reappear on reconnect" warning |
| Command unreachable | Inline error in thread with attempted URL |
| Approval action fails | Toast with HTTP status + URL |
| Sentinel scan fails | Toast with URL; background refresh triggered anyway |

---

## Known Gaps (for Hermes / Codex backlog)

| Gap | Screen | What Hermes needs |
|-----|--------|-------------------|
| POST /api/misato/sentinel/scan | Sentinel | Implement on-demand scan trigger |
| /schedule or scheduledAt fields | Schedule | Add scheduling data to tasks |
| branch/lane fields on agents | Lanes | Add branch/lane to agent registry |
| Tauri shell → Open Obsidian | Obsidian | Wire via Tauri invoke |
| Integrations Configure/Test buttons | Integrations | Wire per-integration config endpoints |
