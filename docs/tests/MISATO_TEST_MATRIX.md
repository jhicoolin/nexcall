# MISATO Test Matrix
**Version:** 1.1 (v6.6 codebase + verification language audit)  
**Date:** 2026-06-02  
**Owner:** Codex (execution) · Claude (spec) · Hermes (backend verification)

**Verified status taxonomy:**
- `loaded` — Surface rendered/booted successfully, but the contract under test was not fully proven
- `verified` — The behavior was exercised and evidence matched the expected contract
- `partially_verified` — Some evidence matched, but at least one required sub-check remains unproven
- `unverified` — Not run, or requires browser/Tauri/manual environment that was unavailable
- `failed` — The check ran and did not satisfy the expected contract
- `SOURCE_VERIFIED` — Code pattern confirmed by source inspection; runtime behavior not observed in this pass
- `BLOCKED` — Cannot test until a dependency is resolved; include what is blocking
- `UNTESTED` — Legacy label kept only for rows that have not been revisited yet; prefer the verified taxonomy above

**⚠️ Do not mark verified without actually running the test.**
**⚠️ Do not use verified for a source-code inspection. Use SOURCE_VERIFIED.**
**⚠️ Do not use verified for a browser check that only loaded the shell. Use loaded.**
**⚠️ Do not use verified for a browser check that was not run. Use unverified.**

### Automated checks (run these before any manual tests)

```bash
# Source contracts + live endpoint contracts (no browser required)
npm run misato:regression
# → Emits JSON with result per check. All must be "verified".

# Full API smoke (requires Hermes running)
npm run misato:smoke
# → Emits JSON with result per check. All must be "verified".

# Shell load check (requires Tauri + Playwright)
npm run misato:browser-shell-check
# → Emits JSON. "loaded" = shell rendered; runtime-origin contract NOT checked here.

# Browser runtime-origin contract (requires Tauri + Hermes + Playwright)
npm run misato:browser-contract-check
# → Emits JSON. "verified" = window.__MISATO_RUNTIME_ORIGIN__ correct + endpoints reachable from browser.
```

---

## Preconditions

Before running any tests:
```
1. npm run dev (backend running on 127.0.0.1:3010)
2. MISATO.exe is running and shows "Connected" status
3. Hermes is connected (top-right indicator shows teal "Hermes v1.x.x-local")
4. No MISATO_REQUIRE_DESKTOP_TOKEN override blocking local auth
5. Default seed data is loaded (12 agents, 5 tasks, 2 approvals from mock/data.ts)
```

---

## 0. Automated Regression + Smoke (run first, no browser required)

| # | Test | Command | Expected output | Status | Notes |
|---|------|---------|-----------------|--------|-------|
| 0.1 | Source contracts | `npm run misato:regression` | `summary.verified === 6`, `summary.failed === 0` | verified | No Hermes required for source checks |
| 0.2 | Live endpoint contracts | `npm run misato:regression` (with Hermes running) | `summary.verified === 11`, `summary.failed === 0` | verified | Requires `npm run dev` |
| 0.3 | Full smoke | `npm run misato:smoke` | `summary.verified === 13`, `summary.failed === 0`, `humanReadable` starts with "Runtime smoke PASS" | verified | Requires `npm run dev` |
| 0.4 | Shell loaded | `npm run misato:browser-shell-check` | `summary.loaded >= 1`, `summary.failed === 0`, notes say "Shell loaded successfully" | loaded | Requires MISATO.exe + Playwright: `npx playwright install chromium` |
| 0.5 | Browser runtime-origin contract | `npm run misato:browser-contract-check` | `summary.verified >= 2`, `summary.failed === 0`, notes confirm window.__MISATO_RUNTIME_ORIGIN__ | verified | Requires MISATO.exe + Hermes + Playwright |

### 0.A Release automation and packaging checks

These checks expand the automated lane with explicit evidence locations. Where a command emits JSON, use the JSON report as the primary evidence. Where a command is shell-only, use the terminal log plus artifact path.

