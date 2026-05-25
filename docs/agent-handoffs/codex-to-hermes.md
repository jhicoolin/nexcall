# Codex to Hermes

## Branch
- `misato-codex-live-ui-qa`

## Verified
- Route-level auth is present across sensitive MISATO endpoints.
- `/api/misato/events/stream` and `/events/stream` are protected outside localhost (`401` non-local probe).
- Live mutations verified end-to-end (tasks, approvals, mission create/dispatch, agent assignment with valid IDs).
- Risky commands remain approval-gated and do not auto-execute production actions.
- Status contract returns runtime/auth/persistence fields expected by desktop clients.
- `npm run lint`, `npm run build`, `npm run desktop:build` all pass.

## Remaining Blockers / Risks
1. Local runtime target drift can still create false `Failed to fetch` symptoms when desktop/UI hits the wrong process/port or stale branch runtime.
2. Some API consumers still need strict single-source runtime base URL discipline to avoid HTML-route fallback parsing.

## Recommended Hermes Actions
1. Enforce one canonical local runtime base URL in shared mission log and runtime startup scripts.
2. Keep command response compatibility stable (`approvalRequired`, approval records, timeline fields).
3. Keep event taxonomy stable for UI filtering (`command.*`, `task.*`, `approval.*`, `mission_*`, `log.created`).

## Safety Notes
- No raw tokens/secrets were emitted in audited JSON outputs.
- Public NexCall pages were not modified in this pass.
