# MISATO Mission Control

Private, owner-only AI Mission Control system built on this NexCall codebase.

## What MISATO is

MISATO (Mission Intelligence System for Agent Task Operations) is a private command center for:
- project operations
- kanban mission tracking
- mock specialist agent registry
- approval-gated risky actions
- daily command review
- tactical log visibility

V1 is **mock-first**: no live external automation is executed.

---

## Owner-only access model

- No public signup flow is provided.
- Dashboard routes are protected by middleware.
- Only `OWNER_EMAIL` can create a valid owner session.
- Non-owner users are redirected to `/unauthorized`.
- Protected APIs require owner session.

Current owner default:

```env
OWNER_EMAIL=nexcall@proton.me
```

---

## Required environment variables

Minimum for MISATO dashboard auth:

```env
OWNER_EMAIL=nexcall@proton.me
ADMIN_DASHBOARD_TOKEN=replace_me
OWNER_SESSION_SECRET=replace_me_long_random
ADMIN_SESSION_SECRET=replace_me_long_random
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MISATO_DESKTOP_URL=https://your-private-vercel-url/misato
```

Core platform vars are still documented in `.env.example` (Supabase/Postgres, Stripe, Twilio, etc.) for legacy NexCall services.

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` then log in at `/login`.

Checks:

```bash
npm run lint
npm run build
```

---

## Deploy privately

Recommended:
- Vercel for private web app deployment
- Supabase Postgres/Auth for future v2 backing services

Deployment requirements:
1. Set `OWNER_EMAIL` and secure secrets in environment settings.
2. Keep project private and avoid public indexing.
3. Do not enable public signup routes.
4. Use branch -> preview -> owner approval -> production workflow.

See:
- `docs/DEPLOYMENT_PRIVATE_CHECKLIST.md`
- `docs/DESKTOP_WRAPPER_PLAN.md`
- `docs/DESKTOP_BUILD_INSTRUCTIONS.md`
- `docs/TAURI_DESKTOP_ROADMAP.md`

---

## Project structure (MISATO additions)

- `app/` — routes for command center, daily, projects, kanban, agents, missions, approvals, logs, memory, tools, settings, login
- `app/api/misato/*` — owner login/logout and mock command endpoint
- `components/misato/*` — tactical shell, HUD panels, command input
- `lib/misato/*` — brand constants, auth, mock typed data
- `middleware.ts` — owner route gate + existing API rate limiting
- `docs/plans/2026-05-24-misato-mission-control-plan.md` — implementation plan

---

## Security rules (v1)

- Secrets remain server-side.
- Session cookie is HTTP-only.
- Owner session signature uses HMAC.
- Risky actions are surfaced to Approval Gate (mock flow).
- No live email/social/deploy execution in MISATO v1.

---

## Project and agent scoping

- Mock data is project-tagged (`projectId`).
- Agent cards include project scope, risk, and blocked actions.
- UI emphasizes least-privilege and approval requirements.

---

## Approvals model

`/approvals` shows risky actions requiring explicit owner decision.

In v1, decisions are UI-only (mock).

---

## What is mocked in v1

- project/task/agent/approval/log stores
- MISATO command parser + orchestrator response
- approval decision buttons
- memory vault entries
- tool permission matrix

## What is real in v1

- owner-only route access middleware
- owner login endpoint and signed session cookie
- protected dashboard pages
- reusable tactical dashboard UI components

---

## How to add a new project

Edit `lib/misato/mock/data.ts` and append a `projects` entry (and related tasks/agents).

## How to add a new agent

Edit `lib/misato/mock/data.ts` in `agents` with:
- `projectId`
- `level`
- `allowedTools`
- `blockedActions`
- `requiresApprovalFor`

## How to add a tool policy

Edit `/app/tools/page.tsx` matrix now; move to DB table in v2.

---

## Connecting real agent runtime later (v2)

Planned next steps:
1. Move mock data to Supabase tables (`projects`, `tasks`, `agents`, `approvals`, `logs`, etc.).
2. Add real auth provider (Supabase Auth or NextAuth) with owner allowlist check.
3. Add orchestrator worker/webhook runtime with strict approval gate enforcement.
4. Add immutable audit logs and redaction controls.

---

## License notes

A repository `LICENSE` file was not detected during this migration pass. Before distribution/rehosting/rebranding release, add or confirm the upstream license and preserve all required notices.

---

## Known risks / TODO

- Replace token-based owner login with provider-backed auth (Supabase Auth) for production hardening.
- Add route/API integration tests for owner-only enforcement.
- Implement server-side persistent approval decisions and logs.
- Add explicit blocked-access log sink (without storing secrets).
- Add LICENSE file / legal attribution before public distribution.
