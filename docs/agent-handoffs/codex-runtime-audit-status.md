# Codex Runtime Audit Status

## Branch

`misato-codex-runtime-audit`

## What MISATO Is

MISATO is the private owner-only AI command center. The desktop app receives owner commands, connects to the private MISATO backend, displays council feedback, shows module status, and routes execution planning through a mock-safe Hermes pipeline.

## What Hermes Is

Hermes is the orchestration and backend architecture lane. It decomposes owner commands, selects agents, identifies risky actions, prepares plans, and hands work to specialist agents without bypassing Approval Gate.

## MISATO / Hermes Connection

`POST /api/misato/command` now routes commands through `lib/misato/hermes/*`, returns a stable mock-safe command contract, and preserves the legacy `result` wrapper for desktop compatibility.

## What Codex Verified / Patched

- Desktop token middleware path audited and patched so valid `x-misato-desktop-token` can reach MISATO APIs.
- Owner session auth remains supported.
- Auth login/logout are no longer blocked before login.
- Command endpoint contract upgraded.
- Hermes mock-safe shim added.
- Watchtower, Design Library, Secret Sentinel, Obsidian, GitHub handoff modules documented/ported as safe v1 scaffolding.
- Gitleaks scripts and workflow configured for redacted repo-only scanning.
- Desktop client connection parsing hardened.
- Tauri empty env injection bug patched.

## Bugs / Security Risks Found

- Middleware blocked desktop-token API access before route handlers.
- Middleware protected login endpoint too early.
- Command endpoint returned old narrow contract.
- Tauri could overwrite saved desktop API URL with an empty env value.
- Desktop client had weak URL validation and non-JSON error handling.
- Fresh install/build could fail if Prisma client was not generated.
- Gitleaks was not installed locally; scripts must fail-soft and docs must show installation.

## Patches Planned / Applied

Patches are limited to private MISATO runtime, desktop reliability, docs, and security scaffolding. Public NexCall marketing pages are not part of this lane.

## Validation Run

- `node --check desktop-ui/app.js`: pass
- `npm install`: pass, Prisma client generated
- `npm run lint`: pass
- `npm run build`: pass
- `cargo fmt --check --manifest-path src-tauri/Cargo.toml`: pass after formatting
- `npm run desktop:build`: pass
- `npm run secrets:scan`: gitleaks not installed; script exited safely with install guidance
- Local mock-token API smoke: no-token `/status` returned 401 JSON; fake local token `/status` returned 200; daily `/command` returned mock-safe approval false; risky deploy/merge command returned approval true

## Remaining Risks

- Preview token-present smoke still requires real Vercel preview env access without printing secrets.
- Production `nexcall.one` must remain blocked for MISATO until owner approves production route deployment.
- `gitleaks` must be installed locally or run in GitHub Actions for real scan results.
