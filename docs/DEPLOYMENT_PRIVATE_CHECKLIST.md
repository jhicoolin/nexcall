# Vercel Private Deployment Checklist (MISATO)

## Required env vars
- `OWNER_EMAIL`
- `ADMIN_DASHBOARD_TOKEN`
- `OWNER_SESSION_SECRET`
- existing NexCall env vars as needed for public site

## Preview-first flow
1. Open PR from `misato-full-build`.
2. Verify preview deployment.
3. Validate `/misato` requires owner login.
4. Validate `/api/misato/command` returns 401 without session.
5. Validate public homepage unchanged.

## Verify MISATO is private
- Unauthenticated visit to `/misato` -> `/login`.
- Non-owner credentials -> `/unauthorized`.
- No links to `/misato` on public nav.

## Rollback
- Revert PR merge or redeploy previous successful commit in Vercel.
- Confirm `/misato` routes no longer accessible if rollback removes feature.

## Do NOT
- push production deploy directly from agent
- expose secrets in logs/frontend
- enable live automations without explicit owner approval