| # | Test | Command | Expected output | Pass criteria | Evidence location | Status |
|---|------|---------|-----------------|---------------|------------------|--------|
| 0.6 | Lint | `npm run lint` | Exit 0, no ESLint errors | The command exits cleanly with zero reported errors | Terminal log | verified |
| 0.7 | Web build | `npm run build` | Next.js build completes and generates routes manifest | The build exits 0 and produces the expected `.next` output | Terminal log + `.next/routes-manifest.json` | verified |
| 0.8 | Desktop build | `npm run desktop:build` | Tauri build completes and emits the exe + NSIS installer | The build exits 0 and both artifacts exist | Terminal log + `src-tauri/target/release/*` | verified |
| 0.9 | Desktop packaging JSON | `npm run misato:desktop-packaging-check` | Structured JSON with `schemaVersion`, `checks`, `summary`, `ok` | `ok === true`, `failed === 0`, known environment-bound items are `unverified` | JSON stdout | verified |
| 0.10 | Desktop acceptance JSON | `npm run misato:desktop-acceptance` | Structured JSON with structural proof plus explicit interactive gaps | `ok === true` and tray/single-instance/autostart remain honest about host-bound gaps | JSON stdout | verified |
| 0.11 | Security scan placeholder | `gitleaks detect --source . --redact --report-format json --report-path .security/gitleaks-report.redacted.json` | Redacted JSON report | If gitleaks is installed, the scan exits 0 and writes a redacted report | `.security/gitleaks-report.redacted.json` | BLOCKED |

---

## 1. Connection and Auth

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 1.1 | Hermes connects on launch | Launch MISATO.exe with Hermes running | "Connected" teal badge appears within 3s | UNVERIFIED (browser-required) | Requires MISATO.exe; verify via `npm run misato:browser-contract-check` |
| 1.2 | Shows offline when Hermes stopped | Stop npm run dev, wait 10s | "✕ Offline" badge, all mutations disabled | UNVERIFIED (browser-required) | |
| 1.3 | Reconnects after Hermes restarts | Stop then start npm run dev | App reconnects, data refreshes, no manual action | UNVERIFIED (browser-required) | |
| 1.4 | Auth token accepted | Set MISATO_DESKTOP_AUTH_TOKEN, use token in app | Connected, no 401 errors | UNVERIFIED (browser-required) | Can also verify via: `curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:3010/api/misato/status` |
| 1.5 | Auth token rejected shows clear error | Use wrong token | "✗ Token rejected. Check MISATO_DESKTOP_AUTH_TOKEN." | UNVERIFIED (browser-required) | |
| 1.6 | Local solo mode bypasses token | Local request with MISATO_LOCAL_SOLO_MODE=true | No auth prompt, connected | UNVERIFIED (browser-required) | |

---

## 2. Schedule

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 2.1 | Agenda tab renders | Click Schedule → Agenda | Shows task list with times or honest empty state | UNTESTED | |
| 2.2 | Day tab renders | Click Schedule → Day | Shows hourly grid 6a–10p | UNTESTED | |
| 2.3 | Week tab renders | Click Schedule → Week | Shows 7-column Sun–Sat grid | UNTESTED | |
| 2.4 | Active tab has visual indicator | Switch tabs | Active tab has teal/violet border or highlight | UNTESTED | |
| 2.5 | Day tab shows task in correct hour | Create task with scheduledAt "2026-06-02T14:00:00Z" | Task in 2PM bucket in Day view | UNTESTED | Requires live task creation |
| 2.6 | Week tab shows task on correct day | Same task as 2.5 | Task on correct weekday column | UNTESTED | |
| 2.7 | Agenda tab shows same count as Day | Same dataset | Agenda item count === Day tab total items | UNTESTED | |
| 2.8 | Tab switching is instant | Click Day → Week → Agenda | No network request on switch, < 50ms | UNTESTED | |
| 2.9 | No scheduled tasks shows honest state | Hermes connected, no scheduledAt on any task | "◎ Hermes connected · no scheduled tasks found" (not mock banner) | UNTESTED | |
| 2.10 | + New Task button opens modal | Click + New Task | Task creation modal opens | UNTESTED | |
| 2.11 | Uses /schedule endpoint when available | Hermes returns viewData | All tabs use viewData, not task fallback | UNTESTED | Verify via network tab |
| 2.12 | Falls back gracefully when /schedule fails | Mock 404 on /schedule | Falls back to tasks with scheduledAt, shows "syncing from tasks" | UNTESTED | |

