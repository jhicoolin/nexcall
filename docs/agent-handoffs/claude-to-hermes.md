# Claude → Hermes Handoff
**Date:** 2026-06-03  
**Branch:** misato-hermes-live-brain  
**Author:** Claude UI Agent (Sonnet 4.6)  
**Subject:** Model/credential state rendering + handoff for real AI routing

---

## What Claude shipped in this pass

UI-only changes to `desktop-ui/app.js` and `desktop-ui/styles.css`. No backend, auth, or API routes touched.

### Changes made

**New `modelStatus()` helper (app.js)**
- Reads `runtimeCtx.activeModel`, `modelProvider`, `modelReady` from Hermes status
- Never displays the string `"deterministic-fallback"` as a real model name
- Returns structured result: `{ ready, isFallback, displayName, providerDisplay, badgeCls, tileCls, credentialState, configHint }`
- When fallback: `displayName = "— No AI model —"`, `providerDisplay = "Deterministic classifier"`
- When live: `displayName = ctx.activeModel`, `providerDisplay = ctx.modelProvider`

**Overview model tile (renderOverview)**
- Now uses `modelStatus()` instead of raw `ctx.activeModel`
- Fallback state: amber tile, "— No AI model —", hint text: "Set AI_GATEWAY_API_KEY in Hermes environment to enable live AI responses."
- Live AI state: violet tile, actual model name, provider name
- Tile always shown when Hermes is connected (not just when activeModel exists)
- Grid column count now based on `hermes` (connected state) not `activeModel` truthiness

**Command Center banner**
- Added model/credential state badge next to runtime mode and SSE badges
- Fallback: amber "FALLBACK MODE" badge with tooltip showing config hint
- Live AI: teal badge showing model name with tooltip showing provider
- Not shown when Hermes is disconnected (shows "Configure →" button instead)

**Command message attribution**
- "deterministic fallback" badge renamed to "⚠ fallback response" with tooltip
- Tooltip: "No AI model configured. Set AI_GATEWAY_API_KEY to enable live responses."
- Real model badge (violet) only shown when modelUsed is not "deterministic-fallback"
- IIFE pattern used to keep template literal clean

**CSS additions (styles.css)**
- `.model-tile-fallback` — amber border/background for fallback tile state
- `.model-tile-fallback-value` — amber text for fallback model name
- `.model-tile-hint` — small hint text under fallback tile

---

## What Hermes must provide for real AI routing

Claude's UI is ready to show real model identity. The following fields from `/api/misato/status` drive the display:

| Field | Type | When fallback | When live |
|-------|------|--------------|-----------|
| `modelReady` | boolean | `false` | `true` |
| `activeModel` | string | `"deterministic-fallback"` | `"deepseek/deepseek-v4-flash"` or model name |
| `modelProvider` | string | `"deterministic-fallback"` | `"vercel-ai-gateway"` or provider name |
| `fallbackModel` | string | `"deterministic-fallback"` | `"deterministic-fallback"` |

And from `/api/misato/command` response:

| Field | Type | When fallback | When live |
|-------|------|--------------|-----------|
| `modelUsed` | string | `"deterministic-fallback"` | actual model name |
| `responseSource` | string | `"deterministic-fallback"` | `"hermes-ai"` |

When Hermes sets `AI_GATEWAY_API_KEY`:
- `modelReady` → `true`
- `activeModel` → the configured model (e.g., `"deepseek/deepseek-v4-flash"`)
- `modelProvider` → `"vercel-ai-gateway"`
- Command responses include `responseSource: "hermes-ai"` and the actual model name in `modelUsed`

The UI will automatically show the real model name and remove the fallback amber styling as soon as those fields change.

---

## Credential handling — Hermes responsibility

Claude does NOT handle credentials. The following is Hermes's domain:

1. **Store `AI_GATEWAY_API_KEY` server-side only** — never in the browser bundle, never in logs
2. **Expose model identity through `/api/misato/status`** — the fields listed above
3. **Pass `modelUsed` and `responseSource` in `/api/misato/command` responses** — Claude reads these to show per-message attribution
4. **Support OpenAI/Codex credentials** — if Hermes can route to OpenAI via `AI_GATEWAY_API_KEY=sk-...` or an OpenRouter key, the UI will pick it up automatically

Claude's model display is driven entirely by what Hermes reports. If Hermes says `modelReady: true` and `activeModel: "gpt-4o"`, the UI shows "gpt-4o" in a teal tile. No UI code change needed for new providers.

---

## Handoff checklist for Hermes

To enable real AI routing:

```
[ ] Set AI_GATEWAY_API_KEY in Hermes environment (server-side only, never committed)
[ ] Optionally set AI_GATEWAY_MODEL (defaults to "deepseek/deepseek-v4-flash" via OpenRouter)
[ ] Confirm /api/misato/status returns modelReady: true after credential is set
[ ] Confirm /api/misato/command response includes modelUsed (actual model, not "deterministic-fallback")
[ ] Confirm responseSource is "hermes-ai" not "deterministic-fallback" when AI is active
[ ] Run: npm run misato:smoke → command-daily check will verify the model field
```

To verify UI update without a real key (smoke test):
```
[ ] Confirm UI shows amber "FALLBACK MODE" badge in Command Center when modelReady: false
[ ] Confirm Overview tile shows "— No AI model —" in amber when fallback
[ ] Confirm command responses show "⚠ fallback response" badge with tooltip
```

---

## Security note

- The UI never reads or stores API keys
- No credential ever appears in the desktop-ui bundle
- Model identity is read from Hermes status response only — server-side truth
- `configHint` shown in the UI says "Set AI_GATEWAY_API_KEY in Hermes environment" — never shows the key value

---

## Build state at handoff

```
npm run lint:        PASS (0 errors)
npm run build:       PASS (102 kB First Load JS)
misato:regression:   11/11 verified (6 source + 5 live)
```
