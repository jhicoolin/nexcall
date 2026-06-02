# MISATO Failed Fetch Root Cause

## Branch
- `misato-hermes-live-brain`

## Confirmed Root Cause
The `Failed to fetch` symptom comes from runtime-target drift, not from a currently broken MISATO route. The desktop shell must treat the Hermes runtime origin and the preview API base as separate values:

- `MISATO_RUNTIME_ORIGIN` / `window.__MISATO_RUNTIME_ORIGIN__` -> local Hermes host and port
- `MISATO_API_BASE_URL` / `window.__MISATO_API_BASE_URL__` -> preview API base for fallback only

When the preview API base is mistaken for the runtime origin, the shell can drift to the wrong path or stale server and surface a generic fetch failure.

## Fix Applied
- Centralized the runtime origin in `desktop-ui/runtime-config.js`
- Defaulted Hermes origin to `http://127.0.0.1:3010`
- Stopped treating preview API URLs as runtime origins
- Updated `src-tauri/src/main.rs` so empty env values do not clobber saved config
- Normalized preview API base URLs separately from runtime origin values
- Removed connected-state mock fallbacks from the live watchtower / sentinel / lanes / command surfaces

## Verification
- Fresh local runtime on `http://127.0.0.1:3010` serves real JSON for:
  - `/health`
  - `/api/misato/status`
  - `/api/misato/agents`
  - `/api/misato/tasks`
  - `/api/misato/approvals`
  - `/api/misato/logs`
  - `/api/misato/watchtower`
  - `/api/misato/secrets`
  - `/api/misato/schedule`
  - `/api/misato/lanes`
- `/api/misato/events/stream`
- Desktop smoke script: `npm run misato:smoke` passed against the fresh 3010 server.
- Browser shell check (`npm run misato:browser-shell-check`) loaded successfully at `http://127.0.0.1:1420`; no page crash was observed in this pass; console/page errors were explicitly checked and none were observed.
- Runtime-origin contract was verified separately by the smoke/regression checks against `http://127.0.0.1:3010`.

## Command Contract Follow-Up
`POST /api/misato/command` now returns both:
- the legacy payload used by the current UI
- the stable top-level fields required by the live runtime contract:
  - `missionSummary`
  - `projectDetected`
  - `hermesPlan`
  - `agentsAssigned`
  - `councilFeedback`
  - `subtasksCreated`
  - `risksDetected`
  - `approvalRequired`
  - `approvalReason`
  - `logsCreated`
  - `moduleStatus`
  - `result`

## Operational Guidance
- Keep one canonical local runtime origin for daily use: `http://127.0.0.1:3010`
- Never let preview API URLs overwrite the runtime origin
- Treat HTML page fallthrough on API requests as a mismatch, not a successful response
