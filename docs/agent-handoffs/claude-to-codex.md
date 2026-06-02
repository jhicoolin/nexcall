# Claude → Codex QA Handoff
**Date:** 2026-06-02  
**Branch:** misato-hermes-live-brain  
**Author:** Claude UI Agent (Sonnet 4.6)  
**Version:** v6.6 + blueprint complete

---

## What Codex Needs to Verify

### Build verification (run in this exact order)

```bash
# 1. Lint — must be clean
npm run lint

# 2. Next.js build
npm run build

# 3. Desktop build — CLOSE MISATO.exe FIRST or this will fail
npm run desktop:build

# Artifact: src-tauri/target/release/bundle/msi/MISATO-x.x.x.exe
```

Expected: all three PASS, zero errors, zero warnings.

---

## What Changed Since Last Codex Handoff

### Bug Fixes (this session)

| Bug | File | Fix | Severity |
|-----|------|-----|----------|
| Approval cards always showed "Low Risk" | app.js | `a.risk` → `a.riskLevel \|\| a.risk` | HIGH |
| Safe mode badge never appeared | app.js | `a.doesNotAutoExecute` → `!!a.safeExecutionMode` | MEDIUM |
| Approval toast had no ID | app.js | `Approval approved.` → `✓ Approval #${id} approved by owner.` | MEDIUM |
| Scan toast had no severity detail | app.js | `Scan complete.` → counts added | MEDIUM |
| Obsidian sync error missing URL | app.js | Added `e.url` to error toast | LOW |

### New Files (this session)

```
docs/misato/ARCHITECTURE.md       — full system architecture
docs/misato/RUN_LEDGER_SCHEMA.md  — JSONL ledger schema with all event types
docs/audits/MISATO_UI_AUDIT.md    — actual code audit against 9 criteria
lib/misato/hooks/*.ts             — 4 TypeScript hook files
lib/misato/subagents/registry.ts  — 6 specialist subagents added
docs/subagents/*.md               — 6 subagent prompts (Claude format)
docs/tests/MISATO_TEST_MATRIX.md  — 130 tests, all UNTESTED
docs/releases/RELEASE_CHECKLIST.md — 12-phase release checklist
docs/misato/STATUS_TAXONOMY.md    — 13-state taxonomy with CSS/hex/ARIA
docs/misato/SYSTEM_PROMPT.md      — production Claude system prompt
docs/misato/TRUST_POLICY.md       — MCP trust tiers 1-4
docs/misato/FIELD_NORMALIZATION.md — normalizer functions for all shapes
docs/misato/HOOKS.md              — hook policies + integration guide
docs/misato/UX_COPY_DECK.md       — all user-facing copy with ARIA
docs/misato/ACCEPTANCE_GATES.md   — 12 pass/fail gates with Given/When/Then
docs/misato/REGRESSION_FORMAT.md  — regression report format
docs/misato/OWNERSHIP_MATRIX.md   — ownership per feature
```

---

## Full Test Matrix

Run `docs/tests/MISATO_TEST_MATRIX.md` in full.

**CRITICAL:** Every row is currently marked `UNTESTED`. Codex must actually run each test and update the status to `PASS`, `FAIL`, or `BLOCKED`. Do not mark PASS without running the test.

### Quick smoke test (15 min)

```
1. Open MISATO.exe (with Hermes running)
2. Verify "Connected" teal badge appears
3. Send "hi" → response appears in Command Center
4. Send "deploy to production" → approval card appears, command blocked
5. Go to Approvals → click Approve → card moves to Approved tab
6. Go to Schedule → click Day tab → hourly grid shows
7. Go to Live Feed → verify no heartbeat events
8. Go to Watchtower → verify no hardcoded CORS tile
9. Check DevTools console → zero errors
```

### Full test matrix (2 hours, all 130 tests)

See `docs/tests/MISATO_TEST_MATRIX.md` for complete coverage across:
- Section 1: Connection + Auth (6 tests)
- Section 2: Schedule (12 tests)
- Section 3: Approvals (15 tests)
- Section 4: Live Feed (15 tests)
- Section 5: Command Center (8 tests)
- Section 6: AgentDex (10 tests)
- Section 7: Kanban (9 tests)
- Section 8: Lanes (5 tests)
- Section 9: Watchtower (8 tests)
- Section 10: Sentinel (7 tests)
- Section 11: Obsidian Mirror (5 tests)
- Section 12: Security (6 tests)
- Section 13: Mock Banners (4 tests)
- Section 14: Error Handling (5 tests)
- Section 15: Desktop App (7 tests)
- Section 16: Regression Verification (8 tests)

---

## Regression Tests — Must All Pass

These 8 regressions are fixed in v6.6. Codex must verify each one:

