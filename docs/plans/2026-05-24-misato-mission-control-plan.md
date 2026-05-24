# MISATO Mission Control Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build MISATO as a private, owner-only command center in the NexCall repo, then add a lightweight early Tauri desktop scaffold (`MISATO.exe` path) without bypassing auth or exposing secrets.

**Architecture:** Keep Next.js App Router as source of truth (private web/backend), enforce strict owner-only routing for `/misato/*` and `/api/misato/*`, verify local web operation, then add a minimal desktop shell that opens the protected MISATO interface. V1 remains mock-first for orchestration/automation.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind, Tauri (preferred), Electron fallback only if Tauri is blocked.

---

## Phase 0 — Preflight / Legal / Safety

### Task 0.1: Repo and legal inventory
**Objective:** Establish current state and license constraints before edits.

**Files:**
- Inspect: `package.json`, `README*`, `LICENSE*`, `app/**/*`, `middleware.*`, `app/api/**/*`
- Create: `docs/audits/2026-05-24-misato-preflight.md`

**Steps:**
1. Confirm repo root, branch, dirty files.
2. Detect `LICENSE` and classify obligations.
3. Record allowed/prohibited actions for private use/rebrand/distribution.
4. Record current auth and route protection status.

### Task 0.2: Risk boundaries doc
**Objective:** Lock non-negotiable safety boundaries before coding.

**Files:**
- Create: `docs/security/misato-v1-boundaries.md`

**Steps:**
1. Enumerate risky actions requiring Approval Gate.
2. Define mock-only execution policy.
3. Define secret handling + log redaction rules.

---

## Phase 1 — Owner-only security perimeter first

### Task 1.1: Owner env schema and config
**Objective:** Enforce owner identity from environment.

**Files:**
- Modify: `.env.example`
- Create/Modify: `lib/misato/auth.ts` (or existing auth helper)

**Steps:**
1. Enforce `OWNER_EMAIL=nexcall@proton.me` (normalized lowercase/trim).
2. Define owner session signing/verification rules.

### Task 1.2: Protect private MISATO web routes
**Objective:** Require owner auth for all `/misato/*` routes.

**Files:**
- Modify: `middleware.ts`
- Create/Modify: `app/login/page.tsx`, `app/unauthorized/page.tsx`

**Steps:**
1. Redirect unauthenticated requests to `/login`.
2. Redirect authenticated non-owner requests to `/unauthorized`.
3. Keep public NexCall pages separate from MISATO routes.

### Task 1.3: Protect private MISATO API routes
**Objective:** Block unauthorized access to `/api/misato/*`.

**Files:**
- Create: `lib/auth/ownerOnly.ts` (or equivalent helper)
- Modify: `app/api/misato/**/route.ts`

**Steps:**
1. Add reusable `assertOwner()` guard.
2. Apply guard to all MISATO API handlers.
3. Log denied attempts with sanitized metadata only.

---

## Phase 2 — Confirm MISATO web interface works locally

### Task 2.1: Local boot verification
**Objective:** Verify protected MISATO web app runs locally.

**Files:**
- Modify if needed: `README.md`

**Steps:**
1. Run `npm install`.
2. Run `npm run dev`.
3. Verify login flow and owner-only access to `/misato` and subroutes.
4. Verify unauthorized behavior for non-owner path.

### Task 2.2: Build/lint baseline
**Objective:** Ensure local quality gates are green before desktop scaffold.

**Steps:**
1. Run `npm run lint`.
2. Run `npm run build`.
3. Record any test-script gaps (`npm run test` if present).

---

## Phase 3 — Add lightweight Tauri desktop shell early

### Task 3.1: Initialize Tauri scaffold (minimal shell)
**Objective:** Add a minimal desktop wrapper that opens protected MISATO interface.

**Files:**
- Create/Modify: `src-tauri/**`
- Modify: `package.json`
- Create/Modify: desktop config docs under `docs/desktop/**`

