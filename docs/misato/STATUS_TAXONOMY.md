# MISATO Status Taxonomy
**Version:** 1.1  
**Branch:** misato-hermes-live-brain  
**Authority:** Claude UI Agent — this document governs all visible status language across every MISATO surface.

Every status used in the UI, copy deck, API responses, agent output, **and verification scripts** must come from this table.  
No ad-hoc status strings. No unlisted colors. No silent states.

---

## Verification Status Axis

Used by verification scripts (`scripts/misato-*.mjs`) and test matrix results.  
These are distinct from the runtime UI statuses below — they describe the **confidence level** of a check.

| Status | Meaning | Example |
|--------|---------|---------|
| `loaded` | Component rendered or responded; no deeper contract asserted | Shell DOM rendered at HTTP 200 |
| `verified` | Explicit assertion made and passed with observable evidence | `/api/misato/status` returned `runtimeMode` field |
| `partially_verified` | Some assertions passed; others skipped or infeasible in this pass | Console errors checked; window globals not checked |
| `unverified` | Check not executed — environment constraint, needs browser, or Hermes offline | Runtime-origin check skipped — Tauri not running |
| `failed` | Check was executed and assertion explicitly failed | `/api/misato/status` returned HTTP 401 |

**Rule:** Never use `verified` for a check that only confirms a source-code pattern. Use `verified` only when an observable runtime behavior was asserted. For source-text checks, the notes field must say "Source text confirms … NOT a runtime observation."

**Rule:** Never use `failed` for a check that could not run due to environment. Use `unverified` with a note explaining how to run it.

**Script output schema** (machine-readable, emitted by all `scripts/misato-*.mjs`):

```json
{
  "schemaVersion": "1.0",
  "timestamp": "ISO 8601",
  "checks": [
    {
      "component": "runtime-smoke",
      "check":     "endpoint-status",
      "result":    "verified",
      "evidence":  { "url": "...", "httpStatus": 200, "topLevelKeys": [...] },
      "notes":     "Human-readable explanation of what was checked and what was found.",
      "timestamp": "ISO 8601"
    }
  ],
  "summary": { "loaded": 0, "verified": 13, "partially_verified": 0, "unverified": 0, "failed": 0 },
  "ok":            true,
  "humanReadable": "Runtime smoke PASS: all 13 checks verified against http://127.0.0.1:3010."
}
```

---

---

## Design Token Reference

These tokens are defined in `desktop-ui/styles.css` and must be used exactly as listed.

| Token | Hex | CSS class | Usage |
|-------|-----|-----------|-------|
| Teal | `#2DD4BF` | `.badge-teal` | Active, healthy, connected, synced |
| Green | `#4ADE80` | `.badge-green` | Recovered, success, done |
| Amber | `#F59E0B` | `.badge-amber` | Warning, stale, waiting, degraded |
| Red | `#EF4444` | `.badge-red` | Error, failed, blocked, offline |
| Blue | `#60A5FA` | `.badge-blue` | Loading, setup, info, syncing |
| Slate | `#6B7280` | `.badge-slate` | Neutral, unknown, inactive |
| Text primary | `#f8fbff` | `.text-primary` | All status labels |
| Text muted | `#4B5563` | `.text-muted` | Timestamps, sub-labels |

---

## Status Definitions

### `loading`

| Field | Value |
|-------|-------|
| **User-facing label** | Loading |
| **Icon** | `◌` (spinner via CSS animation `.loading-dot`) |
| **Color / CSS class** | Blue `#60A5FA` · `.badge-blue` |
| **Meaning** | Fetching live state from Hermes. No data available yet. Do not render stale data while in this state. |
| **Fallback behavior** | Show spinner with context string. Disable all mutation buttons. Do not show empty state yet. |
| **Copy template** | `◌ Loading {feature} from Hermes…` |
| **ARIA description** | `aria-label="Loading {feature}. Please wait."` `aria-busy="true"` |
| **Minimum duration** | Show for at least 300ms to avoid flash |
| **Transition to** | `active` on success · `failed` on error · `offline` if Hermes unreachable |

