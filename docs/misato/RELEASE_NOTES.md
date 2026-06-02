# MISATO Release Notes — Live Runtime / UI Signoff

**Date:** 2026-06-02T03:26:08-04:00  
**Branch:** `misato-hermes-live-brain`  
**Runtime origin:** `http://127.0.0.1:3010`  
**Desktop shell:** `http://127.0.0.1:1420`

## Build status

All entries use the verification taxonomy from `docs/misato/STATUS_TAXONOMY.md`.

| Command | Status | Evidence |
|---------|--------|---------|
| `npm run lint` | SOURCE_VERIFIED | 0 ESLint errors, 0 warnings — confirmed by running the command |
| `npm run build` | SOURCE_VERIFIED | Next.js build completed, 0 type errors — confirmed by running the command |
| `node scripts/misato-runtime-smoke.mjs` | API_VERIFIED | `summary.verified: 13, failed: 0` at `http://127.0.0.1:3010` — structured JSON evidence emitted |
| `node scripts/misato-regression-check.mjs http://127.0.0.1:3010` | API_VERIFIED | `summary.verified: 11, failed: 0` (6 source + 5 live) — structured JSON evidence emitted |
| `npx tauri build --verbose` | SOURCE_VERIFIED | NSIS installer artifact produced: `src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe` |
| `npm run misato:browser-shell-check` | UNVERIFIED (browser-required) | Requires MISATO.exe on port 1420 + Playwright. Run: `npx playwright install chromium && npm run misato:browser-shell-check` |
| `npm run misato:browser-contract-check` | UNVERIFIED (browser-required) | Requires MISATO.exe + Hermes + Playwright. Run: `npm run misato:browser-contract-check` |

## Installer artifact

- `C:\Users\pixel\nexcall\src-tauri\target\release\bundle\nsis\MISATO_0.1.0_x64-setup.exe`

## Verification commands

```bash
npm run lint
npm run build
node scripts/misato-runtime-smoke.mjs
node scripts/misato-regression-check.mjs http://127.0.0.1:3010
npx tauri build --verbose
```

## UI matrix pass summary

### Verified

| Surface | Expected | Actual | Status | Evidence |
|---|---|---|---|---|
| Command Center | Send a command, see live response + feed events | Sent `hello bb`; live feed showed `Command received` and `Command completed` | **verified** | Browser snapshot + live feed update |
| Live Feed | SSE live and meaningful events only | Feed showed live command/approval/task events; no console errors | **verified** | Browser snapshot + console clean |
| Schedule | Agenda / Day / Week show honest live state | Agenda showed `◎ Hermes connected · 31 tasks without scheduledAt`; Day empty; Week showed `NO ITEMS THIS WEEK` | **verified** | Browser snapshot |
| Approvals | Pending cards mutate backend | Clicking **Defer** on a pending approval reduced backend pending count from 13 → 12 | **verified** | UI snapshot + `/api/misato/status` pendingApprovals=12 |
| Lanes | Live lane truth, not static mock | Lanes showed 5 live lanes, with owner approval lane blocked honestly | **verified** | Browser snapshot |
| Watchtower | No stale CORS tile, health tiles derived from live state | Watchtower showed Hermes/SSE/Auth/Queue/Runtime tiles; no CORS tile visible | **verified** | Browser vision screenshot |
| Secret Sentinel | Honest setup-required state when gitleaks missing | Scan button disabled; Gitleaks `NOT FOUND`; endpoint `UNAVAILABLE`; secrets redacted | **verified** | Browser snapshot |
| Obsidian Mirror | Honest setup-required state when vault not configured | Open button disabled; setup required shown | **verified** | Browser snapshot |

### Partially verified / not exercised fully

| Surface | What remains | Status |
|---|---|---|
| Secret Sentinel | Real scan execution with installed gitleaks | **partially_verified** |
| Obsidian Mirror | Real sync execution with configured vault | **partially_verified** |
| Desktop tray / single-instance behavior | Needs hands-on Windows shell testing | **unverified** |

## UI notes

- Browser console remained clean during the UI pass.
- The runtime origin separation stayed intact:
  - `MISATO_RUNTIME_ORIGIN` → local runtime origin
  - `MISATO_API_BASE_URL` → preview/API base, when used
- The app is currently connected to the local runtime on `3010`.

## Remaining owner signoff items

These require hands-on validation outside the browser pass:

1. Install/enable **gitleaks**, then run **Secret Sentinel** end-to-end.
2. Configure **OBSIDIAN_VAULT_PATH**, then run **Obsidian Mirror sync** end-to-end.
3. Verify Windows tray / single-instance behavior in the packaged desktop shell.

## Current live state snapshot

- `pendingApprovals`: **12**
- `activeAgents`: **8**
- `activeTasks`: **18**
- `queueDepth`: **18**
- `runtimeMode`: **mock**
- `localSoloMode`: **true**
- `hermesConnected`: **true**
- `eventStreamAvailable`: **true**

## Handoff note

Ready for owner signoff on the live runtime and UI honesty pass. The remaining work is manual testing of the system-dependent features above.
