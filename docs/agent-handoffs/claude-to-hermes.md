# Handoff: Claude UI → Hermes Architecture

**From:** Claude UI Agent (desktop-ui lane)
**To:** Hermes Architecture Agent (backend lane)
**Branch:** misato-claude-ui → misato-hermes-backend
**Date:** 2026-05-25
**Version:** desktop-ui v4 (stabilization pass)

---

## What Claude UI did in v4

- Delivered `desktop-ui/app.js` v4 and `desktop-ui/styles.css` v4.
- Local Hermes Bridge is the **primary daily path**. Boot probes `127.0.0.1:3010/health` within 4 s; no token required for local mode.
- SSE at `127.0.0.1:3010/events/stream` drives live feed, command timeline, and incremental data patches.
- All 13 screens show live runtime data when Hermes is connected; MOCK fallback is always labeled with an orange banner.
- Persistent SSE failure (3 consecutive errors) escalates to `discoverHermes()` to re-probe `/health`.
- 30-second health ping updates the top bar and detects mid-session Hermes shutdown.
- Vercel / token path is collapsed under Advanced in Settings — not the daily path.

---

## Hermes routes the UI calls

All routes are **flat** — no `/api/misato/` prefix. That prefix belongs to the Next.js / Vercel side only.
Base: `http://127.0.0.1:3010` (configurable in Settings).

| Method | Path | Used for |
|--------|------|---------|
| `GET` | `/health` | Boot discovery + 30 s health ping |
| `GET` | `/agents` | Agent registry (AgentDex, Overview, Watchtower, Command Center) |
| `GET` | `/tasks` | Task list (Kanban, Schedule fallback, Overview) |
| `GET` | `/approvals` | Pending approvals (Approvals screen, Overview) |
| `GET` | `/logs` | Log entries (Logs screen, Watchtower incidents, Overview alerts) |
| `GET` | `/watchtower` | Service health monitors (Watchtower screen) |
| `GET` | `/secrets` | Sentinel findings (Secret Sentinel screen) |
| `GET` | `/events/stream` | SSE stream — drives everything in real time |
| `POST` | `/command` | Send mission command; body `{ command: string }` |

---

## Expected response shapes

### `/health`
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "agents": { "active": 3, "total": 14 },
  "tasks": { "doing": 2, "blocked": 1 },
  "events": 128
}
```

### `/agents`
Accepts bare array OR `{ items: [...] }`.
```json
[{
  "id": "strategy",
  "name": "Strategy Agent",
  "role": "Mission Planning",
  "specialty": "Goal alignment, OKRs",
  "state": "active|thinking|idle|blocked|complete",
  "perm": "Advisory|Build|Audit|Gate",
  "risk": "Low|Medium|High",
  "feedback": "Current status string"
}]
```
**Optional for Lanes screen:** add `"branch"` or `"lane"` field to each agent.

### `/tasks`
Accepts bare array OR `{ items: [...] }`.
```json
[{
  "id": "t1",
  "title": "Task name",
  "project": "NexCall",
  "priority": "High|Medium|Low",
  "status": "Done|Doing|Blocked|Idea",
  "agent": "Claude UI",
  "risk": "Low",
  "approvalRequired": false
}]
```
**Optional for Schedule screen:** add `"scheduledAt"` (ISO 8601) or `"time"` (string range) to each task.

### `/logs`
Accepts bare array OR `{ items: [...] }`. Severity field can be `sev`, `level`, or `severity`.
```json
[{
  "ts": "09:31:57",
  "src": "CONN-TEST",
  "sev": "warn|info|error",
  "agent": "Claude UI",
  "action": "Description of event"
}]
```

### `/approvals`
Accepts bare array OR `{ items: [...] }`.
```json
[{
  "id": "apr-1",
  "title": "Action requiring approval",
  "risk": "High|Medium|Low",
  "agent": "Hermes Architecture Agent",
  "details": "What this action does",
  "requestedAt": "5 min ago"
}]
```

### `/watchtower`
```json
{
  "services": [
    { "name": "Hermes Local Bridge", "meta": "127.0.0.1:3010", "ok": true }
  ]
}
```
Also accepts `{ monitors: [...] }` with `{ name, target, status: 'up'|'down' }`.

### `/secrets`
Object (not array). No raw secret values — type/path/severity only.
```json
{
  "lastScanAt": "2026-05-25T09:33:00Z",
  "findings": [
    { "sev": "warn", "title": "...", "loc": "path/to/file", "age": "1h ago", "status": "Confirmed" }
  ],
  "remediation": [
    { "label": "Rotate all exposed secrets", "done": false }
  ]
}
```

### `/events/stream` — SSE canonical schema
```json
{
  "eventId": "uuid",
  "timestamp": "2026-05-25T09:31:57Z",
  "type": "command_received|plan_generated|agent_assigned|task_updated|risk_detected|approval_requested|approval_resolved|log|status_change",
  "source": "agent-id or system",
  "payload": {
    "message": "Human-readable description",
    "commandId": "optional — ties events to a command flow",
    "summary": "optional — short summary for timeline",
    "task": { "...task fields..." },
    "agent": { "...agent fields..." },
    "approval": { "...approval fields..." }
  }
}
```

### `POST /command`
```json
{ "command": "What needs attention today?" }
```
Response:
```json
{
  "ok": true,
  "commandId": "cmd-uuid",
  "missionSummary": "Plain text summary shown in Command Center"
}
```

---

## CORS requirement

The UI runs in Tauri's webview. The webview origin is `tauri://localhost` in packaged builds and `http://localhost:1420` in dev. Hermes must allow both:
```
Access-Control-Allow-Origin: tauri://localhost, http://localhost:1420
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## New Hermes endpoints needed (v5 wiring pass)

These endpoints are now called by the UI but not yet confirmed as implemented in Hermes. UI shows toast with URL on failure — it does not crash.

| Method | Path | Body | Used for |
|--------|------|------|---------|
| POST | `/approvals/:id/approve` | `{}` | Approval resolution |
| POST | `/approvals/:id/reject` | `{}` | Approval resolution |
| POST | `/approvals/:id/defer` | `{}` | Approval deferral |
| POST | `/tasks` | task object | Task creation |
| PATCH | `/tasks/:id` | partial task | Task status/priority update |

All return `200` on success. On error, UI shows `HTTP <status> — <body excerpt>` and the attempted URL.

---

## What the UI does NOT need from Hermes yet

- A `/schedule` endpoint (UI falls back to MOCK_SCHEDULE with a clear label)
- Agent `branch`/`lane` fields (UI falls back to MOCK lanes with a clear label)
- Any auth token for local-solo mode

---

## Security constraints (unchanged)

- No token values logged or rendered.
- Sentinel findings show type + path + severity only — never raw secret values.
- Do not change auth logic, middleware, or public NexCall routes.
- Do not merge to main. PR targets `misato-full-build` only.
- Do not connect live automations without owner approval.

---

## Files Claude UI changed in v5

```
desktop-ui/app.js   — v5 wiring pass: hermesMutate, resolveApproval, createTask, updateTask,
                       modal system, runtimeStatus(), runtime badge in topbar,
                       sendCommand error surfaces URL, btn-refresh fixed to loadAllFromHermes
desktop-ui/styles.css — v5: modal overlay, kanban-card-actions, runtime-mode-badge, cmd-message-error
docs/agent-handoffs/claude-to-hermes.md — this file (updated)
docs/agent-handoffs/claude-to-codex.md  — new
docs/design/CLAUDE_UI_STYLE_GUIDE.md    — updated
```
