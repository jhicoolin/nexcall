# MISATO No-Mock Release Acceptance Gates
**Version:** 1.0  
**Date:** 2026-06-02  
**Authority:** Owner final sign-off required to ship

These are pass/fail gates. Not guidelines. Not aspirational targets.  
If any gate fails, the release does not ship.

---

## Gate 1: Chat Streams Real Runtime Events

**Pass condition:** Messages, tool calls, progress, approvals, and failures all stream live from the SSE endpoint.

**Acceptance criteria:**
- Given: Hermes is running and connected
- When: User sends a command in Command Center
- Then: The command appears in the Live Feed within 1 second as a `command.received` event
- AND: The response appears in the chat bubble within 5 seconds
- AND: Any approval gate fires visibly (approval card appears in Approvals screen)
- AND: Completion appears in the live feed as `command.completed` or `command.blocked`

**Fail conditions:**
- SSE stream is polling-only (no EventSource connection established)
- Command events don't appear in the feed
- Response never appears
- Approval gate doesn't surface visibly

---

## Gate 2: Lanes Reflect Live Backend State

**Pass condition:** Lane updates occur without reload and without fallback manifest override.

**Acceptance criteria:**
- Given: Hermes returns data from GET /api/misato/lanes
- When: The Lanes screen loads
- Then: Lane cards appear with data from state.lanes.items (not static AGENT_LANES manifest)
- AND: If Hermes is connected but /lanes returns empty, shows: "◎ Hermes connected · waiting for lane data"
- AND: No mock banner appears when Hermes is connected

**Fail conditions:**
- Static AGENT_LANES manifest shown as if it were live data
- Mock banner visible when Hermes is connected
- Lane status doesn't reflect actual agent status
- Refresh required to see lane updates

---

## Gate 3: Schedule Shows the Same Live Backend Truth

**Pass condition:** Agenda, Day, and Week all show the same real backend truth.

**Acceptance criteria:**
- Given: Hermes returns data from GET /api/misato/schedule with viewData
- When: User switches between Agenda, Day, and Week tabs
- Then: All three tabs show the same set of task IDs
- AND: A task with scheduledAt "T14:00:00Z" appears in: Agenda at "2:00 PM", Day in the 2PM bucket, Week on the correct weekday
- AND: Tab switching causes zero network requests (data already loaded)
- AND: unscheduledTasks count matches tasks without scheduledAt

**Fail conditions:**
- Different task counts between tabs
- Wrong hour bucket in Day view
- Wrong weekday in Week view
- /schedule endpoint not called on load

---

## Gate 4: Approvals Mutate Real Backend State

**Pass condition:** Approve/reject mutates backend and immediately clears stale pending items.

**Acceptance criteria:**
- Given: An approval card is in the Pending tab
- When: User clicks Approve
- Then: POST /api/misato/approvals/action fires with { approvalId, action: 'approve' }
- AND: Card moves to Approved tab within 500ms
- AND: A toast shows "✓ Approved by owner"
- AND: The run ledger contains an `approval.decided` event
- AND: The linked task (if any) moves out of Blocked status

**Fail conditions:**
- Approval card stays in Pending after clicking Approve
- No POST request fires
- Toast doesn't appear
- Ledger has no approval decision event

---

## Gate 5: Scans Show Honest States

**Pass condition:** Loading, success, empty, and failure states are all honest and distinct.

**Acceptance criteria:**
- Given: gitleaks is installed
- When: User clicks Scan Now
- Then: Shows "◌ Scanning…" with spinner immediately
- AND: On completion: shows "✓ Scan complete · {critical} · {high} · {warnings}"
- AND: Finding values show [REDACTED] (not actual secrets)
- AND: scan.completed event appears in run ledger
- Given: gitleaks is not installed
- Then: Shows setup instructions, Scan Now button is disabled

**Fail conditions:**
- Scan button enabled when gitleaks not installed
- Actual secret values visible in findings
- No scan.completed ledger entry
- scan_failed state shows no endpoint URL

---

## Gate 6: Watchtower Has No Hardcoded Tiles

**Pass condition:** No stale or hardcoded tiles remain.

**Acceptance criteria:**
- Given: Hermes is running
- When: Watchtower screen loads
- Then: All tiles (Hermes, SSE, Auth, Queue Depth, Runtime Mode) derive values from live state
- AND: No tile shows a hardcoded string that doesn't reflect current truth
- AND: If a tile's source is unavailable, it shows "?" not a stale value

**Fail conditions:**
- Any tile shows "WARN" or specific value regardless of actual state
- CORS tile with static "Fix pending" text visible
- Tiles show same values after disconnecting Hermes

---

## Gate 7: Event Feed Contains Only Meaningful Activity

**Pass condition:** Connection noise never appears as user-facing activity.