| # | Regression | Verification | Expected |
|---|-----------|-------------|---------|
| R1 | state.schedule missing | Check DevTools state — `state.schedule` is object after connect | Non-null |
| R2 | /schedule not fetched | DevTools Network tab on connect | GET /api/misato/schedule fires |
| R3 | /lanes not fetched | DevTools Network tab on connect | GET /api/misato/lanes fires |
| R4 | buildLiveLanes ignores state.lanes | If /lanes returns items, lane cards appear | Live cards shown |
| R5 | Approval requester blank | Open Approvals with seed data | Shows "Vercel Deploy Agent" not blank |
| R6 | Kanban wrong field names | View task cards | Shows agent name, not agentId |
| R7 | context_loaded in feed | Open Live Feed after connect | No context_loaded event |
| R8 | Watchtower CORS tile | Open Watchtower | No CORS tile present |

**Additional regressions from this audit (verify these too):**

| # | Bug | Verification | Expected |
|---|-----|-------------|---------|
| R9 | All approvals showed "Low Risk" | View approval card with High risk seed data | Shows "High Risk" badge in red |
| R10 | Safe mode badge invisible | Create approval with `safeExecutionMode: true` | Badge appears |
| R11 | Approval toast no ID | Approve an approval | Toast includes `#apr-xxx` |
| R12 | Scan toast no detail | Run a scan | Toast shows critical/high/warnings counts |

---

## Mutations to Verify (POST Calls)

| Action | Endpoint | Body | Expected response |
|--------|----------|------|------------------|
| Send command | `POST /api/misato/command` | `{ command }` | `{ ok, responseText, modelUsed, responseSource }` |
| Create task | `POST /api/misato/tasks/create` | `{ title, project, priority, status }` | `{ ok, id, ... }` |
| Update task | `POST /api/misato/tasks/update` | `{ taskId, payload }` | `{ ok }` |
| Delete task | `POST /api/misato/tasks/delete` | `{ taskId }` | `{ ok }` |
| Approve | `POST /api/misato/approvals/action` | `{ approvalId, action: 'approve' }` | `{ ok, status }` |
| Reject | `POST /api/misato/approvals/action` | `{ approvalId, action: 'reject' }` | `{ ok, status }` |
| Defer | `POST /api/misato/approvals/action` | `{ approvalId, action: 'defer' }` | `{ ok, status }` |
| Scan | `POST /api/misato/secrets/scan-summary` | `{}` | `{ ok, critical, high, warnings, findings }` |
| Sync Obsidian | `POST /api/misato/obsidian/sync` | `{}` | `{ ok, filesWritten }` |

---

## Hook TypeScript Files — Verify They Compile

New TypeScript hooks in `lib/misato/hooks/` must compile without errors:

```bash
npx tsc --noEmit  # Should produce zero errors for hook files
```

If Codex integrates hooks into the command machine or API routes, verify:
1. `runDestructiveToolGuard()` blocks tool calls and creates approval records correctly
2. `runLedgerWrite()` writes to events.jsonl after tool execution
3. `runSubagentStart()` and `runSubagentStop()` update agent state correctly
4. `runErrorRecovery()` classifies errors and schedules retries

---

## Desktop App Checklist

Run these AFTER closing MISATO.exe:

```bash
npm run desktop:build
# Produces: src-tauri/target/release/bundle/msi/MISATO-x.x.x.exe
```

Verify the installer:
- [ ] Installs on Windows 10 without admin prompt
- [ ] Installs on Windows 11 without admin prompt
- [ ] App launches (no PowerShell required)
- [ ] Connects to Hermes on launch
- [ ] Tray icon appears
- [ ] Close (X) minimizes to tray
- [ ] Right-click tray → Quit exits
- [ ] Second launch focuses existing window

---

## Security Checklist

These are NOT optional:

- [ ] No API keys, tokens, or passwords visible on any screen
- [ ] Token input field shows dots (type=password)
- [ ] No token values in DevTools console output
- [ ] Sentinel findings show `[REDACTED]` — no actual secret values
- [ ] Risky commands require approval before execution (deploy, auth, delete, billing)

---

## Known Limitations (Expected — Not Blocking)

1. **Schedule tabs empty** until Hermes adds `scheduledAt` to tasks or `/schedule` endpoint returns data
2. **Lanes fallback to static** until Hermes adds `/lanes` endpoint with items
3. **Model badge not shown** until Hermes adds `activeModel` to `/status`
4. **Progress bars not shown** until Hermes adds `progress` to agents
5. **Approval requester shows "—"** for runtime-created approvals until Hermes adds `requestedByAgentName` to `createApprovalRecord()`

These are Hermes blockers — they're documented. Codex should note them as BLOCKED (not FAIL) in the test matrix.

---

## Codex Sign-Off Gate

Before completing this handoff:

```
[ ] npm run lint — PASS
[ ] npm run build — PASS
[ ] npm run desktop:build — PASS
[ ] Full test matrix run (all UNTESTED rows now marked PASS/FAIL/BLOCKED)
[ ] 12 regression tests verified (R1–R12)
[ ] Security checklist completed
[ ] Desktop installer tested on Windows
[ ] Zero console errors in DevTools during normal operation

Codex sign-off: _________________  Date: _________
Blockers found (if any): ________________
```
