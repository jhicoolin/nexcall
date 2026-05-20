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
- Keep `NEXT_PUBLIC_SITE_URL=https://nexcall.one` in Production.
- Verify `STRIPE_WEBHOOK_SECRET`, phone demo provider IDs, calendar keys, and email delivery settings in Production and Preview separately.

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

- Homepage loads and hero says: "Never miss your next call."
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
