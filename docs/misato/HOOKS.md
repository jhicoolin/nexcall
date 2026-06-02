# MISATO Hook Policies
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Claude UI Agent (policy) · Codex (TypeScript implementation)  
**Implementation files:** `lib/misato/hooks/`

Hooks are runtime enforcement points. They are not optional.  
Every critical operation must pass through its relevant hook.  
Do not add inline approval logic or ledger writes outside these hook functions.

---

## Hook Inventory

| Hook | File | Trigger | Blocking? |
|------|------|---------|-----------|
| `destructive-tool-guard` | `hooks/destructive-tool-guard.ts` | Before any tool call | Yes — can block execution |
| `ledger-write` | `hooks/ledger-write.ts` | After any tool call | No — fire and forget |
| `subagent-start` | `hooks/subagent-lifecycle.ts` | When subagent begins work | No |
| `subagent-stop` | `hooks/subagent-lifecycle.ts` | When subagent ends work | No |
| `error-recovery` | `hooks/error-recovery.ts` | When any operation fails | No — returns recovery instructions |

---

## Hook 1: Destructive Tool Guard (Pre-tool Validation)

**File:** `lib/misato/hooks/destructive-tool-guard.ts`  
**Trigger:** Before executing any tool call  
**Blocking:** Yes — returns `{ blocked: true }` to halt execution pending approval

### When it fires

```typescript
// Fire BEFORE calling any MCP tool or executing any tool-like operation
const guard = await runDestructiveToolGuard({
  tool: "vercel-deploy",
  arguments: { project: "nexcall", ref: "main" },
  riskLevel: "L4",
  commandId: "cmd-xxx",
  agentId: "agent-vercel",
  mcpTier: 2
});

if (guard.blocked) {
  // Do not proceed. The approval card has been created.
  return { blocked: true, approvalId: guard.approvalId, reason: guard.reason };
}
// Proceed with tool execution
```

### Decision logic

```
Tool is in ALWAYS_DESTRUCTIVE set?
  OR riskLevel is L2, L3, or L4?
  OR mcpTier === 4 (third-party)?
→ Block. Create approval record. Return { blocked: true }.

Otherwise:
→ Allow. Return { blocked: false }.
```

### What it does when blocking

1. Creates an approval record in `store.approvals`
2. Updates `store.runtime.approvalsPending` count
3. Publishes `approval.created` event to SSE stream
4. Writes `approval.created` entry to run ledger
5. Returns `{ blocked: true, approvalId, reason }`

### ALWAYS_DESTRUCTIVE tool list

The list is maintained in `destructive-tool-guard.ts`. Current entries:
`vercel-deploy`, `git-push`, `git-force-push`, `docker-run`, `rotate-secret`, `update-env`, `change-password`, `delete-file`, `drop-collection`, `drop-table`, `clear-cache`, `send-email`, `post-to-slack`, `vault-write`, `obsidian-write`

To add a new destructive tool: update the `ALWAYS_DESTRUCTIVE` Set in the file and update this document.

---

## Hook 2: Ledger Write (Post-tool Summarization)

**File:** `lib/misato/hooks/ledger-write.ts`  
**Trigger:** After any tool call completes (success or failure)  
**Blocking:** No — fire and forget

### When it fires

```typescript
// Fire AFTER every tool call, regardless of success or failure
await runLedgerWrite({
  tool: "vercel-deploy",
  arguments: { project: "nexcall", ref: "main" },
  status: "success",
  result: { deploymentId: "dpl-abc123", url: "https://nexcall.vercel.app" },
  durationMs: 8000,
  commandId: "cmd-xxx",
  agentId: "agent-vercel",
  approvalId: "apr-xxx",  // if this execution followed an approval
  mcpId: "vercel-api"
});
```

### What it does

1. Redacts any secret values from `result` using `redactSecrets()`
2. Writes `mcp_call.completed` or `mcp_call.failed` to run ledger (events.jsonl)
3. Publishes the same event to SSE stream
4. If the tool affected specific views (agent state, tasks, lanes, etc.), emits `views.refresh_needed`
5. Returns void (fire and forget)

### Secret redaction rules

- Any field with a key matching `/(token|secret|password|key|auth|bearer|credential|private)/i` → value replaced with `[REDACTED]`
- Any string value ≥ 20 chars matching `^[a-zA-Z0-9+/=_\-]{20,}$` (looks like base64 or token) → `[REDACTED]`
- Nested objects are recursively sanitized (up to 8 levels deep)

---

## Hook 3: Subagent Start (Start Annotation)

