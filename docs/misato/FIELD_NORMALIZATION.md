# MISATO Field Normalization Rules
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Claude UI Agent  
**Implementation:** `desktop-ui/app.js` normalizer functions

These rules govern how raw API responses from Hermes are normalized before rendering.  
Every normalizer function must handle all known backend shape variants.  
New fields from Hermes must be added here before adding UI code that reads them.

---

## Governing Rule

**UI code must never read raw API fields directly.**  
All data passes through a normalizer first.  
If a field is missing in one API variant but present in another, the normalizer handles the fallback.  
The UI sees only the normalized shape.

---

## Agent Normalization

**Function:** `normalizeCouncilAgent(a)`  
**Source:** `GET /api/misato/agents` → `.items[]`

### Known input shape variants

```typescript
// Variant A: Hermes runtime shape
{
  agentId: "agent-xxx",
  name: "Agent Name",
  role: "Role description",
  status: "active",      // lowercase: active | idle | blocked | thinking
  riskTier: "L2",
  permissions: ["Tool1"],
  blockedActions: ["Deploy"],
  lastActivityAt: "2026-06-02T14:00:00Z",
  progress: 75,           // optional, 0–100
  branch: "main",         // optional
  lane: "Lane name",      // optional
  currentTaskId: "task-xxx", // optional
  currentTask: "Task title"  // optional
}

// Variant B: Seed data shape (lib/misato/mock/data.ts councilAgents)
{
  id: "agent-xxx",
  name: "Agent Name",
  role: "Role description",
  abilities: ["Ability 1"],
  blockedActions: ["Deploy"],
  allowedTools: ["Tool1"],
  riskLevel: "Medium",
  permissionLevel: 2,
  approvalRules: ["Needs approval for..."],
  status: "Online"        // capitalized: Online | Idle
}
```

### Normalized output shape

```typescript
type NormalizedAgent = {
  agentId: string;           // canonical ID — always non-null
  id: string;                // alias for compatibility with code expecting .id
  name: string;              // display name — "—" if missing
  role: string;              // role description — "—" if missing
  status: "active" | "idle" | "blocked" | "thinking";  // always lowercase
  state: string;             // alias for status
  riskTier: string;          // "L0"–"L4" — derived from permissionLevel if missing
  permissions: string[];     // allowed tools list
  blockedActions: string[];  // blocked action list
  progress: number | null;   // 0–100 or null if not tracking
  tasksCompleted: number | null;
  tasksPending: number | null;
  lastActivityAt: string | null;
  branch: string | null;
  lane: string | null;
  currentTaskId: string | null;
  currentTask: string | null;
};
```

### Implementation

```javascript
function normalizeCouncilAgent(a) {
  const rawStatus = String(a.status || a.state || "").toLowerCase();
  const status =
    rawStatus === "online"   ? "active"   :
    rawStatus === "idle"     ? "idle"     :
    rawStatus === "active"   ? "active"   :
    rawStatus === "blocked"  ? "blocked"  :
    rawStatus === "thinking" ? "thinking" :
    "idle";

  const permLevel = a.permissionLevel ?? null;
  const riskTier = a.riskTier
    || (permLevel != null ? (permLevel >= 4 ? "L4" : `L${Math.max(0, permLevel - 1)}`) : "L1");

  return {
    agentId:         a.agentId  || a.id  || "",
    id:              a.agentId  || a.id  || "",
    name:            a.name     || "—",
    role:            a.role     || a.specialty || "—",
    status,
    state:           status,
    riskTier,
    permissions:     Array.isArray(a.permissions)    ? a.permissions    :
                     Array.isArray(a.allowedTools)   ? a.allowedTools   : [],
    blockedActions:  Array.isArray(a.blockedActions) ? a.blockedActions : [],
    progress:        typeof a.progress === "number"  ? a.progress       : null,
    tasksCompleted:  typeof a.tasksCompleted === "number" ? a.tasksCompleted : null,
    tasksPending:    typeof a.tasksPending   === "number" ? a.tasksPending   : null,
    lastActivityAt:  a.lastActivityAt || null,
    branch:          a.branch    || null,
    lane:            a.lane      || null,
    currentTaskId:   a.currentTaskId || null,
    currentTask:     a.currentTask   || null,
  };
}
```

