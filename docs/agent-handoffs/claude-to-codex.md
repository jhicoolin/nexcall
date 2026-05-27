# Claude → Codex QA Handoff
**Date:** 2026-05-26  
**Branch:** misato-claude-live-ui-wiring  
**Author:** Claude UI Agent  

---

## What Codex needs to verify

### Build verification
- `npm run lint` — PASS (confirmed clean)
- `npm run build` — PASS (confirmed)
- `npm run desktop:build` — run this with MISATO.exe **closed**. If it fails because MISATO.exe is open, close it first.

### Functional testing checklist

**Schedule tabs:**
- [ ] Click Day tab → shows hourly grid 6a–10p
- [ ] Click Week tab → shows 7-column weekly view
- [ ] Click Agenda tab → shows agenda list (default)
- [ ] Active tab has violet border, others have default border

**Approvals:**
- [ ] Approve button calls `POST /api/misato/approvals/action` with `{ approvalId, action: 'approve' }`
- [ ] Card moves out of Pending tab after approve/reject
- [ ] Defer keeps card in Pending tab
- [ ] Filter tabs (Pending/Approved/Rejected/Deferred/All) each show correct subset
- [ ] Duplicate approval IDs are collapsed to one card (no spam)

**Live Feed:**
- [ ] `runtime_heartbeat` events do NOT appear in the feed
- [ ] `stream_connected` / `stream_reconnect` events do NOT appear
- [ ] APPV filter shows only approval events
- [ ] Same eventId does not appear twice

**Command Center:**
- [ ] Send "hi" → response appears in chat bubble
- [ ] If `modelUsed` in response → violet badge appears below message
- [ ] If `responseSource: 'deterministic-fallback'` → amber `deterministic fallback` badge appears
- [ ] Error messages show endpoint URL attempted, not just generic "Failed to fetch"

**AgentDex:**
- [ ] If agent has `progress: 75` → progress bar shows at 75%
- [ ] Agent drawer shows `lastActivityAt`, progress bar, `tasksCompleted` if present
- [ ] Assigning task via modal calls `POST /api/misato/tasks/create`

**Sentinel:**
- [ ] Scan Now button calls `POST /api/misato/secrets/scan-summary` (NOT `sentinel/scan`)
- [ ] If scan fails, toast shows the endpoint URL and error message
- [ ] `gitleaksInstalled: false` shows install instructions panel
- [ ] Secret values are never rendered (only `[REDACTED]`)

**Obsidian Mirror:**
- [ ] If `state.runtimeCtx.obsidian.configured` is false → shows setup instructions
- [ ] Sync Now button calls `POST /api/misato/obsidian/sync`
- [ ] "Open in Obsidian" button is disabled when vault not configured

**Mock banners:**
- [ ] When Hermes connected: NO mock banners on Overview, AgentDex, Kanban, Logs, Watchtower, Approvals
- [ ] When Hermes disconnected: mock banners appear with amber style
- [ ] Loading spinner (`hermes-loading`) appears while data fetches after connect

**Lanes:**
- [ ] When Hermes connected but no branch/lane fields: shows blue "waiting on" banner, NOT MOCK banner
- [ ] When agents have `branch` field: shows live lane data

---

## Mutations to verify (POST calls)

| Action | Endpoint | Body |
|--------|----------|------|
| Send command | `POST /api/misato/command` | `{ command }` |
| Create task | `POST /api/misato/tasks/create` | `{ title, project, priority, status, agent }` |
| Update task | `POST /api/misato/tasks/update` | `{ taskId, payload }` |
| Delete task | `POST /api/misato/tasks/delete` | `{ taskId }` |
| Approve | `POST /api/misato/approvals/action` | `{ approvalId, action: 'approve' }` |
| Reject | `POST /api/misato/approvals/action` | `{ approvalId, action: 'reject' }` |
| Defer | `POST /api/misato/approvals/action` | `{ approvalId, action: 'defer' }` |
| Scan secrets | `POST /api/misato/secrets/scan-summary` | `{}` |
| Sync Obsidian | `POST /api/misato/obsidian/sync` | `{}` |

---

## Known issues Codex may need to fix

1. **`npm run desktop:build`** — must be run with MISATO.exe closed. If build fails, report in this doc.
2. **Approval filter state** — if `state.approvalFilter` persists across screen changes, it might confuse navigation. Codex can decide if it should reset on nav.
3. **Schedule Day/Week with no `scheduledAt` data** — shows honest waiting state. If Hermes tasks never have `scheduledAt`, Codex can confirm this is expected.
4. **Watchtower refresh** — still calls `loadAllFromHermes()` on Refresh click, not a dedicated `/watchtower/check` endpoint. If Hermes adds this, Codex should wire it.
5. **SSE noise** — if Hermes emits events not in `FEED_NOISE_TYPES` that are still spammy, Codex/Hermes should coordinate to add them.

---

## Secrets / security checklist

- [ ] No raw secret values in any UI render path
- [ ] Token fields are password inputs — value never shown after entry
- [ ] No `console.log` of tokens (check browser DevTools)
- [ ] Sentinel findings show `[REDACTED]` for any secret-like value

---

## Blockers for Codex

- `npm run desktop:build` requires Tauri environment (might need to run on owner machine)
- Approval action endpoint shape must match: `{ approvalId, action }` — if Hermes uses different field names, Codex should update the Hermes API contract doc and flag to Claude
