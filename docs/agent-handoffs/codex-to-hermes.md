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

## Final QA Lane - 2026-05-25

- Codex verified the desktop URL shape, token masking, CORS/CORP helper, OPTIONS coverage, command contract, and Tauri desktop bundle path on `misato-codex-qa-final`.
- Local Solo Mode is not present in this integration point; local endpoint tests use desktop token auth and no-token remains 401 JSON.
- Secret Sentinel assets were missing from `origin/misato-full-build` and were added as repo-local, redacted, fail-soft gitleaks scripts plus a GitHub workflow.
- One client reliability fix was applied: Test Connection now enters the visible `Testing` state before the fetch resolves.
- Local validation passed for CORS preflight, 401 JSON without token, 200 status with token, daily command with approval false, and risky deploy command with approval true.
- Preview validation is blocked at Vercel edge protection: preflight and no-token status returned 401 before MISATO app JSON/CORS headers.
- Build validation passed: `npm run lint`, `npm run build`, `cargo fmt --check`, and `npm run desktop:build`.
- Hermes should verify preview env token presence without printing values, then run token-present preview `/status` and `/command` tests after redeploy.
- Production deploy, DNS, auth policy changes, env changes, live automations, GitHub main merges, Discord actions, and Obsidian writes remain approval-gated.