---

## Task Normalization

**Function:** `normalizeTask(t)` (inline in task renderers)  
**Source:** `GET /api/misato/tasks` → `.items[]`

### Known input shape variants

```typescript
// Variant A: Hermes runtime shape
{
  id: "task-xxx",
  title: "Task title",
  description: "Task description",
  status: "Doing",              // Idea | Doing | Blocked | Done | Cancelled
  priority: "High",             // Low | Medium | High | Urgent
  project: "NexCall",
  ownerAgentId: "agent-xxx",
  assignedAgentId: "agent-xxx",
  riskLevel: "Low",
  approvalRequired: false,
  linkedApprovalId: "apr-xxx",  // null if not blocked
  scheduledAt: "2026-06-02T14:00:00Z",
  dueAt: "2026-06-03T00:00:00Z",
  createdAt: "ISO",
  updatedAt: "ISO",
  dedupeKey: "dedupe:project:title"
}

// Variant B: Seed data shape (lib/misato/mock/data.ts tasks)
{
  id: "t1",
  projectId: "p1",              // NOT project name
  title: "Draft dentist campaign",
  status: "Doing",
  priority: "High",
  dueDate: "2026-05-25",        // NOT dueAt
  assignedAgentId: "agent-backend",
  riskLevel: "Low",
  approvalRequired: false
  // No: description, scheduledAt, project, ownerAgentId
}
```

### Normalized output shape

```typescript
type NormalizedTask = {
  id: string;
  title: string;
  description: string;
  status: "Idea" | "Doing" | "Blocked" | "Done" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  project: string;           // display name — from .project or .projectId
  projectId: string | null;
  agent: string;             // agent display name — from .agent or derived from agentId
  agentId: string | null;    // canonical agent ID
  ownerAgentId: string | null;
  assignedAgentId: string | null;
  riskLevel: string;
  approvalRequired: boolean;
  linkedApprovalId: string | null;
  scheduledAt: string | null;
  dueAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
```

### Implementation

```javascript
// agentNameFromId() must be called with access to state.agents
function normalizeTask(t, agentList) {
  const agentId = t.ownerAgentId || t.assignedAgentId || t.agentId || null;
  const agentName = t.agent
    || (agentId && agentList ? (agentList.find(a => a.agentId === agentId || a.id === agentId)?.name || null) : null)
    || agentId  // fall back to ID if no name found
    || "—";

  return {
    id:               t.id    || "",
    title:            t.title || "—",
    description:      t.description || "",
    status:           t.status   || "Idea",
    priority:         t.priority || "Medium",
    project:          t.project  || t.projectId || "—",
    projectId:        t.projectId || null,
    agent:            agentName,
    agentId,
    ownerAgentId:     t.ownerAgentId    || null,
    assignedAgentId:  t.assignedAgentId || null,
    riskLevel:        t.riskLevel       || "Low",
    approvalRequired: t.approvalRequired ?? false,
    linkedApprovalId: t.linkedApprovalId || null,
    scheduledAt:      t.scheduledAt     || null,
    dueAt:            t.dueAt || t.dueDate || null,
    createdAt:        t.createdAt || null,
    updatedAt:        t.updatedAt || null,
  };
}
```

---

## Approval Normalization

**Function:** `normalizeApproval(a)`  
**Source:** `GET /api/misato/approvals` → `.items[]`

### Known input shape variants

