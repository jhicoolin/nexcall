# Agent Permission Matrix

## Runtime modes
- mock: no side effects
- assisted: plans/patches only
- controlled: PRs with approval
- automated: future only

## New specialist agents
- Watchtower Agent: monitoring summaries only; no public status publication without approval.
- Design Librarian Agent: design governance only; no auth/secret changes.
- Secret Sentinel Agent: redacted findings only; no delete/rotate/remediate actions without approval.
