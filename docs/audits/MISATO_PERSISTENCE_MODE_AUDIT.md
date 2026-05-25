# MISATO Persistence Mode Audit

## Branch
- `misato-codex-live-ui-qa`

## Verified Behavior

### Local-first runtime
- Runtime store uses filesystem persistence when not in Vercel/serverless mode.
- Paths:
  - `.misato-runtime/state.json`
  - `.misato-runtime/events.jsonl`
- `/api/misato/status` reports:
  - `persistenceMode: "filesystem"`
  - `paths.persistence: "filesystem"`

### Cloud/serverless safety
- Runtime switches to in-memory persistence when `VERCEL` is set.
- In-memory mode avoids write attempts to read-only filesystems.

## Result
- Local desktop usage is durable.
- Cloud/serverless mode avoids write-crash behavior.
- No persistence-related crash reproduced in this verification pass.

## Remaining Risk
- Cloud mode is intentionally non-durable in this branch (memory-only).
- If long-lived cloud state is required, Hermes should move runtime persistence to a managed DB/KV layer.