---

## 3. Approvals

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 3.1 | Pending tab shows only pending | Open Approvals → Pending | Only status=pending cards shown | UNTESTED | |
| 3.2 | Approved tab shows only approved | Click Approved | Only approved cards | UNTESTED | |
| 3.3 | Rejected tab shows only rejected | Click Rejected | Only rejected cards | UNTESTED | |
| 3.4 | Deferred tab shows only deferred | Click Deferred | Only deferred cards | UNTESTED | |
| 3.5 | All tab shows all | Click All | All cards across all statuses | UNTESTED | |
| 3.6 | Approve button works | Click Approve on pending card | Card moves to Approved tab, toast shows "✓ Approved" | UNTESTED | |
| 3.7 | Reject button works | Click Reject on pending card | Card moves to Rejected tab | UNTESTED | |
| 3.8 | Defer button works | Click Defer on pending card | Card moves to Deferred tab | UNTESTED | |
| 3.9 | Approval sends correct body | Click Approve, check network | POST /api/misato/approvals/action { approvalId, action: 'approve' } | UNTESTED | Use DevTools Network |
| 3.10 | No duplicate cards | Send same risky command twice | Only one approval card in queue | UNTESTED | |
| 3.11 | Requester name shows | View any approval card | Shows agent name (e.g., "Vercel Deploy Agent"), never blank | UNTESTED | |
| 3.12 | Risk level shows | View approval card | riskLevel badge visible (High/Medium/Low) | UNTESTED | |
| 3.13 | Title is human-readable | View dynamically created approval | Title describes actual action, not "L4 risk" | UNTESTED | |
| 3.14 | Approval from risky command | Send "deploy to production" command | Approval card appears, command blocked | UNTESTED | |
| 3.15 | Non-risky command no approval | Send "create a task" command | No approval card created, task created directly | UNTESTED | |

---

## 4. Live Feed

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 4.1 | SSE connects on load | Open Feed screen | "SSE LIVE" badge, events stream in | UNTESTED | |
| 4.2 | Heartbeat not in feed | Wait 15s | No "heartbeat" event visible in feed | UNTESTED | Named SSE events never reach onmessage |
| 4.3 | stream_connected not in feed | Reconnect SSE | No "stream connected" event appears | UNTESTED | |
| 4.4 | context_loaded not in feed | Open app fresh | No "context_loaded" event in feed | UNTESTED | Fixed in v6.6 |
| 4.5 | Command event appears | Send any command | command.received event visible in ALL filter | UNTESTED | |
| 4.6 | Task event appears | Create a task | task.created event visible in TASKS filter | UNTESTED | |
| 4.7 | Approval event appears | Risky command → approval created | approval.created visible in APPV filter | UNTESTED | |
| 4.8 | ALERTS filter shows only alerts | Click ALERTS | Only severity=warn/error events | UNTESTED | |
| 4.9 | AGENTS filter | Click AGENTS | Only agent_assigned, agent_completed, status_change | UNTESTED | |
| 4.10 | CMDS filter | Click CMDS | Only command_* events | UNTESTED | |
| 4.11 | TASKS filter | Click TASKS | Only task_* events | UNTESTED | |
| 4.12 | APPV filter | Click APPV | Only approval_* events | UNTESTED | |
| 4.13 | No duplicate events | Same eventId never shown twice | Deduplication by eventId works | UNTESTED | |
| 4.14 | Pause/Follow works | Click Pause, then Follow | Pauses scroll, then resumes to latest | UNTESTED | |
| 4.15 | Polling fallback on SSE fail | Kill SSE stream | "● POLLING" badge, still getting events | UNTESTED | |

---

