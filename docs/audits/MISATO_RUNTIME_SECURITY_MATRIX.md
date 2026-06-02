# MISATO Runtime Security Matrix

## Branch
- `misato-hermes-live-brain`

## Route-Level Auth Verification

| Surface | Status | Notes |
|---|---:|---|
| `/api/misato/status` | PASS | `assertOwnerJson` + CORS |
| `/api/misato/command` | PASS | `assertOwnerJson`; risky commands stay approval-gated |
| `/api/misato/agents` | PASS | `assertOwnerJson` |
| `/api/misato/agents/assign` | PASS | `assertOwnerJson`; live mutation |
| `/api/misato/tasks` + CRUD routes | PASS | `assertOwnerJson`; live mutation |
| `/api/misato/approvals` | PASS | `assertOwnerJson` |
| `/api/misato/approvals/action` | PASS | `assertOwnerJson`; approve/reject/defer |
| `/api/misato/logs` | PASS | `assertOwnerJson` |
| `/api/misato/missions` + create/dispatch | PASS | `assertOwnerJson`; live mutation |
| `/api/misato/watchtower/*` | PASS | `assertOwnerJson`; no secrets |
| `/api/misato/secrets/*` | PASS | `assertOwnerJson`; redacted outputs |
| `/api/misato/council` `/discord` `/obsidian` `/projects` `/lanes` | PASS | `assertOwnerJson` |
| `/api/misato/events/stream` | PASS | Protected route handler |
| `/events/stream` | PASS | Route handler enforces owner checks |

## `/events/stream` Exposure Check
- Local request: stream opens and emits real runtime events.
- Non-local host simulation: `401` JSON.
- Result: not public outside localhost without owner auth / token.

## Command Contract
`POST /api/misato/command` now preserves the legacy payload and adds the stable contract fields needed by the desktop runtime:
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

## Auth Centralization
- Guard behavior remains centralized in `lib/misato/owner-guard.ts`.
- Sensitive API routes rely on route-level `assertOwnerJson`.
- Middleware is not the sole authorization gate.

## Alias/Rewrite Bypass Review
- Sensitive API routes are protected in-route.
- No confirmed auth bypass found through alias paths in this branch.

## Secrets Handling
- Token/secret fields remain redacted in emitted payload sanitization.
- No raw secrets were emitted in the verified JSON outputs.

## Verification Snapshot
- `npm run lint`: PASS
- `npm run build`: PASS
- `npm run desktop:build`: PASS
- `npm run misato:smoke`: PASS against `http://127.0.0.1:3010`
- Browser shell check (`npm run misato:browser-shell-check`): loaded successfully at `http://127.0.0.1:1420`; no page crash observed in this pass; console/page errors were explicitly checked and none were observed
- Browser-origin contract (`npm run misato:browser-contract-check`): verified against `http://127.0.0.1:3010` with canonical runtime origin, status JSON, command contract, and clean console window
- Runtime-origin contract: also verified separately by the smoke/regression checks against `http://127.0.0.1:3010`
