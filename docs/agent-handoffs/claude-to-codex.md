# Handoff: Claude UI → Codex QA

**From:** Claude UI Agent (desktop-ui lane)
**To:** Codex QA Agent (client reliability lane)
**Branch:** misato-claude-ui → misato-codex-client-qa
**Date:** 2026-05-25
**Version:** desktop-ui v4 stabilization pass

---

## What Claude UI delivered

`desktop-ui/app.js` v4 and `desktop-ui/styles.css` v4 — full local-first rewrite.

All 13 screens now use live Hermes data when connected, with clearly labeled MOCK fallback when not.

---

## What Codex should verify

### 1. Route correctness — Hermes local bridge

`loadAllFromHermes()` now calls **flat paths** (no `/api/misato/` prefix):
```
GET localhost:3010/agents
GET localhost:3010/tasks
GET localhost:3010/approvals
GET localhost:3010/logs
GET localhost:3010/watchtower
GET localhost:3010/secrets
GET localhost:3010/events/stream   (SSE)
POST localhost:3010/command
```
**Verify:** Are these the actual Hermes sidecar routes? If Hermes uses a different prefix or path alias, the UI must be updated. The `hermesBase()` function in app.js returns `http://${host}:${port}`.

### 2. Route correctness — Vercel Preview path

`loadAll()` (the Vercel / token path) calls:
```
GET <baseUrl>/council     → maps to /api/misato/council on Vercel
GET <baseUrl>/tasks       → /api/misato/tasks
GET <baseUrl>/approvals   → /api/misato/approvals
GET <baseUrl>/logs        → /api/misato/logs
GET <baseUrl>/watchtower/status  → /api/misato/watchtower/status
GET <baseUrl>/secrets/status     → /api/misato/secrets/status
```
**Verify:** These paths are appended to `state.baseUrl` (e.g. `https://nexcall-git-*.vercel.app/api/misato`). Confirm the Vercel routes match — particularly `/council` vs `/agents`.

### 3. CORS on Vercel preview routes

The UI sends two headers on Vercel path requests:
```
x-misato-desktop-token: <token>
x-vercel-protection-bypass: <bypass>
```
**Verify:** Vercel middleware allows these custom headers. CORS `Access-Control-Allow-Headers` must include `x-misato-desktop-token` and `x-vercel-protection-bypass`. Without this, the browser will block the preflight.

### 4. Response shape normalization

The UI normalizes response shapes in `normalizeItemsResponse()`:
```js
// Accepts bare array OR { items: [...] }
if (Array.isArray(value)) return value;
if (Array.isArray(value?.items)) return value.items;
return [];
```
And in `normalizeCouncilAgent()`:
```js
// Accepts status/state synonyms: "online"→"active", "pending"→"thinking", etc.
// Accepts perm synonyms: permissionLevel (number) → "L1", "L2", etc.
// Accepts specialty synonyms: abilities[], allowedTools[], memoryScope
```
**Verify:** If Hermes or Vercel returns shapes that don't match, check which field is missing and update the normalizer — not the backend contract.

### 5. `/health` response shape

`discoverHermes()` reads:
```js
{ status, version, uptime, agents: { active, total }, tasks, events }
```
The top bar shows `version` and `agents.active`. If these fields are missing, the top bar shows `?` rather than breaking.

**Verify:** Does `/health` return `agents.active` (object) or `agents` (number)? The UI handles both:
- `h?.agents?.active` for object shape
- Falls back to `'?'` if missing

### 6. SSE event stream

`startSSE()` connects to `localhost:3010/events/stream`. Each message must be valid JSON on `event.data`.

**Verify:**
- Does the SSE endpoint send `data: {...}\n\n` format (standard EventSource)?
- Does each event include `{ eventId, timestamp, type, source, payload }`?
- Does `payload.commandId` exist on command-flow events? (Used to correlate timeline stages)

### 7. Panel-specific checks

| Screen | What to check |
|--------|--------------|
| AgentDex | Does `/agents` return? Does `normalizeCouncilAgent()` map state correctly? |
| Kanban | Does `/tasks` return? Do `status` values match `Done\|Doing\|Blocked\|Idea`? |
| Approvals | Does `/approvals` return? Does each item have `id, title, risk, agent, details`? |
| Logs | Does `/logs` return? Does each item have a severity field (`sev`, `level`, or `severity`)? |
| Watchtower | Does `/watchtower` return `{ services: [...] }` or `{ monitors: [...] }`? |
| Secret Sentinel | Does `/secrets` return an object (not array) with `findings` + `remediation`? |
| Schedule | Does `/tasks` include `scheduledAt` or `time` fields? If not, Schedule stays MOCK. |
| Lanes | Does `/agents` include `branch` or `lane` fields? If not, Lanes stays MOCK. |
| Command Center | Does `POST /command` return `{ ok, commandId, missionSummary }`? |

### 8. Connectivity test path (Vercel)

`testConnection()` hits `<baseUrl>/status` — this maps to `/api/misato/status` on Vercel.

**Verify:** Does this route return `200 application/json`? If it returns `text/html`, the UI correctly shows "Vercel Protected" and prompts the user to add a bypass token.

---

## Known fallback surfaces (not bugs)

These screens are always MOCK because the required data is not in Hermes's current contract. The MOCK banner is shown. These are not Codex bugs — they're Hermes feature requests.

| Screen | Why MOCK | What Hermes needs to add |
|--------|----------|--------------------------|
| Schedule | Tasks have no `scheduledAt` or `time` field | Add `/schedule` endpoint or `scheduledAt` to tasks |
| Lanes | Agents have no `branch` or `lane` field | Add `branch`/`lane` to agent objects |

---

## Security constraints Codex must not break

- Token inputs use `type="password"` and `autocomplete="off"`. Never change to `type="text"`.
- `saveConfig()` checks `if (token && token !== '••••••••••••••••')` before overwriting saved values. Do not remove this guard.
- No token values in `console.log`, render output, or URL parameters.
- `isConnected()` gates command send — do not bypass.
- No changes to `middleware.ts`, auth logic, or `/api/*` backend routes.

---

## Files to diff

```
desktop-ui/app.js
desktop-ui/styles.css
```

**Branch:** `misato-claude-ui`

Codex's branch: `misato-codex-client-qa` — PRs should target `misato-full-build`, not `main`.
