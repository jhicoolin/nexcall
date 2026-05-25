# MISATO Persistence Mode Audit

## Branch
- `misato-claude-ui`

## What Was Verified

### Local runtime persistence
- `lib/misato/runtime/store.ts` uses filesystem persistence locally
- Store path: `.misato-runtime/state.json`
- Event log path: `.misato-runtime/events.jsonl`
- Local runtime exposes `persistenceMode: "filesystem"` in `/api/misato/status`

### Cloud safety
- When `process.env.VERCEL` is present, the runtime falls back to in-memory state
- In-memory mode reports `persistence: "memory"` in runtime paths
- This prevents read-only filesystem failures in serverless/cloud environments

## Why This Matters
- Local-first desktop use stays durable and fast
- Cloud/prod does not rely on writable local disk
- Risky operations still require approval and do not auto-execute

## Evidence
- `GET /api/misato/status` locally returned:
  - `persistenceMode: "filesystem"`
  - `paths.persistence: "filesystem"`
- Build and desktop build completed successfully

## Remaining Constraint
- Cloud persistence is intentionally memory-backed in this branch
- If the product later needs durable cloud state, it should move to a managed store

## 2026-05-25 Follow-up
- Re-verified that route-level status reports persistence mode from runtime paths.
- Local runtime reports filesystem persistence.
- Cloud/serverless safety remains protected by in-memory fallback when `VERCEL` is present.