**Steps:**
1. Initialize Tauri in minimal mode.
2. Configure dev URL to local MISATO web interface (e.g., `http://localhost:3000/login` or `/misato`).
3. Ensure no credentials/secrets are embedded in desktop config.

### Task 3.2: Auth integrity checks for desktop shell
**Objective:** Guarantee desktop wrapper does not bypass web auth.

**Steps:**
1. Confirm desktop opens protected web UI only.
2. Confirm owner login still required in wrapper.
3. Confirm no hidden local bypass token path exists.

### Task 3.3: Explicitly disable advanced desktop features (for now)
**Objective:** Keep scaffold safe and minimal.

**Steps:**
1. Do not add auto-update.
2. Do not add privileged local command bridges.
3. Do not add live automation triggers.

---

## Phase 4 — Desktop scripts and build docs

### Task 4.1: Add npm scripts for desktop dev/build (safe subset)
**Objective:** Make desktop workflows easy and repeatable.

**Files:**
- Modify: `package.json`

**Scripts target:**
- `desktop:dev` (runs Tauri dev shell)
- `desktop:build` (builds Windows package)

### Task 4.2: Document exact .exe build command
**Objective:** Provide single source of truth command for Windows exe build.

**Files:**
- Modify/Create: `README.md`, `docs/DESKTOP_WRAPPER_PLAN.md`

**Output:**
- Exact command to run
- Prerequisites (Rust/Tauri dependencies)

### Task 4.3: Document exact output path for generated .exe
**Objective:** Remove ambiguity on build artifact location.

**Files:**
- Modify/Create: `README.md`, `docs/DESKTOP_WRAPPER_PLAN.md`

**Output:**
- Exact folder path (Tauri output folder for this repo)
- Which file is installer vs standalone exe (if both produced)

---

## Phase 5 — MISATO Tactical HUD + core product routes

### Task 5.1: Tactical shell and UI primitives
**Files:** `components/misato/TacticalShell.tsx`, `components/misato/ui.tsx`, `app/globals.css`

### Task 5.2: Core protected MISATO pages
**Routes:**
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

(Each route: scaffold + mock-first data wiring + responsive pass.)

---

## Phase 6 — MISATO Core mock orchestration + council

### Task 6.1: Command intake + parser (mock)
### Task 6.2: Orchestrator routing (mock)
### Task 6.3: Council agent assignment/result aggregation (mock)
### Task 6.4: Risk detection + Approval Gate handoff (mock)

Constraints:
- no live automations
- no deploy execution
- no secret-bearing logs

---

## Phase 7 — Final checks + docs + readiness report

### Task 7.1: Verification commands
Run:
- `npm run dev` (manual verification)
- `npm run lint`
- `npm run build`
- `npm run test` (if configured)
- desktop dev command
- desktop build command

### Task 7.2: Required operator handoff output
Must show:
1. How to run MISATO desktop in dev mode
2. How to build Windows `.exe`
3. Where `.exe` is generated
4. What still needs Claude UI polish

### Task 7.3: Compliance matrix
Map each non-negotiable to PASS/FAIL with evidence.

---

## Acceptance Criteria (Updated)

1. `/misato/*` is owner-only.
2. `/api/misato/*` is owner-only.
3. MISATO web interface works locally behind auth.
4. Minimal Tauri shell launches and points to protected MISATO interface.
5. Desktop app stores no secrets.
6. Desktop app does not bypass auth.
7. npm desktop scripts exist (if safe in repo environment).
8. Exact Windows `.exe` build command documented.
9. Exact output directory for `.exe` documented.
10. Auto-update is not enabled.
11. Live automations remain disabled.

---

## Open blockers
1. If `LICENSE` is absent/unclear in target repo state, legal distribution posture must be documented as constrained.
2. Tauri prerequisites on Windows (Rust/MSVC/WebView2 tooling) may require environment setup.
3. Existing uncommitted changes must be isolated on a dedicated branch before execution.

---

## Execution lock
No implementation is authorized until owner explicitly says: **"execute plan"**.
