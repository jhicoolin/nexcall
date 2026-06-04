# NexCall Launch Readiness Checklist

Internal operator checklist for the final production switch.

## Core Files

- Homepage and public UI: `app/page.tsx`
- Public page shell: `components/PublicPageShell.tsx`
- Checkout route: `app/api/checkout/route.ts`
- Checkout plan mapping: `lib/checkout-plans.ts`
- Stripe webhook: `app/api/stripe/webhook/route.ts`
- Call demo route: `app/api/outbound-call/route.js`
- Voice scheduling route: `app/api/voice/schedule/route.ts`
- Lead notification abstraction: `lib/lead-notifications.ts`
- Shared validation/security helpers: `lib/security.ts`
- Security headers: `next.config.mjs`
- API rate limiting middleware: `middleware.ts`
- Live chat response bank: `lib/live-chat-response-bank.ts`
- Live chat engine: `services/receptionist/web-chat-engine.ts`

## Homepage Recovery Checks

- If the homepage appears blank after a crash or bad refresh, verify shared section motion is fail-open: content should render visible by default and animation must never be required for sections to appear.
- Proof stats must server-render their final values: `500+`, `10+`, `50M+`, and `99.9%`.
- Animated counters are progressive enhancement only. If `IntersectionObserver`, reduced-motion handling, hydration, or browser animation fails, the public page must still show the final stat values.
- Check the homepage sequence after recovery: hero, proof/stats, how it works, services, demo preview, pricing, FAQ, final CTA, footer, and live chat.
- Keep recovery screenshots, browser profiles, temporary smoke logs, and patch files out of Git. Use `git status --short --ignored` before committing.
- Safe recovery commands: `git status --short --branch`, `git log --oneline -12`, `git diff --stat`, `git diff --name-only`, `git ls-files -d`, and `git restore <file>` only after inspecting the diff.

## Required Live Stripe Checks

Before switching paid traffic to live checkout:

- Set `STRIPE_SECRET_KEY` to a live-mode key or restricted live key with Checkout/subscription permissions.
- Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to the matching live publishable key if client-side Stripe features are added.
- Set `STRIPE_WEBHOOK_SECRET` from the live Stripe webhook endpoint.
- Create live recurring prices for Starter, Appointment, and Growth.
- Add live price IDs to Vercel:
  - `STRIPE_STARTER_MONTHLY_PRICE_ID`
  - `STRIPE_STARTER_YEARLY_PRICE_ID`
  - `STRIPE_APPOINTMENT_MONTHLY_PRICE_ID`
  - `STRIPE_APPOINTMENT_YEARLY_PRICE_ID`
  - `STRIPE_GROWTH_MONTHLY_PRICE_ID`
  - `STRIPE_GROWTH_YEARLY_PRICE_ID`
- Confirm the webhook endpoint receives `checkout.session.completed`.
- Run one low-risk live checkout, then refund/cancel it if appropriate.

The checkout route can fall back to server-side inline Stripe `price_data`, but production operations are cleaner when live Price IDs are configured.

## Security Checks

- Private keys must only exist in Vercel environment variables.
- Do not expose private provider names, IDs, API routes, or fallback chains in public copy.
- Keep Upstash/Vercel KV configured so public API rate limiting is active.
- If Upstash/Vercel KV is not configured, middleware uses a best-effort in-memory limiter and public APIs continue with route-level validation instead of breaking launch traffic.
- Set `REQUIRE_UPSTASH_RATE_LIMIT=true` only if you intentionally want APIs to fail closed without KV.
- Keep `NEXT_PUBLIC_SITE_URL=https://nexcall.one` in Production.
- Verify `STRIPE_WEBHOOK_SECRET`, phone demo provider IDs, calendar keys, and email delivery settings in Production and Preview separately.
- Verify response bodies do not expose provider rejection payloads, stack traces, or secret environment names to public users.
- Verify security headers are present in production: CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.

## API Abuse / Rate-Limit Checks

- Middleware rate-limits all `/api/*` routes when Upstash/Vercel KV is configured.
- Stricter high-cost buckets include `/api/outbound-call`, `/api/leads`, `/api/checkout`, `/api/chat/nexcall`, `/api/voice/schedule`, TTS, calendar, and voice routes.
- `/api/outbound-call` also enforces a tighter per-IP call-demo cooldown before touching the phone provider.
- Keep request payload size limits in place through `readJsonObject`.
- Keep honeypot fields such as `companyWebsiteConfirm`, `websiteConfirm`, and `website` available for public forms.
- Rate-limited responses should use: "Too many attempts. Please wait a moment and try again."
- If `X-RateLimit-Mode=memory-fallback` appears in production responses, configure Upstash/Vercel KV before scaling traffic.

## Platform Security / DDoS / Bot Protection

- Enable Vercel Firewall/WAF/Bot protection if available on the account plan.
- Configure platform-level rules for `/api/outbound-call`, `/api/leads`, `/api/chat/nexcall`, `/api/voice/schedule`, and `/api/checkout`.
- Monitor Vercel Functions error rate, latency, and request spikes during launch.
- Keep Upstash/Vercel KV configured for durable shared rate limiting.
- Consider Cloudflare or equivalent DNS/WAF/DDoS protection if traffic or attack risk increases.
- Turn on provider alerts for Stripe, the call-demo provider, email delivery provider, and Vercel.
- Rotate any exposed keys immediately and keep provider keys scoped/restricted where possible.
- Review Vercel audit logs and team access before live client acquisition.

