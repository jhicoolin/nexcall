# MISATO Runtime API Contract

**Authoritative endpoint definitions for the local runtime (http://127.0.0.1:3010).**

All endpoints return JSON. All authenticated endpoints require either:
- Local-solo mode (automatic on localhost), OR
- A valid `x-misato-desktop-token` header, OR
- A valid `misato_owner_session` cookie

---

## GET /health

**Purpose:** Liveness + basic runtime info. Unauthenticated.

```json
{
  "ok": true,
  "status": "ok",
  "service": "MISATO Hermes Bridge",
  "mode": "local-first",
  "runtimeStatus": "connected",
  "version": "1.0.0-local",
  "uptime": 1135.7,
  "agents": { "active": 7, "total": 12 },
  "tasks": { "doing": 14, "blocked": 1 },
  "events": 59,
  "localFirst": true,
  "cloudOptional": true,
  "approvalsPending": 9,
  "paths": {
    "dataDir": "./.misato-runtime",
    "storePath": "./.misato-runtime/state.json",
    "eventsPath": "./.misato-runtime/events.jsonl"
  },
  "timestamp": "2026-05-25T18:19:28.876Z"
}
```

---

## GET /api/misato/status

**Purpose:** Full runtime status with mode and agent/task/approval counts. **Authenticated.**

Same shape as `/health` PLUS the following fields that must be added:

| Field | Type | Expected | Status |
|-------|------|----------|--------|
| `runtimeMode` | string | `"mock"` | MISSING (null) |
| `localSoloMode` | boolean | `true` | MISSING (null) |
| `desktopTokenRequired` | boolean | `false` | MISSING (null) |
| `productionLocked` | boolean | `false` | MISSING |
| `hermesConnected` | boolean | `true` | MISSING |
| `runtimeConnected` | boolean | `true` | MISSING |
| `eventStreamAvailable` | boolean | `true` | MISSING |
| `persistenceMode` | string | `"jsonl"` | MISSING |
| `activeAgents` | int | 7 | MISSING |
| `activeTasks` | int | 14 | MISSING |
| `pendingApprovals` | int | 10 | OK |
| `lastEventAt` | ISO timestamp | - | MISSING |
| `version` | string | `"1.0.0-local"` | OK |

---

## POST /api/misato/command

**Purpose:** Submit a natural language command to the MISATO runtime. **Authenticated.**

### Request
```json
{ "command": "hi bb" }
```

### Response (safe command)
```json
{
  "ok": true,
  "commandId": "cmd-acf5d9a2-...",
  "mode": "local-first",
  "commandReceived": "hi bb",
  "missionSummary": "MISATO reviewed operational priorities and prepared a mock-safe plan for Research Lab.",
  "projectDetected": "Research Lab",
  "hermesPlan": [
    "Validate auth context (owner session or desktop token)",
    "Classify request risk and enforce Approval Gate",
    "Fan out mock-safe subtasks to council",
    "Return operator summary + next recommended actions"
  ],
  "agentsAssigned": ["Strategy Agent", "Backend Agent", "Security Agent", "QA Agent", "Research Agent", "Claude UI Agent"],
  "councilFeedback": [
    { "agent": "MISATO Core", "feedback": "NexCall: priority HIGH ..." },
    { "agent": "Strategy Agent", "feedback": "..." }
  ],
  "subtasksCreated": 1,
  "approvalRequired": false,
  "moduleStatus": {
    "watchtower": "healthy",
    "secretSentinel": "guarded",
    "lanes": "active",
    "githubVercel": "connected"
  },
  "totalOrchestrationTime": "0.12s"
}
```

### Response (risky command — "deploy to production now")
Same shape but:
```json
{
  "approvalRequired": true,
  "subtasksCreated": 1,
  "councilFeedback": [
    { "agent": "MISATO Core", "feedback": "...", "riskDetected": true },
    { "agent": "Security Agent", "feedback": "Risk: deploy action blocked in v1 mock-safe mode" }
  ]
}
```

### Known Commands and Expected Behavior

| Command | Risk Level | Approval Required | Behavior |
|---------|-----------|-------------------|----------|
| `hi bb` | L0 | No | Friendly greeting, project detection |
| `What needs attention today?` | L0 | No | Daily ops briefing across all projects |
| `Assign Codex to verify the desktop build` | L1 | No | Task creation + agent assignment |
| `Ask Claude to polish AgentDex` | L1 | No | Task creation + agent assignment |
| `deploy to production now` | L4 | **Yes** | Approval record created, NO action taken |

---

## GET /api/misato/events

**Purpose:** Get recent runtime events. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "evt-...",
      "eventId": "evt-...",
      "timestamp": "2026-05-25T16:31:48.928Z",
      "type": "command.completed",
      "source": "misato.runtime",
      "severity": "info",
      "payload": {
        "commandId": "cmd-...",
        "approvalRequired": false
      }
    }
  ]
}
```

**Event types emitted:**
- `command.received` / `command_received` — command arrived
- `command.planned` / `plan_generated` — orchestration steps (x4 per command)
- `task.created` — task created for command
- `task.updated` / `task.status_changed` / `task.priority_changed` — task mutations
- `approval.created` / `approval_requested` / `approval.approved` / `approval.rejected` / `approval.deferred` — approval lifecycle
- `agent_assigned` — agent linked to task
- `risk_detected` — risky command flagged
- `log.created` — general log entries
- `status_change` — runtime state changes
- `context_loaded` — SSE connection established

---

## GET /api/misato/events/stream

**Purpose:** Server-sent events (SSE) real-time event feed. **UNPROTECTED — needs auth fix.**

```
Content-Type: text/event-stream

