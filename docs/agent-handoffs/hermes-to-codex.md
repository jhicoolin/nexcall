# Handoff: Hermes → Codex Reliability Lane

**Date:** 2026-05-25 | **Updated:** Post-execution-loop stabilization
**From:** Hermes (Runtime Orchestrator)
**To:** Codex Reliability Lane (Backend, security, persistence, contract validation)

## Runtime Truth

- **Base URL:** `http://127.0.0.1:3010` — single canonical port. Ports 3000/3020 killed.
- **Branch:** `misato-claude-ui`
- **Latest commit:** `a3319d0` — 10-stage command state machine + AI gateway + tasks
- **Build:** ✅ Clean. All 103 routes compile.
- **Runtime:** ✅ Running (1018s uptime, connected, 12 agents, 27 tasks, 15 approvals)

## What Hermes Just Built (doesn't need Codex)

| Area | File(s) | Status |
|------|---------|--------|
| 10-stage command state machine | `lib/misato/runtime/command-machine.ts` | ✅ LIVE |
| AI gateway (OpenRouter DeepSeek V4 Flash) | `lib/misato/runtime/ai-gateway.ts` | ✅ LIVE (with deterministic fallback) |
| Task deduplication | `lib/misato/runtime/service.ts` (createTask) | ✅ VERIFIED |
| Agent assignment with auto-create task | `lib/misato/runtime/service.ts` (assignAgent) | ✅ VERIFIED |
| Mission tracking (create/list/dispatch) | `app/api/misato/missions/*` | ✅ VERIFIED |
| Status fields (runtimeMode, activeModel, etc.) | `app/api/misato/status/route.ts` | ✅ ALL PRESENT |
| Event stream (10-stage, clean types) | SSE at `/api/misato/events/stream` | ✅ LIVE |
| Scheduled task support | `createTask` payload `scheduledAt` | ✅ READY |

## What Still Needs Codex

### 🔴 CRITICAL (3)

#### 1. Filesystem Writes Crash on Vercel/Railway
**File:** `lib/misato/runtime/store.ts` (lines 70-77, 79-87)
`saveStore()` uses `writeFileSync(STORE_PATH, ...)` and `appendEventJsonl()` uses `appendFileSync(...)`. These will throw `EROFS` on Vercel's read-only filesystem.

**Fix approaches (any works):**
- Wrap in try-catch with graceful in-memory degradation (`if (err.code === 'EROFS') fallback to memory`)
- Replace with KV store (Upstash/Vercel KV) for cloud persistence
- Add a `persistenceMode` switch: `local=filesystem`, `cloud=memory-only`

**The store.ts already has `USE_FILESYSTEM_STORE = !process.env.VERCEL`** — but it only controls whether file ops are done. It doesn't catch the error if `process.env.VERCEL` is somehow not set on Vercel (unreliable env check). Safe to add try-catch anyway.

#### 2. Middleware Matcher Excludes `/api/` Routes
**File:** `middleware.ts` line 222-224
```ts
matcher: ["/misato/:path*"]
```
Rate limiting, Upstash pipeline, and middleware-level auth checks are all dead code for `/api/*` routes. The matcher was narrowed to fix an `EvalError` from edge runtime.

**Fix:** Investigate the `EvalError` cause (likely `path-to-regexp` or regex-heavy import in middleware), resolve it, and add `"/api/:path*"` back to the matcher. Alternatively, add a lightweight rate-limit wrapper in each API route directly.

#### 3. SSE Event Stream Route Auth
**File:** `app/events/stream/route.ts` and `app/api/misato/events/stream/route.ts`
The SSE stream doesn't call `assertOwnerJson()`. Anyone who discovers the URL can subscribe to all runtime events.

**Fix:** Add `const unauthorized = await assertOwnerJson(request); if (unauthorized) return unauthorized;` before establishing the SSE stream. Note: SSE uses `Response` not `NextResponse`, so use a standard `new Response("Unauthorized", { status: 401 })` for rejection.

