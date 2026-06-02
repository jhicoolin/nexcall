# MISATO Future Work
**Version:** 1.1  
**Date:** 2026-06-02 (updated)  
**Scope:** Documented future improvements and intentionally deferred work

This document tracks what was intentionally NOT done in v2.0 and why. Nothing here is a v2.0 bug unless noted.

**Verification standard:** Items marked "NOT IMPLEMENTED" were confirmed absent from the codebase by source audit. Do not mark any item as complete until the code exists and is verified.

---

## Performance Optimization Roadmap (v2.1)

None of the items below are implemented in v2.0. They are the correct next step after the v2.0 release is stable. Each includes exact implementation instructions.

### P1: List Virtualization — HIGH IMPACT

**Status:** NOT IMPLEMENTED — `@tanstack/react-virtual` not installed, no usage in codebase  
**When to implement:** If any list (agents, tasks, approvals, logs, events) exceeds 200 items and shows jank  
**Implementation:**
```bash
npm install @tanstack/react-virtual
```
```tsx
// In any list component with 100+ items:
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48, // estimated row height in px
});
```
**Measure before and after:** Chrome DevTools > Performance > record 5s scroll. Target: constant 60fps frame time.

---

### P2: Lazy Loading Heavy Components — MEDIUM IMPACT

**Status:** NOT IMPLEMENTED — no `next/dynamic` usage in app/ or components/  
**When to implement:** When initial bundle size (from `npm run build` output) exceeds 500KB shared  
**Implementation:**
```tsx
// In any page that uses modals or charts:
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('../components/HeavyChart'), {
  loading: () => <div>Loading chart…</div>,
  ssr: false
});
```
**Measure before and after:** `npm run build` → "First Load JS shared by all" line.

---

### P3: React.memo on List Items — LOW IMPACT

**Status:** NOT IMPLEMENTED — no `React.memo` usage in codebase  
**When to implement:** After adding virtualization, if profiler still shows unnecessary re-renders  
**Implementation:**
```tsx
// Wrap list item components:
const AgentCard = React.memo(function AgentCard({ agent }: { agent: Agent }) {
  // component body unchanged
});
```
**Measure before and after:** Chrome DevTools > Performance > "Components" tab (React DevTools Profiler).

---

### P4: next/font — LOW IMPACT

**Status:** NOT IMPLEMENTED — layout uses Tailwind `font-sans` class  
**When to implement:** If Lighthouse shows font-related LCP penalty  
**Implementation:**
```tsx
// In app/layout.tsx:
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
// Replace className="font-sans" with className={inter.className}
```

---

### P5: Error Boundaries — IMPORTANT FOR PRODUCTION

**Status:** NOT IMPLEMENTED — `react-error-boundary` not installed  
**When to implement:** Before first real user deployment (not just owner use)  
**Implementation:**
```bash
npm install react-error-boundary
```
```tsx
// In app/layout.tsx or each major route:
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

// Wrap root or section:
<ErrorBoundary FallbackComponent={ErrorFallback}>
  {children}
</ErrorBoundary>
```

---

### P6: Bundle Analyzer — MONITORING TOOL

**Status:** NOT IMPLEMENTED — `@next/bundle-analyzer` not installed  
**When to implement:** Before optimizing bundle size (need to know what's large first)  
**Implementation:**
```bash
npm install -D @next/bundle-analyzer
```
```js
// next.config.mjs:
import withBundleAnalyzer from '@next/bundle-analyzer';
const analyzed = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default analyzed(nextConfig);
```
```bash
# To run:
ANALYZE=true npm run build
```
**Add to package.json:**
```json
"analyze": "ANALYZE=true next build"
```

---

### Performance Measurement Protocol

Before claiming any performance numbers, run this baseline:

```bash
# 1. Build for production
npm run build

# 2. Note the "First Load JS shared by all" from build output
# This is your actual bundle baseline

# 3. Run Lighthouse
npx lighthouse http://127.0.0.1:3010 --output json --output-path ./lighthouse-baseline.json
# Extract: performance score, FCP, TTI, LCP, TBT

# 4. Record in a file
echo "Baseline recorded: $(date)" >> docs/misato/PERFORMANCE_BASELINES.md
```

Only publish performance numbers from a recorded Lighthouse run. Never use estimates or aspirational targets as if they were measured values.

---

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