```typescript
// Variant A: Hermes runtime shape (createApprovalRecord in command-machine.ts)
{
  id: "apr-xxx",
  dedupeKey: "approval:command:intent:risk",
  title: "Approval required: {command}",
  description: "reason string",
  riskLevel: "L4",              // L-notation
  requestedByAgentId: "agent-hermes",
  commandId: "cmd-xxx",
  affects: ["runtime"],
  status: "Pending",            // capitalized
  createdAt: "ISO",
  updatedAt: "ISO",
  actionType: "Protected action",
  safeExecutionMode: "manual",
  doesNotAutoExecuteProduction: true
  // No: requestedByAgentName, decisionAt, decidedBy
}

// Variant B: Seed data shape (lib/misato/mock/data.ts approvals)
{
  id: "ap1",
  project: "NexCall",
  requestedAgent: "Vercel Deploy Agent",  // NOT requestedByAgentName
  actionType: "Production deploy",
  reason: "Release pending owner review", // NOT description
  preview: "Deploy commit abc123...",
  riskLevel: "High",                      // word, not L-notation
  status: "Pending",
  createdAt: "ISO"
  // No: title, description, requestedByAgentId, safeExecutionMode
}
```

### Normalized output shape

```typescript
type NormalizedApproval = {
  id: string;
  title: string;              // human-readable title
  description: string;        // what this approval gates and why
  riskLevel: string;          // "Low" | "Medium" | "High" (normalized from L0-L4 or word)
  status: "pending" | "approved" | "rejected" | "deferred" | "superseded";  // always lowercase
  agentName: string;          // requester display name — "—" minimum
  requestedByAgentId: string | null;
  actionType: string;
  safeExecutionMode: boolean;
  createdAt: string | null;
  decisionAt: string | null;
  decidedBy: string | null;
  linkedCommandId: string | null;
  linkedTaskId: string | null;
};
```

### Implementation

```javascript
function normalizeApproval(a) {
  // Normalize risk level: L4/L3 → "High", L2 → "Medium", L1/L0 → "Low"
  const rawRisk = String(a.riskLevel || "").toUpperCase();
  const riskLevel =
    rawRisk === "L4" || rawRisk === "L3" || rawRisk === "HIGH"   ? "High"   :
    rawRisk === "L2" || rawRisk === "MEDIUM"                      ? "Medium" :
    rawRisk === "L1" || rawRisk === "L0" || rawRisk === "LOW"     ? "Low"    :
    a.riskLevel || "Medium";

  const status = String(a.status || "pending").toLowerCase();

  return {
    id:               a.id || "",
    title:            a.title      || a.actionType || "Approval required",
    description:      a.description || a.reason    || "—",
    riskLevel,
    status:
      status === "pending"    ? "pending"    :
      status === "approved"   ? "approved"   :
      status === "rejected"   ? "rejected"   :
      status === "deferred"   ? "deferred"   :
      status === "superseded" ? "superseded" :
      "pending",
    // Field name varies by source:
    // runtime-created: requestedByAgentId (no name)
    // seed data: requestedAgent
    // Hermes future: requestedByAgentName
    agentName:
      a.requestedByAgentName ||
      a.agentName            ||
      a.agent                ||
      a.requestedAgent       ||
      "—",
    requestedByAgentId: a.requestedByAgentId || null,
    actionType:     a.actionType || "Protected action",
    safeExecutionMode:
      typeof a.safeExecutionMode === "boolean"
        ? a.safeExecutionMode
        : a.safeExecutionMode === "manual" || a.doesNotAutoExecuteProduction === true,
    createdAt:      a.createdAt  || null,
    decisionAt:     a.decisionAt || null,
    decidedBy:      a.decidedBy  || null,
    linkedCommandId: a.linkedCommandId || a.commandId  || null,
    linkedTaskId:    a.linkedTaskId    || a.taskId     || null,
  };
}
```

---

## Schedule Item Normalization

**Function:** `toScheduleItem(t)`  
**Source:** `state.schedule.viewData.agenda[]` or `state.tasks[]` (fallback)

### Implementation

