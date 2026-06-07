# NexCall Request-Demo Release Notes

Status: GO FOR REQUEST-DEMO LAUNCH

This document anchors the verified request-demo release posture for NexCall. It is intentionally focused on the public launch contract, rollback expectations, and the proof required to keep launch claims honest.

## Release Snapshot

- Production domain: `https://nexcall.one`
- Canonical verification rule:
  - the exact release SHA must match `origin/main`
  - the Vercel production deployment must report the same GitHub commit SHA
  - the rollback anchor must be the latest matching `nexcall-request-demo-go-*` annotated tag
- Exact deployment SHA, deployment ID, and tag name must be refreshed in the final technical verification report for the current release cycle.

## Route Contract

- `/` returns `200`
- `/health` returns `200` with safe JSON only:
  - `{"ok":true,"service":"nexcall","status":"healthy"}`
- `/command` returns `200`
- `/checkout` returns `404`
- `POST /api/checkout` returns `503`
- `/admin` returns `404`
- `/admin/login` returns `404`
- common exposure paths remain blocked or `404`

## Security Posture

- Admin routes remain fail-closed for anonymous traffic.
- Checkout remains intentionally disabled for public self-serve use.
- Public security headers are present:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `X-Content-Type-Options`
  - `Permissions-Policy`
  - clickjacking protection via `X-Frame-Options` or `frame-ancestors`
- `/health` stays minimal and does not expose runtime internals.
- Public forms and checkout-disabled flows stay under existing validation and rate-limiting controls.

## Homepage Status

- Warm homepage rebuild is live.
- Public hero and CTA posture remain request-demo-first.
- No public checkout CTA is exposed.
- No fake metrics, fake testimonials, preview-host leakage, or provider leakage are part of the verified public homepage.

## Verification Status

- Install path: `npm ci` now triggers Prisma client generation via `postinstall`
- Secret hygiene: `npm run secrets:scan` passes and writes the redacted gitleaks report under `.security/`
- Lint: pass
- Typecheck: pass
- Build: pass
- Vercel-mode build: pass
- `npm audit --omit=dev`: `0` production vulnerabilities
- `scripts/verify-production-parity.ps1`: pass
- Latest external NexCall monitor status:
  - `HighestSeverity: None`
  - `FindingCount: 0`

## SEO Hygiene

- `app/robots.ts` allows only safe public marketing routes for indexing.
- `app/sitemap.ts` includes only:
  - `/`
  - `/about`
- Private, admin, API, health, checkout, and internal runtime paths are excluded from indexing.

## Known Non-Blocking Debt

- CSP still uses `script-src 'unsafe-inline'` for current Next.js compatibility and remains tracked security debt.
- Public self-serve Stripe checkout remains intentionally disabled until separate live-payment proof exists.
- Full-tree `npm ci` may report a non-production vulnerability in dev tooling; release proof is based on `npm audit --omit=dev`.
- The local `next-env.d.ts` file can drift under different build modes; keep it out of release-scope churn unless verification actually requires correction.

## Rollback

- Roll back to the latest verified request-demo release tag if a regression is introduced.
- After rollback:
  - redeploy the tagged commit
  - rerun `scripts/verify-production-parity.ps1`
  - confirm the accepted route contract
  - confirm `https://nexcall.one/health` still returns the safe JSON payload
