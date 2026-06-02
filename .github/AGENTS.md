# MISATO Review Guidelines

## Focus areas
- verification taxonomy: loaded, verified, partially_verified, unverified, failed
- route-level auth on sensitive MISATO endpoints
- canonical runtime origin separation
- desktop packaging and installer artifacts
- honest error states and no fake connected banners
- redacted security outputs only

## What to look for
- any claim that browser shell load equals full runtime correctness
- any fallback path that hides a live endpoint failure
- any route that can return HTML when JSON is expected
- any secret/token rendered in UI, logs, docs, or test output
- any change that weakens owner-only or approval-gated behavior

## What to ignore unless it breaks a user-visible contract
- cosmetic copy changes
- minor spacing / alignment edits
- refactors that do not touch runtime truth, auth, or packaging

## Review standard
- Prefer explicit evidence over optimistic wording.
- If a condition is not directly proven, mark it unverified.
- If a condition is source-only, say SOURCE_VERIFIED.
- If a condition depends on Windows or another host-bound environment, say BLOCKED or UNVERIFIED with a reason.

## Release standard
- Do not merge or ship if any required surface is still fake, stale, or overclaimed.
