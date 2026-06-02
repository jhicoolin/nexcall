# MISATO Subagent Prompt Polish
**Version:** 1.1  
**Date:** 2026-06-02 (updated)  
**Owner:** Claude UI Agent  
**Scope:** Concrete examples, evidence requirements, and user-facing language for all 6 specialist subagents

Each section adds "What Good Looks Like" guidance to the subagent's existing prompt.  
Add this content to the subagent's `.md` file in the `## System Prompt` block.

---

## Dev Server Stability Requirements

All subagents that invoke Hermes endpoints require the dev server to be running.

**Current dev server:** `npm run dev` on port 3010  
**Stability requirement:** Server must be running before any subagent that calls `/api/misato/*` is invoked.  
**If server is down:** Checks that require live endpoints return `result: "unverified"` with note: "Hermes not reachable at http://127.0.0.1:3010 — start npm run dev."  
**Process monitoring:** If pm2 is available (`pm2 status`), the dev server process name is `misato-dev`. Subagents can check `pm2 status misato-dev` to confirm server is online before invoking live checks.

---

---

## 1. Runtime Auditor

### What Good Looks Like

**Good output (verified, with evidence):**
```json
{
  "check": "Command → Task Consistency",
  "result": "verified",
  "evidence": "47 command.completed events in ledger. All 47 have corresponding tasks in state.tasks. No orphaned commands.",
  "recommendation": null
}
```

**Bad output (missing evidence):**
```json
{
  "check": "Command → Task Consistency",
  "result": "verified",
  "finding": "Looks consistent"
}
```
Problem: "Looks consistent" is not evidence. Evidence must state the count compared and the outcome.

**Good output (partially_verified, honest about gap):**
```json
{
  "check": "Agent Status Freshness",
  "result": "partially_verified",
  "evidence": "8 of 12 agents have lastActivityAt. 4 agents (agent-finance, agent-marketing, agent-business, agent-research) are missing the field.",
  "recommendation": "Hermes should include lastActivityAt in /api/misato/agents response for all agents, not only recently-active ones."
}
```

**Bad output (using WARN instead of taxonomy):**
```json
{
  "check": "Agent Status Freshness",
  "status": "WARN",
  "finding": "Some agents missing lastActivityAt"
}
```
Problem: Using `status: "WARN"` instead of `result: "partially_verified"`. Using vague "some agents" instead of specific names and count.

### Evidence Requirements

| Check | Minimum evidence required for "verified" |
|-------|------------------------------------------|
| Command → Task Consistency | Count of command.completed events, count of tasks matched, count unmatched |
| Approval Queue Consistency | Count of Pending approvals in state, count of Pending in ledger, any mismatches listed |
| Agent Status Freshness | Count with lastActivityAt, count without, list of agents missing the field |
| Schedule Truth | Count of agenda items, count found in state.tasks, IDs of any mismatches |
| Lane Sync | Count of lanes, count with valid ownerAgentId, count with invalid |
| SSE Event Ledger Completeness | Count of each expected event type in last 100 entries |
| Approval Decision Propagation | Count of approved approvals with linked tasks, count where task is still Blocked |
| Obsidian Sync Currency | lastSync timestamp, age in minutes, configured status |

### User-Facing Language for Blocked/Waiting States

When surfacing findings to the owner via Watchtower or command-center chat:

**For "failed" findings:**
```
⊘ Runtime audit: {check} failed.
  Evidence: {evidence}
  Action: {recommendation}
  Audit ID: {timestamp}
```

**For "unverified" findings:**
```
◎ Runtime audit: {check} was not verified — {reason why}.
  To verify: {exact command}
```

**For all-verified:**
```
✓ Runtime audit: {checksRun} checks verified. No issues found.
  Timestamp: {timestamp}
```

---

## 2. Dashboard Polisher

### What Good Looks Like

**Good output (ISSUE surface, specific):**
```json
{
  "surface": "Schedule Day",
  "status": "ISSUE",
  "source": "MOCK_SCHEDULE (state.schedule is null, Hermes connected)",
  "finding": "Day view is showing MOCK_SCHEDULE data while Hermes is connected. This is a mock-banner-in-production violation.",
  "issues": [
    "desktop-ui/app.js:renderScheduleDay() — isMock flag evaluating to true while hermesState === 'connected'"
  ]
}
```

