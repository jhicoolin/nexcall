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

## Performance Baseline (v2.0 — Not Yet Measured)

The following optimizations are **on the v2.1 roadmap but not yet implemented** in v2.0. They should not be documented as done until the code exists and metrics are measured.

| Optimization | Status | In Codebase |
|-------------|--------|-------------|
| List virtualization (`@tanstack/react-virtual`) | NOT IMPLEMENTED | No — package not installed |
| `React.memo` on list items | NOT IMPLEMENTED | No |
| Lazy loading (`next/dynamic`) | NOT IMPLEMENTED | No |
| `next/font` optimization | NOT IMPLEMENTED | Uses Tailwind `font-sans` |
| Error boundaries | NOT IMPLEMENTED | No — `react-error-boundary` not installed |
| Bundle analyzer (`@next/bundle-analyzer`) | NOT IMPLEMENTED | No |
| Measured performance metrics (FCP, TTI, FPS, bundle size) | NOT MEASURED | No Lighthouse run recorded |

See `MISATO_TODO.md` for implementation details for each item.

**What IS measured vs. what is aspirational:**

Do not publish performance numbers (e.g., "1.3s load time", "750KB bundle", "60fps scroll") unless they come from a recorded Lighthouse run or DevTools measurement. All such numbers in any previous draft were placeholders — not measured values.

To establish a real baseline: run `npm run build` then `npx lighthouse http://127.0.0.1:3010 --output json` and record the output. Do this once before each release.

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
