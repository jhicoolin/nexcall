# Handoff: Hermes → Claude UI Agent

**Date:** 2026-05-25
**From:** Hermes (Runtime Orchestrator)
**To:** Claude UI Agent (UI polish and shell UX)

## Runtime Truth / API Contract

The canonical local runtime is at **`http://127.0.0.1:3010`**.

The full API contract is defined in `docs/MISATO_RUNTIME_API_CONTRACT.md`. Every response shape is documented there.

Ports 3000 and 3020 have been killed. **Do not use them.**

## What Works (Verified)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /health` | ✅ 200 | Unauthenticated |
| `GET /api/misato/status` | ✅ 200 | Authenticated, local-solo bypass |
| `POST /api/misato/command` | ✅ 200 | All 4 test commands worked |
| `GET /api/misato/events` | ✅ 200 | 59+ events persisted |
| `GET /api/misato/events/stream` | ✅ 200 | SSE, real-time events |
| `GET /api/misato/tasks` | ✅ 200 | 18 tasks in store |
| `GET /api/misato/approvals` | ✅ 200 | 12 approvals in store |
| `GET /api/misato/agents` | ✅ 200 | 12 agents in store |
| `GET /api/misato/logs` | ✅ 200 | 27 log entries |
| `GET /api/misato/lanes` | ✅ 200 | 3 lanes defined |
| `GET /api/misato/projects` | ✅ 200 | 5 projects |
| `GET /api/misato/watchtower` | ✅ 200 | Health monitoring |
| `GET /api/misato/secrets` | ✅ 200 | Secret scanning status |
| `GET /api/misato/council` | ✅ 200 | Agent council roster |
| `GET /api/misato/discord` | ✅ 200 | Mock (not connected) |
| `GET /api/misato/obsidian` | ✅ 200 | Mock (not connected) |
| `POST /api/misato/tasks/create` | ✅ Route wired | Calls service |
| `POST /api/misato/tasks/update` | ✅ Route wired | Calls service |
| `POST /api/misato/tasks/delete` | ✅ Route wired | Calls service |
| `POST /api/misato/approvals/action` | ✅ Route wired | approve/reject/defer |

## What Claude Should Do

### 1. Fix the Status Page — Add Missing Fields
The `GET /api/misato/status` response currently returns `null` for:
- `runtimeMode` → should be `"mock"`
- `localSoloMode` → should be `true`
- `desktopTokenRequired` → should be `false`

These fields are exported from `lib/misato/owner-guard.ts` but the status route handler (`app/api/misato/status/route.ts`) doesn't import or use them. Either:
- Add them to the route handler response, OR
- Build a frontend that derives them from `mode` and `localFirst`

### 2. Wire UI Controls to Working APIs
These backend routes exist and work — the UI needs to call them:
- **Create Task** → `POST /api/misato/tasks/create`
- **Update Task** (status, priority) → `POST /api/misato/tasks/update`
- **Delete Task** → `POST /api/misato/tasks/delete`
- **Assign Agent** → The backend `assignAgent()` exists but no API route was found for it — Codex needs to expose it
- **Approve / Reject / Defer** → `POST /api/misato/approvals/action`

### 3. Event Stream — Real Feed
The SSE event stream at `/api/misato/events/stream` emits real events. Wire the UI to:
- Connect to SSE on page load
- Parse `data:` lines as JSON
- Display real events (instead of dummy/demo logs)
- Show: command.completed, task.created/updated/deleted, approval events

### 4. Remove Port 3000 / 3020 References
The UI should only reference `http://127.0.0.1:3010`. Remove any hardcoded references to port 3000 or 3020.

### 5. Known Backend Issues (Not for Claude)
These are Codex's responsibility:
- SSE stream has no auth
- Filesystem writes crash on Vercel
- Status missing runtimeMode et al
- `misato-runtime/` routes lack auth
- Middleware matcher excludes API routes from rate limiting

## Do NOT Touch
- `lib/misato/` (runtime, store, mock data, auth, owner-guard)
- `middleware.ts`
- Any `/api/` route handler
- `.env` or secrets
- Public NexCall pages
- Any production deployment

## Files Claude CAN Touch
- `app/misato/` pages (agents, approvals, daily, design, kanban, logs, memory, missions, projects, secrets, settings, tools, watchtower)
- `app/misato-runtime/` (if needed for UI testing)
- `components/` (UI components)
- `desktop-ui/` (Tauri app shell)
- `docs/` (documentation updates)
