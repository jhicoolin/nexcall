# MISATO HANDOFF NOTE

Agent: Hermes (Misato runtime lane)
Branch: misato-hermes-backend (working tree)
Task: Final stabilization pass for local-first runtime truth and shell-readable contract

## What I changed
- Added approval resolution lifecycle in runtime core:
  - `lib/misato/runtime/service.ts`
  - new `resolveApproval(approvalId, decision, resolvedBy)`
  - emits `approval_resolved`, `log`, and `status_change` events.
- Expanded guarded approvals API to support queue resolution:
  - `app/api/misato/approvals/route.ts`
  - `POST` accepts `{ approvalId, decision, resolvedBy? }`.
- Implemented route-collision-safe shell aliases for canonical endpoints:
  - `app/misato-runtime/agents/route.ts`
  - `app/misato-runtime/approvals/route.ts`
  - `app/misato-runtime/logs/route.ts`
  - `middleware.ts` rewrites JSON/shell requests for `/agents`, `/approvals`, `/logs` to `/misato-runtime/*`.
- Updated runtime contract docs to record the alias/shim behavior explicitly:
  - `docs/MISATO_RUNTIME_CONTRACT.md`

## What I verified
- Production build succeeds: `npm run build` ✅
- Local-first routes return JSON from shell:
  - `GET /health` ✅
  - `POST /command` ✅
  - `GET /agents` (Accept: application/json) ✅
  - `GET /tasks` ✅
  - `GET /approvals` (Accept: application/json) ✅
  - `GET /logs` (Accept: application/json) ✅
  - `GET /watchtower` ✅
  - `GET /secrets` ✅
  - `GET /events/stream` ✅
- Approval lifecycle:
  - risky command enqueues approval (`approvalRequired=true`) ✅
  - `POST /approvals` resolves pending approval ✅
  - pending count updates in state/events ✅
- SSE behavior:
  - stream opens and emits events ✅
  - reconnect with `Last-Event-ID` returns subsequent events ✅
- Persistence:
  - `.misato-runtime/state.json` updated ✅
  - `.misato-runtime/events.jsonl` append-only event history updated ✅
- Secret redaction posture:
  - `/secrets` reports redaction, no secret values emitted ✅

## Routes live (desktop shell contract)
- `GET /health`
- `POST /command`
- `GET /agents` (JSON alias shim)
- `GET /tasks`
- `GET /approvals` (JSON alias shim)
- `POST /approvals` (JSON alias shim; resolve lifecycle)
- `GET /logs` (JSON alias shim)
- `GET /watchtower`
- `GET /secrets`
- `GET /events/stream`

## Events live
- `command_received`
- `context_loaded`
- `plan_generated`
- `agent_assigned`
- `task_started`
- `task_updated`
- `risk_detected`
- `approval_requested`
- `approval_resolved`
- `log`
- `status_change`

## Approval-gated remains
- High-risk/external actions (deploy, production, DNS, env/auth mutation, secret operations, external automation, merges) remain queued for approval and do not execute side effects.

## What is still blocked
- Cleanup of legacy experimental path `app/_misato/` is pending; removal command was blocked by safety confirmation gate.
- `GET /agents` with HTML Accept currently resolves to the existing app page path behavior (non-JSON). JSON/shell route is stable and canonical for bridge reads.

## Preserve these assumptions
- Keep middleware alias rewrite behavior intact for `/agents`, `/approvals`, `/logs` JSON requests.
- Keep `/api/misato/*` owner-guard semantics unchanged.
- Keep secret-sentinel outputs redacted only.
- Do not reintroduce direct root route handlers that collide with page routes.

## Next agent
Codex

## Next agent must do
1. Verify desktop shell integration sends JSON Accept headers for `/agents`, `/approvals`, `/logs`.
2. Verify UI list adapters consume `{ ok, items }` shape consistently.
3. Confirm no fallback-to-mock occurs when live payloads are present.
4. If approved by owner, perform cleanup of `app/_misato/` and re-run build.
5. Run final smoke test from MISATO.exe against localhost path.

## Files
- `lib/misato/runtime/service.ts`
- `app/api/misato/approvals/route.ts`
- `app/misato-runtime/agents/route.ts`
- `app/misato-runtime/approvals/route.ts`
- `app/misato-runtime/logs/route.ts`
- `middleware.ts`
- `docs/MISATO_RUNTIME_CONTRACT.md`

## Validation
- `npm run build` passed
- route checks via Python requests against `http://127.0.0.1:3000`
- SSE open/reconnect checks passed
- approval enqueue + resolve checks passed
- event log and state persistence verified

Commit/push: not performed
