# MISATO Final QA Matrix

Date: 2026-05-25
Branch: misato-codex-qa-final
Base: origin/misato-full-build

## Scope

Codex owns reliability, security verification, endpoint proof, and acceptance testing for the MISATO desktop/backend integration. This lane does not own UI redesign, Hermes orchestration policy, production deploys, DNS, live automations, or public NexCall marketing pages.

## Desktop Client Behavior

- API base URL: expects a full base ending in `/api/misato`.
- Endpoint shape: appends only `/status` or `/command`.
- Token handling: password fields; status text reports configured/not configured only; token values are not rendered.
- Vercel bypass token: optional advanced local-only field.
- Public website loading: Tauri loads `desktop-ui`, not the public NexCall website.
- Connection states verified in code: Not configured, Not tested, Testing, Connected, Unauthorized, Vercel Protected, 404 / Wrong URL, Failed.
- Local Solo Mode: not present in this integration point; local API tests require a desktop token env value.

## Endpoint Matrix

| Mode | Test | Expected | Result |
| --- | --- | --- | --- |
| Local | OPTIONS `/api/misato/status` | 204/200 with CORS and CORP | PASS: 204, `Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin` |
| Local | GET `/api/misato/status` without token | 401 JSON unless Local Solo Mode exists | PASS: 401 JSON |
| Local | GET `/api/misato/status` with token | 200 JSON, no secrets | PASS: 200 JSON, `ok: true`, `auth: valid` |
| Local | POST `/api/misato/command` daily | 200 JSON, `approvalRequired: false` | PASS: 200 JSON, Hermes plan present |
| Local | POST `/api/misato/command` risky | 200 JSON, `approvalRequired: true` | PASS: 200 JSON, approval required |
| Preview | OPTIONS `/api/misato/status` | CORS/CORP visible unless Vercel edge blocks | BLOCKED: 401 before app CORS headers |
| Preview | GET `/api/misato/status` without token | 401 JSON, not HTML/404 | BLOCKED: 401 `text/html`, Vercel edge protection |
| Preview | GET `/api/misato/status` with token | 200 JSON, no secrets | Needs owner token |
| Preview | POST `/api/misato/command` daily with token | 200 JSON contract | Needs owner token |
| Preview | POST `/api/misato/command` risky with token | 200 JSON, approval required | Needs owner token |

## Acceptance Summary

- Local Mode: PASS with desktop token auth; Local Solo Mode is not implemented in this integration point.
- Preview Mode: BLOCKED by Vercel edge protection until bypass token or protection setting is available.
- CORS/CORP: PASS locally and in source; preview edge blocks before app headers.
- Vercel edge protection diagnosis: PASS.
- Command daily: PASS locally.
- Risky approval gate: PASS locally.
- Lint: PASS.
- Build: PASS after Prisma generate; `postinstall` now runs `prisma generate`.
- Desktop build: PASS; produced `src-tauri/target/release/misato-desktop.exe` and `src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe`.
- Rust format: PASS after `cargo fmt`.
- Ready for Claude final UI merge: YES, with connection logic preserved.
- Ready for owner test: YES after preview edge bypass/token is available.

## Notes For Reviewers

- Vercel edge protection must be reported separately from MISATO app failures. HTML `Authentication Required` responses are an edge protection block, not a broken JSON route.
- The desktop command center intentionally disables commands until Test Connection is Connected.
- No live production, Discord, Obsidian, Vercel deploy, GitHub merge, or automation action should execute from these mock-safe commands.
