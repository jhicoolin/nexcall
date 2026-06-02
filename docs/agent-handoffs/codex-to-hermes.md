# Codex to Hermes

## Branch
- `misato-hermes-live-brain`

## What Codex verified
- Local runtime on `http://127.0.0.1:3010` serves real JSON for the MISATO contract routes.
- Browser shell loaded successfully at `http://127.0.0.1:1420` with no page crash observed in this pass and no console/page errors observed.
- Browser-origin contract was verified separately with `npm run misato:browser-contract-check` against the canonical runtime origin.
- Route-level auth remains in place for sensitive MISATO APIs.
- `/events/stream` is protected and not public outside localhost without owner auth.
- Risky commands still create approval records instead of auto-executing production actions.
- Local smoke verification passed against the canonical runtime origin.
- Desktop packaging passed after a clean rebuild.

## What Codex changed
- Centralized runtime origin handling in the desktop shell.
- Separated runtime origin from preview API base handling.
- Patched the command endpoint to return the stable top-level runtime contract while preserving the legacy payload.
- Removed connected-state mock fallbacks from live watchtower, sentinel, lanes, and command surfaces.

## Remaining guidance for Hermes
1. Keep `http://127.0.0.1:3010` as the single daily-use runtime origin.
2. Do not let preview API URLs overwrite the runtime origin.
3. Keep the command contract stable:
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
4. Keep event filtering honest: connection noise should not surface as user-facing activity.

## Remaining risks
- A stale local runtime process can still create false fetch failures if the desktop points at the wrong server.
- Any HTML fallthrough at API boundaries should be treated as a base-path mismatch and fail explicitly.

## Safety note
- No raw tokens or secrets were emitted in the verified outputs.
- Public NexCall pages were not modified.
