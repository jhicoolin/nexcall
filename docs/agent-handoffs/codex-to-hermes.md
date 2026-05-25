# Codex -> Hermes Handoff

## Vulnerabilities / Risks Found

- Desktop token auth was blocked at middleware before route handlers.
- Login API could be blocked by the broad MISATO API middleware gate.
- Command route contract was too narrow for the documented Hermes/MISATO pipeline.
- Desktop could misread non-JSON Vercel protection responses.
- Gitleaks is not installed locally, so Secret Sentinel should treat local scans as planned until owner installs it.

## Code Bugs Patched

- Middleware now allows valid desktop token auth for protected MISATO APIs while preserving owner session auth.
- Auth login/logout are excluded from the pre-login middleware block.
- Command endpoint now returns mock-safe Hermes plan, module status, approval fields, and legacy `result`.
- Tauri no longer overwrites saved API base URL with an empty env value.
- Desktop connection handling now validates URL shape, normalizes trailing slashes, distinguishes 401/403/404/Vercel protection/fetch failures, and avoids token rendering.

## Recommended Hermes Actions

- Verify Vercel preview env contains `MISATO_DESKTOP_AUTH_TOKEN` without printing it.
- Verify preview `/api/misato/status`, `/command`, `/watchtower/status`, and `/secrets/status` with valid owner auth or desktop token.
- Keep live automations disabled until Approval Gate and audit persistence are real.
- Treat the Hermes shim as v1 contract, not a real external runtime.

## Emergency Connection Repair

- Root cause: MISATO API responses inherited global `Cross-Origin-Resource-Policy: same-origin` and did not consistently provide CORS headers or OPTIONS preflight responses for Tauri/WebView custom headers.
- URL shape verified: desktop expects full API base ending in `/api/misato`, then calls `/status` and `/command`.
- Fix applied: `/api/misato/*` now returns `Access-Control-Allow-Origin: *`, allowed methods/headers, `Access-Control-Max-Age: 86400`, and `Cross-Origin-Resource-Policy: cross-origin`.
- Auth preserved: no token still returns 401 JSON; valid desktop token returns 200 JSON.
- Preview redeploy required: yes, Vercel preview must deploy this branch before MISATO.exe can benefit from the server header fix.
