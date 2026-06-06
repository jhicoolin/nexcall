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
