# Claude → Hermes Handoff
**Date:** 2026-06-02  
**Branch:** misato-hermes-live-brain  
**Author:** Claude UI Agent (Sonnet 4.6)  
**Version:** v6.6 + blueprint complete

---

## What Claude Shipped in This Pass

### app.js v6.6 (commit 67de581)

UI-only changes. No backend, auth, or API routes touched.

1. **state.schedule** — Added to state. `loadAllFromHermes()` now fetches `GET /api/misato/schedule`. All three schedule tabs use `state.schedule.viewData.{agenda,day,week}` with fallback to tasks.
2. **state.lanes** — `loadAllFromHermes()` now fetches `GET /api/misato/lanes`. `buildLiveLanes()` priority: `state.lanes.items` → `agent.branch` → static manifest.
3. **Approval requester** — `normalizeApproval()` adds `a.requestedAgent` to fallback chain (seed data shape).
4. **Kanban field names** — Cards now read `t.agent || t.assignedAgentId` and `t.project || t.projectId`.
5. **context_loaded filtered** — Added to `FEED_NOISE_TYPES`. No longer pollutes Live Feed.
6. **Watchtower CORS tile removed** — Replaced with live Runtime Mode tile from `runtimeCtx`.

### app.js v6.6 + audit fixes (commit TBD)

Bug fixes from actual code audit:

