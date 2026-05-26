# MISATO Local Runtime

**Authoritative source of truth for daily local use.**

## Single Base URL

```
http://127.0.0.1:3010
```

- **Port 3010** is the single canonical port for the production build (`npm run build && npm run start -- -p 3010`).
- Ports 3000 and 3020 are **deprecated** — do not use.
- Dev servers (`npm run dev`) may run on arbitrary ports for development but are NOT the runtime truth.

## Runtime Modes

| Mode | Env | Behavior |
|------|-----|----------|
| `local-solo` | Local production build on localhost | Bypasses all auth — full access. Detected by `NODE_ENV=production` + localhost headers or `MISATO_LOCAL_SOLO_MODE=true` |
| `production-locked` | Vercel/Railway production | Requires valid `x-misato-desktop-token` header. Owner session cookies also accepted. |
| `preview-simple` | Vercel preview / non-prod non-localhost | Owner session cookies or desktop token accepted. |

## Startup Sequence

```bash
cd C:\Users\pixel\nexcall
rm -rf .next
npm run build            # ✅ Must pass with zero errors
PORT=3010 npm run start  # Starts on :3010
```

## Required Env Vars (for production lockdown)

| Variable | Purpose | Default |
|----------|---------|---------|
| `MISATO_DESKTOP_AUTH_TOKEN` | Shared secret for desktop→API auth | (required for production) |
| `MISATO_LOCAL_SOLO_MODE` | Bypass auth on local build | `false` |
| `MISATO_RUNTIME_MODE` | Runtime mode switch | `"mock"` (safe mock data) |
| `MISATO_REQUIRE_DESKTOP_TOKEN` | Force desktop token even in preview | `true` |

## Architecture

```
┌─────────────────────┐
│   MISATO.exe        │  Tauri desktop shell
│   (webview)         │  ─→ http://127.0.0.1:3010
└────────┬────────────┘
         │ POST /api/misato/command
         │ GET /api/misato/events/stream (SSE)
         v
┌─────────────────────┐
│  Next.js Prod Build │  npm run build + npm run start
│  127.0.0.1:3010     │
├─────────────────────┤
│ lib/misato/         │
│  ├─ owner-guard.ts  │  Auth: local-solo bypass in local
│  ├─ runtime/        │  State: in-memory + JSONL persistance
│  ├─ mock/data.ts    │  Mock command pipeline
│  └─ auth.ts         │  Session cookies + desktop tokens
├─────────────────────┤
│ .misato-runtime/    │  State/events storage (LOCAL ONLY)
│  ├─ state.json      │  Agents, tasks, approvals, logs
│  └─ events.jsonl    │  Event ledger
└─────────────────────┘
```

## Key Design Decisions

1. **Local-only file persistence.** The runtime uses `writeFileSync` to `.misato-runtime/`. This works on local builds but will CRASH on Vercel (read-only filesystem). Vercel/cloud deployment requires KV migration.
2. **SSE for real-time events.** `/api/misato/events/stream` emits server-sent events. No auth currently — **must be added before production**.
3. **Mock-safe mode by default.** All risky commands create approval records instead of executing. `MISATO_RUNTIME_MODE=mock` is the safe default.
4. **Vercel is optional.** Daily local use requires zero cloud dependencies.

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| SSE stream has no auth | CRITICAL | Needs fix |
| Filesystem writes crash on Vercel | CRITICAL | Needs KV migration |
| Middleware matcher excludes /api/ routes (dead rate limiting) | CRITICAL | Needs proper fix |
| Status missing runtimeMode/localSoloMode fields | HIGH | Needs route fix |
| Local prod build locks out web login | HIGH | Needs owner-cookie-before-token ordering |
| misato-runtime/ routes lack auth | HIGH | Needs fix |