---

### `active`

| Field | Value |
|-------|-------|
| **User-facing label** | Active |
| **Icon** | `●` |
| **Color / CSS class** | Teal `#2DD4BF` · `.badge-teal` |
| **Meaning** | Live and operational. Data is current. Mutations are enabled. |
| **Fallback behavior** | Show live data. Enable all appropriate mutation controls. |
| **Copy template** | `● {feature} active · {count} items` |
| **ARIA description** | `aria-label="{feature} is active and up to date"` `aria-live="polite"` |
| **Transition to** | `stale` if data age exceeds 5 min · `loading` on refresh · `offline` on disconnect |

---

### `blocked`

| Field | Value |
|-------|-------|
| **User-facing label** | Blocked |
| **Icon** | `⊘` |
| **Color / CSS class** | Red `#EF4444` · `.badge-red` |
| **Meaning** | Cannot proceed. Something external must act first. Always show what is blocking and the next action. |
| **Fallback behavior** | Show blocker card with reason and resolution path. Disable forward actions. Do not auto-retry. |
| **Copy template** | `⊘ Blocked: {reason} · Action: {next_step}` |
| **ARIA description** | `aria-label="Blocked. {reason}. To unblock: {next_step}"` `role="alert"` |
| **Transition to** | `active` when blocker is resolved · `failed` if blocker cannot be resolved |

---

### `waiting_approval`

| Field | Value |
|-------|-------|
| **User-facing label** | Awaiting approval |
| **Icon** | `⟳` |
| **Color / CSS class** | Amber `#F59E0B` · `.badge-amber` |
| **Meaning** | A risky action is pending explicit owner decision. Execution is paused. The approval card is in the queue. |
| **Fallback behavior** | Show approval card in the Approvals screen queue. Show blocked state on the originating command. Do not auto-approve. |
| **Copy template** | `⟳ Awaiting your approval · {risk_level} risk · {time_ago}` |
| **ARIA description** | `aria-label="Awaiting your approval. Risk level: {risk_level}. Created {time_ago}. Review the approval card to proceed."` `role="alert"` `aria-live="assertive"` |
| **Transition to** | `active` on approve · `blocked` on reject · `stale` if pending > 24h |

---

### `stale`

| Field | Value |
|-------|-------|
| **User-facing label** | Stale |
| **Icon** | `⚠` |
| **Color / CSS class** | Amber `#F59E0B` · `.badge-amber` |
| **Meaning** | Data was fetched successfully but is now older than the staleness threshold (5 minutes for live data, 30 minutes for schedule/lanes). May not reflect current truth. |
| **Fallback behavior** | Show last known data with a visible stale banner and timestamp. Show a Refresh button. Disable mutations that depend on current state. |
| **Copy template** | `⚠ Last updated {time_ago} · May not reflect current state · [Refresh]` |
| **ARIA description** | `aria-label="Data is stale. Last updated {time_ago}. Click Refresh to get current state."` |
| **Staleness thresholds** | Live events: 2 min · Agent/task state: 5 min · Schedule: 10 min · Lanes: 5 min |
| **Transition to** | `active` on successful refresh · `offline` if refresh fails |

---

### `failed`

| Field | Value |
|-------|-------|
| **User-facing label** | Failed |
| **Icon** | `✗` |
| **Color / CSS class** | Red `#EF4444` · `.badge-red` |
| **Meaning** | An operation completed with an error. The error is not transient — a user or system action is required to recover. Always show the endpoint, error message, and recovery action. |
| **Fallback behavior** | Show error card with: endpoint URL, status code, error message, and a Retry or Fix action. Write failure to run ledger. |
| **Copy template** | `✗ {operation} failed · {endpoint} · {error_message} · [Retry]` |
| **ARIA description** | `aria-label="{operation} failed. Endpoint: {endpoint}. Error: {error_message}. Action required."` `role="alert"` `aria-live="assertive"` |
| **Transition to** | `loading` on retry · `recovered` if retry succeeds · `offline` if Hermes unreachable |

