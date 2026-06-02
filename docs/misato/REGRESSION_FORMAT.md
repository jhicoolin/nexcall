# MISATO Regression Report Format
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Claude UI Agent (format) · Whoever finds the bug (fills it in)

All regression reports must use this format. No ad-hoc bug reports.  
Each regression gets its own file in `docs/regressions/YYYY-MM-DD-{slug}.md`.

---

## Template

```markdown
# Regression: {short title}

**Date found:** YYYY-MM-DD  
**Severity:** CRITICAL | HIGH | MEDIUM | LOW  
**Status:** OPEN | IN PROGRESS | RESOLVED | WONT FIX  
**Owner:** {Hermes | Claude | Codex | Owner}  
**Commit:** {commit hash if resolved, or "pending"}

---

## Before

{What the user saw before the regression was introduced or when the bug is present.
Be specific. Use exact copy strings or UI descriptions.}

Example:
"Approval cards showed a blank space where the requester name should be."

## After

{What the user sees now that the fix is applied.
Be specific.}

Example:
"Approval cards show the agent name (e.g., 'Vercel Deploy Agent') or '—' as a minimum."

## What Got Worse

{Did the fix introduce any trade-offs, regressions, or edge cases?
If nothing got worse, say "None identified."}

Example:
"Seed data approvals now show requestedAgent field value directly, which may differ 
from the runtime-generated requestedByAgentName format. Both are correct for their shapes."

## Impact

{Who was affected. How severely.}

- **Affected:** All users who view the Approvals screen
- **Data loss:** None
- **Functional impact:** Approval cards showed incomplete information
- **Security impact:** None
- **Severity justification:** Medium — cosmetic issue, no functional breakage

## Root Cause

{Exactly why it broke. Name the file, function, and field.}

Example:
"`normalizeApproval()` in `desktop-ui/app.js` read:
  `agentName: a.requestedByAgentName || a.agentName || a.agent || '—'`
  
But seed data in `lib/misato/mock/data.ts` uses:
  `requestedAgent: 'Vercel Deploy Agent'`
  
The `requestedAgent` field was not in the fallback chain, so it always resolved to '—'."

## Fix Applied

{Exactly what changed. Include file, line, old code, new code.}

Example:
"Updated `normalizeApproval()` fallback chain:

OLD: `agentName: a.requestedByAgentName || a.agentName || a.agent || '—'`
NEW: `agentName: a.requestedByAgentName || a.agentName || a.agent || a.requestedAgent || '—'`

File: `desktop-ui/app.js`, function `normalizeApproval()`
Commit: 67de581"

## Verification

{How to verify the fix is working. Given/When/Then format.}

Given: Approvals screen is open with seed data loaded
When: Any approval card is visible
Then: The "Requested by" field shows a name (e.g., "Vercel Deploy Agent"), not blank

Test matrix entry: Section 3, test 3.11

## Timeline

| Event | Time |
|-------|------|
| Bug introduced | {commit or "unknown"} |
| Bug detected | YYYY-MM-DD HH:MM UTC |
| Root cause identified | YYYY-MM-DD HH:MM UTC |
| Fix committed | YYYY-MM-DD HH:MM UTC |
| Fix verified | YYYY-MM-DD HH:MM UTC |
| Released | YYYY-MM-DD or "pending" |

## Related Regressions

{List any related bugs found in the same audit.}

- [ ] #slug-of-related-regression — Watchtower hardcoded CORS tile (same audit)
- [ ] #slug — context_loaded SSE event (same audit)

## Prevention

{How to prevent this class of bug in the future.}

Example:
"1. Unit test normalizeApproval() with all known data shapes (runtime + seed)
2. Dashboard Polisher audit checks requester name presence on all approval cards
3. When Hermes adds new approval fields, update FIELD_NORMALIZATION.md first"
```

---

## Severity Definitions

| Severity | Meaning | Response time |
|----------|---------|--------------|
| CRITICAL | Security breach, data loss, approval gate bypassed, secret visible | Fix immediately, before any other work |
| HIGH | Core feature broken, user cannot complete important workflow | Fix within 24 hours |
| MEDIUM | Feature degraded, incomplete display, honest fallback not shown | Fix in next release cycle |
| LOW | Cosmetic, non-blocking, affects edge case only | Backlog |

---

## Example Reports

### Example 1: approval requester blank

```markdown
# Regression: Approval requester names blank

**Date found:** 2026-06-02  
**Severity:** MEDIUM  
**Status:** RESOLVED  
**Owner:** Claude  
**Commit:** 67de581

## Before
Approval cards showed blank space where the requester name should appear.

## After
Approval cards show the requesting agent name (e.g., "Vercel Deploy Agent") 
or "—" (em dash) as an explicit minimum.

## What Got Worse
None identified.

## Impact
- Affected: All users viewing Approvals screen
- Data loss: None
- Functional impact: Cards looked incomplete, context for approval decision was missing
- Security impact: None
- Severity justification: Medium — cosmetic, no functional breakage

## Root Cause
normalizeApproval() fallback chain did not include a.requestedAgent.
Seed data uses requestedAgent field; runtime data uses requestedByAgentId (no name field).
Neither mapped to a visible name.

## Fix Applied
Added a.requestedAgent to the normalizeApproval() fallback chain.
File: desktop-ui/app.js — normalizeApproval()
OLD: agentName: a.requestedByAgentName || a.agentName || a.agent || '—'
NEW: agentName: a.requestedByAgentName || a.agentName || a.agent || a.requestedAgent || '—'

## Verification
Given: Approvals screen with seed data loaded
When: View any approval card
Then: Requester field shows "Vercel Deploy Agent" (seed) or agent ID (runtime) — never blank

## Timeline
| Bug detected      | 2026-06-02 |
| Root cause        | 2026-06-02 |
| Fix committed     | 2026-06-02 — commit 67de581 |
| Fix verified      | UNTESTED |
```

---

### Example 2: context_loaded SSE noise

```markdown
# Regression: context_loaded event polluting Live Feed

**Date found:** 2026-06-02  
**Severity:** LOW  
**Status:** RESOLVED  
**Owner:** Claude  
**Commit:** 67de581

## Before
Every time the SSE connection opened, a "context_loaded" event appeared in the Live Feed.
On reconnect cycles, users would see repeated context_loaded events in the feed.

## After
context_loaded events are filtered out of the feed entirely.

## What Got Worse
None — purely additive noise filter.

## Impact
- Affected: All users of the Live Feed screen
- Data loss: None
- Functional impact: Feed was polluted with connection lifecycle events
- Security impact: None
- Severity justification: Low — cosmetic noise only

## Root Cause
app/events/stream/route.ts publishEvent() inside the stream's start() handler
emits { type: "context_loaded" } as a regular data event (not named event).
This reaches the onmessage handler and appears in state.feedEvents.
FEED_NOISE_TYPES did not include "context_loaded".

## Fix Applied
Added "context_loaded" to FEED_NOISE_TYPES Set.
File: desktop-ui/app.js
NEW entry: 'context_loaded',  // fires on every SSE connection open

## Verification
Given: App just launched with Hermes connected
When: Live Feed screen is open
Then: No "context_loaded" event is visible in the feed

## Timeline
| Bug detected  | 2026-06-02 |
| Fix committed | 2026-06-02 — commit 67de581 |
```
