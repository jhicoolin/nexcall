# NexCall Launch Runbook

Last updated: 2026-06-06

## Launch Mode

- current mode: request-demo / request-setup
- public self-serve checkout: disabled
- admin surface: private and fail-closed

## Pre-Launch Commands

Run from the active NexCall repo:

```powershell
cmd /c npm run lint
cmd /c npx tsc --noEmit
cmd /c npm run build
cmd /c npm audit --omit=dev
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-parity.ps1
```

If the repo contains the monitor:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\security\nexcall-security-scan.ps1
```

## Passing State

Passing request-demo launch means:

- homepage returns `200`
- `/health` returns safe minimal NexCall JSON
- `/command` returns `200`
- `/checkout` returns `404`
- `POST /api/checkout` returns `503`
- `/admin` and `/admin/login` return `404`
- common exposure paths stay blocked
- parity script exits `0`
- latest monitor state is `HighestSeverity: None` and `FindingCount: 0`

## NO-GO Triggers

- parity script exits nonzero
- monitor reports new findings above `None`
- homepage implies live checkout
- live production serves stale preview-host metadata
- `/health` exposes runtime, secret, provider, or MISATO details
- admin routes render any public HTML

## Live Verification

After pushing to `main`, verify production:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-parity.ps1 -BaseUrl https://nexcall.one
```

This is the source-of-truth production parity check for request-demo launch.

## Stripe Gate

Stripe self-serve launch is not covered by request-demo GO.

It remains blocked until:

- live mode keys are configured
- webhook verification is proven end to end
- a real live purchase flow is tested successfully
- product owners intentionally switch public checkout on
