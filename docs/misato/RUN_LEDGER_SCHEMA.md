# MISATO Run Ledger Schema
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Hermes (writes) · Claude (reads for display) · Codex (verifies completeness)

The run ledger is the **immutable, append-only record of everything that has happened** in the MISATO runtime.  
Every meaningful action, decision, error, and state change is recorded here.  
Nothing is deleted. Nothing is edited. Only appended.

---

## File Location and Format

```
File:    .misato-runtime/events.jsonl
Format:  JSON Lines — one valid JSON object per line, separated by \n
Encoding: UTF-8
Durability: File-persisted (survives Hermes restarts)
Max size: Not enforced — rotate annually if > 100MB
Backup: Should be included in Obsidian vault sync (02-RUN-LEDGER.md shows last 50 entries)
```

On Vercel (serverless): stored in `globalThis.__misatoRuntimeMemory.events[]` (max 1000 entries in memory).

---

## Base Event Structure

Every ledger entry has exactly this envelope:

```typescript
type LedgerEntry = {
  id:          string;           // "evt-{uuid}" — unique, never reused
  eventId:     string;           // alias for id (backward compat)
  timestamp:   string;           // ISO 8601, e.g. "2026-06-02T14:30:00.000Z"
  type:        string;           // dot-notation event type (see catalog below)
  source:      string;           // "misato.runtime" | "misato.orchestrator" | "misato.tasks" | etc.
  severity:    "info" | "warn" | "error";
  payload:     Record<string, unknown>;  // event-specific fields (see each type)
  // Optional correlation IDs — present only when relevant
  commandId?:  string;           // links to the originating command
  taskId?:     string;           // links to a task
  approvalId?: string;           // links to an approval record
  agentId?:    string;           // links to an agent
};
```

**Invariants:**
- `id` and `eventId` are always equal (dual field for compat)
- `timestamp` is always UTC ISO string
- `payload` never contains raw secret values — redacted to `[REDACTED]`
- Missing optional fields are absent (not null) to keep entries compact

---

## Event Type Catalog

### Command Lifecycle

```jsonc
// Stage 1 — command received at runtime
{
  "type": "command.received",
  "source": "misato.runtime",
  "severity": "info",
  "payload": {
    "command": "deploy to production",   // raw user input (truncated to 200 chars)
    "commandId": "cmd-abc123"
  },
  "commandId": "cmd-abc123"
}

// Stage 2 — intent classified
{
  "type": "command.classified",
  "source": "misato.orchestrator",
  "severity": "info",
  "payload": {
    "intent": "deploy",
    "project": "NexCall",
    "riskLevel": "L4",
    "confidence": 0.95,
    "responseSource": "hermes-ai"        // or "deterministic-fallback"
  },
  "commandId": "cmd-abc123"
}

// Stage 3 — execution plan generated
{
  "type": "plan.generated",
  "source": "misato.orchestrator",
  "severity": "info",
  "payload": {
    "planSteps": ["Classify intent", "Select agents", "Create approval"],
    "intent": "deploy",
    "stepCount": 3
  },
  "commandId": "cmd-abc123"
}

// Stage 4a — agents selected (for routing)
{
  "type": "agents.selected",
  "source": "misato.orchestrator",
  "severity": "info",
  "payload": {
    "agents": [{ "agentId": "agent-vercel", "name": "Vercel Deploy Agent" }],
    "count": 1
  },
  "commandId": "cmd-abc123"
}

// Stage 4b — agents skipped (informational command)
{
  "type": "agents.selected",
  "source": "misato.orchestrator",
  "severity": "info",
  "payload": { "agents": [], "skipped": true, "reason": "Casual chat — no agents needed" },
  "commandId": "cmd-abc123"
}

// Stage 5 — approval gate triggered
{
  "type": "approval.queued",
  "source": "misato.approvals",
  "severity": "warn",
  "payload": {
    "approvalId": "apr-xxx",
    "riskLevel": "L4",
    "reason": "Production deployment requires explicit owner approval"
  },
  "commandId": "cmd-abc123",
  "approvalId": "apr-xxx"
}

// Stage 5b — command blocked waiting for approval
{
  "type": "command.blocked",
  "source": "misato.runtime",
  "severity": "warn",
  "payload": {
    "reason": "Awaiting owner approval",
    "approvalId": "apr-xxx"
  },
  "commandId": "cmd-abc123",
  "approvalId": "apr-xxx"
}

// Stage 6 — task created for the command
{
  "type": "task.created",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "title": "Command: deploy to production",
    "priority": "Urgent",
    "status": "Blocked",
    "assignedAgent": "agent-vercel"
  },
  "commandId": "cmd-abc123",
  "taskId": "task-xxx"
}

// Stage 7 — command completed (not blocked)
{
  "type": "command.completed",
  "source": "misato.runtime",
  "severity": "info",
  "payload": {
    "command": "deploy to production",
    "intent": "deploy",
    "commandStatus": "completed",
    "approvalRequired": false
  },
  "commandId": "cmd-abc123"
}

// Stage 7b — command completed (was blocked, now resumed after approval)
{
  "type": "command.resumed",
  "source": "misato.runtime",
  "severity": "info",
  "payload": {
    "reason": "Approval granted",
    "approvalId": "apr-xxx"
  },
  "commandId": "cmd-abc123",
  "approvalId": "apr-xxx"
}
```

