# MISATO Persistence Mode Audit

## Branch
- `misato-hermes-live-brain`

## Verified Behavior

### Local-first runtime
- Runtime store uses filesystem persistence when not in Vercel/serverless mode.
- Paths:
  - `.misato-runtime/state.json`
  - `.misato-runtime/events.jsonl`
- `/api/misato/status` reports filesystem-backed persistence in the local runtime snapshot.

### Cloud/serverless safety
- Runtime switches to in-memory persistence when `VERCEL` is set.
- In-memory mode avoids write attempts to read-only filesystems.

## Result
- Local desktop usage is durable.
- Cloud/serverless mode avoids write-crash behavior.
- No persistence-related crash was reproduced in this verification pass.

## Additional Verification
- Fresh build and desktop packaging completed successfully after a clean `.next` rebuild.
- Local smoke checks passed against the canonical runtime origin `http://127.0.0.1:3010`.

## Remaining Risk
- Cloud mode is intentionally non-durable in this branch.
- If long-lived cloud state is required, Hermes should move runtime persistence to a managed DB/KV layer.
