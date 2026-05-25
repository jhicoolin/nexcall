# Hermes → Claude Handoff
- agent: Hermes (backend lane)
- branch: misato-hermes-backend
- timestamp: 2026-05-25T00:44:09Z
- current task: Harden MISATO backend auth/connection semantics and shared-brain docs.

## Backend response contracts
- `GET /api/misato/status`
  - 200 success shape includes: `ok, service, mode, ownerOnly, auth, desktopClient, liveAutomations, availableEndpoints, timestamp`
  - 401 shape includes: `ok:false, auth:"invalid", error:"unauthorized", hint`
- `POST /api/misato/command`
  - 200 shape includes: `ok, mode:"mock-safe", ownerOnly, liveAutomations, result, timestamp`
  - `result` fields: `missionSummary, projectDetected, agentsAssigned, councilFeedback, subtasksCreated, risksDetected, approvalRequired, approvalReason, logsCreated, nextRecommendedActions, activityFeed`

## Connection states UI must display
1. Not configured (missing API base URL)
2. Failed (network/unreachable)
3. Failed + 404 (wrong deployment)
4. Unauthorized (token/session invalid)
5. Vercel protected (preview gate/bypass needed)
6. Connected (HTTP 200 + `ok:true`)

## Safety boundaries
- Keep auth owner-only; never bypass.
- Never render/log token values.
- Keep live automations disabled in v1.
- Keep desktop app on bundled UI, not public marketing pages.

## Files Claude should avoid
- `app/api/misato/**`
- `lib/misato/**`
- `lib/auth/**`
- `middleware.ts` (unless a confirmed auth bug)

## What is mocked vs real
- Mocked: council execution, automation actions, discord/obsidian runtime actions.
- Real: desktop-to-backend connection/auth checks, preview API routes, build pipeline.

## What needs visual polish from Claude
- status chips and diagnostics readability
- command response stream hierarchy
- approval/risk callouts styling
- compact information density for daily operator use
