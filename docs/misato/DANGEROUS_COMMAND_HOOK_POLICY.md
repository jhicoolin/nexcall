# MISATO Dangerous Command Hook Policy
**Version:** 1.1  
**Date:** 2026-06-02 (updated)  
**Owner:** Claude UI Agent (policy) · Codex (TypeScript implementation)  
**Implementation:** `lib/misato/hooks/destructive-tool-guard.ts`

This document defines exactly which commands require approval, which are safe to execute, and which require confirmation. It is the authoritative policy for the approval gate.

---

## Process Watcher Integration

**Dev server:** `npm run dev` on port 3010 (canonical runtime origin)  
**Process stability:** The Hermes runtime must be running before any tool in Category A or B is executed. If the runtime goes down mid-execution, the hook should:
1. Detect the error (ECONNREFUSED on any Hermes endpoint)
2. Block the in-progress operation and write `operation.failed_retrying` to the ledger
3. Wait for the server to recover (exponential backoff, max 3 retries)
4. If server does not recover within the retry window, write `operation.failed_final` and surface an error

**Auto-restart behavior:** The dev server does not auto-restart itself. If pm2 is managing the process (`pm2 status misato-dev`), it will restart on crash. If running directly with `npm run dev`, a crash requires manual restart.

**Hook behavior when Hermes is offline:** `runDestructiveToolGuard()` still creates the approval record in memory (state store), but cannot confirm it was written to the persistent ledger until Hermes reconnects. The approval should be re-queued on reconnect.

---

---

## Three Categories

### Category A — Always Dangerous (L3–L4: Always require explicit approval)

These commands cannot execute under any circumstances without an explicit owner approval decision.  
If triggered without prior approval, `runDestructiveToolGuard()` must block them immediately.

**Deployment and Production:**
- `deploy to production`, `npm run deploy`, `vercel --prod`
- `git push origin main`, `git push origin master`
- `git push --force`, `git push --force-with-lease`
- `tauri build` + release distribution
- `docker push`, `kubectl apply`

**Authentication and Credentials:**
- `rotate secret`, `rotate API key`, `rotate token`
- `change password`, `update credentials`
- `MISATO_DESKTOP_AUTH_TOKEN` update
- Any `process.env.*` write that affects auth

