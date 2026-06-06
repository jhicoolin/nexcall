# NexCall Request-Demo Launch Contract

## Final request-demo route contract

| Route | Expected behavior | Notes |
| --- | --- | --- |
| `/` | 200 | Current honest homepage copy; no stale preview hostname; no fake claims. |
| `/health` | 200 with minimal safe JSON | Safe public health probe for uptime and deployment parity; must not expose secrets, provider details, database status, MISATO runtime data, deployment metadata, or internal route information. |
| `/command` | 200 | Private access form / command surface only. |
| `/checkout` | 404 in request-demo mode | Public self-serve checkout disabled. No misleading payment promise. |
| `POST /api/checkout` | 503 while checkout disabled | Generic disabled response only; no Stripe secrets or stack traces. |
| `/admin` | 404 | Fail-closed. |
| `/admin/login` | 404 | Fail-closed. |
| `/.env` | 404 or blocked | No exposure. |
| `/.git/config` | 404 or blocked | No exposure. |
| `/api/debug` | 404 or blocked | No exposure. |
| `/server-status` | 404 or blocked | No exposure. |

## Health monitoring rule

- `/health` 200 with safe JSON = PASS
- `/health` 404 = FAIL
- `/health` old MISATO/runtime payload = FAIL
- `/health` sensitive metadata = FAIL

## Launch posture

- Request-demo launch is the target.
- Stripe self-serve checkout remains disabled.
- CSP `unsafe-inline` is tracked debt, not a request-demo blocker unless a real XSS sink appears.

## Script-Backed Verification

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-parity.ps1
```

Expected passing behavior:

- exit code `0`
- route statuses match this contract
- homepage contains `Turn missed calls into next steps.` and `Request Setup`
- homepage does not expose stale preview hosts, fake claims, provider/model/API leakage, or live-checkout promises
- `/health` contains only safe NexCall health markers
- required security headers are present

NO-GO triggers:

- parity script exits nonzero
- `/health` leaks runtime, MISATO, database, secret, token, or provider details
- `/checkout` stops returning `404` before Stripe readiness is proven
- `POST /api/checkout` stops returning `503` in request-demo mode
- admin routes stop failing closed
