# NexCall Request-Demo Launch Contract

Last updated: 2026-06-06

This document defines the expected public behavior for the live NexCall launch state while self-serve Stripe checkout remains disabled.

## Launch Mode

- Launch mode: request-demo / request-setup
- Public self-serve checkout: disabled
- Admin surface: private and fail-closed
- Public health endpoint: safe public uptime/parity probe

## Public Route Contract

| Route | Expected behavior | Reason |
| --- | --- | --- |
| `/` | `200` with current honest homepage copy | Public marketing site must stay available |
| `/health` | `200` with minimal safe JSON | Safe public health probe for uptime and deployment parity; must not expose secrets, provider details, database status, or internal runtime metadata. |
| `/command` | `200` private access form only | Operator entry exists, but no sensitive data is rendered without auth |
| `/checkout` | `404` | There is no public self-serve checkout page in request-demo mode |
| `POST /api/checkout` | `503` with generic disabled message | Checkout is intentionally disabled until Stripe readiness is proven live |
| `/admin` | `404` | Private admin route must fail closed |
| `/admin/login` | `404` | Private admin login route must fail closed |

## Security Header Contract

The public site is expected to return:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Sensitive/private routes are additionally expected to return:

- `Cache-Control: no-store, max-age=0`
- `Pragma: no-cache`
- `X-Robots-Tag: noindex, nofollow`

## Checkout Contract

The following must remain true unless Stripe is deliberately enabled and verified:

- `NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED` is not treated as live unless explicitly set to `true`
- public CTAs must not imply that payment is currently available
- `POST /api/checkout` must not create a live Stripe session
- no public route should send users to a broken self-serve `/checkout` page

## Monitoring Contract

The non-destructive NexCall security monitor should treat the public `/health` probe as a required parity check.

Launch-safe monitoring expectations are:

- `/health` must return `200` with only `{ "ok": true, "service": "nexcall", "status": "healthy" }`
- `/admin` must remain `404`
- common exposure paths must remain blocked
- header checks must continue to pass
- `/health` returning `404` after deployment is a parity failure
- `/health` returning MISATO/runtime metadata or sensitive fields is a security failure

## Escalation Rule

If live behavior diverges from this contract:

1. verify live behavior with direct route checks,
2. compare against the active repo,
3. treat any disagreement as deployment/cache drift until disproven,
4. do not patch unrelated code to compensate for stale production.