**Acceptance criteria:**
- Given: App is running with active SSE connection
- When: 5 minutes pass with no commands issued
- Then: No heartbeat, stream_connected, stream_reconnect, or context_loaded events in the feed
- AND: When a command is issued, command.received appears in ALL filter
- AND: Each eventId appears at most once (no duplicates)

**Fail conditions:**
- Heartbeat events visible in feed
- context_loaded event visible after connect
- Same event appears twice

---

## Gate 8: Obsidian Mirror Projects Real Ledger

**Pass condition:** Syncs, retries, and content are real (or honestly not configured).

**Acceptance criteria:**
- Given: OBSIDIAN_VAULT_PATH is not set
- Then: Mirror screen shows setup instructions, Sync Now shows "(requires configuration)"
- Given: OBSIDIAN_VAULT_PATH is set and vault is accessible
- When: User clicks Sync Now
- Then: POST /api/misato/obsidian/sync fires
- AND: Mirror screen shows "✓ Synced · {N} items · {timestamp}"
- AND: Vault files contain current runtime truth (not placeholder content)
- AND: mirror.sync.completed appears in run ledger

**Fail conditions:**
- Sync button fires with no backend call
- Mirror shows content that doesn't match current tasks/approvals
- Vault files are stale by > 10 minutes when sync is marked complete

---

## Gate 9: Desktop App Launches Normally

**Pass condition:** Launches on Windows without PowerShell dependency, with installer, tray, single-instance, optional autostart.

**Acceptance criteria:**
- Given: MISATO-x.x.x.exe installer
- When: Run on Windows 10 or 11 without admin rights
- Then: Installs successfully, launches, connects to Hermes
- AND: Tray icon appears
- AND: Closing window minimizes to tray
- AND: Right-click tray → Quit exits cleanly
- AND: No PowerShell window or terminal required at any point
- AND: Opening app again when already running focuses existing window

**Fail conditions:**
- Requires admin to install or run
- Requires PowerShell or terminal
- Multiple instances can be opened
- No tray support

---

## Gate 10: MCPs Enabled Only Through Trust Policy

**Pass condition:** Only trusted servers can be enabled.

**Acceptance criteria:**
- Given: Fresh MISATO install
- Then: Only Tier 1 MCPs (hermes-native, mcp-filesystem, mcp-git) are enabled
- AND: Tier 2 MCPs require explicit Enable + token
- AND: Tier 4 MCPs show security assessment before enabling
- AND: Destructive tools (vercel-deploy, etc.) require approval before execution
- AND: No token values appear in .misato/mcp-config.json

**Fail conditions:**
- Non-Tier-1 MCP enabled without user action
- Token values in config file
- Destructive tool executes without approval gate

---

## Gate 11: Memory and Preferences Are Explicit and Inspectable

**Pass condition:** Preferences persist only through inspected memory paths.

**Acceptance criteria:**
- Given: User states a preference ("always confirm before deleting")
- When: MISATO stores it
- Then: User can see it in Settings → Memory (or equivalent screen)
- AND: User can delete or edit it
- AND: Memory update appears in run ledger as `memory.updated` event
- AND: No secrets or PII are stored in memory

**Fail conditions:**
- Preferences stored with no UI to inspect them
- Secrets appear in memory store
- Memory not in run ledger

---

## Gate 12: Every Fixed Regression Has a Verified Test

**Pass condition:** Each of the 8 v6.6 regressions has a test in the matrix marked PASS by Codex.

**Acceptance criteria:**
For each of R1–R8 in Section 16 of MISATO_TEST_MATRIX.md:
- The test has been run
- The result is PASS (not UNTESTED, not aspirational)
- The tester and date are recorded

**Fail conditions:**
- Any regression test shows UNTESTED
- Any regression test shows FAIL
- Test was not actually run (only marked PASS without verification)

---

## Final Gate: All 12 Must Pass

```
Gate 1:  Chat streams real events          [ ] PASS / [ ] FAIL
Gate 2:  Lanes reflect live state          [ ] PASS / [ ] FAIL
Gate 3:  Schedule same truth in all views  [ ] PASS / [ ] FAIL
Gate 4:  Approvals mutate real backend     [ ] PASS / [ ] FAIL
Gate 5:  Scans show honest states          [ ] PASS / [ ] FAIL
Gate 6:  Watchtower no hardcoded tiles     [ ] PASS / [ ] FAIL
Gate 7:  Feed has only meaningful events   [ ] PASS / [ ] FAIL
Gate 8:  Mirror projects real ledger       [ ] PASS / [ ] FAIL
Gate 9:  Desktop app launches normally     [ ] PASS / [ ] FAIL
Gate 10: MCPs via trust policy only        [ ] PASS / [ ] FAIL
Gate 11: Memory explicit and inspectable   [ ] PASS / [ ] FAIL
Gate 12: Regressions have verified tests   [ ] PASS / [ ] FAIL

All 12 PASS?
[ ] YES → Proceed to release
[ ] NO  → Do not ship. Fix failing gates. Re-verify.

Verified by: _________________ Date: _________
```