data: {"eventId":"...","timestamp":"...","type":"context_loaded","source":"misato.runtime","payload":{"stream":"connected"}}
```

---

## GET /api/misato/tasks

**Purpose:** All runtime tasks. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "task-...",
      "title": "Command: hi bb",
      "project": "Research Lab",
      "priority": "High",
      "status": "Doing",
      "ownerAgentId": null,
      "assignedBy": "MISATO",
      "createdAt": "2026-05-25T18:19:28.888Z",
      "updatedAt": "2026-05-25T18:19:28.888Z",
      "dueAt": null,
      "tags": [],
      "riskLevel": "Low",
      "approvalRequired": false,
      "linkedApprovalId": null,
      "activity": []
    }
  ]
}
```

---

## POST /api/misato/tasks/create

**Purpose:** Create a new task. **Authenticated.**

### Request
```json
{
  "title": "Fix mobile nav",
  "project": "NexCall",
  "priority": "Medium",
  "status": "Idea"
}
```

### Response
```json
{ "ok": true, "task": { ... } }
```

Error: `{ "ok": false, "error": "Title is required" }` (400)

---

## POST /api/misato/tasks/update

**Purpose:** Update an existing task. **Authenticated.**

### Request
```json
{
  "taskId": "task-...",
  "payload": { "status": "Doing", "priority": "High" }
}
```

### Response
```json
{ "ok": true, "task": { ... } }
```

Error: `{ "ok": false, "error": "Task not found" }` (404)

---

## POST /api/misato/tasks/delete

**Purpose:** Delete a task. **Authenticated.**

### Request
```json
{ "taskId": "task-..." }
```

### Response
```json
{ "ok": true, "deleted": true }
```

Error: `{ "ok": false, "error": "Task not found" }` (404)

---

## GET /api/misato/agents

**Purpose:** Agent registry. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "agentId": "agent-strategy",
      "name": "Strategy Agent",
      "role": "High-level planning",
      "status": "active",
      "riskTier": "L1",
      "currentTaskId": null,
      "lastActivityAt": null
    }
  ]
}
```

---

## GET /api/misato/approvals

**Purpose:** Pending/resolved approvals. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "apr-...",
      "title": "Approval required: deploy to production now",
      "riskLevel": "High",
      "status": "Pending",
      "requestedByAgentId": "agent-hermes",
      "affects": ["runtime"],
      "doesNotAutoExecuteProduction": true
    }
  ],
  "mode": "local-first"
}
```

---

## POST /api/misato/approvals/action

**Purpose:** Approve, reject, or defer an approval. **Authenticated.**

### Request
```json
{
  "approvalId": "apr-...",
  "action": "approve"
}
```

**Action values:** `"approve"` / `"approved"` / `"reject"` / `"rejected"` / `"defer"` / `"deferred"`

### Response
```json
{ "ok": true, "status": "approved", "approval": { ... } }
```

Error: `{ "ok": false, "error": "Approval not found" }` (404)

---

## GET /api/misato/logs

