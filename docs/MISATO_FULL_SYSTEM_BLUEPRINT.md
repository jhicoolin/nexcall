# MISATO Mission Control — Full System Blueprint

> Status: **Blueprint only** (no execution)
> 
> Owner: `nexcall@proton.me`
> 
> Execution lock: Do not implement until owner explicitly says **"execute plan"**.

---

## 1) Executive Summary

MISATO Mission Control is a private, owner-only AI operations system layered into the NexCall codebase under private routes, with a future private `misato-agent` runtime and optional Windows desktop wrapper (`MISATO.exe`).

It is designed as a command center + orchestrator + specialist council model:
- **MISATO Core** = command layer for natural-language directives
- **MISATO Orchestrator** = decomposition, routing, risk detection
- **MISATO Council** = specialist subagents with scoped permissions
- **Approval Gate** = hard stop for risky actions
- **Logs + Memory Vault + Tool Access Control** = auditability + safety

V1 is mock-first and safe. V2 introduces persistence/runtime integration. V3 introduces controlled automation.

---

## 2) Full Architecture Diagram (Text)

```text
Owner (nexcall@proton.me)
        |
        v
[ Login / Owner Gate ]
        |
        v
[ /misato Command Center UI ]
        |
        v
[ MISATO Core Command Layer ]
        |
        v
[ MISATO Orchestrator ]
  |         |          |
  |         |          +--> Risk Engine --> Approval Gate --> Owner Decision
  |         |
  |         +--> Council Router --> Specialist Subagents (isolated)
  |                                - scoped memory
  |                                - scoped tools
  |                                - blocked actions
  |
  +--> Mission/Task State --> (V1 mock store -> V2 Supabase)

All actions --> System Logs (redacted)
Scoped summaries --> Memory Vault (no secrets)
Policy checks --> Tool Access Control

Deployment Path:
Git branch -> PR -> Vercel Preview -> Owner Approval -> Production

Desktop Path:
MISATO.exe (Tauri/Electron wrapper) -> private MISATO web app
(no local secrets, no auth bypass)
```

---

## 3) Repo Strategy

### Primary repos
1. **`nexcall`** (existing): public site + private MISATO app partition
2. **`misato-agent`** (future private mirror/fork): private runtime based on Hermes Agent

### Branch model
- `main`: protected production branch
- `feature/*`: implementation branches
- `misato/*`: blueprint/system branches
- `security/*`: auth/security hardening

### Protections
- PR required for main
- status checks required before merge
- no direct production pushes by agents
- no secrets committed

---

## 4) Desktop .exe Strategy

### Preferred
- **Tauri first** (lightweight, safer footprint)
- Electron fallback only if required

### Desktop constraints
- MISATO.exe opens private MISATO web UI
- desktop app does not store raw secrets
- desktop app does not bypass web auth
- web/backend remains source of truth
- wrapper updates only when shell changes

### Why later
Desktop wrapper is phase-delayed until web auth/safety/runtime are stable.

---

## 5) NexCall Public/Private Separation

### Public remains public
- NexCall website stays brand/public-facing
- MISATO must not appear on public marketing pages

### Private MISATO partition
- private pages under: `/misato/*`
- private API under: `/api/misato/*`
- owner auth required for all MISATO routes/APIs

### Security perimeter
- middleware guard + server-side checks
- unauthenticated -> `/login`
- non-owner -> `/unauthorized`

---

## 6) `misato-agent` Private Fork Strategy

Source inspiration: `https://github.com/nousresearch/hermes-agent`

### Rules
- keep fork/mirror **private**
- preserve MIT `LICENSE` + notices
- do not remove legal attribution
- do not commit secrets
- no public release by default

### Integration (future)
- `misato-agent` exposes controlled private interfaces
- MISATO web app communicates via private backend APIs
- no direct browser-to-agent secret path

---

## 7) MISATO Core Design

MISATO Core is the in-app AI command layer.

### Responsibilities
- parse natural language commands
- detect target project/context
- create mission + tasks
- call orchestrator for decomposition/routing
- return structured command report:
  - mission summary
  - project detected
  - agents assigned
  - subtasks created
  - risks detected
  - approval required
  - logs created
  - recommended next actions