---

### `recovered`

| Field | Value |
|-------|-------|
| **User-facing label** | Recovered |
| **Icon** | `✓` |
| **Color / CSS class** | Green `#4ADE80` · `.badge-green` |
| **Meaning** | A previously failed operation is now working. Stale or error state has been cleared. Show briefly, then transition to `active`. |
| **Fallback behavior** | Show success banner for 3 seconds, then hide. Update data view to current state. |
| **Copy template** | `✓ Recovered · {description}` |
| **ARIA description** | `aria-label="{feature} recovered and is now active."` `aria-live="polite"` |
| **Display duration** | 3 seconds then auto-dismiss |
| **Transition to** | `active` after 3 seconds |

---

### `setup_required`

| Field | Value |
|-------|-------|
| **User-facing label** | Setup required |
| **Icon** | `⚙` |
| **Color / CSS class** | Blue `#60A5FA` · `.badge-blue` |
| **Meaning** | Feature is not configured. Specific steps are needed before it can function. Show exact instructions, not generic errors. |
| **Fallback behavior** | Show setup panel with exact configuration steps. Disable feature controls. Link to relevant docs or settings. |
| **Copy template** | `⚙ Setup required: {instruction} · [Configure]` |
| **ARIA description** | `aria-label="Setup required for {feature}. {instruction}. Click Configure to set it up."` |
| **Transition to** | `loading` when user begins setup · `active` when setup completes |

---

### `syncing`

| Field | Value |
|-------|-------|
| **User-facing label** | Syncing |
| **Icon** | `⟳` (spinning) |
| **Color / CSS class** | Blue `#60A5FA` · `.badge-blue` |
| **Meaning** | A live projection operation is in progress (Obsidian mirror, schedule sync, lane update). Do not interrupt. |
| **Fallback behavior** | Show spinner with progress if available. Disable Sync Now button. Do not navigate away. |
| **Copy template** | `⟳ Syncing to {destination}…{progress ? ' ' + progress + '%' : ''}` |
| **ARIA description** | `aria-label="Syncing to {destination}. Please wait."` `aria-busy="true"` |
| **Transition to** | `synced` on success · `failed` on error |

---

### `synced`

| Field | Value |
|-------|-------|
| **User-facing label** | Synced |
| **Icon** | `✓` |
| **Color / CSS class** | Green `#4ADE80` · `.badge-green` |
| **Meaning** | A live projection completed successfully. The destination reflects current runtime truth. |
| **Fallback behavior** | Show timestamp of last sync. Show item count synced. Enable Sync Now for next manual sync. |
| **Copy template** | `✓ Synced · {count} items · {timestamp}` |
| **ARIA description** | `aria-label="{feature} synced successfully. {count} items. Last sync: {timestamp}."` |
| **Transition to** | `stale` when sync age exceeds threshold · `syncing` on next sync |

---

### `degraded`

| Field | Value |
|-------|-------|
| **User-facing label** | Degraded |
| **Icon** | `⚠` |
| **Color / CSS class** | Amber `#F59E0B` · `.badge-amber` |
| **Meaning** | The system is partially functional. Core features work but one or more optional features are offline or impaired. Show which parts work and which don't. |
| **Fallback behavior** | Show which features are working and which are impaired. Enable working features. Disable impaired features with clear label. |
| **Copy template** | `⚠ Degraded · {working_features} working · {offline_features} offline` |
| **ARIA description** | `aria-label="System degraded. {working_features} working. {offline_features} offline."` `role="status"` |
| **Transition to** | `healthy` when all features recover · `offline` if degradation deepens |

---

### `offline`

