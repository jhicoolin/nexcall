# Hermes Orchestration → Codex Runtime Notes

Date: 2026-05-24
Branches inspected: `origin/misato-codex-runtime-audit`, `misato-hermes-backend`

## Verified by Hermes
- Middleware path should allow desktop token auth for MISATO APIs while preserving owner cookie auth for web routes.
- Command route contract now returns top-level orchestration fields:
  `ok, mode, commandReceived, missionSummary, projectDetected, hermesPlan, agentsAssigned, councilFeedback, subtasksCreated, risksDetected, approvalRequired, logsCreated, nextRecommendedActions, moduleStatus`.
- Watchtower / Secret Sentinel routes remain owner-protected and mock-safe.
- CORS helper introduced for MISATO API routes only (`lib/misato/http/cors.ts`), with OPTIONS handlers.

## Needed from Codex lane
1. Push `misato-codex-connection-repair` branch for review (branch missing remotely).
2. Confirm desktop-side URL normalization + fetch error clarity remains intact after merge.
3. Re-test preview after redeploy with non-empty token.

## Guardrails
- No weakening auth.
- No global CORS changes across public NexCall endpoints.
- No secret output in logs/responses.
- No live automation enablement.