### Execution mode by phase
- V1: mocked behavior
- V2: runtime-backed with persisted state
- V3: controlled real execution post-approval

---

## 8) MISATO Orchestrator Design

### Responsibilities
- convert broad requests into scoped subtasks
- route subtasks to best-fit council agents
- enforce role boundaries
- aggregate outputs into unified summary
- classify risk and route risky actions to Approval Gate
- log each handoff/action

### Guardrails
- no bypass of approvals
- no cross-project memory leakage
- least-privilege tool routing

---

## 9) MISATO Council / Subagent Design

Subagents (initial blueprint set):
- Strategy Agent
- UI Builder Agent
- Backend Agent
- Security Agent
- QA Agent
- Vercel Deploy Agent
- Business Ops Agent
- Marketing Agent
- Finance Agent
- Research Agent
- Claude UI Agent
- Hermes Architecture Agent

### Each subagent spec
- role
- abilities
- blocked actions
- allowed tools
- memory scope
- risk level
- permission level (1-5)
- approval rules
- logs

### Isolation defaults
- project-scoped context
- tool deny-by-default
- no secret access unless explicit and approved

---

## 10) Approval Gate Design

Approval Gate is mandatory for:
- production deploy
- env var changes
- DNS changes
- auth changes
- DB migrations
- data deletion
- email sending
- social posting
- server commands
- billing/payment changes
- exporting contacts
- enabling live automations

### Decision states
- Pending
- Approved
- Rejected
- Revision Requested

### Enforcement
No risky execution path can run without explicit owner approval.

---

## 11) Memory Vault Design

### Principles
- summaries only, no raw secrets
- project memory isolated by default
- agent memory scoped by role and project
- revocable entries

### Views
- project memory cards
- agent memory scopes
- revoked entries audit

---

## 12) Tool Access Control Design

Permission levels:
- **L1** Read-only
- **L2** Draft-only
- **L3** Edit with approval
- **L4** Approved automation
- **L5** Owner/admin only

### Policy model
- default deny
- explicit allow per agent/tool
- risky tools require approval flags
- all sensitive invocations logged

---

## 13) GitHub Communication Workflow

Agent collaboration occurs via repository artifacts:
- branches
- PRs
- issues
- comments
- commit messages
- `docs/agent-handoffs/*.md`
- `docs/agent-notes/*.md`

### Operational principle
GitHub is the asynchronous coordination bus for human + AI contributors.

---

## 14) Claude Handoff Workflow

Claude UI Agent scope:
- UI refinement, components, visual systems, UX polish

Claude UI Agent blocked from:
- auth logic
- middleware security
- secret handling
- production deploy settings
- live automation execution

Handoff format:
1. MISATO creates UI request brief
2. Claude UI Agent proposes UI diffs/specs
3. Security/owner checks
4. Merge only after approval

---

## 15) Vercel Deployment Workflow

```text
feature branch
  -> pull request
    -> Vercel preview deployment
      -> owner review/approval
        -> merge
          -> production deploy
```

### Hard constraints
- no direct production pushes by agents
- no env mutation by agents without approval
- deployment changes are approval-gated

---

## 16) UI/UX Layout Blueprint

### Visual system: MISATO Tactical HUD (original)
- black/graphite base
- red risk accents
- amber warning accents
- green safe/online signals
- cyan/blue data highlights
- tactical panel borders
- command strips
- log terminals
- desktop-first, responsive v1

### Page layout primitives
- left navigation rail
- top status/command bar
- main mission workspace
- right council/log stream
- optional bottom status strip

### Copyright guardrails
Do not copy exact Hermes layouts/assets.
Do not use copyrighted anime logos/likenesses/branding.

---

## 17) Data Model Blueprint

V1: mock in-memory/static store
V2: Supabase tables

Tables/entities:
- `projects`
- `tasks`
- `missions`
- `agents`
- `subagents`
- `approvals`
- `logs`
- `memory_entries`
- `tools`
- `agent_tool_permissions`
- `owner_settings`
- `council_sessions`
- `council_messages`
- `quick_links`
- `project_notes`

### Core relationship sketch
- project has many tasks/missions/agents/notes/links/logs
- mission has many tasks/logs/approvals
- agent/subagent has scoped tool permissions + memory entries
- council session has many council messages

