# Hermes → Claude Handoff (Orchestration Contract)

Date: 2026-05-25
Branch: `misato-hermes-backend`

## UI contract fields to expect from `POST /api/misato/command`
- `ok`
- `mode` (`local-solo` | `preview-simple` | `production-locked`)
- `runtimeMode` (`mock` default)
- `commandReceived`
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
- `nextRecommendedActions`
- `moduleStatus`
- `timestamp`

## States UI should display
- Auth mode badge: local/preview/production.
- Runtime mode badge: `mock`.
- Approval badge: `approvalRequired` true/false.
- Module cards from `moduleStatus`:
  - watchtower
  - designLibrary
  - secretSentinel
  - obsidianMirror
  - githubVercel
  - lanes

## Do not touch
- `app/api/misato/**`
- `lib/auth/**`
- `lib/misato/http/**`
- `middleware.ts`
- token validation/CORS logic

## Preserve
- Save Config / Test Connection
- Local/Preview/Production selector behavior
- token masking + no token logging
- bypass token as Advanced-only
