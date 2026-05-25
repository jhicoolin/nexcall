# MISATO Runtime Contract

## Core pipeline
Owner command in MISATO.exe
→ MISATO Core receives command
→ Hermes Orchestrator classifies intent and risk
→ Council specialists provide structured feedback
→ Codex QA/Security lane invoked for code/security tasks
→ Approval Gate enforces policy
→ GitHub/Vercel actions remain preview/approval-only

## Auth modes
1. **LOCAL_SOLO_MODE**
   - Intended for owner local PC only.
   - `http://localhost:3000/api/misato`
   - No desktop token required when local solo is active.
   - Disabled on Vercel and production runtime.
2. **PREVIEW_SIMPLE_MODE**
   - One desktop token (`MISATO_DESKTOP_AUTH_TOKEN`).
   - Vercel bypass token is advanced-only when edge protection is enabled.
3. **PRODUCTION_LOCKED_MODE**
   - Desktop token required.
   - Approval Gate required.
   - No public MISATO access.

## Runtime env controls
- `MISATO_LOCAL_SOLO_MODE=true`
- `MISATO_REQUIRE_DESKTOP_TOKEN=true`
- `MISATO_RUNTIME_MODE=mock`

## Stable command response contract (`POST /api/misato/command`)
Returns:
- `ok`
- `mode`
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

## Risk handling
- Risky intents (deploy/prod/dns/env/auth/delete/billing/external) set `approvalRequired: true`.
- No live execution in mock runtime.
- Production actions remain blocked until owner approval and audit log.
