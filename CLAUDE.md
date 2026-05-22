# NexCall — Design System & Project Context

## Product
AI receptionist service for local businesses. Answers calls, captures lead details, supports appointment requests, routes urgent calls, sends clean team handoffs.

**Core promise:** Never miss your next call.

## Audience
Owner-operators and small teams at local businesses (dental, salon, auto repair, legal, contractors, agencies). Non-technical, pragmatic, value practical results over AI buzzwords. Must trust before they act.

## Design Personality
**Operational. Human. Premium.**
Not robotic. Not hacker. Not generic SaaS. Feels like a real, capable front desk — calm, fast, reliable.

## Color System
| Token | Value | Usage |
|-------|-------|-------|
| Base bg | `#020403` | Page background |
| Surface | `#070b10` | Panels, cards |
| Accent | `#A8FF00` / `#BAFF39` | Status signals, active states, brand moments — use sparingly |
| Accent dim | `rgba(186,255,57,0.08)` | Card backgrounds, hover states |
| Border | `rgba(186,255,57,0.12)` | Panel borders |
| Text primary | `#f8fbff` | Headlines, important copy |
| Text secondary | `#93a09f` | Body copy |
| Text muted | `#4B5563` | Labels, microcopy |

## Typography
- Display/headings: Inter Tight, font-black (900), leading 0.88–0.95, negative tracking
- Body: system-ui stack, 400–600 weight
- Section labels: ALL CAPS, tracking-[0.2em], 0.7rem, lime accent, preceded by short lime rule
- Hierarchy: giant hero → section h2 → card h3 → body → label
- **Typography IS the design.** Headlines should feel bold and confident.

## Hero
- Headline: "Never miss your next call." — smooth CSS fade-in (NO scramble/glitch/random chars)
- Animation: `opacity: 0 → 1` with optional `translateY(20px → 0)`, 0.6–0.8s ease-out
- Reduced-motion: show final text immediately, no animation
- Layout shift: zero. Reserve space before animation starts.
- "next call." accented lime after settle (not during animation)

## Absolute Rules
- Never expose: Twilio, ElevenLabs, Cal.com, API routes, webhooks, models, env vars
- Never use: fake customer names, fake companies, fake star ratings, fake reviews
- Never break: Call Demo popup, /api/outbound-call, pricing/checkout, FAQ, live chat
- Never add: hacker UI, neon overload, cluttered hero, heavy gimmicks

## Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS v3
- Framer Motion (use sparingly — prefer CSS animations for critical paths)
- lucide-react for icons
- react-hook-form for forms

## Security
- API keys: server-side only, never referenced in client components
- PII in logs: masked (e.g. `+1******6578`)
- Rate limits: in-memory + Upstash Redis on /api/outbound-call
- CSP: configured in next.config.mjs
- Provider errors: sanitized before returning to client

## Key Components
- `components/ui/DecryptText.tsx` — **DEPRECATED for hero** (too glitchy). Use CSS fade-in instead.
- `components/ui/CountUpStat.tsx` — IntersectionObserver count-up, reduced-motion safe
- `components/ui/StatusStrip.tsx` — rotating lime status strip
- `components/sections/TrustStrip.tsx` — outcome chips + avatar initials
- All page sections inline in `app/page.tsx` (use client)

## Suggested Next Steps
- `/design-for-ai` — run full APPLIER workflow for implementation
- `/color` — refine the palette if needed
- `/fonts` — verify typography choices
- `/hone` — final quality pass before launch
