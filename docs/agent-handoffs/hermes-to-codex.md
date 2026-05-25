# Handoff: Hermes → Codex Reliability Lane

**Date:** 2026-05-25
**From:** Hermes (Runtime Orchestrator)
**To:** Codex Reliability Lane (Backend, runtime, security, endpoint proof)

## Verified Runtime State

- **Base URL:** `http://127.0.0.1:3010` (single canonical port)
- **Branch:** `misato-claude-ui`
- **Build:** `npm run build` ✅ (Next.js 15.5.18)
- **Start:** `PORT=3010 npm run start` ✅
- **Runtime:** `local-first` mode, `connected` status
- **Current agents:** 12 defined in state, 7 active
- **Current tasks:** 18 (many duplicate commands from testing)
- **Current approvals:** 12 (10 pending, need cleanup)
- **Runtime store:** `.misato-runtime/state.json` + `events.jsonl`

## All 16 API Endpoints Returned 200 ✅

All verified in production build mode. Full shapes in `docs/MISATO_RUNTIME_API_CONTRACT.md`.

## Issues Requiring Codex Attention

### 🔴 CRITICAL — 3 Issues

#### 1. SSE Event Stream Has Zero Authentication
**File:** `app/events/stream/route.ts`
The entire SSE stream pipeline lacks any `assertOwnerJson()` call. Anyone discovering the URL can subscribe and receive all runtime events — commands, approval statuses, task changes, risk detections.

**Fix:** Add `assertOwnerJson(request)` guard to `app/events/stream/route.ts` before establishing the SSE stream.

#### 2. Filesystem Writes Will Crash on Vercel/Railway
**File:** `lib/misato/runtime/store.ts` (uses `writeFileSync`/`appendFileSync`)
Every mutation — `saveStore()` called from `createTask`, `updateTask`, `deleteTask`, `assignAgent`, `approvalAction`, `runCommand` — writes to `.misato-runtime/state.json` and `.misato-runtime/events.jsonl`. On Vercel's read-only filesystem, these will throw `EROFS`.

**Fix:** Either:
- Wrap in try-catch with graceful in-memory degradation
- Replace with Upstash/KV/Redis for cloud persistence
- Use a `persistenceMode` flag to skip writes locally vs remotely

#### 3. Middleware Matcher Excludes `/api/` Routes
**File:** `middleware.ts` line 222-224
```ts
matcher: ["/misato/:path*"]
```
The rate limiting (Upstash + memory) and middleware-level API auth checks are dead code — they never execute for `/api/misato/*` routes.

**Fix:** Re-add `"/api/:path*"` to the matcher. The original reason for removing it was a `EvalError: Code generation from strings disallowed for this context` in the edge runtime. This might be caused by `path-to-regexp` or regex-heavy dependencies. Investigate the cause and add it back with the minimal necessary dependencies.

### 🟠 HIGH — 4 Issues

#### 4. Local Production Build Locks Out Web Login
**File:** `lib/misato/owner-guard.ts` line 65-79
`assertOwnerJson()` checks `isProdRuntime()` before `hasOwnerSession()`. Running `npm run start` triggers `NODE_ENV=production` → requires desktop token → web session login doesn't work.

**Fix:** Move `hasOwnerSession()` check inside the `isProdRuntime()` block, OR detect local production vs Vercel production more precisely.

#### 5. Status Missing Required Fields
**File:** `app/api/misato/status/route.ts`
The status endpoint returns `null` for `runtimeMode`, `localSoloMode`, `desktopTokenRequired`. These functions (`misatoRuntimeMode()`, `misatoAuthMode()`, `isLocalSoloMode()`, `isDesktopTokenRequired()`) exist in `lib/misato/owner-guard.ts` but aren't imported by the status route.

**Fix:** Import and include them in the response.

#### 6. `misato-runtime/` Routes Have NO Auth
**Files:** `app/misato-runtime/agents/route.ts`, `approvals/route.ts`, `logs/route.ts`
These routes serve data at `/misato-runtime/agents` etc. The middleware rewrites `/agents` → `/misato-runtime/agents` for JSON clients. No `assertOwnerJson()` is called.

**Fix:** Add `assertOwnerJson()` to all three route handlers.

#### 7. Duplicated Auth Logic
`isLocalSoloAllowed()` in `middleware.ts` is a near-copy of `localHostOnly()` + `isLocalSoloMode()` from `lib/misato/owner-guard.ts`. Fixes to one won't sync.

**Fix:** Extract shared request-utils into `lib/misato/request-utils.ts` and import from both.

### 🟡 MEDIUM — Cleanup Items

| # | Issue | File(s) |
|---|-------|---------|
| 8 | `_misato/` directory is dead code (underscore = private in Next.js) | `app/_misato/` |
| 9 | `hasValidDesktopToken` uses `===` instead of `timingSafeEqual` | `owner-guard.ts:62`, `middleware.ts:63` |
| 10 | No error boundaries on any API route | All `app/api/misato/*/route.ts` |
| 11 | In-memory rate limiting resets on cold start | `middleware.ts:90-92` |
| 12 | 3 routes missing CORS (`projects`, `discord`, `obsidian`) | `app/api/misato/projects/`, `discord/`, `obsidian/` |
| 13 | No Railway/host detection — `isVercelRuntime()` is false on Railway | `owner-guard.ts:17-19` |

## Do NOT Touch
- UI components, pages, layouts (Claude's lane)
- Public NexCall pages
- Production deployment
- Secrets or tokens

## Files You CAN Touch
- `lib/misato/` (all runtime/auth/storage code)
- `app/api/misato/` (all route handlers)
- `middleware.ts`
- `app/events/stream/route.ts`
- `app/misato-runtime/` (add auth)
- `app/_misato/` (delete it)
- `.env.example`
- `docs/` (update as needed)

## Cleanup Request
The runtime store has accumulated 18 tasks (most are duplicate command recordings) and 12 approvals (10 pending). If you have time, a cleanup pass:
- `GET /api/misato/tasks` — 18 items, many are `"Command: hi bb"` duplicates
- `GET /api/misato/approvals` — 12 items, 10 pending from repeated "deploy to production now"
