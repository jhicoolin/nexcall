# Claude → Codex Handoff
**Date:** 2026-06-03  
**Branch:** misato-hermes-live-brain  
**Author:** Claude UI Agent

---

## Blocker for Codex: pm2 crash — misato-dev-server.cjs on Windows

**Status:** pm2 `misato-dev` is errored (30 restarts). Port 3010 is serving (process lingering from before crash loop), but pm2 cannot reliably manage the process.

**Root cause:**  
`misato-dev-server.cjs` uses:
```js
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "--port", port], { shell: false });
```

On Windows, `require.resolve("next/dist/bin/next")` resolves to `next.cmd` (the Windows batch file wrapper), not the actual `.js` entry point. Spawning a `.cmd` file as a Node.js script fails with:
```
SyntaxError: Invalid or unexpected token
    @ECHO off
    ^
```

**Fix options (Codex pick one):**

Option A — Use `shell: true` on Windows:
```js
const child = spawn(process.execPath, [nextBin, "dev", "--port", port], {
  shell: process.platform === 'win32',
  stdio: "inherit",
  ...
});
```

Option B — Resolve to the actual JS file:
```js
// Instead of require.resolve("next/dist/bin/next"), use:
const nextBin = require.resolve("next/dist/bin/next.js"); // force .js extension
```

Option C — Use `npx` or the package bin path directly:
```js
const child = spawn("npx", ["next", "dev", "--port", port], {
  shell: true, stdio: "inherit", ...
});
```

**Verification after fix:**
- `pm2 restart misato-dev` should stabilize (restart count stops growing)
- `curl http://127.0.0.1:3010/health` → HTTP 200 JSON
- `npm run misato:smoke` → 13/13 verified

---

## Mismatch to investigate: modelUsed vs responseSource

**Observed in live runtime:**
```
modelUsed: "gpt-4o-mini"       ← configured model (always set from getModelResolution())
responseSource: "deterministic-fallback"  ← actual path used for this response
```

These are contradictory. The model is configured but the classification pipeline is using the deterministic path. This means either:
1. The OpenAI API call in `classifyCommand()` is failing silently and falling back
2. `modelUsed` is set from the configured model before classification runs, then `responseSource` reflects the actual path after it runs

**Claude's UI fix:** The UI now uses `responseSource` as the authoritative signal and never shows both badges simultaneously. But the mismatch in the data model should be understood and potentially fixed:

- If the AI call fails → `responseSource` correctly says `"deterministic-fallback"`. But `modelUsed` saying `"gpt-4o-mini"` is misleading.
- Suggestion: only set `modelUsed` to the actual model name if `responseSource === "hermes-ai"`. When `responseSource === "deterministic-fallback"`, set `modelUsed` to `null` or omit it.

This is in `lib/misato/runtime/command-machine.ts` at the `CommandResult` return:
```typescript
modelUsed: resolution.model,  // ← only set if AI was actually invoked
```

---

## What Claude verified this pass

```
modelReady:        true           (live AI credentials configured)
activeModel:       "gpt-4o-mini"  (real model)
modelProvider:     "openai"       (real provider)
credentialState:   "resolved"     (from new Hermes model-routing module)
fallbackReason:    null           (no active fallback reason)
responseSource:    "deterministic-fallback" (classification still deterministic — see above)
```

---

## What Claude changed this pass

UI changes in `desktop-ui/app.js` (see commit message for details):
- `modelStatus()` now consumes `credentialState`, `fallbackReason`, `resolvedModel` from Hermes
- Message attribution: `responseSource` is now the sole authority for badge selection
- Both fallback + real-model badges can no longer appear simultaneously on the same message

Handoff to Hermes in `docs/agent-handoffs/claude-to-hermes.md` updated with full field reference.

---

## Verification state

```
npm run lint:             PASS
npm run build:            PASS (102 kB First Load JS)
npm run misato:regression: 11/11 verified (6 source + 5 live)
```
