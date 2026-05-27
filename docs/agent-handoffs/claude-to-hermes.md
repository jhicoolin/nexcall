# Claude → Hermes Handoff
**Date:** 2026-05-26  
**Branch:** misato-claude-live-ui-wiring  
**Author:** Claude UI Agent  

---

## What Claude shipped in this pass

UI-only changes to `desktop-ui/app.js` and `desktop-ui/styles.css`. No backend, auth, or API routes were touched.

### Changes made
1. **Schedule Day/Week/Agenda** — all three tabs now render real content. Day: hourly grid 6a–10p with task blocks. Week: 7-column calendar. All tabs wired and stateful via `state.scheduleView`.
2. **Approvals** — filter tabs (Pending/Approved/Rejected/Deferred/All), dedup by ID to stop approval spam, normalizes `requestedByAgentName`, `riskLevel`, `safeExecutionMode`, `decisionAt`.
3. **Live Feed** — heartbeat/stream noise filtered (`runtime_heartbeat`, `stream_connected`, `ping`, `pong`). Deduplication by eventId. Added APPV (approvals) filter tab.
4. **Mock banners** — suppressed when Hermes connected. Replaced with loading spinner while data fetches, or honest empty state after load.
5. **Command Center** — captures `modelUsed` and `responseSource` from command responses. Shows violet model badge and amber `deterministic-fallback` badge on MISATO messages.
6. **AgentDex** — progress bar on cards and drawer if `progress` field present. `lastActivityAt`, `tasksCompleted`, `tasksPending` shown in drawer.
7. **Obsidian Mirror** — checks `state.runtimeCtx.obsidian.configured` / `vaultPath`. Shows live vs. not-configured state. Sync button calls `POST /api/misato/obsidian/sync`.
8. **Secret Sentinel** — fixed scan endpoint from `sentinel/scan` → `secrets/scan-summary`. Added `gitleaksInstalled` and `scanAvailable` status panel. Disabled scan button when endpoint unavailable. Normalizes `critical`, `high`, `warnings` counts.
9. **Lanes** — no longer shows MOCK banner when Hermes is connected. Shows honest "waiting on branch/lane fields" message with specific instruction.
10. **Overview** — active model tile from `ctx.activeModel`. Health tiles show `…` while loading.
11. **Error states** — every fetch error shows endpoint URL and recovery action.

---

## Endpoints Claude is calling — Hermes must serve these

| Method | Path | Used by | Notes |
|--------|------|---------|-------|
| GET | `/health` | Boot discovery, 30s ping | Must return `application/json` |
| GET | `/api/misato/status` | runtimeCtx, activeModel, mutationMode | Required |
| GET | `/api/misato/agents` | AgentDex, Overview | Required |
| GET | `/api/misato/tasks` | Kanban, Schedule, Overview | Required |
| GET | `/api/misato/approvals` | Approvals screen | Required |
| GET | `/api/misato/logs` | Logs, Live Feed fallback | Required |
| GET | `/api/misato/watchtower` | Watchtower | Required |
| GET | `/api/misato/secrets` | Sentinel screen | Required |
| GET | `/api/misato/events/stream` | SSE — Live Feed | Required |
| POST | `/api/misato/command` | Command Center | Required |
| POST | `/api/misato/tasks/create` | Create task modal | Required |
| POST | `/api/misato/tasks/update` | Kanban status/priority | Required |
| POST | `/api/misato/tasks/delete` | Kanban delete | Required |
| POST | `/api/misato/approvals/action` | Approve/Reject/Defer | Required |
| POST | `/api/misato/secrets/scan-summary` | Sentinel Scan Now | **RENAMED — was `sentinel/scan`** |
| POST | `/api/misato/obsidian/sync` | Obsidian Sync Now | New endpoint needed |

---

## Fields Hermes should add or confirm

### `/api/misato/status` — Claude reads these
```json
{
  "mode": "LOCAL SOLO",
  "activeModel": "deepseek-v4-flash",
  "runtimeMode": "local",
  "mutationMode": "full CRUD",
  "agentCount": 14,
  "taskCount": 9,
  "obsidian": {
    "configured": true,
    "vaultPath": "/path/to/vault",
    "lastSync": "2026-05-26T12:00:00Z"
  }
}
```

### `/api/misato/command` — canonical response shape
```json
{
  "ok": true,
  "commandId": "cmd-abc123",
  "responseText": "Human-readable MISATO response.",
  "modelUsed": "deepseek-v4-flash",
  "responseSource": "ai",
  "intent": "task.create",
  "riskLevel": "Low",
  "commandStatus": "completed"
}
```
Claude reads `responseText` first, then `missionSummary → response → message → output`.

### `/api/misato/agents` — add for live progress + lanes
```json
{
  "progress": 75,
  "tasksCompleted": 3,
  "tasksPending": 1,
  "branch": "misato-hermes-backend",
  "lane": "Hermes Backend Lane",
  "lastActivityAt": "2026-05-26T11:30:00Z"
}
```
`branch` or `lane` field makes Lanes screen go fully live.

### `/api/misato/approvals` — add for clean card rendering
```json
{
  "id": "apr-xxx",
  "title": "Human-readable title",
  "description": "What this approval does and why",
  "riskLevel": "High",
  "status": "pending",
  "requestedByAgentName": "Hermes Architecture Agent",
  "actionType": "deploy.production",
  "createdAt": "2026-05-26T10:00:00Z",
  "decisionAt": null,
  "safeExecutionMode": true
}
```

### `/api/misato/tasks` — add for Schedule Day/Week
```json
{
  "scheduledAt": "2026-05-26T14:00:00Z"
}
```
Without `scheduledAt`, tasks won't appear in Day/Week calendar views.

---

## Hermes must verify

1. `POST /api/misato/secrets/scan-summary` — endpoint exists (renamed from `sentinel/scan`)
2. `POST /api/misato/obsidian/sync` — endpoint exists (new)
3. `POST /api/misato/command` response includes `responseText` field
4. `GET /api/misato/status` returns `activeModel` field
5. SSE does not emit `runtime_heartbeat` continuously (or Hermes is OK that Claude filters it)
6. Approval objects have `requestedByAgentName` not just `agent`

---

## Blockers for Claude (waiting on Hermes)

- Schedule Week/Day only populate if tasks have `scheduledAt` ISO field
- Lanes screen fully live only when agents have `branch` or `lane` fields
- Obsidian live sync requires `OBSIDIAN_VAULT_PATH` env var + Hermes support
- Active model badge requires `activeModel` in `/status` response