---

### Task Lifecycle

```jsonc
// Task created
{
  "type": "task.created",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "title": "Design approval queue UX",
    "project": "NexCall",
    "priority": "High",
    "status": "Idea",
    "ownerAgentId": "agent-ui"
  },
  "taskId": "task-xxx"
}

// Task updated (status change, priority change, etc.)
{
  "type": "task.updated",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "changes": {
      "status": { "from": "Idea", "to": "Doing" },
      "updatedBy": "owner"
    }
  },
  "taskId": "task-xxx"
}

// Task started (moved to Doing with agent assigned)
{
  "type": "task.started",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "assignedAgent": "agent-ui",
    "status": "Doing"
  },
  "taskId": "task-xxx"
}

// Task completed
{
  "type": "task.completed",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "title": "Design approval queue UX",
    "completedBy": "agent-ui",
    "durationMs": 3600000
  },
  "taskId": "task-xxx"
}

// Task blocked (linked to approval)
{
  "type": "task.blocked",
  "source": "misato.tasks",
  "severity": "warn",
  "payload": {
    "taskId": "task-xxx",
    "blockedBy": "approval",
    "linkedApprovalId": "apr-xxx",
    "reason": "Awaiting owner approval for production deploy"
  },
  "taskId": "task-xxx",
  "approvalId": "apr-xxx"
}

// Task unblocked (after approval granted)
{
  "type": "task.unblocked",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "approvalId": "apr-xxx",
    "newStatus": "Doing"
  },
  "taskId": "task-xxx",
  "approvalId": "apr-xxx"
}

// Task deleted
{
  "type": "task.deleted",
  "source": "misato.tasks",
  "severity": "info",
  "payload": {
    "taskId": "task-xxx",
    "title": "Deleted task title",
    "deletedBy": "owner"
  },
  "taskId": "task-xxx"
}
```

---

### Approval Lifecycle

```jsonc
// Approval created (gate triggered)
{
  "type": "approval.created",
  "source": "misato.approvals",
  "severity": "warn",
  "payload": {
    "approvalId": "apr-xxx",
    "title": "Deploy NexCall to production",
    "riskLevel": "L4",
    "reason": "Production deployment requires explicit owner approval",
    "dedupeKey": "approval:deploy to production:deploy:L4"
  },
  "commandId": "cmd-abc123",
  "approvalId": "apr-xxx"
}

// Approval approved
{
  "type": "approval.approved",
  "source": "misato.approvals",
  "severity": "info",
  "payload": {
    "approvalId": "apr-xxx",
    "decidedBy": "owner",
    "linkedCommandId": "cmd-abc123",
    "linkedTaskId": "task-xxx"
  },
  "commandId": "cmd-abc123",
  "approvalId": "apr-xxx",
  "taskId": "task-xxx"
}

// Approval rejected
{
  "type": "approval.rejected",
  "source": "misato.approvals",
  "severity": "warn",
  "payload": {
    "approvalId": "apr-xxx",
    "decidedBy": "owner",
    "reason": "Timing not right — wait for team sync",
    "linkedCommandId": "cmd-abc123"
  },
  "commandId": "cmd-abc123",
  "approvalId": "apr-xxx"
}

// Approval deferred
{
  "type": "approval.deferred",
  "source": "misato.approvals",
  "severity": "info",
  "payload": {
    "approvalId": "apr-xxx",
    "decidedBy": "owner",
    "deferredUntil": null    // or ISO timestamp if deferred to specific time
  },
  "approvalId": "apr-xxx"
}

// Approval superseded (duplicate command)
{
  "type": "approval.superseded",
  "source": "misato.approvals",
  "severity": "info",
  "payload": {
    "approvalId": "apr-old",
    "supersededBy": "apr-new",
    "reason": "Newer approval created for same intent"
  },
  "approvalId": "apr-old"
}
```

---

