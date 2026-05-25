# Codex Client QA Status

## Emergency Connection Repair

- Branch: `misato-codex-connection-repair`
- Root cause: desktop fetch could die before JSON because `/api/misato/*` lacked route-level CORS/preflight handling and inherited global CORP `same-origin`.
- URL shape: full API base ending in `/api/misato`; desktop appends `/status` and `/command`.
- CORS: added for MISATO API only.
- CORP: overridden to `cross-origin` for MISATO API only.
- OPTIONS: added for active MISATO routes.
- Auth: preserved; missing/bad token still 401 JSON, valid desktop token 200 JSON.
- Vercel protection: desktop now identifies non-JSON 401/403 as protected preview and tells owner to add bypass token or disable preview protection.

## Local Endpoint Tests

- `GET /api/misato/status` without token: 401 JSON with CORS/CORP.
- `OPTIONS /api/misato/command`: 204 with allowed custom headers.
- `GET /api/misato/status` with local test token: 200 JSON.
- `POST /api/misato/command` with daily command: 200 JSON, approval false.
- `POST /api/misato/command` with risky deploy command: 200 JSON, approval true.
- `npm run desktop:build`: pass; exe and NSIS installer produced.

## Preview Status

Real preview token was not present in the local shell. Preview token test remains owner/Hermes verification after Vercel redeploy.

## Owner Retest

After Vercel preview redeploy and desktop rebuild, paste:

`https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato`

Then save config, click Test Connection, and run `What needs attention today?`.
