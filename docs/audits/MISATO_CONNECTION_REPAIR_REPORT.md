# MISATO Connection Repair Report

## Summary

MISATO.exe showed `Failed to fetch` before it could read JSON. The likely root cause was the server response policy for `/api/misato/*`: no consistent CORS headers, missing OPTIONS preflight for custom desktop headers, and inherited `Cross-Origin-Resource-Policy: same-origin` from the global public-site security headers.

## URL Shape Verified

- Owner pastes full API base ending in `/api/misato`.
- Desktop calls `${base}/status`.
- Desktop calls `${base}/command`.
- Trailing slashes are trimmed.
- Tauri does not overwrite saved URL/token values with empty env values.
- Tokens are never logged or rendered.

## Server Repair

- Added `lib/misato/http/cors.ts`.
- Added CORS headers for `/api/misato/*` only:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, x-misato-desktop-token, x-vercel-protection-bypass, authorization`
  - `Access-Control-Max-Age: 86400`
  - `Cross-Origin-Resource-Policy: cross-origin`
- Added OPTIONS handlers to active MISATO routes.
- Added Next header override for `/api/misato/:path*`.
- Public NexCall global security headers remain unchanged.

## Desktop Repair

- Non-JSON 401/403 is reported as Vercel Protected.
- Fetch exceptions now explain likely CORS/CORP, Vercel protection, network, or wrong URL.
- 404 reports wrong deployment URL.
- 401 JSON reports unauthorized token mismatch or missing desktop token.

## Local Tests

- No token `GET /status`: 401 JSON, `Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin`.
- `OPTIONS /command`: 204, custom headers allowed.
- Local test token `GET /status`: 200 JSON.
- Local test token daily `POST /command`: 200 JSON, approval false.
- Local test token risky deploy `POST /command`: 200 JSON, approval true.
- OPTIONS checked for status, watchtower, secrets, projects, tasks, approvals, council, discord, and obsidian routes.

## Validation

- `node --check desktop-ui/app.js`: pass
- `npm install`: pass
- `npm run lint`: pass
- `npm run build`: pass
- `npm run desktop:build`: pass
- Desktop exe: `src-tauri\target\release\misato-desktop.exe`
- Desktop installer: `src-tauri\target\release\bundle\nsis\MISATO_0.1.0_x64-setup.exe`
- Public NexCall marketing pages: untouched

## Preview

Preview token test requires the real owner token and a redeployed preview branch. No token values were accessed or printed in this repair.

## Owner Retest Steps

1. Wait for Vercel preview redeploy from `misato-codex-connection-repair`.
2. Rebuild or install the new MISATO desktop bundle.
3. Launch MISATO.exe.
4. Paste API base: `https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato`.
5. Paste the matching desktop token.
6. Paste Vercel bypass token if preview protection is enabled.
7. Click Save Config.
8. Click Test Connection.
9. Expect Connected / HTTP 200.
10. Run `What needs attention today?`.
