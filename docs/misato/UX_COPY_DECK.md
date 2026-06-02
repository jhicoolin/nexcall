# MISATO UX Copy Deck
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Claude UI Agent  
**Status:** PRODUCTION — all user-facing strings must come from this document

No ad-hoc copy. No invented error messages. If a string isn't here, add it here first.

---

## Format

Each entry has:
- **State:** the system condition triggering this copy
- **Context:** which screen or component shows it
- **Headline:** the primary text (largest, highest contrast)
- **Body:** supporting detail
- **Action:** button label(s)
- **ARIA:** screen reader text

---

## Approval States

### approval_pending

**State:** An approval card is in the queue. Owner has not acted.

**Context:** Approvals screen (card), Command Center (blocked message), any screen where the originating command is shown.

**Card:**
```
Headline: Awaiting your approval
Subhead:  {actionType} · {riskLevel} risk

Body:
  What: {title}
  Why:  {description}
  Risk: {riskAssessment}
  Who:  {agentName} requested this
  When: {timeAgo}
  ID:   #{approvalId}

Actions: [Approve]  [Reject]  [Defer]
```

**Blocked command message (Command Center):**
```
Headline: ⟳ Waiting for your approval
Body:     Approval #{approvalId} is in the queue. No action will be taken until you decide.
Action:   [Review approval]
```

**ARIA:**
```
aria-label="Approval required. {actionType}. Risk level: {riskLevel}. Requested by {agentName} {timeAgo}. 
Review the approval card and click Approve, Reject, or Defer."
role="alert"
aria-live="assertive"
```

---

### approval_applied

**State:** Owner approved the action. Execution is proceeding.

**Context:** Toast notification, Command Center message, Approvals screen (card moves to Approved tab).

**Toast:**
```
✓ Approval #{approvalId} approved
  Proceeding with {actionType}…
```

**Command Center follow-up:**
```
✓ Approval granted by owner.
  {agentName} is now executing: {taskTitle}
  Progress: {progressBar if available}
```

**Card (in Approved tab):**
```
Approved by owner
Decision: Approved · {decisionAt}
```

**ARIA:**
```
aria-label="Approval {approvalId} approved. {actionType} is now proceeding."
aria-live="polite"
```

---

### approval_rejected

**State:** Owner rejected the action. Execution is blocked permanently.

**Context:** Toast notification, Command Center, Approvals screen.

**Toast:**
```
✗ Approval #{approvalId} rejected
  {actionType} was not executed.
```

**Command Center:**
```
✗ Approval rejected by owner.
  {actionType} was not executed.
  {reason ? 'Reason: ' + reason : ''}
  
  Should I archive this task, or keep it for later?
  [Archive task]  [Keep for later]
```

**Card (in Rejected tab):**
```
Rejected by owner
Decision: Rejected · {decisionAt}
{reason ? 'Reason: ' + reason : ''}
```

**ARIA:**
```
aria-label="Approval {approvalId} rejected. {actionType} was not executed. {reason}"
role="alert"
aria-live="assertive"
```

---

## Scan States

### scan_started

**Context:** Sentinel screen, Scan Now button area.

```
◌ Scanning repository…
  Tool: gitleaks
  Scope: project root
  Started: {timestamp}
  
  [Cancel]
```

**ARIA:**
```
aria-label="Secret scan in progress. Scanning project root with gitleaks."
aria-busy="true"
```

---

### scan_success

**Context:** Sentinel screen after scan completes.

```
✓ Scan complete
  Critical: {critical}  High: {high}  Warnings: {warnings}
  Duration: {durationMs}ms · Scanned: {timestamp}
  
  {critical > 0 ? '⚠ CRITICAL findings require immediate action.' : ''}
  {high > 0 ? 'High-severity findings detected. Review below.' : ''}
  {critical === 0 && high === 0 ? 'No critical or high-severity findings.' : ''}
  
  [View findings]  [Export report]
```

**ARIA:**
```
aria-label="Scan complete. {critical} critical findings. {high} high findings. {warnings} warnings."
```

---

### scan_failed

**Context:** Sentinel screen, toast.

```
✗ Scan failed
  Endpoint: POST /api/misato/secrets/scan-summary
  Error: {errorMessage}
  
  {gitleaksInstalled === false ? 
    'gitleaks is not installed. Install it to enable scanning.' : 
    'The scan process returned an error. Check Hermes logs.'}
  
  [Retry]  {gitleaksInstalled === false ? '[Install gitleaks]' : '[View Hermes logs]'}
```

**Install instructions (when gitleaks not found):**
```
⚙ Setup required: gitleaks not installed

Install on Windows:
  winget install gitleaks
  — or —
  scoop install gitleaks

After installing, click Retry to verify detection.
```

