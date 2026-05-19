# AI Receptionist

Launch-ready Next.js sales site for an AI receptionist business.

## What Is Included

- Warm, diverse homepage with scenario demos and industry sections
- Multi-scenario voice demo UI with browser speech playback
- Hugging Face voice lab section and optional server-side TTS route
- Collapsed live chat with Hugging Face question-answering and human follow-up tabs
- Stripe Checkout API route for monthly/yearly subscriptions
- Stripe webhook receiver for successful checkout events
- Checkout success and cancel pages
- Lead capture webhook route
- Twilio voice webhook forwarding route
- Calendar booking webhook route
- Per-client phone, voice-agent, lead, and calendar routing through Postgres tenants
- Database-first tenant routing with Prisma/Postgres
- Upstash rate limiting middleware for API cost protection
- Inngest background jobs for calendar, summaries, and SMS retries
- Protected admin dashboard for tenants, prompts, voice routing, and analytics
- Protected client lookup endpoint for voice-agent platforms and internal tooling
- About / mission page
- Legal and transparency pages for privacy, terms, refunds, AI disclosure, compliance, cookies, and accessibility
- Full launch checklist in `docs/LAUNCH_SETUP.txt`

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Before deploying:

```bash
npm run lint
npm run build
```

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the execution policy.
Stop any running `npm run dev` server before `npm run build`; running both at the same time can overwrite the local `.next` folder during testing.

## Important Setup File

Read:

```text
docs/LAUNCH_SETUP.txt
```

That file tells you exactly what to buy, what accounts to create, what environment variables to paste, and how to deploy the site.

Also read:

```text
docs/UX_RESEARCH_NOTES.txt
```

That file explains the page order and conversion/credibility logic behind the layout.

For voice model choices, read:

```text
docs/VOICE_LAB_RESEARCH.txt
```

That file explains the Hugging Face voice shortlist, the optional scenario-only TTS route, and why uploaded MP3 clips are still the safest public-launch demo layer.

For live chat setup, read:

```text
docs/LIVE_CHAT_SETUP.txt
```

That file explains the collapsed chat tab, tenant-aware quick-answer route, safety shutoff, and human handoff flow.

For security notes, read:

```text
docs/SECURITY_NOTES.txt
```

That file explains what has been hardened and what still needs to be handled before public launch.

For client phone routing and AI receptionist operations, read:

```text
docs/CLIENT_OPERATIONS_SETUP.txt
```

That file explains how to add each business, route Twilio numbers, connect a voice agent, forward leads, and automate Google Calendar bookings.

For the backend-only multi-tenant engine, read:

```text
docs/BACKEND_MULTI_TENANT_ENGINE.txt
```

That file covers the strict tenant schema, Twilio switchboard, WebSocket media bridge, Hugging Face STT/LLM/TTS pipeline, booking extractor, and Vercel DNS checklist.

For the enterprise security/database/voice/jobs/admin upgrade, read:

```text
docs/ENTERPRISE_OVERHAUL_REPORT.txt
```

## File Guide

Read:

```text
docs/PROJECT_FILE_GUIDE.txt
```

That file explains what every project file is for. Some files keep framework-required names like `page.tsx` and `route.ts`; renaming those would break Next.js routing.

## MarcoPolo Copy

A portable source bundle is ready here:

```text
archives/ai-receptionist-source.zip
```

Read:

```text
docs/MARCOPOLO_UPLOAD_INSTRUCTIONS.txt
```

That file explains what belongs in the MarcoPolo workspace folder and why generated folders like `node_modules` and `.next` are excluded.

## Core Files

- `app/page.tsx` - homepage
- `app/about/page.tsx` - mission/about page
- `app/legal/page.tsx` - legal and transparency center
- `app/privacy/page.tsx` - privacy policy
- `app/terms/page.tsx` - terms of service
- `app/refund-policy/page.tsx` - refund policy
- `app/ai-disclosure/page.tsx` - AI transparency disclosure
- `app/compliance/page.tsx` - compliance notice with no false certification claims
- `app/cookie-notice/page.tsx` - cookie notice
- `app/accessibility/page.tsx` - accessibility statement
- `app/api/checkout/route.ts` - Stripe Checkout session creation
- `app/api/stripe/webhook/route.ts` - Stripe webhook receiver
- `app/api/chat/huggingface/route.ts` - tenant-aware front-desk chat route
- `app/api/leads/route.ts` - lead capture forwarding
- `app/api/twilio/voice/route.ts` - Twilio voice forwarding
- `app/api/tts/huggingface/route.ts` - optional Hugging Face TTS generation
- `app/api/calendar-booking/route.ts` - booking webhook forwarding
- `app/api/ai/respond/route.ts` - tenant-aware AI turn processor for live calls
- `app/api/inngest/route.ts` - Inngest durable background job endpoint
- `app/api/admin/*` - protected admin APIs
- `app/admin/page.tsx` - protected admin dashboard
- `app/api/clients/lookup/route.ts` - protected client lookup for voice-agent platforms
- `lib/client-directory.ts` - compatibility exports for the database tenant repository
- `lib/tenant-repository.ts` - database-first tenant repository
- `prisma/schema.prisma` - Supabase/Postgres schema
- `middleware.ts` - Upstash API rate limiting
- `lib/huggingface-receptionist-pipeline.ts` - STT, LLM, TTS, and Twilio audio conversion pipeline
- `services/receptionist/*` - master prompt, business knowledge, safety shutoff, and web chat engine
- `inngest/functions.ts` - retrying background jobs
- `scripts/twilio-media-server.mjs` - standalone WebSocket bridge for Twilio Media Streams
- `lib/live-chat-knowledge.ts` - approved context and fallback answers for live chat
- `lib/huggingface-voice-lab.ts` - Hugging Face model shortlist and scenario mapping
- `.env.example` - all required configuration placeholders
