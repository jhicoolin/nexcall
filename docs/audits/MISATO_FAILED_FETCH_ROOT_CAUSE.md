# MISATO Failed Fetch Root Cause

## Branch
- `misato-codex-live-ui-qa`

## Confirmed Root Cause
`Failed to fetch` is no longer reproduced on the current branch when the backend is launched from this workspace. The remaining real-world trigger is runtime-target mismatch:

1. A stale local runtime process can be alive on one port while the desktop points to another runtime contract.
2. If the shell hits a route outside the live backend contract (for example, a page route returning HTML instead of JSON), frontend parsing can surface a generic fetch failure.

This is an environment/runtime-target mismatch, not a current route-auth regression.

## What Was Verified
- Fresh local server (`next dev -p 4010`) serves all MISATO API endpoints with JSON.
- Non-local host simulation returns `401` JSON for protected routes (including SSE).
- Command, tasks, approvals, missions, and stream routes all respond under the current source.

## Evidence (2026-05-25)
- `GET /api/misato/status`: `200`
- `POST /api/misato/command` (daily): `200`
- `POST /api/misato/command` (risky): `200` with `approvalRequired: true`
- `POST /api/misato/tasks/create|update|delete`: `200`
- `POST /api/misato/agents/assign`: `200` (with valid `taskId` and `agentId`)
- `POST /api/misato/approvals/action`: `200` (with valid `approvalId`)
- `POST /api/misato/missions/create|dispatch`: `200` (with valid `missionId` and `agentId`)
- `GET /api/misato/events/stream` with non-local host header: `401`

## Operational Guidance
- Keep one local runtime base URL as truth for daily use.
- Restart local runtime after branch switch before desktop smoke tests.
- Treat HTML responses from API calls as endpoint/base mismatch and fail fast in UI with explicit diagnostics.
