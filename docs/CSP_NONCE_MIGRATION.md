# CSP Nonce Migration

Last updated: 2026-06-06

Launch impact: non-blocking for request-demo launch, blocking for any claim of hardened nonce-based CSP.

## Current State

NexCall currently ships this production-compatible script policy:

```text
script-src 'self' 'unsafe-inline'
```

This is not the preferred end state. It is a compatibility concession for the current Next.js App Router bootstrap path on the active production app.

## Why `unsafe-inline` Is Still Present

- The live site uses Next.js App Router.
- Current production rendering still relies on framework-emitted inline bootstrap scripts.
- Removing `unsafe-inline` without a full nonce/hash rollout breaks hydration and route bootstrapping.
- The current launch mode does not expose a known user-controlled inline script sink on the public surface.

## Why This Is Not A Launch Blocker Today

Request-demo launch can proceed with this CSP if all of the following remain true:

- public input is server-side validated,
- private routes stay fail-closed,
- checkout remains disabled until real Stripe readiness exists,
- no reflected or stored XSS sink is found on the live public surface,
- the non-destructive security monitor continues to report zero findings.

## Migration Goal

Move from:

```text
script-src 'self' 'unsafe-inline'
```

to a nonce-based policy where framework and app scripts receive a request-scoped nonce and `unsafe-inline` can be removed.

## First Implementation Targets

### `C:\Users\pixel\Documents\Codex\Projects\ai receptionist\middleware.ts`

- generate a per-request nonce
- attach it to request/response headers
- build the CSP header using that nonce
- avoid reintroducing `unsafe-inline` once migration succeeds

### `C:\Users\pixel\Documents\Codex\Projects\ai receptionist\app\layout.tsx`

- read/pass nonce where framework/app-owned scripts or components need it
- ensure hydration still works
- ensure no user-controlled inline script is introduced

### `C:\Users\pixel\Documents\Codex\Projects\ai receptionist\next.config.mjs`

- confirm security header behavior does not conflict with middleware CSP
- avoid duplicate/conflicting CSP definitions
- keep production headers compatible with Vercel/Next.js App Router

## Proposed Migration Steps

1. Generate a per-request nonce in `middleware.ts`.
2. Pass the nonce through request headers or request context so App Router rendering can read it.
3. Apply the nonce to any app-owned scripts first.
4. Validate whether the current Next.js runtime can consistently nonce required bootstrap scripts without forcing an unacceptable rendering tradeoff.
5. Re-test:
   - homepage hydration
   - `/command`
   - admin auth flow
   - checkout disabled flow
   - CSP console errors
6. Remove `unsafe-inline` only after live verification succeeds.

## Known Risks

- Next.js nonce support can force more dynamic rendering than desired.
- Middleware/header nonce propagation must remain consistent across static and dynamic routes.
- A partial rollout can silently break hydration even if builds stay green.

## Owner Guidance

Treat this as tracked security debt, not as proof that the current site is insecure by itself.

Do not remove `unsafe-inline` in production until:

- the nonce wiring is complete,
- the live domain is tested,
- and the route contract still matches the request-demo launch posture.

## GO/NO-GO Rule

- Request-demo launch: GO, as long as no public XSS sink is found and the monitor remains clean.
- Full hardened CSP claim: NO-GO until nonce/hash-based CSP is implemented and `unsafe-inline` is removed from production.
- Full self-serve checkout launch: unrelated to CSP; still requires Stripe live-flow proof.
