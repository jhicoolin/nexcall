# NexCall Launch Readiness Checklist

Last updated: 2026-06-06

This checklist is for the request-demo launch state only. It does not authorize self-serve Stripe checkout.

## Accepted Launch Contract

- `/` returns `200`
- `/health` returns `200` with minimal safe JSON only
- `/command` returns `200`
- `/checkout` returns `404`
- `POST /api/checkout` returns `503`
- `/admin` returns `404`
- `/admin/login` returns `404`
- exposure paths remain blocked
- latest monitor reports `HighestSeverity: None` and `FindingCount: 0`

## Script-Backed Verification

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-parity.ps1
```

Optional non-production target:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-parity.ps1 -BaseUrl https://preview.example.com
```

Expected passing behavior:

- exits `0`
- confirms route statuses match the request-demo contract
- confirms required security headers are present
- confirms homepage markers include `Turn missed calls into next steps.` and `Request Setup`
- confirms homepage does not expose stale preview hosts, fake claims, provider leakage, or checkout-live promises
- confirms `/health` returns safe NexCall JSON without runtime or secret leakage

## NO-GO Triggers

- `/health` returns anything other than safe NexCall JSON
- `/checkout` becomes public while Stripe live readiness is still unproven
- `POST /api/checkout` stops returning `503` in request-demo mode
- `/admin` or `/admin/login` stop failing closed
- homepage implies live checkout or self-serve payment readiness
- monitor reports anything other than `HighestSeverity: None` and `FindingCount: 0`
- production parity script exits nonzero

## Build Proof

Run:

```powershell
cmd /c npm run lint
cmd /c npx tsc --noEmit
cmd /c npm run build
cmd /c npm audit --omit=dev
```

Expected:

- lint passes
- typecheck passes
- build passes
- `npm audit --omit=dev` reports `0` production vulnerabilities

## Monitor Proof

If the security monitor exists in the current repo, run it after parity:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\security\nexcall-security-scan.ps1
```

If that file is not present in this repo, do not invent a local substitute. Use the established NexCall monitor workspace and latest reports instead.

## Checkout Gate

Request-demo launch is allowed with checkout disabled.

Self-serve checkout remains a separate future gate and requires:

- live Stripe keys configured
- webhook proof
- end-to-end live purchase proof
- explicit product decision to enable public checkout

## Final Smoke Tests

- Request-demo homepage loads and hero says: "Turn missed calls into next steps." (no stale preview hostname, no fake claims).
- Public pages load: `/about`, `/ai-disclosure`, `/refund-policy`, `/privacy`, `/terms`, `/compliance`, `/cookie-notice`, `/accessibility`, `/legal`.
- Live chat opens, closes, answers buyer questions, refuses stack details, and routes to human follow-up.
- Experience NexCall uses the compact call-flow preview and pushes visitors toward request-demo setup.
- Call Demo opens, formats phone numbers, and only shows success after provider acceptance.
- Checkout stays disabled in request-demo mode; visible purchase CTAs must not imply live self-serve Stripe checkout.
- Checkout success and cancel pages match the dark NexCall theme.
- `/api/voice/schedule` accepts flexible voice-agent scheduling payloads.
- Contact/demo/checkout/call-demo leads are captured or notified.
- No public page or chat response exposes provider names, API routes, prompts, models, env names, or fallback architecture.
- Mobile checks: 320, 375, 390, 430, tablet, desktop.
- `npm run lint`, `tsc --noEmit`, and `npm run build` pass.
