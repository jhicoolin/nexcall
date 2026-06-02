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
- `npm run lint`: PASS
- `npm run build`: PASS
- `npm run desktop:build`: PASS
- `npm run misato:smoke`: PASS
- Browser shell check (`npm run misato:browser-shell-check`): loaded successfully at `http://127.0.0.1:1420`; no page crash observed in this pass; console/page errors were explicitly checked and none were observed
- Browser-origin contract (`npm run misato:browser-contract-check`): verified against `http://127.0.0.1:3010` with canonical runtime origin, status JSON, command contract, and clean console window
- Runtime-origin contract: also verified separately by the smoke/regression checks against `http://127.0.0.1:3010`