**Bad output (vague finding):**
```json
{
  "surface": "Schedule Day",
  "status": "ISSUE",
  "finding": "Something looks wrong with the schedule"
}
```
Problem: No location, no source identified, no evidence of what's wrong.

**Good output (verified, with source named):**
```json
{
  "surface": "Approvals",
  "status": "LIVE",
  "source": "GET /api/misato/approvals (state.approvals, 27 items)",
  "finding": "Approvals screen reading from live backend. 12 pending, 8 approved, 7 rejected. Filter tabs functional.",
  "issues": []
}
```

**Good check output (evidence required):**
```json
{
  "check": "No Blank Requester Names",
  "result": "partially_verified",
  "evidence": "27 approval cards inspected. 25 show 'Vercel Deploy Agent' or other names. 2 runtime-created approvals show '—' (requestedByAgentId: 'agent-hermes', no requestedByAgentName field in Hermes response).",
  "locations": ["state.approvals[14].agentName === '—'", "state.approvals[23].agentName === '—'"]
}
```

### Evidence Requirements

| Check | Minimum evidence for "verified" |
|-------|--------------------------------|
| No Mystery Spinners | List of screens checked, count of spinners, each spinner's adjacent label text |
| No Blank Requester Names | Count of cards checked, count with names, count showing "—", IDs of those showing "—" |
| No Dead Tabs | List of tabs checked, what each shows (content/empty state/spinner) |
| No Stale Badges | Time of last fetch vs badge state, threshold applied |
| No Mock in Production | hermesState value, whether any .mock-banner elements visible |
| No Hidden Approval Flows | Whether any risky commands were run during audit, approval cards observed |
| No Unclear Ownership | Count of approval cards, count with all 3 required fields, count missing any |
| No Ambiguous Errors | Whether any error states were triggered, copy of error messages seen |

### User-Facing Language for Blocked/Waiting States

When returning findings to command center or Watchtower:

**Blocking issue found:**
```
⊘ Dashboard audit: {N} surface(s) have issues blocking release.
  Critical: {issue summary}
  Location: {file:function if known}
  Fix: {specific change required}
```

**All surfaces verified:**
```
✓ Dashboard audit: {surfacesChecked} surfaces checked. All reading from live sources.
  Hermes connected: {true|false}
  Ready for release: yes
```

---

## 3. Approval Guardian

### What Good Looks Like

**Good output (gate verified):**
```json
{
  "check": "Gate Integrity",
  "result": "verified",
  "evidence": "3 commands with riskLevel L4 in ledger. All 3 have approval.created events (apr-123, apr-456, apr-789). 0 L2+ commands missing approval gate.",
  "affectedApprovals": []
}
```

**Bad output (assertion without evidence):**
```json
{
  "check": "Gate Integrity",
  "result": "verified",
  "evidence": "Gate seems to be working"
}
```
Problem: "seems to be" is not evidence. Must count commands and approvals and state the match.

**Good output (gate compromised — detailed):**
```json
{
  "check": "Gate Integrity",
  "result": "failed",
  "evidence": "1 command with riskLevel L4 (cmd-xxx, intent: deploy, project: NexCall) has no approval.created event in ledger. Command timestamp: 2026-06-02T14:30:00Z. No approval exists in state.approvals for this commandId.",
  "affectedApprovals": [],
  "gateIntegrity": "compromised"
}
```

**Good approval card entry:**
```json
{
  "id": "apr-456",
  "title": "Deploy NexCall to production",
  "riskLevel": "High",
  "status": "Pending",
  "ageDays": 0.5,
  "completeness": "complete"
}
```

**Bad approval card entry:**
```json
{
  "id": "apr-456",
  "title": "L4 risk: deploy",
  "riskLevel": "High",
  "completeness": "complete"
}
```
Problem: Title says "L4 risk: deploy" — not human-readable. Risk Language check would mark this `partially_verified`.

