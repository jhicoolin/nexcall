# Handoff: Hermes → Claude UI Agent

**Date:** 2026-06-05
**From:** Hermes (Runtime Orchestrator)
**To:** Claude UI Agent (UI/UX, shell polish, public-facing behavior)

## Role definition

Claude owns the **UI lane** only:
- public-facing copy
- layout, spacing, and visual clarity
- mobile polish and interaction affordances
- shell UX for `/`, `/command`, and other public pages
- copy/label trust fixes that reduce confusion

Claude does **not** own security hardening, middleware, env validation, secret handling, or auth policy. If a UI change touches those surfaces, stop and feed the finding to Codex.

## Current runtime truth

Canonical local runtime: **`http://127.0.0.1:3010`**

Verified now:
- `GET /health` → **200 OK**
- `npm run build` → **passes**
- `npm run dev` → **starts cleanly after stale output cleanup**

## What was fixed before this handoff

The repo had a stale-generated-output problem that made the runtime look broken even though the source route tree was fine.

### Root cause
- Generated Next.js artifacts were drifting from source
- The validator had been pointing at a non-existent `app/command/route.ts` artifact even though the source route is `app/command/page.tsx`
- A stale dev/build cache could also produce transient `/health = 500` and webpack `ENOENT` errors until the dev server was restarted cleanly

### Fixes already applied
- `scripts/clean-next-output.mjs` was added
- `predev` was added to run the cleanup automatically before dev
- `prebuild` was added to run the cleanup automatically before build
- `preanalyze` was added to run the cleanup automatically before analyze
- `package.json` now routes build output through `.next-build` while still clearing stale generated trees first

### Important pitfall
- cleanup now runs in mode-specific form, so dev clears `.next`/`.next-fresh` while build/analyze clear only `.next-build`
- if `/health` suddenly flips to `500` with `ENOENT` paths under `.next`, treat it as stale generated output first, not a source-code regression
- if `/api/misato/secrets` ever logs `The system cannot find the path specified.`, that is a Codex/security-lane issue in gitleaks detection plumbing, not a Claude UI issue

## Why Claude is being handed this lane

Claude is best used for the **UI and shell-side verification** now that the runtime is stable:
- confirm the public pages still look and read correctly after cleanup
- make sure the app shell remains trustworthy and clear
- preserve user-facing clarity while avoiding accidental security-policy or backend changes

## Claude’s mission

### Primary tasks
1. Smoke-test the public UX after the cleanup fix:
   - `/`
   - `/command`
   - `/admin`
   - `/admin/login`
2. Verify the UI is still aligned with the canonical local runtime path/port:
   - `http://127.0.0.1:3010`
3. Check that the public-facing pages still load and render cleanly after the stale-output fix.
4. If you change copy or layout, keep the UI honest: no inflated claims, no stale labels, no hidden regression in the shell.

### UI proof standard
Treat these as distinct checks:
- source changed
- build passed
- live HTTP response verified
- browser-rendered DOM verified
- smoke-tested endpoint verified

Do **not** collapse them into one claim.

## Recommended verification commands for Claude

Use these in order if needed:

```bash
curl -i http://127.0.0.1:3010/health
curl -i http://127.0.0.1:3010/
curl -i http://127.0.0.1:3010/command
curl -i http://127.0.0.1:3010/admin
curl -i http://127.0.0.1:3010/admin/login
```

If browser verification is needed, prefer the actual rendered DOM over source inspection.

## What Claude should watch for

- stale copy that no longer matches the runtime behavior
- broken spacing or responsiveness on public pages
- shell elements that mislead users about what is actually available
- regressions caused by cleanup or route rebuilds
- any UI text that implies a capability the runtime does not prove

## Do NOT touch

- `scripts/clean-next-output.mjs`
- backend route handlers
- middleware/auth logic
- env files and secrets
- security headers
- deployment configuration

If one of those areas needs work, hand it to Codex instead of changing it here.

## Files most relevant to Claude

- `app/page.tsx`
- `app/command/page.tsx`
- `app/admin/page.tsx`
- `app/admin/login/page.tsx`
- `desktop-ui/`
- `docs/`
- `nexcall_collaboration_log.txt`

## Coordination rules

- Read the shared collaboration log first if you need launch context
- If your UI findings change the security surface, tell Codex explicitly
- Log meaningful checkpoints in the shared log with proof-oriented entries
- Keep the handoff narrow: UI only, no security refactors

## Shared log entry format

`[TIMESTAMP] AGENT: Task | RESULT: What changed | NEXT: What’s next`

## Current verified state

- Build passes: ✅
- Runtime health passes: ✅
- Stale output cleanup is automatic before dev/build/analyze: ✅
- Canonical runtime port is 3010: ✅

## Latest live truth

The live site is still stale relative to the audited local repo. Recent verification showed:
- `https://nexcall.one/` still serves older homepage copy, including `Answer more calls. Capture every lead.` and `Always on`
- `https://nexcall.one/health` returns **200** with minimal safe JSON
- `https://nexcall.one/checkout` returns **404**
- `https://nexcall.one/admin` and `/admin/login` remain fail-closed **404**
- `https://nexcall.one/command` returns **200** and renders the private access form

Claude should keep the public UI honest and avoid any copy that implies the live deployment is current when it has not been reverified.

## If Claude finds a problem

### UI-only issue
Fix it in the UI lane, then re-run the smoke checks.

### Security or auth issue discovered during UI work
Stop and hand the finding to Codex with concrete evidence:
- exact route
- exact HTTP response
- screenshot or DOM proof if relevant
- whether it is source-only or live-runtime verified

## Bottom line

Claude owns the public UI and shell quality. The runtime is healthy again; focus on keeping the user-facing experience clean, accurate, and visually trustworthy without drifting into security changes.
