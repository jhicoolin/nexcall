# MISATO Failed Fetch Root Cause

## Branch
- `misato-claude-ui`

## Root Cause
The desktop shell could reach the local runtime only on the happy path, but the JSON shell aliases for `/agents`, `/approvals`, and `/logs` were not protected by the owner gate because `middleware.ts` rewrote those requests to `app/misato-runtime/*` before auth ran.

That created two failure modes:
1. Non-local / production-simulated requests returned raw 401s without the shell seeing a consistent protected JSON contract.
2. The approval action compatibility endpoint expected `action`, while the shell flow was sending `decision`, so approval actions could fail even though the underlying approval service was present.

I fixed both issues by:
- Adding `assertOwnerJson()` to `app/misato-runtime/agents/route.ts`, `app/misato-runtime/approvals/route.ts`, and `app/misato-runtime/logs/route.ts`
- Adding a compatibility endpoint at `app/api/misato/approvals/action/route.ts`
- Mapping `decision` to `action` in that compatibility route
- Extending `app/api/misato/status/route.ts` with the runtime fields the desktop shell expects

## Verified Result
- Local shell requests from `http://localhost:1420` to `http://localhost:3000` return JSON and CORS headers
- Production-simulated requests with a non-local host return `401` JSON, not browser-level fetch failures
- Approval actions now resolve through `/api/misato/approvals/action`

## Evidence
- `GET /api/misato/status` with local origin: `200`
- `GET /api/misato/agents` with local origin: `200`
- `GET /api/misato/approvals` with local origin: `200`
- `GET /api/misato/logs` with local origin: `200`
- `GET /api/misato/events/stream` with local origin: SSE stream opens
- Non-local host simulation returned `401` JSON for the protected MISATO routes

## Notes
- Vercel remains optional for daily use.
- No secrets were exposed in responses or logs.

## 2026-05-25 Follow-up (Safety Verification)
- Verified against the live local runtime on `http://localhost:3010`.
- Sensitive MISATO routes returned `401` JSON for non-local host simulation, including `/api/misato/events/stream`.
- Task CRUD, agent assignment, approval action, and mission create/dispatch passed end-to-end on localhost.
- A separate local dev runtime on `http://localhost:3000` showed intermittent `500` from missing `.next` vendor chunks; this was a local runtime artifact issue, not an auth/contract regression in MISATO routes.
