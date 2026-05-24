# Production Approval Flow (MISATO)

## Risky action categories (always approval-gated)
- production deploy
- env var changes
- DNS changes
- auth changes
- database migrations
- data deletion/export
- email/social posting
- server commands
- billing/payment changes
- live automation connections
- real production merges/deploy execution

## V1 behavior
1. Detect risk in command.
2. Create approval item.
3. Log event.
4. Block execution until owner decision.

## Owner decision states
- Approve
- Reject
- Request revision
