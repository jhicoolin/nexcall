# MISATO LIVE v2.0 — Release Completion Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Close the remaining acceptance gaps for MISATO LIVE v2.0 and produce a final release-ready verification set with honest environment-bound exceptions documented.

**Architecture:** Keep the current local-first runtime on `http://127.0.0.1:3010` as the canonical backend, and use the desktop UI at `http://127.0.0.1:1420` as the primary human verification surface. This plan does not introduce new architecture; it hardens the existing release path by verifying runtime truth, cleaning the browser session, and proving the Windows packaging behaviors that remain environment-bound.

**Tech Stack:** Next.js 15, Tauri 2, pm2, Node.js scripts, browser checks, Windows NSIS bundle, gitleaks.

---

## Scope and current truth

The most recent acceptance run already proved:
- `pm2` dev server stability on `misato-dev`
- `npm run misato:live-data-check` PASS against 12 endpoints
- Tauri packaging artifacts exist, including `MISATO_0.1.0_x64-setup.exe`
- Obsidian is honestly configured as `not-configured` when `OBSIDIAN_VAULT_PATH` is absent
- Secret Sentinel shows redacted, non-secret state

What remains for final release confidence:
- a clean browser-console session with no runtime warnings
- explicit proof of the 8-surface UI matrix in the live desktop shell
- Windows-only tray / single-instance / autostart behavior proof
- network/security confirmation that no secret values appear in payloads or console
- a final acceptance bundle that clearly separates verified items from environment-bound items

---

## Task 1: Lock the canonical runtime truth and eliminate warning noise

**Objective:** Ensure the runtime status shown in the UI and the browser console remain aligned with the local-first backend, and reduce false warning noise from health checks.

**Files:**
- Modify: `scripts/misato-dev-server.cjs`
- Modify: `scripts/misato-process-watcher.mjs`
- Modify: `app/api/misato/health` or the equivalent health route that emits the browser warnings, if present
- Modify: any runtime client file that prints `discoverHermes failed` or `health ping failed`

**Step 1: Inspect the warning source**
- Search for the exact warning strings observed in console:
  - `discoverHermes failed`
  - `health ping failed`
  - `Failed to fetch (target: http://127.0.0.1:3010/health)`
- Identify whether the warning comes from client polling, a health hook, or the dev server wrapper.

**Step 2: Fix the warning source without changing the happy path**
- Keep `runtimeOrigin` pinned to `http://127.0.0.1:3010`.
- Keep `runtimeMode: "local"` and `runtimeStatus: "connected"` for local solo mode.
- If a retry loop is required, convert noisy warnings into a single visible status line or debounce them.

**Step 3: Verify the runtime contract**
Run:
```bash
curl -s http://127.0.0.1:3010/api/misato/status
node scripts/misato-process-watcher.mjs
```
Expected:
- status returns JSON with `runtimeMode: "local"`
- process watcher reports the dev stack as verified
- browser console no longer emits repeated health-ping warnings during idle

**Step 4: Commit**
```bash
git add scripts/misato-dev-server.cjs scripts/misato-process-watcher.mjs app/api/misato/health* \
  # plus any client file that produced the warning
git commit -m "fix: reduce runtime health warning noise"
```

---

## Task 2: Re-run the 8-surface UI matrix in the live desktop shell

**Objective:** Verify each major surface against live state, not mock data, and capture evidence for the final report.

**Files:**
- Validate: the live UI pages reachable from `http://127.0.0.1:1420`
- Fix only if a surface still shows mock or stale state:
  - Command Center
  - Live Feed
  - Schedule
  - Approvals
  - Lanes
  - Watchtower
  - Secret Sentinel
  - Obsidian Mirror

**Step 1: Command Center**
- Open the page, send `hi`, and verify the response is rendered in chat.
- Confirm the page shows `Hermes LOCAL SOLO` and not `DISCONNECTED`.

**Expected:**
- response appears
- no approval gate for safe greeting
- live feed logs the command

**Step 2: Live Feed**
- Open the feed and wait briefly.
- Confirm the badge is `LIVE` or `SSE LIVE`.
- Confirm no mock banner is visible.

**Expected:**
- real SSE events, not placeholder entries

**Step 3: Schedule**
- Click `Agenda`, `Day`, and `Week`.
- Verify they render honest live data or honest empty state.

**Expected:**
- same backend truth across all three views
- no mock data or stale manifest fallback

**Step 4: Approvals**
- Approve one pending card.
- Confirm the count changes immediately and the item moves to `Approved`.

**Expected:**
- state mutation is live and visible

**Step 5: Lanes**
- Open `Lanes`.
- Verify cards show live status and current lane ownership.

**Expected:**
- no fallback manifest masquerading as live data

**Step 6: Watchtower**
- Open `Watchtower`.
- Verify the 5 health tiles reflect the live backend.

**Expected:**
- no hardcoded CORS or stale warning tile

**Step 7: Secret Sentinel**
- Open `Secret Sentinel`.
- Verify gitleaks status is installed/available and finding values remain redacted.

**Expected:**
- no raw secrets displayed

**Step 8: Obsidian Mirror**
- If `OBSIDIAN_VAULT_PATH` is unset, verify the setup-required state is explicit and honest.
- If it is set, run sync and verify the synced timestamp / item count.

**Expected:**
- either honest setup-required or successful live sync, never fake success

**Verification command(s):**
- browser console inspection
- `npm run misato:browser-shell-check` if it exists and is aligned with the current UI
- screenshots for each surface

**Commit:**
```bash
git add docs/misato/* if any copy or evidence notes changed
git commit -m "docs: record live ui matrix verification"
```

---

## Task 3: Prove Obsidian Mirror behavior in both configured and unconfigured states

**Objective:** Make the mirror behavior explicit: sync when configured, honest setup-required when not configured.

