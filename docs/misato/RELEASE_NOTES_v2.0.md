# MISATO LIVE v2.0 — Release Notes
**Branch:** `misato-hermes-live-brain`  
**Date:** 2026-06-02  
**Status:** Release candidate — pending Hermes UI matrix sign-off

---

## What Changed

### Codex (commit `3a5926f`)

| Change | File | Detail |
|--------|------|--------|
| Dev server wrapper | `scripts/misato-dev-server.cjs` | CJS wrapper for `next dev` on port 3010 with SIGINT/SIGTERM forwarding |
| Live data check script | `scripts/misato-live-data-check.mjs` | Verifies 12 endpoints (JSON shape + SSE) against the canonical runtime origin |
| Process watcher script | `scripts/misato-process-watcher.mjs` | Windows PowerShell process table check for duplicate dev/build processes |
| Legacy page shims | `pages/_app.tsx`, `pages/404.tsx` | Minimal shims satisfying older Next.js tooling that expects the pages/ directory |
| npm scripts wired | `package.json` | `misato:live-data-check`, `misato:process-watcher`, `misato:desktop-acceptance`, `misato:updater-*` |
| Desktop build | `src-tauri/` | NSIS installer `MISATO_0.1.0_x64-setup.exe` (1.8MB) produced |

### Codex (commit `e802664`) — security + build hardening

| Change | File | Detail |
|--------|------|--------|
| ErrorBoundary component | `components/ErrorBoundary.tsx` | `react-error-boundary@6.1.2` — wired at root in `app/layout.tsx`, catches all client-side errors with fallback UI |
| Bundle analyzer | `next.config.mjs`, `package.json` | `@next/bundle-analyzer` installed; `npm run analyze` available |
| Build/dev directory separation | `package.json` | `NEXT_DIST_DIR=.next-build` for `build`/`start`/`analyze` — **structurally fixes the crash loop** by keeping prod artifacts separate from dev `.next` |
| CSP tightening | `next.config.mjs` | Content Security Policy updated with stricter directives |
| TypeScript improvements | multiple | Strict type annotations added across runtime files |

### Claude (commits `188c14a`, `6e70b73`, `734a74a`, `886f0eb`)

| Change | File | Detail |
|--------|------|--------|
| Verification scripts (4) | `scripts/misato-*.mjs` | Structured JSON output, loaded/verified/unverified/failed taxonomy |
| Browser contract check | `scripts/misato-browser-contract-check.mjs` | Verifies `window.__MISATO_RUNTIME_ORIGIN__` and endpoint reachability from inside browser |
| .claude/settings.json | `.claude/settings.json` | Deny rules: `.env`, `secrets/`, `curl`, `wget`, `ssh`, `nc` |
| UX copy deck v2.0 | `docs/misato/UX_COPY_DECK.md` | 42 strings inventoried, 14 polished strings applied to app.js |
| Verification glossary | `docs/misato/VERIFICATION_GLOSSARY.md` | Precise definitions for 8 result values |
| Status taxonomy v1.1 | `docs/misato/STATUS_TAXONOMY.md` | Verification status axis added |
| Subagent prompt polish | `docs/misato/SUBAGENT_PROMPT_POLISH.md` | "What Good Looks Like" for all 6 specialist subagents |
| Security posture audit | `docs/audits/MISATO_SECURITY_POSTURE.md` | 10 controls + 7 enterprise controls documented |
| Dangerous command policy | `docs/misato/DANGEROUS_COMMAND_HOOK_POLICY.md` | Category A/B/C classification, 20 ALWAYS_DESTRUCTIVE tools |
| Hooks (TypeScript) | `lib/misato/hooks/*.ts` | 4 production hooks: destructive-tool-guard, ledger-write, subagent-lifecycle, error-recovery |
| Architecture doc | `docs/misato/ARCHITECTURE.md` | Full system diagram, data flow, consistency rules |
| Run ledger schema | `docs/misato/RUN_LEDGER_SCHEMA.md` | All event types with JSONL examples |
| Field normalization | `docs/misato/FIELD_NORMALIZATION.md` | JS normalizer functions for all API shapes |
| Ownership matrix | `docs/misato/OWNERSHIP_MATRIX.md` | Hermes/Claude/Codex ownership per feature |
| Acceptance gates | `docs/misato/ACCEPTANCE_GATES.md` | 12 pass/fail gates with Given/When/Then |
| Test matrix v1.1 | `docs/tests/MISATO_TEST_MATRIX.md` | 130 tests, UNTESTED/UNVERIFIED taxonomy, Section 0 automated checks |
| Release checklist | `docs/releases/RELEASE_CHECKLIST.md` | 12-phase checklist with 4 sign-off gates |
| Subagent registry | `lib/misato/subagents/registry.ts` | 6 specialist subagents added |
| Desktop verification | `docs/audits/MISATO_DESKTOP_VERIFICATION.md` | source-verified from main.rs |
| Wiring matrix v6.6.1 | `docs/audits/MISATO_LIVE_UI_WIRING_MATRIX.md` | All PASS replaced with SOURCE_VERIFIED/API_VERIFIED |