### Agent Lifecycle

```jsonc
// Agent assigned to command/task
{
  "type": "agent.assigned",
  "source": "misato.agents",
  "severity": "info",
  "payload": {
    "agentId": "agent-vercel",
    "agentName": "Vercel Deploy Agent",
    "taskId": "task-xxx",
    "commandId": "cmd-abc123"
  },
  "agentId": "agent-vercel",
  "taskId": "task-xxx",
  "commandId": "cmd-abc123"
}

// Subagent started work (from subagent-lifecycle hook)
{
  "type": "agent_started",
  "source": "misato.hooks",
  "severity": "info",
  "payload": {
    "agent": "codex",
    "taskId": "task-xxx",
    "taskTitle": "Deploy backend migration",
    "intent": "Execute scheduled DB migration for NexCall"
  },
  "agentId": "codex",
  "taskId": "task-xxx"
}

// Subagent completed work (from subagent-lifecycle hook)
{
  "type": "agent_completed",
  "source": "misato.hooks",
  "severity": "info",
  "payload": {
    "agent": "codex",
    "taskId": "task-xxx",
    "status": "completed",
    "summary": "Backend migration complete. 7 tables migrated, 0 errors."
  },
  "agentId": "codex",
  "taskId": "task-xxx"
}
```

---

### MCP Tool Operations

```jsonc
// Tool execution allowed (L0/L1)
{
  "type": "tool.allowed",
  "source": "misato.hooks",
  "severity": "info",
  "payload": {
    "tool": "mcp-git",
    "riskLevel": "L0",
    "reason": "Below approval threshold"
  }
}

// Tool execution blocked (L2+) — approval created
{
  "type": "approval.created",
  "source": "misato.hooks",
  "severity": "warn",
  "payload": {
    "approvalId": "apr-xxx",
    "tool": "vercel-deploy",
    "riskLevel": "L4",
    "reason": "Production deployment requires owner approval",
    "sanitizedArgs": { "project": "nexcall", "ref": "main" }
  },
  "approvalId": "apr-xxx"
}

// Tool execution completed
{
  "type": "mcp_call.completed",
  "source": "misato.hooks",
  "severity": "info",
  "payload": {
    "tool": "vercel-deploy",
    "mcp": "vercel-api",
    "arguments": { "project": "nexcall", "ref": "main" },
    "status": "success",
    "result": { "deploymentId": "dpl-abc123", "url": "https://nexcall.vercel.app" },
    "durationMs": 8000,
    "affectedViews": ["tasks", "lanes", "watchtower"]
  },
  "approvalId": "apr-xxx"
}

// Tool execution failed
{
  "type": "mcp_call.failed",
  "source": "misato.hooks",
  "severity": "error",
  "payload": {
    "tool": "vercel-deploy",
    "mcp": "vercel-api",
    "arguments": { "project": "nexcall" },
    "status": "failed",
    "error": "401 Unauthorized — token may have expired",
    "durationMs": 450
  }
}
```

---

### Scan Operations

```jsonc
// Scan started
{
  "type": "scan.started",
  "source": "misato.sentinel",
  "severity": "info",
  "payload": { "scanType": "gitleaks", "scope": "repo-root" }
}

// Scan completed
{
  "type": "scan.completed",
  "source": "misato.sentinel",
  "severity": "info",
  "payload": {
    "scanType": "gitleaks",
    "critical": 0,
    "high": 2,
    "warnings": 5,
    "durationMs": 3000
  }
}

// Scan failed
{
  "type": "scan.failed",
  "source": "misato.sentinel",
  "severity": "error",
  "payload": {
    "scanType": "gitleaks",
    "error": "gitleaks: command not found",
    "suggestion": "Install with: winget install gitleaks"
  }
}
```

---

### Mirror Operations

```jsonc
// Obsidian sync started
{
  "type": "mirror.sync.started",
  "source": "misato.obsidian",
  "severity": "info",
  "payload": {
    "vaultPath": "[REDACTED — vault path omitted from ledger for privacy]",
    "files": ["01-OVERVIEW.md", "02-RUN-LEDGER.md", "03-ACTIVE-TASKS.md"]
  }
}

// Obsidian sync completed
{
  "type": "mirror.sync.completed",
  "source": "misato.obsidian",
  "severity": "info",
  "payload": {
    "filesWritten": 8,
    "durationMs": 450,
    "syncNumber": 47
  }
}

// Obsidian sync failed
{
  "type": "mirror.sync.failed",
  "source": "misato.obsidian",
  "severity": "error",
  "payload": {
    "error": "Vault not accessible. Check OBSIDIAN_VAULT_PATH.",
    "suggestion": "Set correct vault path and restart Hermes"
  }
}
```