## 5. Command Center

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 5.1 | Send greeting | Type "hi", send | Response in chat, no approval gate | UNTESTED | |
| 5.2 | Send risky command | Type "deploy to production", send | Approval card created, command blocked | UNTESTED | |
| 5.3 | Response text appears | Any command | Response text visible in chat bubble | UNTESTED | |
| 5.4 | Model badge (when AI configured) | Command with AI Gateway | Violet model badge shows below message | UNTESTED | Requires AI_GATEWAY_API_KEY |
| 5.5 | Fallback badge | Command without AI Gateway | Amber "deterministic fallback" badge | UNTESTED | |
| 5.6 | Error shows endpoint | Hermes offline during command | Toast: "✗ POST /api/misato/command — {error}" | UNTESTED | |
| 5.7 | Clear messages works | Click Clear | All chat messages removed | UNTESTED | |
| 5.8 | Spinner while processing | Send command | Loading indicator visible while waiting | UNTESTED | |

---

## 6. AgentDex

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 6.1 | Loads all agents | Open AgentDex | All 12 seed agents visible | UNTESTED | |
| 6.2 | Filter pill counts correct | Count agents by status | (Online) count matches visible active agents | UNTESTED | |
| 6.3 | Filter click works | Click "Online" filter | Shows only online agents | UNTESTED | |
| 6.4 | All filter resets | Click "All" | Shows all agents | UNTESTED | |
| 6.5 | Agent card click opens drawer | Click any agent card | Drawer opens with agent details | UNTESTED | |
| 6.6 | Progress bar renders | Agent has progress field | Bar shows at correct % (0-100) | BLOCKED | Requires Hermes to send progress field |
| 6.7 | lastActivityAt in drawer | Agent has lastActivityAt | "Last active: {timeAgo}" shown in drawer | BLOCKED | Requires Hermes to send field |
| 6.8 | Assign Task button works | Click Assign Task in drawer | Modal opens | UNTESTED | |
| 6.9 | Task creation from modal | Fill modal, click Create | Task created, modal closes | UNTESTED | |
| 6.10 | No mock banner when connected | Hermes connected | No mock banner on AgentDex | UNTESTED | |

---

## 7. Kanban

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 7.1 | Status columns visible | Open Kanban | 4 columns: Idea, Doing, Blocked, Done | UNTESTED | |
| 7.2 | Seed tasks load | Connect Hermes | 5 seed tasks appear in correct columns | UNTESTED | |
| 7.3 | Agent name shows | View task card | Shows "Backend Agent" not "agent-backend" | UNTESTED | Fixed in v6.6 (agent fallback) |
| 7.4 | Project shows | View task card | Shows project name or projectId | UNTESTED | Fixed in v6.6 |
| 7.5 | Blocked badge shows linkedApprovalId | Blocked task with approval | "Blocked — approval pending" on card | UNTESTED | |
| 7.6 | Status cycle on click | Right-click task | Status changes Idea → Doing → Blocked → Done | UNTESTED | |
| 7.7 | Priority cycle | Priority badge click | Priority cycles Low → Medium → High → Urgent | UNTESTED | |
| 7.8 | Delete task | Delete option on card | Task removed, DELETE request sent | UNTESTED | |
| 7.9 | High-risk delete gates approval | Delete approvalRequired=true task | Approval gate before delete | UNTESTED | |

---

## 8. Lanes

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 8.1 | Lane cards load from /lanes | Hermes returns lanes | Cards appear with live status | UNTESTED | |
| 8.2 | Lane shows status badge | View lane card | Shows "Active"/"Blocked"/"Ready" badge | UNTESTED | |
| 8.3 | Fallback state is honest | Hermes connected, /lanes returns empty | "◎ Hermes connected · waiting for lane data" (NOT mock) | UNTESTED | Fixed in v6.6 |
| 8.4 | No mock banner when connected | Hermes connected | No mock banner | UNTESTED | |
| 8.5 | Agent branch fallback | Agents have branch field, no /lanes data | Lane cards built from agent.branch | UNTESTED | BLOCKED if Hermes doesn't send branch |

---

## 9. Watchtower

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 9.1 | Health tiles load | Open Watchtower | Shows 5 tiles: Hermes, SSE, Auth, Queue, Runtime Mode | UNTESTED | |
| 9.2 | No hardcoded CORS tile | Check tiles | No "CORS WARN" tile present | UNTESTED | Fixed in v6.6 |
| 9.3 | Hermes tile accurate | Hermes running | Tile shows "Connected · 127.0.0.1:3010" | UNTESTED | |
| 9.4 | Hermes tile offline | Stop Hermes | Tile shows "Offline · Start npm run dev" | UNTESTED | |
| 9.5 | SSE tile live | Stream active | "Live · {count} events" | UNTESTED | |
| 9.6 | Queue tile shows blockers | Tasks with Blocked status | Shows blocked count in amber | UNTESTED | |
| 9.7 | Runtime Mode tile | View tile | Shows LOCAL/OFFLINE + version | UNTESTED | |
| 9.8 | Refresh button works | Click Refresh | Tiles update | UNTESTED | |

