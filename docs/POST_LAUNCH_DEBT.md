# NexCall Post-Launch Debt

Last updated: 2026-06-06

These items are intentionally separate from the request-demo launch gate.

## Security Debt

- CSP nonce/hash migration so `script-src 'unsafe-inline'` can be removed safely
- broader automated parity coverage for secondary public pages
- optional deeper browser-driven accessibility sweeps in CI

## Product Debt

- explicit Stripe live-flow readiness proof before any self-serve checkout claim
- deliberate decision on whether `/command` should remain public-facing or be further narrowed

## Engineering Debt

- reduce homepage first-load JS further if future launches need tighter performance budgets
- continue separating generated/build-output assumptions from committed type references when Next.js changes

## Verification Debt

- add parity script invocation to a scheduled or manual pre-release workflow
- keep monitor expectations aligned whenever the public route contract changes