### Evidence Requirements

| Check | Minimum evidence for "verified" |
|-------|--------------------------------|
| Gate Integrity | Count of L2+ commands, count with approval.created, count without (must be 0 for verified) |
| Card Completeness | Count of approvals, count with all required fields, list of missing fields per card |
| Deduplication | Count of dedupeKeys, any with >1 Pending (must be 0 for verified) |
| Decision Propagation | Count of Approved approvals with linked tasks, count where task still Blocked (must be 0) |
| Queue Hygiene | Age distribution of Pending approvals, count older than 48h |
| Risk Language | Count of cards with human-readable titles, count with technical-only titles |

### User-Facing Language When Gate Is Compromised

When `gateIntegrity === "compromised"`:
```
⊘ APPROVAL GATE ALERT: A risky command bypassed the approval gate.
  Command: {commandId} — {intent} ({project})
  Risk level: {riskLevel}
  Timestamp: {timestamp}
  Action: This command may have executed without owner review. Review the run ledger for follow-up actions.
  Evidence in ledger: command.classified at {timestamp}
```

When queue has stale approvals (>48h):
```
⚠ Approval queue has {count} item(s) older than 48 hours.
  Oldest: {title} — created {timeAgo}
  Action: Approve, reject, or defer these items. Stale approvals block team awareness.
```

---

## 4. Obsidian Scribe

### What Good Looks Like

**Good sync result:**
```json
{
  "ok": true,
  "filesWritten": ["01-OVERVIEW.md", "02-RUN-LEDGER.md", "03-ACTIVE-TASKS.md", "04-APPROVALS.md", "05-SCHEDULE.md", "06-SCAN-RESULTS.md", "07-LANES.md", "08-LEARNING.md"],
  "filesFailed": [],
  "syncNumber": 47,
  "timestamp": "2026-06-02T14:30:00.000Z",
  "errors": [],
  "nextSync": "2026-06-02T14:35:00.000Z"
}
```

**Good vault file header:**
```markdown
---
updated: 2026-06-02T14:30:00Z
source: misato-hermes-v1.0.0
sync: 47
---
```

**Bad vault file (missing header):**
```markdown
# MISATO Overview
Last updated: some time ago
```
Problem: No machine-readable metadata. Cannot determine freshness from the file itself.

**Good redaction:**
```markdown
### Finding: env.example:12
Rule: generic-api-key
Severity: High
Value: [REDACTED]
```

**Bad redaction (secret visible):**
```markdown
### Finding: env.example:12
Rule: generic-api-key
Value: sk_live_abc123def456
```
Problem: Actual secret visible. This is `security_failed`.

### Evidence Requirements

Sync result must always include:
- `filesWritten`: exact list of file names (not count)
- `filesFailed`: exact list of files that failed (empty array if none)
- `errors`: specific error message per failed file
- `syncNumber`: incrementing counter for audit trail
- `timestamp`: ISO 8601 timestamp

### User-Facing Language

**Sync in progress:**
```
⟳ Syncing to Obsidian vault ({syncNumber})… {filesWritten.length}/8 files complete
```

**Sync complete:**
```
✓ Obsidian vault synced · 8 files · sync #{syncNumber} · {timestamp}
  Vault: {vaultPath}
```

**Sync failed:**
```
✗ Obsidian sync failed · {filesFailedCount} file(s) not written
  Error: {errors[0].error}
  Path: {vaultPath}
  Action: Check vault accessibility and restart Hermes.
```

**Vault not configured:**
```
⚙ Obsidian Mirror not configured.
  Set OBSIDIAN_VAULT_PATH env var and restart Hermes to enable.
  Example: OBSIDIAN_VAULT_PATH=C:\Users\pixel\Documents\ObsidianVault
```

---

## 5. Schedule Reconciler

### What Good Looks Like