---

## 10. Sentinel (Secret Scanner)

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 10.1 | gitleaks status shows | Open Sentinel | Shows installed: ✓ or ✗ | verified | CLI evidence: `gitleaks version` / `where gitleaks` |
| 10.2 | Scan button disabled when not installed | gitleaks not found | Button disabled, setup instructions visible | unverified | Now that gitleaks is installed, this branch is only testable after uninstalling or hiding PATH; verify with `where gitleaks` returning empty |
| 10.3 | Scan starts on click | Click Scan Now | Spinner + "◌ Scanning…" | UNTESTED | |
| 10.4 | Scan results show | Scan completes | "✓ Scan complete · {critical} critical · {high} high" | UNTESTED | |
| 10.5 | No raw secrets in findings | View findings | All secret values show "[REDACTED]" | UNTESTED | **Security critical** |
| 10.6 | Error shows endpoint | Scan fails | Toast: "✗ POST /api/misato/secrets/scan-summary — {error}" | UNTESTED | |
| 10.7 | Ledger entry after scan | Scan completes | scan.completed event in run ledger | UNTESTED | |

---

## 11. Obsidian Mirror

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 11.1 | Not configured state | OBSIDIAN_VAULT_PATH not set | Shows setup instructions | UNTESTED | |
| 11.2 | Configured state | Vault path set | Shows vault path + last sync time | UNTESTED | |
| 11.3 | Sync Now button works | Click Sync Now | Spinner + "⟳ Syncing…" then "✓ Synced" | UNTESTED | |
| 11.4 | Sync failure shows endpoint | Vault inaccessible | Toast: "✗ POST /api/misato/obsidian/sync — {error}" | UNTESTED | |
| 11.5 | Open in Obsidian disabled when not configured | No vault path | Button grayed out | UNTESTED | |

---

## 12. Security Tests

| # | Test | Steps / Command | Expected | Status | Notes |
|---|------|-----------------|----------|--------|-------|
| 12.1 | No raw secrets in any screen | Browse all screens in MISATO.exe | No API keys, tokens, or passwords visible anywhere | unverified | **Security critical**; no automated check available — must be done visually |
| 12.2 | Token input is password field | SOURCE: grep `type=password` in app.js | `<input type="password"` present for token fields | SOURCE_VERIFIED | Source check: `grep -n 'type=password\|type="password"' desktop-ui/app.js` |
| 12.3 | Token not logged to console | BROWSER: enter token, watch DevTools Network + Console | No token value in console or network payload | unverified | Cannot be automated without browser session — check manually after every token-related change |
| 12.4 | Sentinel findings redacted | API: `curl -X POST http://127.0.0.1:3010/api/misato/secrets/scan-summary` + view findings | All `value` fields show `[REDACTED]` | partially_verified | CLI scan completed with `.security/gitleaks-report.redacted.json` = `[]`; UI/API rendering still needs an explicit browser pass |
| 12.5 | Auth enforced | API: `curl http://127.0.0.1:3010/api/misato/status` without token (in non-local mode) | Returns HTTP 401 | unverified | Only testable when `MISATO_LOCAL_SOLO_MODE=false` and `MISATO_REQUIRE_DESKTOP_TOKEN=true` |
| 12.6 | Production deploy requires approval | API: `npm run misato:smoke` | `command-risky-gate` check: `approvalRequired: true` | SOURCE_VERIFIED | Verified by `npm run misato:regression` (check: command-risky-gate) and `npm run misato:smoke` |

---