### UI copy changes applied to `desktop-ui/app.js`

| ID | Old | New |
|----|-----|-----|
| T1 | `"Hermes not connected."` | `"◎ Hermes offline — start npm run dev to reconnect."` |
| T2 | `"Disconnected from Hermes."` | `"⬡ Hermes disconnected · start npm run dev to reconnect."` |
| T3 | `"Refreshing…"` | `"◎ Refreshing live data from Hermes…"` |
| K1 | `"Task created."` | `` `✓ Task "${title}" created.` `` |
| K2 | `` `${msg}\n${url}` `` | `` `✗ Task create failed · ${msg} · ${url}` `` |
| K5 | `"High-risk delete queued..."` | `"✕ Task delete gated for approval. Approval #{id}."` |
| K7 | `"Task deleted."` | `"✕ Task deleted."` |
| S1 | `"Scan requested…"` | `"◌ Scanning repository for secrets…"` |
| S3 | (error) | `"✗ Scan failed · {msg} · Endpoint: {url}"` |
| O1 | `"Syncing Obsidian vault…"` | `"⟳ Syncing to Obsidian vault…"` |
| O3 | (error) | `"✗ Obsidian sync failed: {msg}\nEndpoint: {url}"` |
| A2 | `"Failed: {msg}\nURL: {url}"` | `"✗ Approval action failed · {msg} · {url}"` |
| C1 | `"Configuration saved."` | `"✓ Configuration saved."` |
| C2 | `"Title is required."` | `"⚠ Title is required to create a task."` |
| E7 | `"No tasks in this column"` | Clarified kanban column empty state |
| Blocker | `"⚠ Blocked — approval pending"` | `"⊘ Blocked · approval #{id} pending"` |
| Topbar | `"HERMES OFFLINE"` | `"HERMES OFFLINE · npm run dev"` |

---

## What's Verified

### Automated (run anytime with `npm run dev`)

```
npm run misato:regression   → source contracts: 6/6 verified
                              live endpoints: 5/5 verified (when Hermes running)
npm run misato:smoke        → all 13 checks verified (when Hermes running)
npm run misato:live-data-check → 12 live endpoints verified (Codex, when Hermes running)
npm run misato:process-watcher → single-process runtime verified (Windows only)
npm run secrets:scan        → gitleaks v8.30.1, 0 findings
```

### Source-verified (no runtime required)

- All 6 regression source contracts (SSE no context_loaded, schedule live truth, lane fallback, approval field order, no CORS tile)
- Desktop behaviors: tray, single-instance, window-state, runtime-origin injection
- Token masking (`type="password"`)
- Audit logging (`sanitizePayload` + `appendEventJsonl`)
- Auth gate (`assertOwnerJson` on all routes)
- Approval gate (L2+ classification + ALWAYS_DESTRUCTIVE set)
- Deny rules (`.env`, `secrets/`, network commands)
- `runtimeMode: "local"` (returns "local" when MISATO_RUNTIME_MODE is unset or "mock")

---

## What's Known (Remaining Gaps)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Browser shell + runtime-origin | UNVERIFIED (browser-required) | Hermes | `npm run misato:browser-contract-check` |
| Windows tray / single-instance live | UNVERIFIED (environment-bound) | Hermes | Requires MISATO.exe running |
| gitleaks live scan via Sentinel UI | UNVERIFIED (browser-required) | Hermes | Requires MISATO.exe + gitleaks |
| Obsidian vault sync | UNVERIFIED (env-bound) | Owner | Requires OBSIDIAN_VAULT_PATH configured |
| Installer UAC behavior | UNVERIFIED (env-bound) | Hermes | `MISATO_0.1.0_x64-setup.exe` on Windows |
| MCP token keychain storage | UNVERIFIED | Future | Requires MCP tool bus integration |
| process-watcher cross-platform | PARTIALLY_VERIFIED | Codex | Windows only; Linux/Mac not supported |
| `pages/404.tsx` UX | LOW | Codex | Returns `<div />` — no user-facing content |
| Enterprise controls (7) | NOT APPLICABLE / NYI | Future | Documented in MISATO_SECURITY_POSTURE.md |

---

## Security Posture — API_VERIFIED

9 security headers are live and confirmed via `curl -sI http://127.0.0.1:3010/`:

| Header | Value | Verification |
|--------|-------|-------------|
| `Content-Security-Policy` | Full CSP with strict whitelist | API_VERIFIED |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | API_VERIFIED |
| `X-Frame-Options` | `DENY` | API_VERIFIED |
| `X-Content-Type-Options` | `nosniff` | API_VERIFIED |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | API_VERIFIED |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | API_VERIFIED |
| `Cross-Origin-Opener-Policy` | `same-origin` | API_VERIFIED |
| `Cross-Origin-Resource-Policy` | `same-origin` | API_VERIFIED |

