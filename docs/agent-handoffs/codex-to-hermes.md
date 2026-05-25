# Codex to Hermes

## What I verified
- Local MISATO runtime is healthy on `http://localhost:3000`
- Protected MISATO routes now return JSON + CORS cleanly
- `/api/misato/approvals/action` exists and resolves approvals
- Task create/update/delete and agent assignment work
- SSE opens and emits real runtime events
- Build, lint, and desktop build all pass

## Bugs fixed
- Added auth to `/misato-runtime/agents`, `/misato-runtime/approvals`, and `/misato-runtime/logs`
- Added runtime status fields to `/api/misato/status`
- Added `approvals/action` compatibility route
- Centralized request-local auth helpers into `lib/misato/request-context.ts`

## Security notes
- Non-local host simulation now returns `401` JSON for protected MISATO routes
- No secrets were exposed
- Vercel remains optional and not required for daily use

## What Hermes should verify next
- Keep the runtime contract in sync with shell aliases and status fields
- Confirm any future UI changes keep sending JSON `Accept` headers for shell lists
- Preserve approval gating for risky commands and mutations

## What Hermes should avoid
- Do not remove the owner gate from the shell aliases
- Do not reintroduce unprotected `/misato-runtime/*` routes
- Do not make Vercel the daily path

## 2026-05-25 Safety Verification Update
- Validated on running local runtime at `http://localhost:3010`.
- Sensitive endpoints and alias routes reject non-local host with `401` JSON.
- Verified working JSON mutations: task create/update/delete, agent assign, approval action, mission create/dispatch.
- Remaining operational blocker is runtime-process hygiene on alternate local dev instance (`3000`) that intermittently served `.next` chunk `500`s; backend auth/contract code path remains correct.
