# MISATO LIVE v2.0 — Owner Handoff
**Date:** 2026-06-02  
**Branch:** `misato-hermes-live-brain`  
**For:** moe joe (owner)

This document tells you exactly what to test, what to deploy, what to monitor, and what the known limitations are.

---

## What to Test Before Calling It Done

### 5-minute smoke test (start here)

```bash
# 1. Start Hermes
npm run dev

# 2. Run automated verification (should all show "verified")
npm run misato:smoke
npm run misato:regression

# 3. Open MISATO.exe
# → Should show "Connected" teal badge within 3 seconds
# → Should show "Hermes v1.0.0-local" in top-right
```

Expected: `misato:smoke` says `"Runtime smoke PASS: all 13 checks verified"`.

### Browser checks (requires MISATO.exe + npm run dev)

```bash
npm run misato:browser-contract-check
```

Expected: `window.__MISATO_RUNTIME_ORIGIN__ === "http://127.0.0.1:3010"` verified, endpoints reachable from inside the shell.

### UI screens to manually verify

Go through each screen in MISATO.exe:

| Screen | What to confirm |
|--------|-----------------|
| Overview | Agents show live status (8 active), tasks show "active", no mock banners |
| Command Center | Type "hi" → response appears with model badge (or amber fallback badge) |
| AgentDex | 12 agents listed, no loading spinners stuck |
| Schedule | Agenda tab shows "◎ Hermes connected · 31 tasks without scheduledAt" (honest state, not error) |
| Kanban | Tasks appear in correct columns, no blank agent/project names |
| Approvals | Pending cards show requester name, risk level, approve/reject buttons |
| Watchtower | 5 health tiles from live state — no CORS tile, no hardcoded values |
| Sentinel | gitleaks shows INSTALLED, Scan Now button enabled |
| Live Feed | Events streaming, no heartbeat noise, AGENTS/CMDS/TASKS filters work |
| Lanes | 5 live lanes with Hermes Runtime Lane showing "active" |
| Obsidian Mirror | Shows "⚙ Setup required" if vault not configured — this is correct |
| Design Library | Tokens/Components/Patterns tabs load |
| Integrations | Hermes card shows "active" |

### Security checks (visual, 2 minutes)

1. Open Settings panel → verify token input is masked (shows dots)
2. Open DevTools Console → navigate all screens → confirm zero console errors
3. Open Sentinel → confirm any findings show `[REDACTED]` not raw secrets
4. Send "deploy to production" in Command Center → confirm approval card created, command blocked

### Desktop app checks (requires MISATO.exe running)

1. Click X → app should minimize to tray, not exit
2. Right-click tray icon → confirm "Show MISATO" and "Quit" options
3. Open MISATO.exe again while it's running → second launch should focus existing window (single instance)

---

## What to Deploy

### Development use (current)

```bash
npm run dev      # starts Hermes on port 3010
# then open MISATO.exe
```

### Packaged installer (Windows)

```
src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe
```

Run the installer on Windows. No admin rights required. No PowerShell required. App appears in Start Menu and system tray.

### No cloud deployment

MISATO is local-first. There is no production cloud deployment. All AI processing runs locally through Hermes at `http://127.0.0.1:3010`. The Vercel preview is for optional remote access only.

---

## What to Monitor

### Runtime health

```bash
npm run misato:process-watcher   # check process stability (Windows)
npm run misato:smoke             # verify all endpoints (requires Hermes running)
```

### Run ledger

```
.misato-runtime/events.jsonl
```

Every command, task mutation, approval decision, scan, and sync is logged here. Check it if something behaves unexpectedly.

### Approval queue

Watch the Approvals screen. If a risky command fires without creating an approval card, that's a gate integrity issue — check the run ledger immediately.

### Secret sentinel

Run scans regularly. gitleaks v8.30.1 is installed. Command: `npm run secrets:scan`. Report goes to `.security/gitleaks-report.redacted.json`.

---

## Known Limitations

### 1. No scheduled tasks

All 31 tasks currently lack `scheduledAt` fields. The Schedule Day/Week views will show empty grids until tasks have dates. To fix: add `scheduledAt` to tasks when creating them via command center or API. No code change needed.

### 2. Obsidian Mirror not configured

The Mirror screen shows setup instructions because `OBSIDIAN_VAULT_PATH` is not set. To enable:

