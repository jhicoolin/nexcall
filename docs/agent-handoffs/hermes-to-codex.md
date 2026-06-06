# Handoff: Hermes → Codex Security Lane

**Date:** 2026-06-05
**From:** Hermes (Runtime Orchestrator)
**To:** Codex Security Agent (security hardening, proof, contract validation)

## Role definition

Codex owns the **security lane** only:
- route protection and fail-closed behavior
- middleware and header validation
- env validation and secret hygiene
- auth surface verification
- public/private route contract checks
- security smoke tests on live runtime behavior

Codex does **not** own UI polish, copy editing, spacing, or shell aesthetics unless those changes are required to prove a security outcome.

## Current runtime truth

Canonical local runtime: **`http://127.0.0.1:3010`**

Verified now:
- `GET /health` → **200 OK**
- `npm run build` → **passes**
- `npm run dev` → **starts cleanly after stale output cleanup**

## What was broken before this handoff

The runtime was failing because stale generated Next.js output had drifted from source.

### Observed failure mode
- dev startup could throw `MODULE_NOT_FOUND` for generated server artifacts
- `/health` could return **500** while the dev server was using stale cache/output
- webpack cache `ENOENT` noise appeared in `.next/cache/webpack/client-development`
- the source tree itself was not the root cause

### Resolved root cause
- stale generated output was poisoning the runtime
- the validator had been pointing at a non-existent `app/command/route.ts` artifact while the source route is `app/command/page.tsx`

### Fixes already applied
- `scripts/clean-next-output.mjs` was added
- `predev` was added to clear stale output before dev
- `prebuild` was added to clear stale output before build
- `preanalyze` was added to clear stale output before analyze
- build output continues to use `.next-build` via `NEXT_DIST_DIR=.next-build`

### Important pitfall
- cleanup now runs in mode-specific form, so dev clears `.next`/`.next-fresh` while build/analyze clear only `.next-build`
- if the live runtime reports `ENOENT` for `routes-manifest.json`, `server/app/health/route.js`, or `server/pages/_document.js`, the first move is to clear stale generated output and relaunch the dev server
- if `/api/misato/secrets` prints `The system cannot find the path specified.`, check the gitleaks detection path first: the runtime now probes `gitleaks` with shell-less `where`/`which` and version probing via `execFileSync`, so that warning should be treated as a regression in detection plumbing rather than a route or auth failure

## Why Codex is being handed this lane

Codex is best used for **security and verification** now that the runtime is stable:
- prove route protection is correct
- make sure sensitive surfaces fail closed
- verify headers and no-store behavior on private routes
- confirm env/secret assumptions are not leaking into public behavior
- check that the live runtime matches the source contract, not just the build output

## Codex’s mission

### Primary tasks
1. Re-verify the security-sensitive routes and contracts:
   - `/admin`
   - `/admin/login`
   - `/command`
   - `/api/admin/*`
   - any other sensitive route that is supposed to fail closed
2. Confirm the live runtime still enforces the expected security posture after cleanup.
3. Check headers, cache policy, and access control on private surfaces.
4. Confirm the runtime is not accidentally reusing stale artifacts.

### Security proof standard
Treat these as separate checks:
1. source patched
2. build passes
3. live HTTP response verified
4. rendered DOM verified where relevant
5. endpoint smoke test verified
6. headers/security posture verified

Do **not** collapse them into one claim.

## Recommended verification commands for Codex

Use these as a baseline:

```bash
curl -i http://127.0.0.1:3010/health
curl -i http://127.0.0.1:3010/admin
curl -i http://127.0.0.1:3010/admin/login
curl -i http://127.0.0.1:3010/command
curl -i http://127.0.0.1:3010/api/admin/session
curl -i http://127.0.0.1:3010/api/admin/analytics
```

Expected directionally:
- admin surfaces should fail closed for anonymous access
- sensitive surfaces should not expose secrets or stale private data
- cache-control / no-store behavior should be present where required
- security headers should remain intact

## What Codex should watch for

- route drift between source and generated output
- stale-cache artifacts masquerading as app bugs
- auth/middleware regressions that only show up live
- missing or inconsistent security headers
- env validation that blocks the wrong thing or leaks the wrong thing
- mismatches between build-time success and live-runtime security behavior

## Do NOT touch

- UI-only copy polish unless it affects security proof
- layout/spacing/tone work
- design-system tweaks unrelated to security
- public marketing content
- cleanup script logic unless you have a concrete security reason

If it is a UI issue, hand it to Claude.

## Files most relevant to Codex

- `middleware.ts` or any auth/middleware entrypoints
- `app/admin/page.tsx`
- `app/admin/login/page.tsx`
- `app/command/page.tsx`
- `app/api/admin/**`
- `app/api/misato/**`
- `lib/misato/runtime/**`
- `next.config.mjs`
- `scripts/clean-next-output.mjs`
- `package.json`
- `docs/agent-handoffs/`
- `nexcall_collaboration_log.txt`

## Coordination rules

- Read the shared collaboration log first
- If a UI change affects the trust boundary, report it back to Claude
- Log meaningful checkpoints in the shared log with proof-oriented entries
- Keep this lane narrow: security, proof, and contract validation

## Shared log entry format

`[TIMESTAMP] AGENT: Task | RESULT: What changed | NEXT: What’s next`

## Current verified state

- Build passes: ✅
- Runtime health passes: ✅
- Stale output cleanup is automatic before dev/build/analyze: ✅
- Canonical runtime port is 3010: ✅

## Latest live truth

The request-demo launch contract is now GO on the security-sensitive surfaces, and the parity script is now the script-backed proof point. Recent verification showed:
- `https://nexcall.one/` serves the current honest homepage copy with request-demo wording
- `https://nexcall.one/health` returns **200** with minimal safe JSON
- `https://nexcall.one/checkout` returns **404**
- `https://nexcall.one/admin` and `/admin/login` remain fail-closed **404**
- `https://nexcall.one/command` returns **200** and renders the private access form
- `scripts/verify-production-parity.ps1` passes and suggests `GO FOR REQUEST-DEMO LAUNCH`

Codex should stay on security-sensitive verification only and avoid reintroducing the old `/health` 404 blocker loop or treating homepage copy drift as a request-demo blocker.

## If Codex finds a problem

### Security issue
Fix it, then re-run the live proof commands until the behavior is verified.

### UI-only issue found during security work
Stop and hand it to Claude with concrete evidence:
- exact route
- exact HTTP response
- screenshot or DOM proof if relevant
- whether it is source-only or live-runtime verified

## Bottom line

Codex owns the security posture and proof. Keep the live app honest: fail closed where required, keep headers and cache policy correct, and verify the runtime directly instead of trusting stale generated artifacts.