**Purpose:** Runtime log entries. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "log-...",
      "timestamp": "2026-05-25T18:07:30.055Z",
      "severity": "info",
      "source": "misato.runtime",
      "message": "Command processed: hi bb",
      "commandId": "cmd-..."
    }
  ]
}
```

---

## GET /api/misato/lanes

**Purpose:** Development lanes (Codex/Claude workstreams). **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "lane-hermes",
      "name": "Hermes",
      "branch": "misato-hermes-live-runtime",
      "owner": "Hermes",
      "status": "active"
    }
  ]
}
```

---

## GET /api/misato/projects

**Purpose:** Registered projects. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    { "id": "p1", "name": "NexCall", "slug": "nexcall", "description": "AI receptionist operations", "priority": "HIGH" }
  ]
}
```

---

## GET /api/misato/watchtower

**Purpose:** Runtime health monitoring service. **Authenticated.**

```json
{
  "ok": true,
  "serviceHealth": "healthy",
  "checkState": "local-runtime",
  "mode": "local-first",
  "liveExternalCalls": false,
  "monitors": [
    { "name": "local-runtime", "status": "up", "lastChecked": "..." },
    { "name": "command", "status": "up", "lastChecked": "..." },
    { "name": "events", "status": "up", "lastChecked": "..." }
  ]
}
```

---

## GET /api/misato/secrets

**Purpose:** Secret scanning status. **Authenticated.**

```json
{
  "ok": true,
  "findingsRedacted": true,
  "repoOnlyScan": true,
  "noRawSecretsInLogs": true,
  "status": "guarded",
  "findings": [...],
  "remediation": "..."
}
```

---

## GET /api/misato/council

**Purpose:** Agent council roster. **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "agent-strategy",
      "name": "Strategy Agent",
      "role": "High-level planning",
      "abilities": [...],
      "status": "active"
    }
  ]
}
```

---

## GET /api/misato/discord

**Purpose:** Discord bridge status. **Authenticated.**

```json
{
  "ok": true,
  "connected": false,
  "mode": "mock",
  "note": "Discord command center not connected in v1."
}
```

---

## GET /api/misato/obsidian

**Purpose:** Obsidian vault bridge status. **Authenticated.**

```json
{
  "ok": true,
  "connected": false,
  "mode": "mock",
  "note": "Obsidian bridge not connected in v1."
}
```

---

## Middleware Shell-Friendly Aliases

These page routes are rewritten by middleware for JSON clients:

| Path | Rewrite to | Purpose |
|------|-----------|---------|
| `/agents` | `/misato-runtime/agents` | Shell alias for agent list (JSON) |
| `/approvals` | `/misato-runtime/approvals` | Shell alias for approval list (JSON) |
| `/logs` | `/misato-runtime/logs` | Shell alias for log list (JSON) |

**NOTE:** The `misato-runtime/` routes currently lack auth guards. These MUST be added before production use.

---

## Event Types (Full Reference)

| Type | Emitted By | When | Payload |
|------|-----------|------|---------|
| `context_loaded` | runtime | SSE connect | `{ stream: "connected" }` |
| `command.received` | runtime | Command arrives | `{ commandId, command }` |
| `command_received` | runtime | Command arrives | `{ commandId, command, summary }` |
| `command.planned` | orchestrator | Plan generated | `{ commandId, plan[] }` |
| `plan_generated` | orchestrator | Each step | `{ commandId, step, index }` |
| `task.created` | tasks | Task created | `{ taskId, task }` |
| `task.updated` | tasks | Task updated | `{ taskId, task }` |
| `task.deleted` | tasks | Task deleted | `{ taskId }` |
| `task.status_changed` | tasks | Status change | `{ taskId, from, to }` |
| `task.priority_changed` | tasks | Priority change | `{ taskId, from, to }` |
| `approval.created` | approvals | New approval | `{ approvalId, approval }` |
| `approval_requested` | approvals | Approval needed | `{ commandId, approvalId, approval }` |
| `approval.approved` | approvals | Approval granted | `{ approvalId }` |
| `approval.rejected` | approvals | Approval rejected | `{ approvalId }` |
| `approval.deferred` | approvals | Approval deferred | `{ approvalId }` |
| `risk_detected` | approvals | Risk flagged | `{ commandId, command, risks[] }` |
| `agent_assigned` | orchestrator | Agent linked | `{ agentId, taskId }` |
| `log.created` | any | New log entry | `{ message, commandId? }` |
| `status_change` | runtime | State change | `{ runtimeStatus, approvalsPending }` |
| `command.completed` | runtime | Command done | `{ commandId, approvalRequired }` |
