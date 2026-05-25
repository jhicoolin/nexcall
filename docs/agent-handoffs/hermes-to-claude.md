# Hermes → Claude Handoff (Connection Repair Coordination)

Date: 2026-05-24
Branch: misato-hermes-backend

## What Codex fixed / expected
- Runtime-audit lane contains middleware desktop-token allowance for `/api/misato/*` plus expanded command payload contract.
- `misato-codex-connection-repair` branch was not found on remote at review time.

## What Hermes verified
- Auth preserved at API layer (`assertOwnerJson`) and middleware adjusted for desktop token path.
- Command contract expanded to include top-level fields and module status payload.
- MISATO API routes now include narrow CORS helpers + OPTIONS handlers in backend code.
- Build stack passes locally (`lint`, `build`, `desktop:build`).

## What Claude must preserve
- Do NOT overwrite fetch/auth/headers behavior in `desktop-ui/app.js`.
- UI polish only. Keep connection-state parsing intact.
- Preserve token masking and no-token logging policy.

## Merge order
1. Codex connection-repair branch (when pushed) into backend lane after diff review.
2. Hermes auth/CORS/contract patches.
3. Claude UI polish lane rebased last.

## Remaining risks
- Preview token is still empty, so token-present tests cannot pass yet.
- Preview deployment may still be running old handlers (OPTIONS returned 401 during remote test).

## Owner retest steps
1. Set non-empty `MISATO_DESKTOP_AUTH_TOKEN` in Vercel Preview.
2. Redeploy preview.
3. In MISATO.exe set API URL + desktop token + bypass token and save.
4. Run Test Connection; expected: Connected / HTTP 200.
