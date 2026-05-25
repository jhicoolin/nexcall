# Hermes Orchestration → Codex Verification Notes

Date: 2026-05-25
Branch under test: `misato-hermes-backend`

## Endpoints to verify
1. `OPTIONS /api/misato/status`
2. `GET /api/misato/status` without token
3. `GET /api/misato/status` with token
4. `POST /api/misato/command` with token

## Auth mode validations
- Local Solo: localhost/dev can access status + command without desktop token.
- Preview Simple: one desktop token required; bypass only when edge protection blocks.
- Production Locked: desktop token required; no public access.

## Approval behavior to verify
- Normal command (`What needs attention today?`): `approvalRequired=false`.
- Risky command (`deploy to production now`): `approvalRequired=true`, no live execution/deploy/merge/DNS/env mutation.

## Contract assertions
`POST /command` should include:
`ok, mode, commandReceived, missionSummary, projectDetected, hermesPlan, agentsAssigned, councilFeedback, subtasksCreated, risksDetected, approvalRequired, approvalReason, logsCreated, nextRecommendedActions, moduleStatus`.

## Guardrails
- No auth weakening.
- No global CORS changes.
- No secret output.
- No production deploy.
