# NexCall Cleanup Plan

Last updated: 2026-06-06

This is a classification plan only. It is not authorization for destructive cleanup.

## Safe Delete Now

- generated build output such as `.next/` and `.next-build/` when not needed for active debugging
- temporary analyzer output if intentionally regenerated outside version control

## Archive / Move

- older handoff notes that are no longer active but still useful for audit history
- one-off verification artifacts that should live in a dedicated evidence or reports area instead of the repo root

## Keep

- active application source
- security and launch contracts
- collaboration log
- CI workflow
- parity verification script
- public brand assets
- documentation that explains current request-demo launch posture

## Owner Review Required

- files with unclear ownership or mixed NexCall / MISATO value
- anything under docs that might still be referenced by another agent workflow
- historical scripts that may still be used from external runbooks
- any file not clearly generated, obsolete, or duplicated

## Current Dirty-State Guidance

- `.gitignore`: keep the `.next-build/` ignore rule
- `next-env.d.ts`: keep the `.next-build` route-types reference while custom build output remains in use
- `lib/tenant-repository.ts`: keep the typecheck/build reliability fix unless Prisma typing changes upstream make it unnecessary