**Good cross-view consistency check:**
```json
{
  "check": "Cross-View Consistency",
  "result": "verified",
  "evidence": "Agenda: 8 tasks (IDs: task-001 through task-008). Day[2026-06-02]: 8 tasks. Week[Monday]: 8 tasks. All 3 views contain identical task ID sets. No mismatches.",
  "details": {
    "agendaIds": ["task-001", "task-002", "..."],
    "dayIds": ["task-001", "task-002", "..."],
    "weekIds": ["task-001", "task-002", "..."],
    "mismatches": []
  }
}
```

**Bad consistency check (missing IDs):**
```json
{
  "check": "Cross-View Consistency",
  "result": "verified",
  "evidence": "All views look consistent"
}
```
Problem: No IDs listed, cannot actually verify. "Look consistent" is subjective.

**Good time accuracy check:**
```json
{
  "check": "Time Accuracy",
  "result": "verified",
  "evidence": "Task task-003 has scheduledAt: '2026-06-02T14:30:00Z'. Agenda shows '2:30 PM'. Day shows task in hour bucket '14'. Week shows task on 'Monday'. All correct per UTC+0 timezone.",
  "details": {}
}
```

**Good unverified (no test data):**
```json
{
  "check": "Time Accuracy",
  "result": "unverified",
  "evidence": "0 tasks with scheduledAt exist in current state. Cannot verify time rendering without scheduled tasks.",
  "details": {}
}
```

### User-Facing Language

**Schedule inconsistency found:**
```
⊘ Schedule views are inconsistent.
  Agenda shows {N} tasks. Day shows {M} tasks. Week shows {P} tasks.
  Mismatched IDs: {ids}
  Action: Check /api/misato/schedule endpoint — viewData may be out of sync with state.tasks.
```

**All views consistent:**
```
✓ Schedule verified · {count} tasks in all 3 views · source: {dataSource}
```

---

## 6. Scan Triager

### What Good Looks Like

**Good redaction check (verified):**
```json
{
  "check": "Secret Redaction",
  "result": "verified",
  "evidence": "5 findings inspected. Fields checked: secret, value, match, line_content, raw. All 5 show '[REDACTED]' for secret values. No raw secret values visible. File paths visible (expected).",
  "affectedFields": []
}
```

**Good redaction check (security_failed):**
```json
{
  "check": "Secret Redaction",
  "result": "security_failed",
  "evidence": "Finding at src/config/prod.env:45 has field 'value' containing a string of 40+ characters matching token/key pattern. This field should contain '[REDACTED]'. Secret appears to be an API key.",
  "affectedFields": ["findings[3].value"]
}
```
Note: Do NOT include the actual secret value in this output. Name the field and location only.

**Good UI state check (unverified — scenario not triggered):**
```json
{
  "check": "UI State Honesty — Scenario B (scan in progress)",
  "result": "unverified",
  "evidence": "Scenario B (scan in progress) was not triggered during this audit pass.",
  "affectedFields": []
}
```

### Evidence Requirements

| Check | Minimum evidence for "verified" |
|-------|--------------------------------|
| Tool Availability | Value of gitleaksInstalled field, source of the value |
| Scan Availability | Value of scanAvailable, relationship to gitleaksInstalled |
| Severity Count Accuracy | Reported counts vs actual finding count per severity, difference if any |
| Secret Redaction | Count of findings, count inspected, count showing [REDACTED], count showing raw values (must be 0) |
| UI State Honesty | Which scenario was triggered, what the UI showed |
| Ledger Entry | Whether scan.completed event exists, counts it contains |

### User-Facing Language

**Security_failed — immediate action:**
```
⊘ SECURITY ALERT: Secret visible in scan output.
  Location: {field path} (e.g., findings[3].value)
  Action: 1. Rotate the exposed secret immediately. 2. Fix the redaction logic. 3. Re-run scan to verify.
  Do not share this report until the secret is rotated.
```

**Scan clean:**
```
✓ Scan complete · {critical} critical · {high} high · {warnings} warnings
  All findings redacted · Ledger entry: scan.completed at {timestamp}
  {critical > 0 ? 'Action: Rotate critical secrets immediately.' : ''}
```

**gitleaks not installed:**
```
⚙ Secret scanning unavailable · gitleaks not installed.
  Install: winget install gitleaks
  Then: Click Scan Now to verify installation and run first scan.
```