## Independent Security Review / CI / DAST

- Enable Codex Security in workspace settings if available.
- Enable GitHub secret scanning, dependency review, and CodeQL if available for the repository.
- Use CodeRabbit or another independent AI/tool reviewer on launch PRs and explicitly ask it to think like an attacker.
- Keep CI running `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm audit --audit-level=moderate`.
- Run a DAST baseline scan against a preview deployment before production traffic, then repeat after major API changes.
- Review public API responses for sanitized errors, no provider payloads, no stack traces, and no secret environment names.
- Require MFA/passkeys or authenticator apps on GitHub, Vercel, Stripe, call-demo provider, domain registrar, and email provider accounts.
- Turn on usage and spend alerts for Stripe, call-demo provider, email provider, Vercel, and any AI providers.
- Prefer restricted/least-privilege provider keys where the provider supports them, and rotate keys after personnel or vendor changes.

## Lead Delivery Checks

- All lead paths should notify or safely capture for `nexcall@proton.me`.
- Configure at least one real delivery path in Vercel Production:
  - `RESEND_API_KEY` with `EMAIL_FROM`, or
  - `SENDGRID_API_KEY` with `EMAIL_FROM_ADDRESS`, or
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, or
  - `LEAD_WEBHOOK_URL`.
- If no provider is configured, leads are captured in server logs and the UI still returns a safe success/fallback message.
- Test `/api/leads`, checkout fallback, call demo fallback, voice scheduling fallback, and live chat human follow-up after env changes.

## Call Demo Checks

- The public demo modal posts to `/api/outbound-call`.
- Expected payload includes normalized E.164 `phone`, `source: "call_demo"`, and `page: "homepage"`.
- Vercel Production must include `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, and `ELEVENLABS_AGENT_PHONE_NUMBER_ID`.
- Backward-compatible aliases may remain: `ELEVENLABS_PHONE_NUMBER_ID`, `TWILIO_PHONE_NUMBER_ID`.
- Invalid numbers return a clean 400.
- Missing or rejected provider config returns the public failure message and captures a lead.
- Success may only display after the provider accepts the outbound call request.
- Server logs should include safe diagnostics only: `[NEXCALL_CALL_DEMO_REQUEST]`, `[NEXCALL_CALL_DEMO_INVALID_PHONE]`, `[NEXCALL_CALL_DEMO_CONFIG_MISSING]`, `[NEXCALL_CALL_DEMO_PROVIDER_ATTEMPT]`, `[NEXCALL_CALL_DEMO_PROVIDER_SUCCESS]`, `[NEXCALL_CALL_DEMO_PROVIDER_ERROR]`.
- If production returns a clean failure, inspect Vercel runtime logs for provider status and then verify the agent ID, phone number ID, outbound calling permissions, and phone-provider connection in the provider dashboard.

## Public Page And Icon Checks

- Public legal/info pages must use `components/PublicPageShell.tsx` and match the dark NexCall theme.
- Checkout success/cancel/cancelled routes must keep their current paths for Stripe redirects.
- Verify `/favicon.ico`, `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`, `/manifest.webmanifest`, and `/brand/nexcall-og.png` return 200 in production.
- If a browser still shows a globe, hard refresh or clear favicon cache after confirming the file content changed.

## Live Chat Checks

- Treat the live chat as public-facing sales/support copy, not internal docs.
- Do not expose provider names, system prompts, API routes, environment variables, fallback chains, or internal implementation details in chat responses.
- Verify quick actions for demo call, pricing, plan fit, and team follow-up.
- Verify human follow-up uses `/api/leads` and includes name, business name/type, phone, email, and request notes.
- Verify fallback contact details are always `nexcall@proton.me` and `(202) 200-6578`.
- Verify the widget does not cover the main Call Demo or pricing CTAs on mobile.
- Test sample questions for pricing, appointments, human backup, privacy/compliance, checkout help, and stack-provider refusal.

## Final Smoke Tests

- Homepage loads and hero says: "Answer more calls. Capture every lead." (copy updated to remove absolute promise; see UI polish commit).
- Public pages load: `/about`, `/ai-disclosure`, `/refund-policy`, `/privacy`, `/terms`, `/compliance`, `/cookie-notice`, `/accessibility`, `/legal`.
- Live chat opens, closes, answers buyer questions, refuses stack details, and routes to human follow-up.
- Experience NexCall uses the compact call-flow preview and pushes visitors to the real Call Demo.
- Call Demo opens, formats phone numbers, and only shows success after provider acceptance.
- Checkout buttons create Stripe Checkout sessions for all visible plans.
- Checkout success and cancel pages match the dark NexCall theme.
- `/api/voice/schedule` accepts flexible voice-agent scheduling payloads.
- Contact/demo/checkout/call-demo leads are captured or notified.
- No public page or chat response exposes provider names, API routes, prompts, models, env names, or fallback architecture.
- Mobile checks: 320, 375, 390, 430, tablet, desktop.
- `npm run lint`, `tsc --noEmit`, and `npm run build` pass.