## 13. Mock Banner Behavior

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 13.1 | No mock banners when Hermes connected | Connect Hermes | Zero mock banners on any screen | UNTESTED | |
| 13.2 | Mock banner appears when offline | Disconnect Hermes | Amber mock banners appear on relevant screens | UNTESTED | |
| 13.3 | Loading state, not mock, while fetching | Connect Hermes, wait for load | "◌ Loading…" spinner shown during load, no mock | UNTESTED | |
| 13.4 | Waiting state, not mock, after load | Hermes connected, no data | "◎ Hermes connected · waiting for {feature}" | UNTESTED | |

---

## 14. Error Handling

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 14.1 | Fetch error shows endpoint | Kill Hermes during fetch | Toast: "✗ GET /api/misato/agents — {error}" | UNTESTED | |
| 14.2 | Retry logic fires | Transient 502 error | Retries up to 3x with backoff | UNTESTED | |
| 14.3 | 401 shows auth message | Invalid token | "✗ Authentication failed. Re-enter your token." | UNTESTED | |
| 14.4 | 404 shows endpoint | Endpoint removed | "✗ Endpoint not found: GET /api/misato/..." | UNTESTED | |
| 14.5 | Silent failures impossible | Any error | Some user-visible error always appears | UNTESTED | |
| 14.6 | Hermes offline recovery | Hermes stops during active session | "Offline" with endpoint, last contact, and reconnect guidance | UNTESTED | Mirrors `docs/misato/ERROR_RECOVERY_PATTERNS.md` |
| 14.7 | Runtime origin mismatch recovery | Runtime origin points at stale port or wrong base | Explicit mismatch warning and runtime origin shown separately from preview API base | UNTESTED | Mirrors `docs/misato/ERROR_RECOVERY_PATTERNS.md` |
| 14.8 | API fallback honesty | Live endpoint fails but UI can still render stale/setup-required state | Honest fallback state; no mock-success banner | UNTESTED | Mirrors `docs/misato/ERROR_RECOVERY_PATTERNS.md` |
| 14.9 | gitleaks missing recovery | `gitleaks` absent from PATH | Setup instructions shown; scan scripts fail soft | UNTESTED | Mirrors `docs/misato/ERROR_RECOVERY_PATTERNS.md` |
| 14.10 | Obsidian vault missing recovery | `OBSIDIAN_VAULT_PATH` unset | Setup-required state; sync controls disabled | UNTESTED | Mirrors `docs/misato/ERROR_RECOVERY_PATTERNS.md` |

## 15. Desktop App

| # | Test | Steps | Expected | Status | Notes |
|---|------|-------|----------|--------|-------|
| 15.1 | Installer runs | Run MISATO-x.x.x.exe | Installs without errors or admin prompt | BLOCKED | Requires desktop:build |
| 15.2 | Single instance | Open installer twice | Second instance focuses first window | BLOCKED | |
| 15.3 | Tray icon appears | Launch app | Icon in Windows system tray | BLOCKED | |
| 15.4 | Close to tray | Click X | App minimizes to tray, does not exit | BLOCKED | |
| 15.5 | Quit from tray | Right-click tray → Quit | App exits cleanly | BLOCKED | |
| 15.6 | No PowerShell required | Fresh Windows machine | App launches without any PowerShell dependency | BLOCKED | |
| 15.7 | Memory stable over 1 hour | Run for 1 hour | Memory < 200MB, no growth trend | BLOCKED | |

---

## 16. Regression Verification

Regressions fixed in v6.6. Status uses precise verification taxonomy.

**Automated verification (run first):**
```bash
npm run misato:regression
# All 6 source contracts must be verified.
```