---

### System Events

```jsonc
// Hermes connected (SSE stream opened)
{
  "type": "context_loaded",          // NOTE: filtered from UI feed — not shown to user
  "source": "misato.runtime",
  "severity": "info",
  "payload": { "stream": "connected" }
}

// Runtime status change
{
  "type": "status_change",
  "source": "misato.runtime",
  "severity": "info",
  "payload": {
    "runtimeStatus": "connected",
    "approvalsPending": 2,
    "lastCommandAt": "2026-06-02T14:30:00Z"
  }
}

// Error recovery — retrying
{
  "type": "operation.failed_retrying",
  "source": "misato.hooks",
  "severity": "warn",
  "payload": {
    "operation": "Load agents",
    "endpoint": "GET /api/misato/agents",
    "statusCode": 502,
    "errorMessage": "Bad Gateway",
    "attempt": 1,
    "maxRetries": 3,
    "retryAfterMs": 1000
  }
}

// Error recovery — final failure (gave up)
{
  "type": "operation.failed_final",
  "source": "misato.hooks",
  "severity": "error",
  "payload": {
    "operation": "Load agents",
    "endpoint": "GET /api/misato/agents",
    "statusCode": 502,
    "errorMessage": "Bad Gateway",
    "attempt": 3,
    "maxRetries": 3
  }
}

// Log entry (from logEvent in command-machine.ts)
{
  "type": "log.created",
  "source": "misato.runtime",
  "severity": "info",
  "payload": {
    "message": "Command received: deploy to production",
    "commandId": "cmd-abc123"
  }
}

// Memory updated (learned preference)
{
  "type": "memory.updated",
  "source": "misato.memory",
  "severity": "info",
  "payload": {
    "preference": "always confirm before deleting tasks",
    "updatedBy": "owner",
    "scope": "global"
  }
}
```

---

## Querying the Ledger

```javascript
// Read from .misato-runtime/events.jsonl
import { readEventLog } from '@/lib/misato/runtime/store';

const allEvents = readEventLog(200);  // last 200 entries

// Filter patterns:
const commandEvents  = allEvents.filter(e => e.type.startsWith('command.'));
const approvalEvents = allEvents.filter(e => e.type.startsWith('approval.'));
const errorEvents    = allEvents.filter(e => e.severity === 'error');
const taskEvents     = allEvents.filter(e => e.taskId === 'task-xxx');
const forCommand     = allEvents.filter(e => e.commandId === 'cmd-abc123');
const today          = allEvents.filter(e => e.timestamp.startsWith('2026-06-02'));
```

---

## Redaction Rules

Before ANY entry is written to the ledger, apply:

```typescript
function sanitizePayload(input: Record<string, unknown>) {
  const txt = JSON.stringify(input);
  // Redact values at secret-named keys
  return JSON.parse(
    txt.replace(/(token|secret|password|key)"\s*:\s*"[^"]*"/gi, '$1":"[REDACTED]"')
  );
}
```

Additionally: any string value ≥ 20 characters matching `^[a-zA-Z0-9+/=_\-]{20,}$` in a field  
named `token|secret|password|key|auth|bearer|credential` is replaced with `[REDACTED]`.

---

## Event Types NOT Written to Ledger

These fire on the SSE event bus but are NOT persisted to the ledger:
- `heartbeat` — sent as SSE named event, no data value
- `stream.connected` / `stream_connected` — transport-level noise
- `ping` / `pong` — keepalive, no operational value
- `views.refresh_needed` — UI hint, not an operational event

---

## JSONL File Example

```
{"id":"evt-a1b2c3","eventId":"evt-a1b2c3","timestamp":"2026-06-02T09:00:00.000Z","type":"command.received","source":"misato.runtime","severity":"info","payload":{"command":"hi","commandId":"cmd-001"},"commandId":"cmd-001"}
{"id":"evt-d4e5f6","eventId":"evt-d4e5f6","timestamp":"2026-06-02T09:00:00.150Z","type":"command.classified","source":"misato.orchestrator","severity":"info","payload":{"intent":"greeting","project":"MISATO","riskLevel":"L0","confidence":1.0,"responseSource":"deterministic-fallback"},"commandId":"cmd-001"}
{"id":"evt-g7h8i9","eventId":"evt-g7h8i9","timestamp":"2026-06-02T09:00:00.200Z","type":"command.completed","source":"misato.runtime","severity":"info","payload":{"intent":"greeting","commandStatus":"completed","approvalRequired":false},"commandId":"cmd-001"}
```