```bash
# In your .env.local or environment:
OBSIDIAN_VAULT_PATH=C:\Users\pixel\Documents\ObsidianVault

# Then restart Hermes:
npm run dev

# Then click Sync Now in the Mirror screen
```

### 3. AI gateway state (fallback only when the key is missing)

When `AI_GATEWAY_API_KEY` is not set, commands use the deterministic classifier and return pattern-matched responses, not AI-generated ones. The UI shows an amber fallback badge on responses.

Current verified runtime truth in this branch: the gateway resolves `AI_GATEWAY_API_KEY` and reports `modelReady: true` when that key is present, but live command invocation still needs separate proof because a command can legitimately fall back to the deterministic path if the provider call fails. To enable real AI on a fresh environment, set `AI_GATEWAY_API_KEY` and optionally `AI_GATEWAY_MODEL`, then verify `responseSource: "hermes-ai"` on an actual command response.

### 4. No autostart

The Tauri installer does not configure Windows autostart. If you want MISATO to start with Windows, enable it manually in Windows Settings → Startup Apps or via the Settings screen in MISATO (if implemented in a future version).

### 5. MCP tool bus not active

The MCP catalog and tool execution pipeline are designed but the runtime MCP bus is not wired. Tool calls route through Hermes AI gateway only. Full MCP integration (vercel-api, obsidian-mcp, etc.) is a future milestone.

### 6. process-watcher is Windows-only

`npm run misato:process-watcher` uses PowerShell. It will fail on Linux/Mac. This is a developer tool, not a production dependency.

---

## Quick Reference: All npm Scripts

```bash
# Runtime
npm run dev                       # start Hermes on port 3010

# Verification
npm run misato:regression         # source contracts + live endpoints
npm run misato:smoke              # 13-check API smoke test
npm run misato:live-data-check    # 12-endpoint live data verification
npm run misato:process-watcher    # process stability (Windows only)
npm run misato:browser-shell-check       # browser shell load (requires Playwright + MISATO.exe)
npm run misato:browser-contract-check   # browser runtime-origin contract (requires Playwright + MISATO.exe + Hermes)

# Security
npm run secrets:scan              # gitleaks scan (0 findings as of v2.0)
npm run secrets:scan:staged       # scan staged files before commit

# Build
npm run build                     # Next.js build
npm run desktop:build             # Tauri installer build (MISATO.exe closed first)
npm run lint                      # ESLint
```

---

## Security Headers — Already Active

9 security headers are served on every response (pre-existing in `next.config.mjs`, confirmed live):

```bash
curl -sI http://127.0.0.1:3010/ | grep -i "policy\|options\|protection\|transport\|origin"
```

Headers active: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.

---

## Performance Monitoring Guide

### What you can measure now (no extra tools needed)

```bash
# 1. Check bundle size
npm run build
# Look at the "First Load JS shared by all" line in the build output
# Target: < 200KB shared, < 500KB per route

# 2. Check TypeScript (already strict: true)
npx tsc --noEmit
# Should output nothing (0 errors)

# 3. Check security headers
curl -sI http://127.0.0.1:3010/ | grep -i "policy\|options\|transport\|origin"
# Should show 8+ headers

# 4. Run gitleaks
npm run secrets:scan
# Should show: [] (0 findings)
```

### Lighthouse (requires Chrome)

1. Open Chrome → navigate to `http://127.0.0.1:3010`
2. DevTools (F12) → Lighthouse tab
3. Run audit: Performance, Accessibility, Best Practices
4. Record the scores. **These are your baseline numbers.** Do not publish performance claims without running this first.

### What's on the v2.1 performance roadmap

The following optimizations are documented in `MISATO_TODO.md` but **not yet implemented**. They require code changes before the performance claims become real:

| Optimization | Expected Impact | Effort |
|-------------|----------------|--------|
| List virtualization | Handles 1000+ items at 60fps | Medium |
| `next/dynamic` lazy loading | Reduces initial bundle 20-30% | Low |
| `React.memo` on list items | Fewer re-renders | Low |
| `next/font` | Faster font loading | Low |
| Error boundaries | Prevents crashes | Low |

**Do not measure performance before these are implemented** and expect them to match post-optimization targets. Establish your baseline first, then implement, then measure again.
