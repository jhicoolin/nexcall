# MISATO Future Work
**Version:** 1.0  
**Date:** 2026-06-02  
**Scope:** Documented future improvements and intentionally deferred work

This document tracks what was intentionally NOT done in v2.0 and why. Nothing here is a v2.0 bug unless noted.

---

## 1. Updater Pipeline — NOT IMPLEMENTED

**Status:** Placeholder scripts only  
**Commands:** `misato:updater-check`, `misato:updater-download`, `misato:updater-install`  
**Current behavior:** Each prints `"TODO: MISATO updater wiring not implemented yet"` and exits 0  
**Why deferred:** Tauri Updater plugin requires a signed update server URL (S3, GitHub Releases, or self-hosted). This depends on how the release distribution is set up. Cannot be implemented without a decided distribution strategy.  
**What's needed:**
1. Decide update distribution channel (GitHub Releases recommended)
2. Configure `tauri.conf.json` → `updater` block with `endpoints` and `pubkey`
3. Sign the installer with a key pair
4. Wire `misato:updater-check` to call the Tauri updater API
5. Wire `misato:updater-download` + `misato:updater-install` to download and apply the update

---

## 2. Obsidian Mirror Sync — UNVERIFIED (environment-bound)

**Status:** Code is wired, endpoint exists, UI shows setup-required  
**Blocked by:** `OBSIDIAN_VAULT_PATH` not configured in local environment  
**What to do:** Set `OBSIDIAN_VAULT_PATH`, restart Hermes, click Sync Now. See `HANDOFF_TO_OWNER.md` for exact steps.  
**Verification:** Once configured, run `npm run misato:live-data-check` — `obsidian-sync` check will verify the POST endpoint.

---

## 3. process-watcher Cross-Platform Support — LOW PRIORITY

**Status:** Windows-only (uses PowerShell `Get-CimInstance`)  
**Impact:** `npm run misato:process-watcher` fails on Linux/Mac  
**Why acceptable:** MISATO is a Windows desktop app. Linux/Mac usage is development-only.  
**Future fix:** Add a POSIX branch using `ps aux | grep node` if cross-platform support is needed.

---

## 4. Per-Agent Tool Restrictions — NOT IMPLEMENTED

**Status:** Global tool policy via trust tiers; no per-agent allowlists  
**Design:** `lib/misato/subagents/registry.ts` has `approvalRequiredFor[]` per agent but no `allowedMcps[]` or `deniedMcps[]`  
**What's needed:** Add per-agent tool allowlists to the SubagentRole type and enforce at the MCP tool bus layer  
**Priority:** Low — single-operator system; global trust policy is sufficient for now

---

## 5. Browser-Layer Checks Not Automated in CI — DOCUMENTED LIMITATION

**Status:** `misato:browser-shell-check` and `misato:browser-contract-check` require Playwright + running MISATO.exe  
**Impact:** These checks are marked `UNVERIFIED (browser-required)` in the test matrix  
**What's needed:** A CI environment with Xvfb (Linux) or Windows headless + MISATO.exe for automated browser testing  
**Priority:** Medium — important for regression prevention as the project grows

---

## 6. Schedule Views Empty — EXPECTED (no scheduledAt data)

**Status:** All 31 tasks have `scheduledAt: null`  
**Impact:** Schedule Day/Week views show empty grids  
**Why not a bug:** Tasks were created through command-center which doesn't auto-assign dates. This is correct behavior — the UI shows the honest empty state.  
**What to do:** When creating tasks, assign `scheduledAt` via the + New Task modal or command center.

---

## 7. AI Gateway — Deterministic Fallback Only

**Status:** `AI_GATEWAY_API_KEY` not set; all commands use deterministic classifier  
**Impact:** Command responses are pattern-matched (greeting, deploy, daily-summary) not AI-generated. Amber "deterministic fallback" badge shows on all responses.  
**What to do:** Set `AI_GATEWAY_API_KEY` (OpenRouter key) + optionally `AI_GATEWAY_MODEL` in `.env.local`.  
**No code change needed** — gateway is fully wired, key is the only missing piece.

---

## 8. Enterprise Security Controls — NOT APPLICABLE

The following enterprise controls are documented in `MISATO_SECURITY_POSTURE.md` and explicitly NOT implemented because they apply to multi-user organizational deployments, not single-operator local systems:

| Control | Rationale |
|---------|-----------|
| Shadow AI discovery | Single operator — no employee devices to monitor |
| Browser-level DLP | Controlled environment — no external employees |
| AI usage policy document | Partially covered by TRUST_POLICY.md; formal policy needed when expanding to teams |
| Governance committee | Single operator — approval gate is the governance |
| SIEM integration | No compliance requirement; add when SOC2/ISO27001 needed |
| Multi-factor auth on agent actions | Approval gate handles manual confirmation; formal MFA when compliance needed |
| Per-agent least-privilege enforcement | Global controls sufficient for single-operator; add per-agent tool lists for teams |

---

## 9. pages/404.tsx UX — LOW PRIORITY

**Status:** Returns `<div />` (empty page)  
**Why it exists:** Required by Next.js legacy tooling that checks for `pages/` directory  
**Impact:** If a user navigates to a 404 URL in the Next.js app, they see a blank page  
**MISATO context:** MISATO is a single-page app (desktop-ui). The Next.js app router handles all API routes. A 404 via browser is not a user path.  
**Future fix:** Add a minimal "Not found" message to `pages/404.tsx` if this ever becomes user-facing.

---

## 10. Memory UI — PARTIALLY IMPLEMENTED

**Status:** Ledger (run events) is immutable and queryable. User preference memory is not exposed in a dedicated UI panel.  
**What exists:** The run ledger at `.misato-runtime/events.jsonl` is the source of truth for all actions. Memory updates would emit `memory.updated` events.  
**What's missing:** A "Memory" screen showing learned preferences, with edit/delete controls.  
**Acceptance gate 11** (memory explicit and inspectable) is partially verified. Full verification requires the memory UI to be exercised.

---

## Priority Order for v2.1

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | Obsidian Mirror — configure vault and verify live | Owner action (config only) |
| HIGH | AI Gateway — configure API key | Owner action (env var) |
| HIGH | Scheduled tasks — add scheduledAt to tasks | Usage pattern |
| MEDIUM | Browser check automation in CI | Medium engineering |
| MEDIUM | Updater pipeline | High engineering + infra |
| LOW | Per-agent tool restrictions | Medium engineering |
| LOW | Memory UI panel | Medium engineering |
| LOW | pages/404.tsx UX | 5-minute fix |
| LOW | process-watcher cross-platform | Small engineering |
