# LAUNCH GREEN CHECKLIST

## Current status

- Route/security contract remains green on the live domain.
- Local UI rebuild is now visually acceptable on desktop and mobile according to screenshot review.
- The current script-backed parity run is **NO-GO** until the homepage redesign is deployed publicly.
- Vercel deployment SHA has **not yet been publicly re-proved** from an extractable signal in this turn.

## A. Production route proof

- [ ] `/` → 200
- [ ] `/health` → 200 with minimal safe JSON only
- [ ] `/command` → 200
- [ ] `/checkout` → 404 in request-demo mode
- [ ] `POST /api/checkout` → 503 while Stripe checkout is disabled
- [ ] `/admin` → 404
- [ ] `/admin/login` → 404
- [ ] Common exposure paths blocked (`/.env`, `/.git/config`, `/api/debug`, `/server-status`)

## B. Security proof

- [ ] Monitor HighestSeverity: None
- [ ] Monitor FindingCount: 0
- [ ] Security headers present
- [ ] Admin fail-closed
- [ ] Checkout disabled
- [ ] No public secrets
- [ ] No provider leakage
- [ ] CSP debt documented

## C. Build proof

- [ ] lint
- [ ] typecheck
- [ ] build
- [ ] Vercel-mode build
- [ ] npm audit

## D. UI proof

- [ ] Buyer understands the offer within 5 seconds
- [ ] Mobile layout clean
- [ ] No fake claims
- [ ] No dark/cyberpunk vibe
- [ ] Diverse service-business feel
- [ ] CTA safe
- [ ] No checkout-live implication

## E. Docs proof

- [ ] Launch contract
- [ ] CSP migration
- [ ] Launch runbook
- [ ] Post-launch debt
- [ ] Repo organization plan
- [ ] Production parity script

## F. Final status

- [ ] Request-demo GO
- [ ] Full checkout NO-GO until Stripe proof
