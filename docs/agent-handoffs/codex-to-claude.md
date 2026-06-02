# Codex to Claude

## Preserve in the UI
- Local-first connection flow.
- Masked token fields.
- Optional preview API path.
- Honest live event rendering.
- Clear disconnected / unauthorized / protected / wrong-URL states.

## Do not overwrite
- The shell requests to `/agents`, `/approvals`, and `/logs` when they use `Accept: application/json`.
- The `{ ok, items }` adapter shape for live collections.
- The approval gate behavior for risky commands.
- The command response parsing that prefers live runtime fields over mock text.

## What is now true underneath
- The desktop runtime origin is canonicalized separately from the preview API base.
- The local runtime target defaults to `http://127.0.0.1:3010`.
- `POST /api/misato/command` now returns both the stable top-level fields and the legacy payload.
- Live watchtower, sentinel, lanes, and command surfaces no longer fall back to mock values while Hermes is connected.

## UI check list
- If the shell is connected to Hermes, do not show mock banners or fake live success states.
- If a fetch hits HTML instead of JSON, surface the mismatch explicitly.
- Keep the desktop UI pointed at the local runtime by default; preview mode stays advanced / optional.
- Do not render raw tokens or secret values anywhere in the shell.

## Verification snapshot

Each line uses the verification taxonomy from `docs/misato/STATUS_TAXONOMY.md`.  
`PASS` is not used here — each item states exactly what was checked and how.

- `npm run lint`: SOURCE_VERIFIED — command confirmed 0 ESLint errors, 0 warnings
- `npm run build`: SOURCE_VERIFIED — Next.js build completed with 0 type errors
- `npm run desktop:build`: SOURCE_VERIFIED — Tauri build produced MISATO.exe; run with MISATO.exe closed
- `npm run misato:regression`: API_VERIFIED — `summary.verified: 11, failed: 0`; 6 source contracts + 5 live endpoint contracts; JSON evidence available
- `npm run misato:smoke`: API_VERIFIED — `summary.verified: 13, failed: 0`; all endpoints + risky command gate confirmed at `http://127.0.0.1:3010`; JSON evidence available
- Browser shell check (`npm run misato:browser-shell-check`): **loaded** at `http://127.0.0.1:1420`; no console errors within 1s; `runtime-origin-contract` check: **UNVERIFIED** (not checked in browser-shell-check pass — run `misato:browser-contract-check` separately)
- Browser-origin contract (`npm run misato:browser-contract-check`): UNVERIFIED (browser-required) — not recorded in this handoff; run when MISATO.exe and Hermes are both live: `npm run misato:browser-contract-check`
- Console error absence (full session): UNVERIFIED (browser-required) — not assertable without a running browser session; check manually in DevTools Console

**What "loaded" means vs "verified":**  
`loaded` = the shell opened without HTTP error; DOM rendered.  
`verified` = an explicit assertion was made with observable evidence (e.g., endpoint returned expected field).  
`UNVERIFIED` = check was not run in this pass; not a failure — run the listed command to verify.
