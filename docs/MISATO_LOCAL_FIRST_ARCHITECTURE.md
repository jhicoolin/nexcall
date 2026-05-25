# MISATO Local-First Architecture (Hermes Runtime v1)

## Purpose
MISATO must run daily from local runtime first (Hermes Bridge / localhost), with cloud actions optional and approval-gated.

## Ownership boundaries
### Hermes owns
- Runtime architecture + orchestration logic
- Command pipeline + agent routing
- Event stream schema + emission
- Approval gate policy + queues
- Persistence model
- Local runtime discovery + health
- Optional cloud handoff behavior

### Hermes does not own
- UI polish / CSS / accessibility polish
- Public NexCall pages
- Production deploy/merge execution without approval
- Secret disclosure

## Runtime topology
1. **MISATO.exe frontend** (desktop shell + command center)
2. **Local Hermes Bridge** (`http://127.0.0.1:4040`) as primary runtime target
3. **Fallback local Next runtime** (`http://127.0.0.1:3000/api/misato`) for compatibility
4. **Optional cloud preview** (Vercel) only when explicitly requested + approved for risky ops

## Discovery sequence (boot)
On boot, MISATO.exe probes in order:
1. `GET http://127.0.0.1:4040/health` (timeout 800ms)
2. `GET http://localhost:4040/health` (timeout 800ms)
3. `GET http://127.0.0.1:3000/api/misato/status` (timeout 1000ms)
4. `GET http://localhost:3000/api/misato/status` (timeout 1000ms)

Rules:
- First `ok: true` response wins.
- Total discovery budget: 3.8s.
- If no local endpoint responds: state=`not_running`, show **Start Hermes** and setup steps.
- Cloud is never auto-required for this state.

## Connected state contract
Desktop connection state:
- `connected` when local runtime healthy
- `not_running` when localhost probes fail
- `degraded` when runtime is reachable but command/event endpoints fail

## Local-first execution policy
- Default mode: local-first
- Command writes go to active local runtime target
- Cloud handoff allowed only for approval-gated actions (L3/L4)
- Production actions remain blocked without explicit owner approval audit

## Required local endpoints (canonical v1)
- `GET /health`
- `POST /command`
- `GET /agents`
- `GET /tasks`
- `GET /approvals`
- `GET /logs`
- `GET /watchtower`
- `GET /secrets`
- `GET /events/stream` (SSE)

Compatibility mapping for current Next runtime (`/api/misato/*`) is defined in `MISATO_RUNTIME_CONTRACT.md`.

## Event transport
- v1: SSE (`text/event-stream`) on `/events/stream`
- Event IDs monotonic by timestamp + UUID
- Heartbeat every 15s
- Reconnect with `Last-Event-ID`

## Persistence
- **SQLite**: current state tables (agents, tasks, approvals, logs, module_status, runtime_state)
- **JSONL**: append-only event ledger (`events.jsonl`) for replay/debug

## Security
- Owner-only command APIs outside local solo mode
- Secrets endpoint returns masked metadata only, never raw secret values
- No secret values in logs/events
- Risk actions queue for approval, never auto-executed

## Cloud behavior (optional)
Cloud integrations are explicit fallback/handoff lanes:
- GitHub/Vercel metadata read: allowed
- Preview deploy: approval-gated (L3)
- Production deploy, DNS, billing, destructive actions: blocked until L4 owner approval + audit log