**ARIA:**
```
aria-label="Scan failed. {errorMessage}. Action required."
role="alert"
```

---

## Schedule States

### schedule_stale

**Context:** Schedule screen (Day/Week/Agenda tabs), stale data banner.

```
⚠ Schedule data is stale
  Last synced: {timeAgo}
  Hermes may be offline or sync failed silently.
  
  [Refresh now]  [Check Hermes health]
```

**ARIA:**
```
aria-label="Schedule data is stale. Last synced {timeAgo}. Click Refresh now to get current data."
```

---

### schedule_no_data

**Context:** Schedule screen when Hermes is connected but no scheduledAt data exists.

```
◎ Hermes connected · no scheduled tasks found
  {unscheduledTasks} tasks exist without a scheduledAt date.
  
  Tasks need a scheduled date to appear in Day or Week view.
  Use + New Task to create a scheduled task.
  
  [+ New Task]
```

---

### schedule_loading

**Context:** Schedule screen while fetching from /api/misato/schedule.

```
◌ Loading schedule from Hermes…
```

**ARIA:**
```
aria-label="Loading schedule. Please wait."
aria-busy="true"
```

---

## Auth States

### auth_required

**Context:** Any API call that returns 401, login screen, settings.

```
⚙ Authentication required

MISATO requires an owner token to connect.

Enter your desktop token below:
[________________] (password input)
[Connect]

Token is stored in Windows Credential Manager.
It is never logged or transmitted unencrypted.
```

**ARIA:**
```
aria-label="Authentication required. Enter your MISATO desktop token to connect."
```

---

### auth_invalid

**Context:** After submitting a token that fails.

```
✗ Token rejected
  The token you entered was not accepted.
  
  Check: Is this the correct MISATO_DESKTOP_AUTH_TOKEN?
  
  [Try again]  [Check Hermes config]
```

---

## MCP States

### mcp_unhealthy

**Context:** MCP Catalog screen, tool call failure.

```
⚠ MCP server unhealthy: {mcpName}
  Status: {status}
  Last contact: {timeAgo}
  
  This MCP is currently unavailable. Tool calls will fail.
  
  [Retry connection]  [Disable {mcpName}]  [View logs]
```

**ARIA:**
```
aria-label="MCP server {mcpName} is unhealthy. Tool calls will fail. Review and retry."
role="alert"
```

---

### mcp_not_in_allowlist

**Context:** When a tool call is attempted for an MCP not in the trust policy.

```
✗ Tool not permitted: {toolName}
  MCP: {mcpName}
  
  This MCP is not in the trust policy allowlist.
  
  To enable it: Settings → MCP Catalog → Add {mcpName}
  You will need to review a security assessment before enabling.
  
  [Go to MCP Catalog]
```

---

### mcp_third_party_warning

**Context:** Every time a Tier 4 MCP is used. Shown inline before tool executes.

```
⚠ Third-party MCP: {mcpName}
  This tool is not officially vetted. Proceed only if you trust the source.
  
  What it will do: {toolDescription}
  Arguments: {sanitizedArgs}
  
  [Proceed]  [Cancel]
```

---

## Mirror States

### mirror_sync_failed

**Context:** Obsidian Mirror screen, sync operation error.

```
✗ Obsidian sync failed
  Endpoint: POST /api/misato/obsidian/sync
  Error: {errorMessage}
  
  Check:
  • Vault path is set: OBSIDIAN_VAULT_PATH env var
  • Vault is accessible: {vaultPath}
  • Obsidian is not in safe mode
  
  [Retry sync]  [Verify vault path]  [Check Hermes logs]
```

**ARIA:**
```
aria-label="Obsidian sync failed. {errorMessage}. Action required."
role="alert"
```

---

### mirror_not_configured

**Context:** Obsidian Mirror screen when OBSIDIAN_VAULT_PATH is not set.

```
⚙ Obsidian Mirror not configured

To enable live mirror projection:

1. Find your Obsidian vault path
   (Usually: C:\Users\{user}\Documents\ObsidianVault)

2. Set the environment variable:
   OBSIDIAN_VAULT_PATH=C:\Users\pixel\Documents\ObsidianVault

3. Restart Hermes (npm run dev)

4. Click "Sync Now" to test.

[Open Hermes config]  [View setup docs]
```

---

### mirror_synced

**Context:** Obsidian Mirror screen after successful sync.

```
✓ Mirror synced
  Vault: {vaultPath}
  Files written: {fileCount}
  Last sync: Just now
  Next: {nextSyncTime}
  
  [Open in Obsidian]  [Sync now]
```

---

## Model / Backend States

### local_model_offline

**Context:** Command Center, when AI Gateway cannot reach the local model.

