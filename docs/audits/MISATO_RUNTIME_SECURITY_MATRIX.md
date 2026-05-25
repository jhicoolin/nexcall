# MISATO Runtime Security Matrix

## Branch
- `misato-codex-live-ui-qa`

## Route-Level Auth Verification

| Surface | Status | Notes |
|---|---:|---|
| `/api/misato/status` | PASS | `assertOwnerJson` + CORS |
| `/api/misato/command` | PASS | `assertOwnerJson`; risky commands approval-gated |
| `/api/misato/agents` | PASS | `assertOwnerJson` |
| `/api/misato/agents/assign` | PASS | `assertOwnerJson`; live mutation |
| `/api/misato/tasks` + CRUD routes | PASS | `assertOwnerJson`; live mutation |
| `/api/misato/approvals` | PASS | `assertOwnerJson` |
| `/api/misato/approvals/action` | PASS | `assertOwnerJson`; `decision` mapped to `action` |
| `/api/misato/logs` | PASS | `assertOwnerJson` |
| `/api/misato/missions` + create/dispatch | PASS | `assertOwnerJson`; live mutation |
| `/api/misato/watchtower/*` | PASS | `assertOwnerJson`; no secrets |
| `/api/misato/secrets/*` | PASS | `assertOwnerJson`; redacted outputs |
| `/api/misato/council` `/discord` `/obsidian` `/projects` `/lanes` | PASS | `assertOwnerJson` |
| `/api/misato/events/stream` | PASS | Proxies protected stream route |
| `/events/stream` | PASS | `assertOwnerJson` in route handler |

## `/events/stream` Exposure Check
- Local request: stream opens and emits events.
- Non-local host simulation: `401` JSON.
- Result: not public outside localhost without owner auth / token.

## Auth Centralization
- Local/desktop request parsing is centralized in `lib/misato/request-context.ts`.
- Guard behavior centralized in `lib/misato/owner-guard.ts`.
- API routes rely on route-level `assertOwnerJson`, not middleware-only assumptions.

## Alias/Rewrite Bypass Review
- Sensitive API routes are protected in-route.
- No confirmed auth bypass found through alias paths in this branch.
- Remaining operational risk is base-path drift between runtime endpoints and UI expectations (handoff item, not auth bypass).

## Secrets Handling
- Token/secret fields are redacted in emitted payload sanitization.
- No raw secrets observed in status/command/events/tasks/approvals/missions outputs.

## Verification Snapshot (2026-05-25)
- Local endpoints: PASS (status, command, agents, tasks, approvals, logs, missions, watchtower, secrets, events).
- Non-local protection probes: PASS (`401` JSON on protected routes).
- `npm run lint`: PASS
- `npm run build`: PASS
- `npm run desktop:build`: PASS