**Files:**
- Validate: `app` route(s) or client component backing Obsidian Mirror
- Validate: `/api/misato/obsidian` and `/api/misato/obsidian/sync`
- Update docs if the UI wording has drifted

**Step 1: Confirm unconfigured path**
- Verify `OBSIDIAN_VAULT_PATH` is absent in the current environment.
- Confirm the UI says setup required.

**Expected:**
- `configured: false`
- `syncAvailable: false`

**Step 2: If a vault exists, test configured path**
- Set `OBSIDIAN_VAULT_PATH` to a real vault path.
- Click `Sync Now`.
- Confirm the spinner changes to success and the API returns live sync data.

**Expected:**
- sync endpoint fires
- mirrored content reflects current runtime truth

**Step 3: Document the environment-bound outcome**
- If no vault exists, document that as a non-blocking environment constraint, not a product defect.

**Verification command(s):**
```bash
curl -s http://127.0.0.1:3010/api/misato/obsidian
curl -s http://127.0.0.1:3010/api/misato/obsidian/sync
```

---

## Task 4: Recheck Windows packaging runtime behaviors

**Objective:** Exercise the installer and desktop shell behaviors that cannot be proven by static build artifacts alone.

**Files:**
- Validate: `src-tauri/src/main.rs`
- Validate: `src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe`
- Validate: any tray / single-instance / autostart wiring in the Tauri app

**Step 1: Install from the NSIS bundle on Windows**
- Launch the installer and confirm the app starts normally.

**Expected:**
- no terminal or PowerShell dependency
- app opens cleanly

**Step 2: Tray behavior**
- Left-click tray icon → window shows.
- Right-click tray icon → menu shows Show/Quit.
- Click X → app hides to tray, does not exit.
- Quit from tray → exits cleanly.

**Expected:**
- tray behavior matches acceptance gates

**Step 3: Single-instance behavior**
- Launch a second time.
- Confirm it focuses the existing window rather than opening a second one.

**Expected:**
- one running instance only

**Step 4: Optional autostart**
- If feasible, toggle autostart in Windows and verify the app relaunches after reboot.

**Expected:**
- autostart works, or is documented as unverified if not exercised

**Verification command(s):**
- manual Windows interaction
- `npm run misato:desktop-packaging-check`

**Commit:**
```bash
git add src-tauri/* docs/misato/* if notes changed
git commit -m "docs: finalize desktop runtime acceptance notes"
```

---

## Task 5: Perform browser-console and network security checks

**Objective:** Prove the UI does not leak raw secrets and that visible token inputs are password fields.

**Files:**
- Validate: settings / auth UI components
- Validate: Secret Sentinel display
- Validate: any fetch layer that might echo token data

**Step 1: Inspect console output**
- Open DevTools console and run a full session across all 8 surfaces.
- Confirm no JS exceptions and no secret-bearing logs.

**Expected:**
- zero JS errors
- warnings, if any, are documented and not secret-related

**Step 2: Inspect network payloads**
- Open DevTools Network tab.
- Verify no token values appear in request/response payloads.

**Expected:**
- tokens are not echoed in cleartext

**Step 3: Confirm password fields**
- Confirm token inputs are `type=password`.

**Expected:**
- no plaintext token display

**Step 4: Confirm Sentinel redaction**
- Verify any findings remain `[REDACTED]`.

**Verification command(s):**
- browser console inspection
- browser network inspection
- DOM inspection of input types

---

## Task 6: Re-run release verification scripts and package the final evidence

**Objective:** Produce the final acceptance bundle with clean pass/fail separation and no ambiguity about environment-bound checks.

**Files:**
- `scripts/misato-live-data-check.mjs`
- `scripts/misato-process-watcher.mjs`
- `scripts/misato-desktop-packaging-check.mjs`
- `docs/misato/FINAL_ACCEPTANCE_REPORT.md`
- `docs/releases/RELEASE_CHECKLIST.md`

**Step 1: Re-run the core scripts**
Run:
```bash
npm run misato:live-data-check
node scripts/misato-process-watcher.mjs
npm run misato:desktop-packaging-check
```

**Expected:**
- live-data-check PASS
- process-watcher PASS
- packaging check PASS for artifacts/wiring, with any runtime behavior clearly marked if unverified

**Step 2: Update the final acceptance report**
- Record verified items, partially verified items, and environment-bound blockers separately.
- Keep Obsidian configured-state honest.
- Keep Windows-only runtime behavior separated from static artifact proof.

**Step 3: Update release checklist status**
- Mark only the items actually verified.
- Leave any unverified items explicit rather than implied.

**Step 4: Final review**
- Confirm the final report says exactly what was proven.
- Ensure no mock data, no fake success, and no hidden assumptions.

**Commit:**
```bash
git add docs/misato/FINAL_ACCEPTANCE_REPORT.md docs/releases/RELEASE_CHECKLIST.md docs/plans/MISATO_LIVE_v2_RELEASE_COMPLETION_PLAN.md
git commit -m "docs: add release completion plan and acceptance evidence"
```

---

## Done criteria

This plan is complete when:
- the browser console session is clean or documented with non-blocking warnings
- all 8 surfaces are verified or explicitly documented as setup-required / environment-bound
- Windows packaging behaviors are exercised on Windows or marked unverified honestly
- the final acceptance report and release checklist match the live truth
- the plan file is saved and ready for execution

---

## Recommended execution order

1. Task 1 — eliminate warning noise and lock runtime truth
2. Task 2 — verify the 8-surface live UI matrix
3. Task 3 — Obsidian Mirror honest/configured behavior
4. Task 4 — Windows packaging runtime behaviors
5. Task 5 — browser console and network security checks
6. Task 6 — rerun scripts and update final acceptance docs
