# MISATO Agent Runtime Plan

## Objective
Plan a private fork/mirror of `nousresearch/hermes-agent` as `misato-agent` for future runtime integration.

## Constraints
- Do not fork yet without explicit owner approval.
- Preserve MIT license notices and attribution.
- Keep runtime private.
- No secrets in repo/config/docs.

## Integration path (future)
1. Private fork/mirror setup (`misato-agent`).
2. Define private API bridge from NexCall `/api/misato/*`.
3. Add scoped tool policies + approval-gate hooks.
4. Add audit logging and owner-only runtime controls.
