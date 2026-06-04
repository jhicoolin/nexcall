# MISATO Release Checklist — No-Mock Release
**Version:** 1.0  
**Target:** v1.0.0-live-no-mock  
**Owner:** Codex (execution) · Claude (UI sign-off) · Hermes (backend sign-off) · Owner (final approval)

**Current execution note (2026-06-02):** live-data check PASS, browser shell and browser contract PASS, secrets scan PASS with no leaks, Obsidian Mirror remains setup-required because `OBSIDIAN_VAULT_PATH` is unset, and Windows tray / single-instance / autostart runtime behavior is still environment-bound.

**Rule: All items must be checked before shipping. No exceptions. No partial releases.**

---

## Phase 1: Build Verification

```
[ ] npm run lint              — PASS (0 errors, 0 warnings)
[ ] npm run build             — PASS (full Next.js build, no type errors)
[ ] npm run desktop:build     — PASS (Tauri build, MISATO.exe produced)
    Note: Close MISATO.exe before running desktop:build
    Artifact: src-tauri/target/release/bundle/msi/MISATO-x.x.x.exe
[ ] Installer is signed       — Windows SmartScreen shows trusted publisher
[ ] File size reasonable      — Between 80MB and 250MB
```

---

## Phase 2: Surface Truth Verification

Each surface must read from its declared source of truth. No hardcoded data. No mock in production.

```
[ ] Chat          — SSE stream active, messages and events streaming live
[ ] Lanes         — /api/misato/lanes returning items OR agent.branch fallback with honest waiting state
[ ] Schedule      — /api/misato/schedule viewData used for all three tabs (Agenda/Day/Week)
[ ] Approvals     — /api/misato/approvals, approve/reject mutates backend and moves card
[ ] Scans         — /api/misato/secrets shows real gitleaks status, not mock
[ ] Watchtower    — All tiles derived from /api/misato/status, zero hardcoded values
[ ] Event Feed    — Only meaningful runtime events, zero connection noise
[ ] Obsidian      — Mirror syncs from shared ledger OR shows honest setup-required state
[ ] Desktop App   — Launches on Windows without PowerShell
[ ] MCPs          — Only allowlisted Tier 1-3 MCPs enabled
[ ] Memory        — Preferences stored and inspectable, no secrets
```

---

## Phase 3: Regression Verification

All 8 v6.6 regressions must be verified fixed by Codex running the test matrix:

```
[ ] R1 — state.schedule populated on Hermes connect
[ ] R2 — GET /api/misato/schedule fires in loadAllFromHermes
[ ] R3 — GET /api/misato/lanes fires in loadAllFromHermes
[ ] R4 — buildLiveLanes uses state.lanes.items as priority source
[ ] R5 — Approval cards show requestedAgent name (not blank)
[ ] R6 — Kanban cards show agent name and project name (not IDs)
[ ] R7 — context_loaded event absent from Live Feed
[ ] R8 — Watchtower has no hardcoded CORS or stale warning tile
```

---

## Phase 4: Test Matrix Sign-Off

Run `docs/tests/MISATO_TEST_MATRIX.md` in full.

```
[ ] Section 1 (Connection + Auth)      — All PASS or N/A
[ ] Section 2 (Schedule)              — All PASS or BLOCKED (with documented reason)
[ ] Section 3 (Approvals)             — All PASS
[ ] Section 4 (Live Feed)             — All PASS
[ ] Section 5 (Command Center)        — All PASS
[ ] Section 6 (AgentDex)              — All PASS or BLOCKED
[ ] Section 7 (Kanban)                — All PASS
[ ] Section 8 (Lanes)                 — All PASS or BLOCKED
[ ] Section 9 (Watchtower)            — All PASS
[ ] Section 10 (Sentinel)             — All PASS
[ ] Section 11 (Obsidian Mirror)      — All PASS or BLOCKED
[ ] Section 12 (Security)             — ALL PASS — no exceptions
[ ] Section 13 (Mock Banners)         — All PASS
[ ] Section 14 (Error Handling)       — All PASS
[ ] Section 15 (Desktop App)          — All PASS or BLOCKED with documented workaround
[ ] Section 16 (Regression)           — All PASS
```

---

## Phase 5: Security Audit

```
[ ] No raw secrets visible on any screen (browsed all 13 screens)
[ ] Token input fields are type=password (dots, not plaintext)
[ ] No token values in browser console
[ ] Sentinel findings show [REDACTED] (not actual secret values)
[ ] Auth required shown when token not set (non-local mode)
[ ] Risky commands gated by approval (tested with "deploy" command)
[ ] MCP tier 1 only on fresh install
[ ] Token stored in Windows Credential Manager (not config file)
```

---

## Phase 6: Subagent Audit (optional but recommended)

Run each subagent against current state and verify clean reports:

