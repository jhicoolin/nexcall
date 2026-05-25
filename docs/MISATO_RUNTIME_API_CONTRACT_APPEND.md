---

## GET /api/misato/missions

**Purpose:** Get all missions (subagent dispatch records). **Authenticated.**

```json
{
  "ok": true,
  "items": [
    {
      "id": "msn-859aa3da-...",
      "title": "Stabilize MISATO runtime for production",
      "description": "Fix SSE auth, filesystem persistence, middleware matcher",
      "project": "NexCall",
      "priority": "High",
      "status": "Pending",
      "assignedAgentId": "agent-backend",
      "assignedAgentName": "Backend Agent",
      "taskIds": ["task-449517ed-...", "task-bf1e21f2-..."],
      "createdBy": "Hermes",
      "createdAt": "2026-05-25T21:02:XX.XXXZ",
      "updatedAt": "2026-05-25T21:02:XX.XXXZ",
      "completedAt": null,
      "handoffNote": "Claude: wire CRUD task UI, SSE feed, approval actions"
    }
  ]
}
```

---

## POST /api/misato/missions/create

**Purpose:** Create a new mission (subagent assignment record). **Authenticated.**

### Request
```json
{
  "title": "Stabilize MISATO runtime for production",
  "description": "Fix SSE auth, filesystem persistence, middleware matcher",
  "project": "NexCall",
  "priority": "High",
  "createdBy": "Hermes",
  "status": "Pending",
  "assignedAgentId": "agent-claude-ui",
  "handoffNote": "Optional initial handoff text"
}
```

### Response
```json
{
  "ok": true,
  "mission": {
    "id": "msn-859aa3da-...",
    "title": "Stabilize MISATO runtime for production",
    "project": "NexCall",
    "taskIds": [],
    "createdBy": "Hermes",
    "createdAt": "...",
    "handoffNote": null
  }
}
```

---

## POST /api/misato/missions/dispatch

**Purpose:** Dispatch a subagent to a mission (creates task + auto-assigns agent). **Authenticated.**

### Request
```json
{
  "agentId": "agent-claude-ui",
  "missionId": "msn-859aa3da-...",
  "taskTitle": "Wire UI controls to working MISATO APIs",
  "project": "NexCall",
  "priority": "High",
  "handoffNote": "Claude: wire CRUD task UI, SSE feed, approval actions"
}
```

### Response
```json
{
  "ok": true,
  "agent": { "agentId": "agent-claude-ui", "name": "Claude UI Agent" },
  "taskId": "task-449517ed-...",
  "missionId": "msn-859aa3da-...",
  "handoffNote": "Claude: wire CRUD task UI, SSE feed, approval actions"
}
```

---

## POST /api/misato/agents/assign

**Purpose:** Assign an agent to an existing task. **Authenticated.**

### Request
```json
{
  "agentId": "agent-strategy",
  "taskId": "t1"
}
```

### Response (success)
```json
{
  "ok": true,
  "agent": { "agentId": "agent-strategy", "name": "Strategy Agent", ... },
  "task": { "id": "t1", "title": "Draft dentist campaign", ... }
}
```

### Response (agent or task not found)
```json
{ "ok": false, "error": "agent_or_task_not_found" }
```