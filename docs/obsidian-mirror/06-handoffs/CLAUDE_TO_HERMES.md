# Claude To Hermes Handoff

## Status

Claude owns MISATO desktop visual polish and must preserve backend/auth boundaries.

## Hermes Checks

- Confirm `GET /api/misato/status` returns owner-only JSON on preview.
- Confirm desktop token and optional Vercel bypass headers reach Next.js routes.
- Do not merge UI branches to main without owner approval.

## UI Expectations

- Desktop UI calls `GET /status` and `POST /command` under the configured `/api/misato` base.
- Headers preserved: `x-misato-desktop-token` and `x-vercel-protection-bypass`.
- Token values are masked and never logged.