```
⚠ Local model offline
  Model: {activeModel}
  Provider: {modelProvider}
  
  Hermes is falling back to deterministic classification.
  Responses will be pattern-matched, not AI-generated.
  
  To restore: Start {modelProvider} (e.g., ollama serve)
  
  [Check model status]  [Continue with fallback]
```

**Badge on command response (fallback mode):**
```
deterministic fallback
```
CSS class: `.cmd-fallback-note` · color: Amber `#F59E0B`

---

### backend_unavailable

**Context:** Any screen when Hermes cannot be reached.

```
✕ Hermes offline
  Status: No connection to 127.0.0.1:3010
  Last contact: {timeAgo}
  
  Showing last known state (may be stale).
  All mutations are disabled until reconnected.
  
  To reconnect: Start the development server
    npm run dev
  
  [Attempting reconnect…]
```

**ARIA:**
```
aria-label="Hermes backend is offline. Last contact was {timeAgo}. Mutations are disabled. 
Attempting to reconnect automatically."
role="alert"
aria-live="assertive"
```

---

### no_live_data

**Context:** Any screen when Hermes is connected but the specific data has not loaded yet.

```
◎ Hermes connected · no {feature} data yet
  
  This may mean:
  • {feature} endpoint returned empty results
  • No {items} have been created yet
  • Hermes version does not support this endpoint yet
  
  [Create {item}]  [Refresh]  [Check Hermes logs]
```

Examples:
- No tasks: "No tasks have been created yet. Create one with + New Task."
- No approvals: "No pending approvals. All clear."
- No lanes: "No lane data. Agents need a branch or lane field to populate this view."

---

## Error Message Template

**All fetch errors must follow this format. No exceptions.**

```
✗ {operation} failed

Endpoint: {method} {url}
Status:   {statusCode} {statusText}
Error:    {errorMessage}

Suggestion: {recoveryAction}

[{primaryAction}]  [{secondaryAction}]
```

**Examples:**

Agents fetch fail:
```
✗ Failed to load agents

Endpoint: GET /api/misato/agents
Status:   502 Bad Gateway
Error:    Hermes may be restarting

Suggestion: Wait 10 seconds and try again.

[Retry]  [Check Hermes health]
```

Approval action fail:
```
✗ Approval decision failed to save

Endpoint: POST /api/misato/approvals/action
Status:   409 Conflict
Error:    Approval may have been superseded

Suggestion: Reload approvals to see current state.

[Reload approvals]  [View approval #{approvalId}]
```

---

## Empty State Templates

| Screen | Condition | Headline | Body | Action |
|--------|-----------|----------|------|--------|
| Approvals | No pending approvals | ✓ All clear | No pending approvals. Last decision: {timeAgo}. | — |
| Schedule | No scheduled tasks | ◷ No scheduled tasks | Create a task with a date to see it here. | [+ New Task] |
| Agents | No agents loaded | ◌ Loading agents | Connecting to Hermes… | [Retry] |
| Lanes | No lane data | ◎ Waiting for lane data | Agents need a `branch` field to appear here. | [Check docs] |
| Live Feed | No events | ○ No activity yet | Events will appear here as they happen. | — |
| Logs | No logs | ○ No recent logs | Activity will appear here. | [Refresh] |
| Kanban | No tasks | ○ No tasks | Create your first task to get started. | [+ New Task] |

---

## Loading State Templates

All loading states follow this exact pattern:
```
◌ Loading {feature} from Hermes…
```

| Screen | Loading copy |
|--------|-------------|
| Overview | `◌ Loading runtime state from Hermes…` |
| Agents | `◌ Loading agents from Hermes…` |
| Tasks / Kanban | `◌ Loading tasks from Hermes…` |
| Approvals | `◌ Loading approvals from Hermes…` |
| Schedule | `◌ Loading schedule from Hermes…` |
| Lanes | `◌ Loading lanes from Hermes…` |
| Logs | `◌ Loading logs from Hermes…` |
| Watchtower | `◌ Loading health status from Hermes…` |
| Sentinel | `◌ Loading scan status from Hermes…` |
| Obsidian | `◌ Checking Obsidian vault configuration…` |

---

## Regression Explanation Format

When a bug is found and fixed, the user-facing explanation follows this format:

```
Before: {what the user saw}
After:  {what they see now}
What got worse: {any tradeoff or edge case introduced}
Impact: {who was affected and how severely}
Fix in progress: {current status}
```

**Example:**

```
Before: Approval cards showed a blank requester name.
After:  Approval cards show the agent name that requested the action (e.g., "Vercel Deploy Agent").
What got worse: Nothing. Purely additive fix.
Impact: All users who viewed approval cards were missing context for who requested action. Medium severity.
Fix in progress: Committed in 67de581. Verified with seed data shapes.
```