**File:** `lib/misato/hooks/subagent-lifecycle.ts`  
**Trigger:** When a specialist subagent begins work on a task  
**Blocking:** No

### When it fires

```typescript
// Fire when Codex, Claude, or any specialist subagent is assigned a task
await runSubagentStart({
  agent: "codex",                        // agent identifier
  taskId: "task-xxx",                    // which task
  taskTitle: "Deploy backend migration", // human-readable
  intent: "Execute the scheduled database migration for NexCall",
  commandId: "cmd-xxx"
});
```

### What it does

1. Finds the agent in `store.agents` (by agentId, id, or name)
2. Sets agent status to `"active"`, sets `currentTaskId`, `currentTask`, `startedAt`, `lastActivityAt`, `progress = 0`
3. Saves store
4. Publishes `agent_started` event to SSE stream
5. Writes `agent_started` entry to run ledger

---

## Hook 4: Subagent Stop (Stop Annotation)

**File:** `lib/misato/hooks/subagent-lifecycle.ts`  
**Trigger:** When a specialist subagent completes, fails, or is blocked  
**Blocking:** No

### When it fires

```typescript
// Fire when the subagent finishes (any outcome)
await runSubagentStop({
  agent: "codex",
  taskId: "task-xxx",
  status: "completed",  // "completed" | "failed" | "blocked"
  summary: "Backend migration complete. 7 tables migrated, 0 errors.",
  result: { migratedTables: 7, errors: 0 },
  commandId: "cmd-xxx",
  approvalId: "apr-xxx"  // if blocked by approval gate
});
```

### What it does

1. Sets agent status to `"idle"` (completed) or `"blocked"` (blocked/failed)
2. Clears `currentTaskId`, `currentTask`; updates `lastActivityAt`
3. Updates the linked task status:
   - `completed` → task.status = "Done", task.completedAt, task.completedBy
   - `blocked` → task.status = "Blocked", task.linkedApprovalId = approvalId
   - `failed` → task.status = "Blocked"
4. Saves store
5. Publishes `agent_completed` event to SSE stream
6. Writes `agent_completed` entry to run ledger

---

## Hook 5: Error Recovery

**File:** `lib/misato/hooks/error-recovery.ts`  
**Trigger:** When any operation fails  
**Blocking:** No — returns recovery instructions for the caller to act on

### When it fires

```typescript
// Fire when any fetch, tool call, or operation fails
const recovery = await runErrorRecovery({
  operation: "Load agents",
  endpoint: "GET /api/misato/agents",
  statusCode: 502,
  error: new Error("Bad Gateway"),
  attempt: 1,     // 1-based (1 = first try, 2 = first retry, etc.)
  commandId: "cmd-xxx"
});

if (recovery.shouldRetry) {
  await delay(recovery.retryAfterMs);
  // retry the operation
} else if (recovery.isFinal) {
  showErrorToast(recovery.userMessage);
}
```

### Retry policy

| Attempt | Status codes retried | Delay |
|---------|---------------------|-------|
| 1 → 2 | 408, 429, 500, 502, 503, 504, 0 (network) | 1000ms |
| 2 → 3 | Same | 2000ms |
| 3 (final) | — | Give up. Show error. |

Non-transient errors (400, 401, 403, 404, 422): never retry. Show error immediately.

### What it does

1. Classifies error as transient or final
2. Writes `operation.failed_retrying` or `operation.failed_final` to run ledger
3. Publishes same event to SSE stream
4. Returns `{ shouldRetry, retryAfterMs, isFinal, userMessage, logEntryId }`

The `userMessage` follows the UX Copy Deck error template:
```
✗ {operation} failed
  Endpoint: {endpoint}
  Status: {statusCode}
  Error: {errorMessage}
  Suggestion: {recoveryAction}
```

---

## Hook Enforcement Checklist

Before marking any feature complete, verify:

- [ ] All tool calls in `command-machine.ts` pass through `runDestructiveToolGuard` before execution
- [ ] All tool calls in `command-machine.ts` call `runLedgerWrite` after execution
- [ ] All subagent invocations call `runSubagentStart` at the beginning
- [ ] All subagent completions call `runSubagentStop` at the end
- [ ] All fetch failures in API routes and the command machine call `runErrorRecovery`
- [ ] No inline approval logic exists outside `destructive-tool-guard.ts`
- [ ] No inline ledger writes exist outside `ledger-write.ts`

---

## Adding a New Hook

1. Create the file in `lib/misato/hooks/`
2. Export from `lib/misato/hooks/index.ts`
3. Document it in this file (trigger, parameters, behavior)
4. Update the Hook Inventory table above
5. Notify Hermes via handoff doc