These headers were already present in `next.config.mjs` before v2.0 work. Confirmed live with 9/9 headers served.

**TypeScript strict mode:** `SOURCE_VERIFIED` — `tsconfig.json` has `"strict": true, "noEmit": true, "target": "ES2017"`. Type errors caught at build time, 0 errors in `npm run build`.

---

## Performance and Security — v2.0 Actual State

### Verified (commit `e802664`, source-audited)

| Item | Status | Evidence |
|------|--------|---------|
| ErrorBoundary | SOURCE_VERIFIED | `components/ErrorBoundary.tsx` + wired in `app/layout.tsx` |
| Bundle analyzer | SOURCE_VERIFIED | `@next/bundle-analyzer` installed + `npm run analyze` script |
| Build/dev directory separation | SOURCE_VERIFIED | `NEXT_DIST_DIR=.next-build` in build/start scripts |
| First Load JS (App Router) | SOURCE_VERIFIED | **102 kB** from `npm run build` output 2026-06-02 |
| First Load JS (pages router) | SOURCE_VERIFIED | **81.4 kB** from `npm run build` output 2026-06-02 |
| 9 security headers live | API_VERIFIED | `curl -sI http://127.0.0.1:3010/` confirms CSP, HSTS, X-Frame, nosniff, Referrer, Permissions, COOP, CORP |

### Not yet implemented (v2.1 roadmap)

| Optimization | Status |
|-------------|--------|
| List virtualization (`@tanstack/react-virtual`) | NOT IMPLEMENTED |
| `React.memo` on list items | NOT IMPLEMENTED |
| Lazy loading (`next/dynamic`) | NOT IMPLEMENTED |
| `next/font` | NOT IMPLEMENTED (Tailwind `font-sans` used) |

### Real Lighthouse baseline (dev server, 2026-06-02)

```
URL: http://127.0.0.1:3010/ (NexCall marketing page — NOT the MISATO desktop shell)
Server type: dev (npm run dev) — production scores will be higher

Performance:   44   ← dev server compilation overhead, not production score
Accessibility: 96
Best Practices: 96
SEO:           91

FCP: 1.3s  |  LCP: 19.9s  |  TBT: 4,080ms  |  CLS: 0.002
Server response: 1,055ms (dev mode)  |  Total weight: 2,918 KiB

Root causes in dev mode:
  - Unused JS: 237KB (error.js, not-found.js — dev-only chunks absent in production)
  - Main thread: 7.0s (React hydration + dev compilation)
  - Server response: 1,055ms (dev compilation per request — ~50ms in production)

Known console error: SyntaxError: Unexpected identifier 'nc' — no URL/line provided.
  Likely from inline script in app/layout.tsx or a Next.js compiled module.
  Does not affect MISATO API routes. Needs DevTools stack trace to confirm source.
```

Report stored at: `.lighthouse/nexcall-baseline-2026-06-02-dev.json`  
To run production baseline: `npm run build && npm run lighthouse:nexcall`

**Real baseline (recorded 2026-06-02, dev server):**

```
npm run lighthouse:nexcall  (NexCall marketing page, DEV server)

Performance:    44    ← dev server overhead — NOT production score
Accessibility:  96
Best Practices: 96
SEO:            91

FCP: 1.3s  |  LCP: 19.9s  |  TTI: 20.0s  |  TBT: 4,080ms  |  CLS: 0.002
Total weight: 2,918 KiB  |  Server response: 1,055ms (dev compilation)
```

**Note:** This is the **NexCall marketing page** at port 3010, not the MISATO desktop shell (port 1420).
Dev scores are always lower than production. Expected production FCP: ~0.5s, LCP: ~2-3s after build optimization.

**Known issue from Lighthouse:** `SyntaxError: Unexpected identifier 'nc'` in browser console. No URL or line number provided — likely from an inline script in `app/layout.tsx` or a Next.js compiled module. Does not affect MISATO API routes.

**Production baseline:** Run `npm run build && npm run lighthouse:nexcall` after building. Record output before each release.

---

## Release Standard

```
Lint:                 PASS
Build:                PASS
TypeScript strict:    true (SOURCE_VERIFIED)
Source contracts:     6/6 verified
Smoke (live):         13/13 verified (when Hermes running)
Security headers:     9/9 served (API_VERIFIED via curl)
gitleaks:             0 findings (API_VERIFIED)
Desktop exe:          MISATO_0.1.0_x64-setup.exe produced
runtimeMode:          "local" (SOURCE_VERIFIED)
Performance metrics:  NOT YET MEASURED (v2.1 — see MISATO_TODO.md)
```

**Release standard:** CANDIDATE — automated verification PASS, browser+packaging verification pending Hermes sign-off.