### 🟠 HIGH (3)

#### 4. `misato-runtime/` Routes Lack Auth
**Files:** `app/misato-runtime/agents/route.ts`, `approvals/route.ts`, `logs/route.ts`
The middleware rewrites `/agents` → `/misato-runtime/agents` for JSON clients. These routes don't call `assertOwnerJson()`.

**Fix:** Add auth guard to all 3 route handlers, same pattern as `/api/misato/*` routes.

#### 5. Owner Session Skipped in Production Mode
**File:** `lib/misato/owner-guard.ts` lines 65-79
`assertOwnerJson()` checks `isProdRuntime()` before `hasOwnerSession()`. On Vercel, a logged-in user with a valid session cookie still gets 401 because the desktop token check runs first.

**Fix:** Add `hasOwnerSession()` check inside the `isProdRuntime()` block:
```ts
if (isProdRuntime()) {
  if (await hasOwnerSession()) return null; // ADD THIS
  return hasValidDesktopToken(request) ? null : unauthorized;
}
```

#### 6. Duplicated Auth Logic
`isLocalSoloAllowed()` in `middleware.ts` is a near-copy of `localHostOnly()` from `owner-guard.ts`. Changes to one rot without the other.

**Fix:** Extract shared helpers into `lib/misato/request-utils.ts` and import from both files.

### 🟡 MEDIUM (5)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 7 | `_misato/` directory is dead code (underscore-prefixed dirs are private in Next.js) | `app/_misato/*` | Delete the directory |
| 8 | `hasValidDesktopToken` uses `===` instead of `timingSafeEqual` | `owner-guard.ts:62`, `middleware.ts:63` | Replace with `crypto.timingSafeEqual` |
| 9 | No error boundaries on API routes — uncaught exceptions leak stack traces | All `app/api/misato/*/route.ts` | Add global error handler |
| 10 | 3 routes missing CORS (`projects`, `discord`, `obsidian`) | `app/api/misato/projects/`, `discord/`, `obsidian/` | Wrap responses with `withMisatoCors()` |
| 11 | No Railway/host detection — `isVercelRuntime()` is false on Railway | `owner-guard.ts:17-19` | Check `RAILWAY_SERVICE_NAME` or `RENDER` env |

## Do NOT Touch
- `lib/misato/runtime/command-machine.ts` — Hermes owns this
- `lib/misato/runtime/ai-gateway.ts` — Hermes owns this
- `docs/agent-handoffs/hermes-to-codex.md` — Hermes owns this
- UI components, pages, layouts — Claude's lane
- Public NexCall pages — Hands off
- Production deployment — Not happening

## Files Codex CAN Touch
- `lib/misato/owner-guard.ts`
- `lib/misato/runtime/store.ts`
- `middleware.ts`
- `app/events/stream/route.ts`
- `app/api/misato/events/stream/route.ts`
- `app/misato-runtime/` (add auth)
- `app/_misato/` (delete)
- `.env.example`

## Shared Documentation
- `docs/audits/HERMES_RUNTIME_TRUTH_MATRIX.md` — All endpoint statuses
- `docs/audits/HERMES_MISSION_DISPATCH_MATRIX.md` — Mission/dispatch flows
- `docs/audits/HERMES_AGENT_SYNC_LOG.md` — Agent registry and dispatch history
- `docs/agent-handoffs/hermes-to-codex.md` — This file

## Final Note
This is the authoritative handoff. Codex should:
1. Fix 3 CRITICAL items first (filesystem, middleware, SSE auth)
2. Fix 3 HIGH items second (misato-runtime auth, owner session, dedup logic)
3. Fix 5 MEDIUM items as time allows
4. Rebuild, restart, and run the 10-test suite
5. Write own handoff note for Hermes when done

**All 10 tests PASS on the current build.** Do not regress them.
