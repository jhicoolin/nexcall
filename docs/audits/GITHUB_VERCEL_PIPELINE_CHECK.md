# GitHub / Vercel Pipeline Check

## Branch Flow

MISATO command -> Hermes plan -> Codex QA if code is involved -> GitHub branch -> Vercel preview -> MISATO status update -> owner approval -> production only later.

## Active Branches Observed

- `misato-full-build`: safe base branch
- `misato-hermes-backend`: active Hermes/backend lane
- `misato-codex-client-qa`: local client QA lane
- `misato-codex-runtime-audit`: this lane

`misato-coordination` and `misato-claude-ui` were not present during local branch inspection.

## Preview / Production

- Safe preview API base: `https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato`
- Production domain: `nexcall.one`
- Production MISATO status: blocked until owner intentionally deploys MISATO routes

## Required Env Vars

- `OWNER_EMAIL`
- `OWNER_SESSION_SECRET`
- `ADMIN_DASHBOARD_TOKEN`
- `MISATO_DESKTOP_AUTH_TOKEN`
- Optional preview protection bypass token

## Approval Rules

Safe to push: docs, mock-safe runtime contract, bug fixes, redacted audit scaffolding.

Requires owner approval: production deploy, DNS changes, env changes, live automations, GitHub merge to main, Discord/Obsidian live writes, billing/email/social/contact exports.

Rollback: keep changes branch-scoped; revert or close PR before production if validation fails.

## Validation

Runtime audit branch builds locally and desktop package generation passed. Push creates a reviewable branch only; it does not merge or deploy production.
