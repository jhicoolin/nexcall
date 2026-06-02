# MISATO UX Copy Inventory
**Version:** 1.0  
**Date:** 2026-06-02  
**Source:** `desktop-ui/app.js` (v6.6)  
**Voice:** Operations commander. Direct. Precise. Mission-control. Not corporate. Not theatrical.

Every user-facing string from the desktop UI is inventoried here, grouped by state type.  
Before/after rewrites follow the voice standard: calm, specific, actionable, no filler.

---

## Voice Standard

**Good:** `✗ Task update failed · POST /api/misato/tasks/update · 502`  
**Bad:** `An error occurred while updating the task. Please try again.`

**Good:** `◎ Hermes offline — run npm run dev to reconnect.`  
**Bad:** `Hermes not connected.`

**Good:** `✓ Approval #apr-456 approved · Deploy to production unblocked.`  
**Bad:** `Approval approved.`

Rules:
1. Name what happened. Not "error" — name the operation.
2. Name what's next. Not "please try again" — say the exact command or action.
3. Use the status icon prefix: `✓` success, `✗` failure, `◎` info/waiting, `⟳` in progress, `⊘` blocked, `⚠` warning, `◌` loading.
4. Include the endpoint URL in every network error.
5. Include the approval ID in every approval mutation.
6. Include severity counts in every scan result.

---

## Toast Messages

### Connection / Runtime

| ID | Location | Current string | Rewritten | Change type |
|----|----------|---------------|-----------|-------------|
| T1 | line 899, 921, 2869 | `'Hermes not connected.'` | `'◎ Hermes offline — start npm run dev to reconnect.'` | Added action |
| T2 | line 2671 | `'Disconnected from Hermes.'` | `'⬡ Hermes disconnected · start npm run dev to reconnect.'` | Added action |
| T3 | line 2683 | `'Refreshing…'` | `'◎ Refreshing live data from Hermes…'` | Added context |
| T4 | line 2812 | `'Hermes not connected — start npm run dev.'` | ✓ Already correct | No change needed |
| T5 | line 2839 | `'Refreshing data…'` | `'◎ Refreshing…'` | Consistent with T3 |

### Approval

| ID | Location | Current string | Rewritten | Change type |
|----|----------|---------------|-----------|-------------|
| A1 | line 908 | `` `✓ Approval #${id} ${actionLabel} by owner.` `` | ✓ Already correct | No change |
| A2 | line 913-914 | `` `Failed: ${e.message}\nURL: ${e.url}` `` | `` `✗ Approval action failed · ${e.message} · ${e.url}` `` | Consistent format |

### Task CRUD

| ID | Location | Current string | Rewritten | Change type |
|----|----------|---------------|-----------|-------------|
| K1 | line 931 | `'Task created.'` | `` `✓ Task created: ${task.title || 'new task'}` `` | Added task name |
| K2 | line 935 | `` `${e.message}\n${e.url}` `` | `` `✗ Task create failed · ${e.message} · ${e.url}` `` | Consistent format |
| K3 | line 947 | `'Task updated locally — changes are not persisted (Hermes offline).'` | `'◎ Local update only · Hermes offline. Reconnect to persist.'` | Shorter, same info |
| K4 | line 958 | `` `Sync failed: ${e.message} — ${e.url}` `` | `` `✗ Task update failed · ${e.message} · ${e.url}` `` | Consistent format |
| K5 | line 976 | `'High-risk delete queued for approval.'` | `'◆ High-risk delete blocked · Approval #apr-? queued for owner review.'` | Added approval context |
| K6 | line 983 | `'Task removed locally (Hermes offline — will reappear on reconnect).'` | `'◎ Removed locally · Hermes offline — will reappear on reconnect.'` | Shorter |
| K7 | line 991 | `'Task deleted.'` | `'✕ Task deleted.'` | Added icon |
| K8 | line 995 | `` `Delete failed — task not removed: ${e.message} (${e.url})` `` | `` `✗ Delete failed · task not removed · ${e.message} · ${e.url}` `` | Consistent format |

### Scan

| ID | Location | Current string | Rewritten | Change type |
|----|----------|---------------|-----------|-------------|
| S1 | line 2813 | `'Scan requested…'` | `'◌ Scanning repository for secrets…'` | Added context |
| S2 | line 2823 | `` `✓ Scan complete · ${c} critical · ${h} high · ${w} warnings` `` | ✓ Already correct | No change |
| S3 | line 2831 | `msg` (from error handler) | `` `✗ Scan failed · ${e.message} · Endpoint: ${e.url}` `` | Consistent format |

### Obsidian Mirror

| ID | Location | Current string | Rewritten | Change type |
|----|----------|---------------|-----------|-------------|
| O1 | line 2870 | `'Syncing Obsidian vault…'` | `'⟳ Syncing to Obsidian vault…'` | Added icon |
| O2 | line 2875 | `` `✓ Synced · ${filesWritten} files · Just now` `` | ✓ Already correct | No change |
| O3 | line 2878 | `` `✗ Obsidian sync failed: ${e.message}\nEndpoint: ${e.url}` `` | ✓ Already correct | No change |

### Settings