```javascript
function toScheduleItem(t, agentList) {
  const agentId = t.ownerAgentId || t.assignedAgentId || null;
  const agentName =
    t.agent || t.assignee ||
    (agentId && agentList
      ? (agentList.find(a => a.agentId === agentId || a.id === agentId)?.name || null)
      : null) ||
    "—";

  const scheduledAt = t.scheduledAt || null;
  const date = scheduledAt ? new Date(scheduledAt) : null;
  const hour = t.hour != null
    ? String(t.hour)
    : (date ? String(date.getHours()) : null);
  const timeStr = t.time ||
    (date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");

  return {
    id:          t.id || null,
    scheduledAt,
    hourStr:     hour,
    time:        timeStr,
    title:       t.title || t.name || "—",
    agent:       agentName,
    priority:    t.priority || "Medium",
    status:      t.status   || "Scheduled",
    live:        !!(t.liveAt || t.status === "Doing"),
  };
}
```

---

## Watchtower Tile Normalization

**Function:** inline in `renderWatchtower()`  
**Source:** constructed from live state

### Rules

```typescript
type WatchtowerTile = {
  label: string;    // short name (≤ 12 chars)
  value: string;    // primary display value
  sub: string;      // secondary detail
  cls: string;      // "" | "ok" | "warn" | "bad"
};
```

**Derivation rules:**
- `cls: "ok"` ↔ status is healthy/connected
- `cls: "warn"` ↔ status is degraded/stale/partial
- `cls: "bad"` ↔ status is offline/failed/not configured
- `cls: ""` ↔ neutral/unknown

**Forbidden:**
- Hardcoded tile values (no static "WARN" or "OK" strings)
- Tiles that don't derive from live state
- Tiles that show "?" as a permanent state (? is for loading only)

---

## Log Entry Normalization

**Function:** inline in `renderLogs()`  
**Source:** `GET /api/misato/logs` → `.items[]`

```javascript
function normalizeLog(l) {
  return {
    id:        l.id        || "",
    timestamp: l.timestamp || l.createdAt || null,
    type:      l.type      || l.action    || "log.entry",
    source:    l.source    || l.agent     || "misato.runtime",
    severity:  String(l.severity || l.status || "info").toLowerCase(),
    message:   l.message   || l.details   || l.summary || "—",
    payload:   l.payload   || {},
  };
}
```

**Secret sanitization for logs:** Any log entry whose message or payload contains a string matching  
`/(token|secret|password|key|api_key|bearer)\s*[:=]\s*\S{8,}/gi` must have those values replaced  
with `[REDACTED]` before rendering.

---

## Lane Normalization

**Function:** `normalizeLaneItem(lane)` in `buildLiveLanes()`  
**Source:** `GET /api/misato/lanes` → `.items[]`

```javascript
function normalizeLaneItem(lane) {
  const idSuffix = String(lane.id || "").replace(/^lane-/, "");
  const st = String(lane.status || "ready").toLowerCase();

  const statusCls =
    st === "active"   ? "badge-teal"  :
    st === "blocked"  ? "badge-red"   :
    st === "thinking" ? "badge-blue"  :
    "badge-slate";

  const blockers =
    Array.isArray(lane.blockers) && lane.blockers.length
      ? lane.blockers.map(b => typeof b === "string" ? b : (b.title || JSON.stringify(b))).join(", ")
      : typeof lane.blockers === "string"
        ? lane.blockers
        : "None";

  return {
    id:          lane.id       || idSuffix,
    cls:         idSuffix      || "default",
    name:        lane.name     || "—",
    branch:      lane.branch   || "—",
    status:      lane.status   || "ready",
    statusCls,
    currentTask: lane.current  || lane.currentTask || "—",
    lastHandoff: lane.lastHandoff
      || (lane.tasksDone != null ? `${lane.tasksDone}/${lane.tasksTotal || "?"} tasks done` : "—"),
    blockers,
    next:        lane.next     || "—",
    owns:        Array.isArray(lane.owns)
      ? lane.owns
      : [lane.ownerAgentName || lane.ownerAgentId || "—"],
  };
}
```

---

## Adding New Fields

When Hermes adds a new field to any API response:

1. Update the "Known input shape variants" section above
2. Add the field to the normalized output shape
3. Update the normalizer function implementation
4. Update `docs/agent-handoffs/hermes-to-claude.md` with the new field

Do not add UI code that reads a new field without updating this document first.