**Data Deletion and Irreversible Operations:**
- `rm -rf`, `del /f /s /q`, `rmdir /s`
- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE TABLE`
- `DELETE FROM` (without WHERE clause)
- `git branch -D`, permanent branch deletion
- `npm unpublish`, package deletion

**Billing and Payments:**
- Any Stripe mutation: `PaymentIntent.create`, `Subscription.delete`, plan changes
- DNS changes: `A record`, `CNAME`, `nameserver` changes
- Domain transfers

**Classification:** L4 (production/auth/billing) or L3 (data deletion)

---

### Category B — Conditionally Dangerous (L2: Require confirmation for non-trivial use)

These commands require approval when targeting production environments, external services, or shared state. They are safe in local/dev context.

**Source Control (non-force push):**
- `git push` to staging or release branch: require confirmation
- `git merge main` into feature: safe (L1)
- `git merge` into main/staging: require confirmation (L2)
- `git rebase`: require confirmation if applied to shared branches

**Package Management:**
- `npm install --save {package}` (new production dependency): require confirmation
- `npm install --save-dev {package}`: safe (L1) — dev dependency, no production impact
- `npm uninstall`: require confirmation
- `npm audit fix --force`: require confirmation

**Configuration Changes:**
- Any `.env` write: require approval (L3 by deny rule)
- Config file edits in `/etc/` or system paths: require approval
- Hermes environment variable update: require confirmation
- Tauri configuration change: require confirmation

**External API Calls:**
- `POST /external-service/...` (non-MISATO): require confirmation if side-effecting
- `PUT /external-service/...`: require confirmation
- `DELETE /external-service/...`: require approval (L3)
- `GET /external-service/...` (read-only): safe (L0)

**Classification:** L2 — external write or configuration change

---

### Category C — Always Safe (L0–L1: No approval needed)

These commands are read-only or local-state-only. Execute immediately.

**Read Operations (L0):**
- `git log`, `git status`, `git diff`, `git show`
- `npm run lint`, `npm run typecheck`
- `ls`, `dir`, `cat`, `grep`, `find` (read-only file operations)
- `GET /api/misato/*` — all MISATO read endpoints
- Status checks, health pings, monitoring queries
- `npm outdated`, `npm audit` (read-only scan)

**Local State Changes (L1):**
- Creating a task (`POST /api/misato/tasks/create`)
- Assigning an agent (`POST /api/misato/assign-agent`)
- Approving or rejecting an approval (user-triggered, not agent-triggered)
- Writing to the run ledger (internal ledger write, not external)
- `npm run build` — build verification only, no deploy
- `npm run test` — test execution, no external side effects
- `git add`, `git commit` (local only, no push)
- Creating or updating files within the project workspace (non-sensitive files)

---

## Command Classification Logic

When `runDestructiveToolGuard()` receives a tool call, it applies this decision tree:

```
1. Is the tool in ALWAYS_DESTRUCTIVE?
   → YES: Block immediately. Create approval. Return { blocked: true }.

2. Is the risk level L2, L3, or L4?
   → YES: Block immediately. Create approval. Return { blocked: true }.

3. Is this a Tier 4 (third-party) MCP tool?
   → YES: Block immediately. Create approval with third_party=true flag.

4. None of the above:
   → Allow. Return { blocked: false }. Write to ledger via ledger-write hook.
```

---

## ALWAYS_DESTRUCTIVE Tool Registry

The following tools are always blocked regardless of risk classification.  
Maintained in `lib/misato/hooks/destructive-tool-guard.ts`:

```typescript
const ALWAYS_DESTRUCTIVE = new Set([
  // Deployment
  "vercel-deploy",
  "git-push",
  "git-force-push",
  "docker-push",
  "tauri-release",
  
  // Authentication / credential rotation
  "rotate-secret",
  "update-env",
  "change-password",
  "update-api-key",
  
  // Data deletion
  "delete-file",         // rm, del equivalents
  "drop-collection",     // MongoDB
  "drop-table",          // SQL
  "clear-cache",         // destructive cache wipe
  "truncate-table",
  "delete-database",
  
  // External communications (side-effecting)
  "send-email",
  "post-to-slack",
  "post-to-discord",
  "send-sms",
  "post-tweet",
  
  // Vault writes
  "vault-write",
  "obsidian-write",
  
  // DNS and infrastructure
  "dns-update",
  "domain-transfer",
  "nameserver-change",
]);
```

To add a new tool: update this Set in `destructive-tool-guard.ts` AND update this document.

---

## Hook Templates

### Pre-execution: destructive-tool-guard

```typescript
// BEFORE executing any tool or external operation:
import { runDestructiveToolGuard } from '@/lib/misato/hooks';

const guard = await runDestructiveToolGuard({
  tool:      "vercel-deploy",         // exact tool name from ALWAYS_DESTRUCTIVE list
  arguments: { project: "nexcall" },  // will be sanitized (secrets redacted)
  riskLevel: "L4",                    // from AI classification or manual assignment
  commandId: "cmd-abc123",            // from command pipeline
  agentId:   "agent-vercel",          // which agent is calling
  mcpTier:   2                        // tier 1-4 from trust policy
});

if (guard.blocked) {
  // STOP. Do not execute the tool.
  // The approval record has been created.
  // Return the approval ID to the caller.
  return {
    blocked:    true,
    approvalId: guard.approvalId,
    reason:     guard.reason
  };
}

// Safe to proceed — tool is below approval threshold
const result = await executeTool(tool, arguments);
```

### Post-execution: ledger-write

```typescript
// AFTER any tool call (success or failure):
import { runLedgerWrite } from '@/lib/misato/hooks';

await runLedgerWrite({
  tool:       "vercel-deploy",
  arguments:  { project: "nexcall" },  // secrets will be redacted
  status:     result.ok ? "success" : "failed",
  result:     result.data,             // will be sanitized
  error:      result.error,
  durationMs: Date.now() - startTime,
  commandId:  "cmd-abc123",
  agentId:    "agent-vercel",
  approvalId: "apr-456",              // the approval that authorized this execution
  mcpId:      "vercel-api"
});
```

### Ambiguous command handling

For commands that are Category B (conditionally dangerous), the command machine classifies them as L2. The user must be shown what the command will do before it executes:

```typescript
// For L2 commands: show confirmation before executing
if (guard.blocked && riskLevel === "L2") {
  // Show in command center:
  appendToChat({
    type:    "system",
    message: `⟳ Awaiting your approval for: ${command}\n` +
             `Risk: ${riskLevel} — ${reason}\n` +
             `Review and approve: [approval #${guard.approvalId}]`,
    approvalId: guard.approvalId
  });
}
```

---

## Audit Trail Requirements

Every tool execution (blocked or allowed) must appear in the run ledger.

**Blocked tool:**
```json
{
  "type": "approval.created",
  "source": "misato.hooks",
  "severity": "warn",
  "payload": {
    "tool": "vercel-deploy",
    "riskLevel": "L4",
    "reason": "Production deployment requires owner approval",
    "sanitizedArgs": { "project": "nexcall", "ref": "main" }
  },
  "approvalId": "apr-456"
}
```

**Allowed tool:**
```json
{
  "type": "mcp_call.completed",
  "source": "misato.hooks",
  "severity": "info",
  "payload": {
    "tool": "git-log",
    "riskLevel": "L0",
    "status": "success",
    "durationMs": 45
  }
}
```

---

## Escalation Protocol

If a dangerous command is attempted and the approval gate does not fire (gate compromised):

1. The Approval Guardian subagent will detect this during the next audit run
2. The Guardian emits `approval.gate_compromised` event with severity "error"
3. The owner is notified via the Watchtower incident card
4. The run ledger records all evidence of the bypass
5. The command is NOT retroactively stopped — it may have already executed
6. Owner must review the run ledger to assess impact

**This is why the gate must never be bypassed.** The only recovery from a gate compromise is manual investigation of the run ledger.