1. **Approval risk badge** — Was reading `a.risk` (undefined after normalization); now reads `a.riskLevel || a.risk`. All cards were showing "Low Risk" incorrectly.
2. **Safe mode badge** — Was reading `a.doesNotAutoExecute` (not in normalized shape); now reads `a.safeExecutionMode`. Badge now renders correctly.
3. **Approval toast** — Now includes approval ID: "✓ Approval #apr-xxx approved by owner."
4. **Scan toast** — Now includes severity counts: "✓ Scan complete · 0 critical · 2 high · 5 warnings"
5. **Sync toast** — Now includes file count: "✓ Synced · 8 files · Just now"
6. **Obsidian sync error** — Now includes endpoint URL in error toast.
7. **createdAt as fallback** — Approval cards use `createdAt` when `requestedAt` is absent (live records don't have `requestedAt`).
8. **decidedBy shown** — Resolved approval cards now show `· by {decidedBy}` when present.

### Blueprint documentation (commit 1b204f3)

Complete MISATO blueprint written to files — all implementation-grade:

```
docs/misato/
  ARCHITECTURE.md         — system diagram, data flow, consistency rules
  SYSTEM_PROMPT.md        — production Claude system prompt (verbatim)
  STATUS_TAXONOMY.md      — 13 statuses with hex codes, CSS classes, ARIA
  TRUST_POLICY.md         — MCP tiers 1-4, token handling, destructive gates
  FIELD_NORMALIZATION.md  — JS normalizer functions for all API shapes
  HOOKS.md                — hook policies + TypeScript integration guide
  UX_COPY_DECK.md         — all user-facing copy with ARIA
  ACCEPTANCE_GATES.md     — 12 pass/fail gates with Given/When/Then
  REGRESSION_FORMAT.md    — regression report format with examples
  OWNERSHIP_MATRIX.md     — Hermes/Claude/Codex ownership per feature
  RUN_LEDGER_SCHEMA.md    — JSONL schema with all event types and examples

docs/subagents/           — 6 specialist subagent prompts (real Claude format)
docs/tests/               — 130-test matrix (all UNTESTED — needs Codex run)
docs/releases/            — 12-phase release checklist
docs/audits/              — MISATO_UI_AUDIT.md (actual code audit findings)

lib/misato/hooks/         — 4 TypeScript hook files (real, not pseudocode)
lib/misato/subagents/     — registry.ts updated with 6 specialist subagents
```

---

## Endpoints Claude Is Calling — Hermes Must Serve All

| Method | Path | Used by | Status |
|--------|------|---------|--------|
| GET | `/health` | Boot discovery, 30s ping | Required |
| GET | `/api/misato/status` | runtimeCtx, activeModel, Hermes version | Required |
| GET | `/api/misato/agents` | AgentDex, Overview, Lanes fallback | Required |
| GET | `/api/misato/tasks` | Kanban, Schedule fallback, Overview | Required |
| GET | `/api/misato/approvals` | Approvals screen | Required |
| GET | `/api/misato/logs` | Logs, Live Feed polling fallback | Required |
| GET | `/api/misato/watchtower` | Watchtower service cards | Required |
| GET | `/api/misato/secrets` | Sentinel screen | Required |
| GET | `/api/misato/schedule` | Schedule — all three tabs | **NEW — added v6.6** |
| GET | `/api/misato/lanes` | Lanes screen (primary source) | **NEW — added v6.6** |
| GET | `/api/misato/events/stream` | SSE — Live Feed | Required |
| POST | `/api/misato/command` | Command Center | Required |
| POST | `/api/misato/tasks/create` | Create task modal | Required |
| POST | `/api/misato/tasks/update` | Kanban status/priority cycles | Required |
| POST | `/api/misato/tasks/delete` | Kanban delete | Required |
| POST | `/api/misato/approvals/action` | Approve/Reject/Defer | Required |
| POST | `/api/misato/secrets/scan-summary` | Sentinel Scan Now | Required |
| POST | `/api/misato/obsidian/sync` | Obsidian Sync Now | Required |

---

## Fields Hermes Must Add or Confirm

### CRITICAL — approval cards show "—" for requester without this

In `createApprovalRecord()` in `lib/misato/runtime/command-machine.ts`, add:
```typescript
requestedByAgentName: "Hermes Runtime",  // Add this field
requestedByAgentId: "agent-hermes",      // Already exists
```

The UI reads `requestedByAgentName` first, then `agentName`, then `agent`, then `requestedAgent`. Without this, runtime-created approvals show "—" for requester.

### HIGH — schedule tabs only populate with this

In task objects returned by `GET /api/misato/tasks`:
```json
{
  "scheduledAt": "2026-06-02T14:00:00Z"
}
```

And the `GET /api/misato/schedule` endpoint must return:
```json
{
  "ok": true,
  "mode": "runtime-tasks",
  "today": "2026-06-02",
  "viewData": {
    "agenda": [
      { "id": "task-xxx", "title": "...", "project": "NexCall", "status": "Doing", "priority": "High", "scheduledAt": "2026-06-02T14:00:00Z", "ownerAgentId": "agent-xxx" }
    ],
    "day": {
      "2026-06-02": [
        { "id": "task-xxx", "title": "...", "hour": "14", "scheduledAt": "2026-06-02T14:00:00Z" }
      ]
    },
    "week": {
      "Monday": [...],
      "Tuesday": [...]
    }
  },
  "unscheduledTasks": 3
}
```

### HIGH — lanes screen fully live only with this

`GET /api/misato/lanes` must return:
```json
{
  "ok": true,
  "mode": "live",
  "items": [
    {
      "id": "lane-hermes",
      "name": "Hermes Backend Lane",
      "ownerAgentName": "Hermes Architecture Agent",
      "ownerAgentId": "agent-hermes-arch",
      "branch": "misato-hermes-live-brain",
      "status": "active",
      "current": "Runtime truth layer and AI gateway",
      "next": "scheduledAt field on tasks",
      "tasksTotal": 5,
      "tasksDone": 2,
      "tasksBlocked": 0,
      "blockers": []
    }
  ]
}
```

### MEDIUM — model badge only shows with this

`GET /api/misato/status` must include:
```json
{
  "activeModel": "deepseek/deepseek-v4-flash",
  "runtimeMode": "local"
}
```

### MEDIUM — agent progress bars only show with this

`GET /api/misato/agents` items must include (optional):
```json
{
  "progress": 75,
  "branch": "misato-hermes-live-brain",
  "lastActivityAt": "2026-06-02T14:00:00Z"
}
```

---

## Hooks Available for Hermes Integration

Four TypeScript hooks are implemented and ready to import:

```typescript
import { 
  runDestructiveToolGuard,  // blocks L2+ tools, creates approval
  runLedgerWrite,           // writes tool results to events.jsonl
  runSubagentStart,         // marks agent active, emits SSE
  runSubagentStop,          // marks agent idle/blocked, updates task
  runErrorRecovery          // classifies errors, schedules retries
} from '@/lib/misato/hooks';
```

See `docs/misato/HOOKS.md` for integration points and usage examples.

---

## Blockers for Claude (Waiting on Hermes)

| Blocker | Impact | Priority |
|---------|--------|----------|
| `requestedByAgentName` not in createApprovalRecord | Runtime approvals show "—" requester | HIGH |
| `scheduledAt` not in command-created tasks | Schedule Day/Week views empty | HIGH |
| `/lanes` endpoint not returning items | Lanes screen falls back to static manifest | HIGH |
| `activeModel` not in `/status` | Model badge never shows | MEDIUM |
| `progress` not in agents | Progress bars never show | MEDIUM |
| `OBSIDIAN_VAULT_PATH` not configured | Mirror screen shows setup-required | OWNER |

---

## SSE Requirements

The following event types must NOT appear as data events in the SSE stream (they pollute the Live Feed):
- `runtime_heartbeat` or `heartbeat` as data events — use named SSE events only: `event: heartbeat\n`
- `stream_connected` / `stream_reconnect`
- `context_loaded` — currently emitted by `app/events/stream/route.ts` as a data event; Claude filters it but it should not be emitted at all

The following event types MUST appear when actions happen:
- `command.received` — every command
- `command.classified` — every command
- `task.created` — every new task
- `task.updated` — every task change
- `approval.created` — every new approval
- `approval.decided` — every approval decision
- `agent.assigned` — every agent assignment
- `command.completed` / `command.blocked` — every command completion

---

## Specialist Subagents Ready for Hermes to Invoke

All 6 specialist subagents have full system prompts in `docs/subagents/`. Hermes can invoke them by:

1. Reading the system prompt from the file
2. Passing current runtime state as JSON input
3. Calling Claude API with the prompt + state
4. Writing the output report to the run ledger

See `docs/subagents/README.md` (to be created) or individual files for invocation specs.
