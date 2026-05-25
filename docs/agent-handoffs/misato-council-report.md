# MISATO Council Report
- agent: MISATO Core (mock-safe)
- branch: misato-hermes-backend
- timestamp: 2026-05-25T00:44:09Z

## Current mission
Stabilize MISATO desktop connection and backend reliability on preview.

## Signals
- Preview API routes exist and are auth-protected.
- Production `nexcall.one/api/misato/*` remains out-of-scope until intentional rollout.

## Risks
- Token mismatch/empty preview token causes Unauthorized.
- Preview protection can mask route behavior unless bypass header is provided.

## Recommendations
1. Keep preview-first connection flow.
2. Preserve owner-only auth enforcement.
3. Route risky commands to approval-required outcomes.