| # | Regression | Verification method | Status | Commit | Automated? |
|---|-----------|---------------------|--------|--------|------------|
| R1 | state.schedule missing | Source: `npm run misato:regression` → `schedule-live-truth` | SOURCE_VERIFIED | 67de581 | ✓ `schedule-live-truth` check |
| R2 | /schedule not fetched | API: `npm run misato:smoke` → `endpoint-schedule` verified | SOURCE_VERIFIED | 67de581 | ✓ `misato:smoke` endpoint-schedule |
| R3 | /lanes not fetched | API: `npm run misato:smoke` → `endpoint-lanes` verified | SOURCE_VERIFIED | 67de581 | ✓ `misato:smoke` endpoint-lanes |
| R4 | buildLiveLanes ignores state.lanes | Source: `npm run misato:regression` → `lanes-live-fallback` | SOURCE_VERIFIED | 67de581 | ✓ `lanes-live-fallback` check |
| R5 | Approval requester blank | Source: `npm run misato:regression` → `approval-requester-field-order` | SOURCE_VERIFIED | 67de581 | ✓ `approval-requester-field-order` check |
| R6 | Kanban agent/project blank | Source: grep `t.agent \|\| t.assignedAgentId` in app.js | SOURCE_VERIFIED | 47e956a | Manual source check |
| R7 | context_loaded in feed | Source: `npm run misato:regression` → `sse-no-context-loaded` | SOURCE_VERIFIED | 67de581 | ✓ `sse-no-context-loaded` check |
| R8 | Watchtower CORS tile | Source: `npm run misato:regression` → `no-stale-cors-tile` | SOURCE_VERIFIED | 67de581 | ✓ `no-stale-cors-tile` check |

**Note on SOURCE_VERIFIED:** These regressions are confirmed by source-code inspection and source-contract checks. The runtime behavior (e.g., "the card actually shows the name in the browser") requires UNVERIFIED (browser-required) manual testing with MISATO.exe open. SOURCE_VERIFIED confirms the fix is in the code; it does not confirm the user has seen the behavior in the UI.

---

## 17. Desktop Packaging Automated Checks

| # | Test | Command | Expected output | Pass criteria | Evidence location | Status |
|---|------|---------|-----------------|---------------|------------------|--------|
| 17.1 | Rust compile sanity | `cargo check --manifest-path src-tauri/Cargo.toml` | Clean compile, no Rust errors | Exits 0 | Terminal log | verified |
| 17.2 | Rust formatting sanity | `cargo fmt --check --manifest-path src-tauri/Cargo.toml` | No formatting diff | Exits 0 | Terminal log | verified |
| 17.3 | Tauri release build | `npm run desktop:build` | `misato-desktop.exe` and NSIS installer produced | Exits 0 and artifacts exist | Terminal log + `src-tauri/target/release/*` | verified |
| 17.4 | Packaging verifier | `npm run misato:desktop-packaging-check` | Structured JSON with `schemaVersion`, `checks`, `summary`, `ok` | `ok === true` | JSON stdout | verified |
| 17.5 | Direct verbose Tauri build | `tauri build --verbose` | Verbose build output with release artifacts | Not run directly in this pass; equivalent build path verified via `npm run desktop:build` | Terminal log | unverified |

---

## 18. Security Automated Checks

| # | Test | Command | Expected output | Pass criteria | Evidence location | Status |
|---|------|---------|-----------------|---------------|------------------|--------|
| 18.1 | Gitleaks availability | `gitleaks version` | Version string or install guidance | Tool is installed or documented as blocked | Terminal log | BLOCKED |
| 18.2 | Repo secret scan | `gitleaks detect --source . --redact --report-format json --report-path .security/gitleaks-report.redacted.json` | Redacted JSON report only | Exits 0 and produces redacted output | `.security/gitleaks-report.redacted.json` | BLOCKED |
| 18.3 | Fail-soft gitleaks scripts | `scripts/security/run-gitleaks.ps1` and `.sh` | Clean exit with install guidance when gitleaks missing | Scripts do not print raw secrets or fail hard when tool absent | Terminal log | verified |
| 18.4 | Claude deny rules present | `.claude/settings.json` | Deny rules include env/secret read-write blocks | File exists and denies secret paths / env files | `.claude/settings.json` | verified |
| 18.5 | Token masking validation | Browser / DevTools token entry pass | No token value appears in console or network payloads | Manual browser check confirms redaction | Browser console/network | unverified |

---

## Test Execution Sign-Off

When all tests are run, complete this sign-off before marking the matrix as verified:

```
Tested by: _________________ (Codex | Claude | Owner)
Date: _____________________
Hermes version: ___________
App version: v6.6
Build: npm run build verified / npm run desktop:build verified

Tests run:    ___ / ___
verified:     ___
loaded:       ___
partially_verified: ___
unverified:   ___
failed:       ___
BLOCKED:      ___
UNTESTED:     ___

Ready for release: YES / NO

Blocking failures (if NO):
1. ___
2. ___
```
