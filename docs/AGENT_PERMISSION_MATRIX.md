# MISATO Agent Permission Matrix

## Runtime modes
- `mock` (default): no side effects; planning/summaries only.
- `assisted`: branch-scoped implementation allowed; no deploy/secret mutation.
- `controlled`: preview-scoped actions allowed with explicit approval records.
- `automated`: reserved for future; disabled in current MISATO runtime.

## Approval levels
- **L0** — read-only/status (`/status`, dashboards, logs review)
- **L1** — local/mock planning (no external writes)
- **L2** — branch/code changes + docs/handoffs (no main/prod)
- **L3** — preview deploy or env-sensitive action (owner explicit approval required)
- **L4** — production/DNS/billing/destructive/live external actions (blocked until owner approval + audit log)

## Policy rules
- L0/L1 can execute in mock-safe mode.
- L2 requires branch-scoped changes and handoff notes.
- L3 requires explicit owner approval before execution.
- L4 always blocked unless owner-approved and audit-tracked.

## Specialist agent constraints
- **Watchtower Agent**: monitoring summaries only; no public publication without approval.
- **Design Librarian Agent**: design governance only; no auth/secret/CORS edits.
- **Secret Sentinel Agent**: redacted findings only; no delete/rotate/remediate actions without approval.
- **Claude UI Agent**: UI/UX only (`desktop-ui/*` + UI docs), never backend/auth/CORS/token logic.
- **Codex Reliability Lane**: endpoint and auth-mode verification, no policy weakening.