---

## 18) Security Blueprint

Non-negotiables:
1. no secrets in frontend
2. no secrets in desktop bundle
3. no real env values committed
4. no raw tokens in logs
5. no public MISATO access
6. no public signup
7. no unauthenticated `/api/misato/*` access
8. no non-owner MISATO access
9. no direct prod deploy by agents
10. no live automations in v1
11. no agent approval bypass
12. no copyrighted anime assets
13. no removal of required license notices
14. no desktop auth bypass
15. no risky action without owner approval

Required env placeholders:
```env
OWNER_EMAIL=nexcall@proton.me
ADMIN_DASHBOARD_TOKEN=
OWNER_SESSION_SECRET=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=
```

---

## 19) V1 Scope (Mock-First)

Include:
- owner-only MISATO route/API guard
- `/misato/*` dashboard pages
- mock projects/tasks/missions/agents/council
- mock MISATO Core command parser
- mock orchestrator routing
- mock approval queue
- mock logs/memory/tools views

Exclude:
- live deploy execution
- live email/social posting
- live server command execution
- real production automation triggers

---

## 20) V2 Scope (Real Runtime + Persistence)

- Supabase persistence for core tables
- real sessioned approval decisions
- private `misato-agent` runtime integration
- secure backend APIs for orchestration
- stronger audit logging and redaction

---

## 21) V3 Scope (Controlled Automation)

- cron/event-driven workflows
- approval-enforced automated actions
- per-agent L4 automation lanes
- deployment assistant with explicit owner gates
- rollback and incident controls

---

## 22) Risks and Blockers

1. **License/attribution drift** in rebrand work
2. **Secret leakage** through logs/env mishandling
3. **Scope creep** (desktop/runtime too early)
4. **Auth bypass bugs** if middleware/API guards diverge
5. **Agent over-permissioning** without strict Tool Access Control
6. **Public/private route confusion** inside NexCall repo
7. **Premature automation** before approval pipeline is robust

---

## 23) Exact Implementation Phases (When Execution Is Approved)

### Phase 0 — Legal + Safety Baseline
- verify license obligations
- finalize security rules docs
- establish branch protections

### Phase 1 — Private Route Partition
- isolate `/misato/*` and `/api/misato/*`
- enforce owner auth boundaries

### Phase 2 — Tactical HUD Foundation
- shell/layout/nav/status framework
- design tokens + component primitives

### Phase 3 — Core Product Screens
- dashboard/daily/projects/kanban/agents/council/missions/approvals/logs/memory/tools/settings

### Phase 4 — MISATO Core + Orchestrator (Mock)
- command ingestion
- project detection
- subtask routing mock
- structured output + logs

### Phase 5 — Safety Systems Hardening
- approval workflow checks
- tool permission matrix enforcement
- sensitive action blockers

### Phase 6 — Vercel Private Workflow Hardening
- preview-first deployment flow
- production approval process docs/checks

### Phase 7 — Supabase + Runtime Integration (V2)
- persistence migration
- `misato-agent` private runtime connection

### Phase 8 — Desktop Wrapper (Post-Stability)
- Tauri wrapper
- auth-preserving launch
- no local secret storage

---

## 24) What Requires Owner Approval

- production deployments
- env var changes
- DNS changes
- auth/middleware policy changes
- DB migrations
- data deletion/export
- billing/payment config changes
- enabling real automations
- any secret-scope changes

---

## 25) What Not to Build Yet

- no public MISATO release
- no real deploy trigger from agents
- no live automation execution
- no direct agent-driven prod changes
- no desktop-first implementation before web hardening
- no secret-bearing local desktop storage

---

## Route Blueprint

- `/misato`
- `/misato/daily`
- `/misato/projects`
- `/misato/projects/[slug]`
- `/misato/kanban`
- `/misato/agents`
- `/misato/agents/[id]`
- `/misato/council`
- `/misato/missions`
- `/misato/approvals`
- `/misato/logs`
- `/misato/memory`
- `/misato/tools`
- `/misato/settings`
- `/login`
- `/unauthorized`

---

## Final Blueprint Constraint

This document is planning output only.

No coding, forking, repo creation, deployment, automation connection, or secret movement is authorized until owner explicitly says:

**"execute plan"**