| Field | Value |
|-------|-------|
| **User-facing label** | Offline |
| **Icon** | `✕` |
| **Color / CSS class** | Slate `#6B7280` · `.badge-slate` |
| **Meaning** | Feature or backend is completely unavailable. Cannot load data or execute mutations. Show last known state as explicitly stale. |
| **Fallback behavior** | Show last known data with stale banner. Disable all mutations. Show reconnect button with retry interval. Write disconnection to run ledger. |
| **Copy template** | `✕ Offline · {reason} · Last contact: {time_ago} · [Reconnect]` |
| **ARIA description** | `aria-label="{feature} is offline. {reason}. Last contact was {time_ago}. Click Reconnect to retry."` `role="alert"` |
| **Retry interval** | 5 seconds exponential backoff, max 60 seconds |
| **Transition to** | `loading` on reconnect attempt · `active` on successful reconnect |

---

### `healthy`

| Field | Value |
|-------|-------|
| **User-facing label** | Healthy |
| **Icon** | `✓` |
| **Color / CSS class** | Teal `#2DD4BF` · `.badge-teal` |
| **Meaning** | All checks pass. No warnings. System is functioning within expected parameters. |
| **Fallback behavior** | Show health indicator tiles. No action required. Show uptime if available. |
| **Copy template** | `✓ Healthy · uptime {uptime} · all checks pass` |
| **ARIA description** | `aria-label="{feature} is healthy. Uptime: {uptime}. All checks passing."` |
| **Transition to** | `degraded` on partial failure · `offline` on full failure |

---

## Usage Rules

1. **Never use unlisted status strings.** If the situation doesn't fit a listed status, choose the closest one and note the gap.
2. **Never show `failed` without an endpoint URL and error message.** Silent failures are prohibited.
3. **Never show `loading` indefinitely.** After 30 seconds with no response, transition to `failed` with a timeout message.
4. **Never show `active` or `healthy` when data is actually stale.** Check timestamps before rendering status.
5. **`blocked` must always name the blocker.** "Blocked" with no reason is forbidden.
6. **`waiting_approval` must link to the approval card.** Never leave the user wondering where to act.
7. **Accessibility attributes are not optional.** Every status indicator must include the `aria-label` specified above.

---

## Status CSS Class Reference

```css
/* In desktop-ui/styles.css — badge classes for status chips */
.badge-teal   { background: rgba(45,212,191,0.12); color: #2DD4BF; border: 1px solid rgba(45,212,191,0.2); }
.badge-green  { background: rgba(74,222,128,0.12); color: #4ADE80; border: 1px solid rgba(74,222,128,0.2); }
.badge-amber  { background: rgba(245,158,11,0.12); color: #F59E0B; border: 1px solid rgba(245,158,11,0.2); }
.badge-red    { background: rgba(239,68,68,0.12);  color: #EF4444; border: 1px solid rgba(239,68,68,0.2);  }
.badge-blue   { background: rgba(96,165,250,0.12); color: #60A5FA; border: 1px solid rgba(96,165,250,0.2); }
.badge-slate  { background: rgba(107,114,128,0.12);color: #6B7280; border: 1px solid rgba(107,114,128,0.2);}
```

---

## Status → Surface Mapping

| Surface | Primary status used | Secondary |
|---------|--------------------|----|
| Chat stream | `active` / `loading` / `offline` | `waiting_approval` when command blocked |
| Agents list | `active` / `loading` / `blocked` | `stale` if lastActivityAt old |
| Tasks (Kanban) | `active` / `blocked` / `loading` | `stale` if not refreshed |
| Approvals | `waiting_approval` / `active` / `loading` | `stale` if queue not current |
| Schedule | `active` / `loading` / `stale` | `setup_required` if no scheduledAt |
| Lanes | `active` / `loading` / `setup_required` | `stale` if no lane data |
| Watchtower | `healthy` / `degraded` / `offline` | `loading` on refresh |
| Sentinel | `active` / `setup_required` / `loading` | `failed` on scan error |
| Live Feed | `active` / `loading` / `offline` | `degraded` on polling fallback |
| Obsidian Mirror | `synced` / `syncing` / `setup_required` | `failed` on sync error |
| MCP Tools | `active` / `setup_required` / `offline` | `degraded` if tool partial |