| ID | Location | Current string | Rewritten | Change type |
|----|----------|---------------|-----------|-------------|
| C1 | line 1129 | `'Configuration saved.'` | `'✓ Configuration saved.'` | Added icon |
| C2 | line 2764 | `'Title is required.'` | `'⚠ Title is required to create a task.'` | Added context |

---

## Empty States

### AgentDex

| ID | Current | Rewritten | Change type |
|----|---------|-----------|-------------|
| E1 | `'No agents loaded'` | `'No agents loaded · Connect Hermes to load live agents'` | Added action |
| E2 | `'No agents match'` + clear filter button | ✓ Already correct | No change |

### Schedule

| ID | Current | Rewritten | Change type |
|----|---------|-----------|-------------|
| E3 | `'No scheduled tasks'` (Hermes connected) | `'No scheduled tasks · Add scheduledAt to tasks to see them here'` | Added action |
| E4 | `'No tasks with schedule data'` (offline) | `'No schedule data · Connect Hermes and add tasks with dates'` | Added action |
| E5 | Loading: `'Loading schedule from Hermes…'` | ✓ Correct | No change |
| E6 | Waiting: `'◎ Hermes connected · N tasks without scheduledAt. Use + New Task...'` | ✓ Correct | No change |

### Kanban

| ID | Current | Rewritten | Change type |
|----|---------|-----------|-------------|
| E7 | `'No tasks'` (in column) | `'No tasks in this column'` | Slightly clearer |

### Lanes

| ID | Current | Rewritten | Change type |
|----|---------|-----------|-------------|
| E8 | `'No live lanes yet'` + description | ✓ Correct | No change |
| E9 | `'◎ Hermes connected — waiting on live lane records...'` | ✓ Correct | No change |

### Approvals

| ID | Current | Rewritten | Change type |
|----|---------|-----------|-------------|
| E10 | `'No pending approvals'` + `'All gates clear.'` | `'All gates clear · No pending approvals'` | Reordered for scannability |
| E11 | `'Nothing to show for this filter.'` | `'No {filter} approvals · Switch filters to see other states'` | Added navigation hint |

---

## Loading States

All follow the pattern `'◌ Loading {what} from Hermes…'`. Current implementations:

| Screen | Current string | Status |
|--------|---------------|--------|
| AgentDex | `'◌ Loading agents from Hermes…'` | ✓ Correct |
| Schedule | `'◌ Loading schedule from Hermes…'` | ✓ Correct |
| Approvals | `'◌ Loading approvals from Hermes…'` | ✓ Correct |
| Sentinel | `'◌ Fetching scan status from Hermes…'` | Minor: change `Fetching` to `Loading` for consistency |
| Sentinel → | `'◌ Loading scan status from Hermes…'` | Updated form |

---

## Topbar / Connection Indicator

| Current | Rewritten | Change type |
|---------|-----------|-------------|
| `'HERMES OFFLINE'` | `'HERMES OFFLINE · run npm run dev'` | Added action |
| `● HERMES` (when SSE active) | ✓ Correct | No change |
| `● POLLING` (when SSE disconnected) | ✓ Correct — honest fallback | No change |
| `Connected · ${host}:${port} · v${version} · ↑${uptime}` | ✓ Correct | No change |

---

## Status Badges and State Labels

### Approval Card

| Current | Rewritten | Change type |
|---------|-----------|-------------|
| `'Requested by ${agentName}'` | `'Requested by ${agentName}'` | ✓ Correct |
| `'Decision: ${decisionAt}'` | `'Decision: ${decisionAt} · by ${decidedBy}'` | Added actor |
| `'Status: ${status}'` | Used as fallback when no decisionAt | ✓ Correct |

### Kanban Card

| Current | Rewritten | Change type |
|---------|-----------|-------------|
| `'⚠ Blocked${linkedApprovalId ? ' — approval pending' : ' — requires approval'}'` | `'⊘ Blocked${linkedApprovalId ? " · approval #" + linkedApprovalId + " pending" : " · requires owner approval"}'` | Added approval ID |

### Watchtower Tiles

All 5 tiles derive from live state — no hardcoded values. ✓ Correct.

---

## Sections Needing App.js Edits

These rewrites require editing `desktop-ui/app.js`. Grouped by risk level:

**Low risk (copy-only changes, no logic change):**
- T1: Hermes not connected toast → add action
- T2: Disconnected toast → add action
- C1: Configuration saved → add ✓ icon
- C2: Title required → add context
- E7: Kanban empty column → minor clarity
- Sentinel loading string → normalize to `Loading`

**Medium risk (pass dynamic data into toast):**
- K1: Task created → pass task title
- K5: High-risk delete → pass approval ID when available

**Already correct (no change):**
- A1: Approval mutation toast
- S2: Scan complete toast
- O2: Sync complete toast
- O3: Sync failed toast
- All loading states except Sentinel

---

## Applying the Rewrites

Run this after reviewing to apply the low-risk copy changes:

```bash
# Verify no regressions before editing
npm run misato:regression

# After editing app.js:
npm run lint
npm run build
node scripts/misato-regression-check.mjs
```

The medium-risk rewrites (K1, K5) require reading the response object shape before editing.  
For K1: `createTask()` in app.js returns `task.id` — need to also capture `task.title` or use `data.title`.  
For K5: `deleteTask()` creates local approval with `id: \`apr-del-${id}-${Date.now()}\`` — can reference this directly.