```
[ ] Runtime Auditor    — 0 FAIL findings
[ ] Dashboard Polisher — 0 ISSUE findings, readyForRelease: true
[ ] Approval Guardian  — gateIntegrity: "sound"
[ ] Schedule Reconciler — viewConsistent: true
[ ] Scan Triager       — no CRITICAL_FAIL
```

---

## Phase 7: Performance Check

```
[ ] SSE stream stays open for 30 minutes without drop
[ ] App memory stable over 1 hour (< 200MB)
[ ] All API calls respond < 1s under normal conditions
[ ] Tab switching is instant (< 50ms, no network request)
[ ] Approval decision + card move happens < 500ms
```

---

## Phase 8: Desktop App Verification

```
[ ] MISATO-x.x.x.exe installs without errors on Windows 10
[ ] MISATO-x.x.x.exe installs without errors on Windows 11
[ ] Installer does not require admin rights
[ ] Installer creates desktop shortcut
[ ] App launches without manual terminal or PowerShell
[ ] System tray icon appears on launch
[ ] Close button (X) minimizes to tray (does not exit)
[ ] Right-click tray → Quit exits cleanly
[ ] Window position and size remembered across restarts
[ ] Autostart option toggleable in Settings
[ ] Single instance: second launch focuses existing window
```

---

## Phase 9: Hermes Sign-Off

Hermes must confirm:

```
[ ] All endpoints documented in claude-to-hermes.md are working
[ ] /api/misato/schedule returns viewData with agenda, day, week
[ ] /api/misato/lanes returns items array
[ ] /api/misato/status includes activeModel and runtimeMode fields
[ ] SSE stream does not emit runtime_heartbeat, stream_connected, or context_loaded as data events
[ ] Approval deduplication logic is working (same command = one approval)
[ ] POST /api/misato/approvals/action accepts { approvalId, action } body
[ ] POST /api/misato/secrets/scan-summary endpoint exists and works
[ ] Run ledger (events.jsonl) is being written correctly

Hermes sign-off: _________________ Date: _________
```

---

## Phase 10: Codex Sign-Off

Codex must confirm:

```
[ ] Full test matrix run (Section 16 regression verification complete)
[ ] Desktop build passes and installer tested on Windows
[ ] npm run lint — PASS
[ ] npm run build — PASS
[ ] npm run desktop:build — PASS
[ ] No console errors in DevTools during normal use
[ ] Memory and CPU usage stable in 1-hour test
[ ] Hook TypeScript files in lib/misato/hooks/ compile without errors

Codex sign-off: _________________ Date: _________
```

---

## Phase 11: Claude Sign-Off

Claude UI Agent must confirm:

```
[ ] All 8 diagnosed regressions verified fixed
[ ] UX Copy Deck reviewed — all error states show endpoint + action
[ ] Status Taxonomy applied — all status indicators match taxonomy
[ ] No mystery spinners (every spinner has context text)
[ ] No blank requester names on approval cards
[ ] No mock banners visible when Hermes is connected
[ ] Approval flow is transparent (card → decision → confirmation)
[ ] Dashboard Polisher audit shows readyForRelease: true

Claude sign-off: _________________ Date: _________
```

---

## Phase 12: Owner Final Sign-Off

```
I have personally verified:
[ ] Approvals workflow: risky command → approval card → approve → executes
[ ] Schedule: Day, Week, and Agenda all show live task data (or honest empty state)
[ ] Live Feed: events stream in, no noise, filters work
[ ] Command Center: send command, see response, see progress
[ ] Watchtower: health tiles reflect real Hermes state
[ ] No mock banners visible anywhere when Hermes is connected
[ ] Desktop app launches normally without terminal

I understand:
[ ] This is a no-mock release — all data from Hermes backend
[ ] Hermes must be running for mutations to work
[ ] Run ledger is immutable and cannot be edited
[ ] Risky actions require my explicit approval
[ ] MCP tokens are in Windows Credential Manager

I approve this release for production deployment.

Owner signature: _________________ Date: _________
MISATO version: v1.0.0-live-no-mock
```

---

## Release Blockers

**DO NOT SHIP if any of the following are true:**

- Any Security Audit item is not checked
- Any Regression (R1–R8) verification is not PASS
- Desktop app requires admin or PowerShell to launch
- Secrets are visible in any UI screen
- Approval gate can be bypassed
- Codex sign-off is missing
- Hermes sign-off is missing
- Owner sign-off is missing

---

## Post-Release (24h Monitoring)

After release, monitor for:

```
[ ] Hermes connection stable — no disconnects in first 24h
[ ] SSE stream no drops — 24h continuous
[ ] Run ledger writing correctly — events.jsonl growing
[ ] No crashes — Windows Event Log clean
[ ] No console errors — DevTools clean in production use
[ ] All endpoints responding — < 1s latency
[ ] Approval mutations immediate — card moves < 500ms

If any issue found → document in regression report → create v1.0.1 patch
```
