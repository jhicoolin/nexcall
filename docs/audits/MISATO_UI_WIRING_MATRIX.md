# MISATO UI Wiring Matrix

**Version:** app.js v5.1  
**Branch:** misato-claude-ui  
**Date:** 2026-05-25  

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
| Find Hermes | `discoverHermes()` | ✅ Probes `/health` |
| Disconnect Hermes | `stopSSE()` + state reset | ✅ |
| Feed filter pills | `state.feedFilter` + `refreshFeedUI()` | ✅ |
| Pause / Follow Live | `state.feedPaused` toggle | ✅ |

---

## Settings Panel

| Control | Handler | Notes |
|---------|---------|-------|
| Host / Port inputs | `saveHermesHostPort()` | ✅ persists to localStorage |
| Find Hermes button | `discoverHermes()` | ✅ |
| Save Config (Advanced) | `saveConfig()` | ✅ token guard active |
| Test Connection | `testConnection()` | ✅ Vercel path |

---

## Overview

| Control | Handler | Notes |
|---------|---------|-------|
| Refresh button | `loadAllFromHermes()` | ✅ (v5 fix — was calling discoverHermes) |
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
| Send button | `sendCommand()` | ✅ POST /command — error shows URL |
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
| + Assign Task | Opens modal `assign-task` | ✅ (v5) |
| Modal confirm | `createTask()` → POST /tasks | ✅ (v5) |

---

## Schedule

| Control | Handler | Notes |
|---------|---------|-------|
| + New Task | `id="btn-add-task"` → modal | ❌ Missing id on Schedule header button |
| View toggle (Day/Agenda/Week) | No handler | ❌ No-op |
| Live schedule items | `normalizeScheduleItems()` | 🔒 Hermes needs `scheduledAt` field |

---

## Kanban

| Control | Handler | Notes |
|---------|---------|-------|
| + Add Task | `id="btn-add-task"` → modal | ✅ (v5) |
| Card → status cycle | `data-task-status` → `updateTask()` | ✅ (v5) optimistic |
| Card → priority cycle | `data-task-priority` → `updateTask()` | ✅ (v5) optimistic |
| PATCH /tasks/:id | `hermesMutate('PATCH')` | 🔒 Hermes must implement PATCH /tasks/:id |

---

## Watchtower

| Control | Handler | Notes |
|---------|---------|-------|
| Refresh | `loadAllFromHermes()` | ✅ (v5 fix) |
| Data source | `/watchtower` Hermes or MOCK | ⚠️ Falls back to mock |

---

## Secret Sentinel

| Control | Handler | Notes |
|---------|---------|-------|
| Scan Now | No handler | ❌ No-op (Hermes endpoint needed) |
| Findings display | `state.sentinel` or MOCK | ✅ No raw secrets rendered |

---

## Logs

| Control | Handler | Notes |
|---------|---------|-------|
| Export | No handler | ❌ No-op |
| Severity filters (ALL/INFO/WARN/ERROR) | No handler | ❌ Display only |
| Log entries | `state.logs` or MOCK | ✅ normalizes sev/level/severity |

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
| Lane cards | Display only | ✅ Live if Hermes has branch/lane fields |

---

## Approvals

| Control | Handler | Notes |
|---------|---------|-------|
| Approve | `resolveApproval(id, 'approve')` | ✅ (v5) POST /approvals/:id/approve |
| Reject | `resolveApproval(id, 'reject')` | ✅ (v5) POST /approvals/:id/reject |
| Defer | `resolveApproval(id, 'defer')` | ✅ (v5) POST /approvals/:id/defer |
| Optimistic removal | On approve/reject, removes from list | ✅ |
| Live data | `state.approvals` from `/approvals` | ✅ |

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

## Mutation API Summary (v5)

All Hermes write operations go through `hermesMutate(method, path, body)`:

| Operation | Method | Path | Status |
|-----------|--------|------|--------|
| Send command | POST | `/command` | ✅ shows URL on error |
| Approve | POST | `/approvals/:id/approve` | ✅ wired, 🔒 Hermes endpoint |
| Reject | POST | `/approvals/:id/reject` | ✅ wired, 🔒 Hermes endpoint |
| Defer | POST | `/approvals/:id/defer` | ✅ wired, 🔒 Hermes endpoint |
| Create task | POST | `/tasks` | ✅ wired, 🔒 Hermes endpoint |
| Update task | PATCH | `/tasks/:id` | ✅ optimistic + Hermes sync |
| Delete task (low risk) | DELETE | `/tasks/:id` | ✅ optimistic, 🔒 Hermes endpoint |
| Delete task (high risk) | — | creates approval record | ✅ approval gate |
| Sentinel scan | POST | `/sentinel/scan` | ✅ wired, 🔒 Hermes endpoint |

All mutations surface `Attempted: <url>` on error. No tokens logged.

---

## Runtime Status (v5)

`runtimeStatus()` returns:

| Field | Source |
|-------|--------|
| `runtimeMode` | `LOCAL SOLO` / `VERCEL PREVIEW` / `DISCONNECTED` |
| `hermesConnected` | `state.hermesState === 'connected'` |
| `sseAvailable` | `state.sseState === 'connected'` |
| `allowedMutationMode` | `full CRUD` when Hermes up, `read-only` otherwise |
| `productionLocked` | always `true` |

Displayed as badge in topbar. Color: teal = LOCAL SOLO, blue = VERCEL PREVIEW, slate = DISCONNECTED.

---

## Live Feed Strategy (v5.1)

Priority chain: SSE events → polled `/logs` (when Hermes up, SSE down) → MOCK_LOGS (fully offline).

- SSE connected: feed shows real-time events, badge = `● LIVE`
- SSE error, Hermes up: `pollLogsFallback()` runs every 15 s, badge = `● POLLING`
- Hermes up, no SSE events yet: feed shows `state.logs` entries (not mock), badge = `● HERMES`
- Fully disconnected: feed shows MOCK_LOGS dimmed, badge = `● MOCK`

Feed entries from `state.logs` use `logToFeedEvent()` (not flagged `_mock`, not dimmed).

---

## Known Gaps (for Hermes / Codex backlog)

| Gap | Screen | What Hermes needs |
|-----|--------|-------------------|
| POST /approvals/:id/approve|reject|defer | Approvals | Implement approval resolution endpoints |
| PATCH /tasks/:id | Kanban | Implement task update endpoint |
| POST /tasks | Kanban / AgentDex | Implement task creation endpoint |
| /schedule or scheduledAt fields | Schedule | Add scheduling data to tasks |
| branch/lane fields on agents | Lanes | Add branch/lane to agent registry |
| POST /sentinel/scan | Sentinel | Implement on-demand scan trigger |
| Tauri shell → Open Obsidian | Obsidian | Wire via Tauri invoke |
