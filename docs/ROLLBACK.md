# NexCall Rollback

## Purpose

This document defines the rollback path for the request-demo launch state.

## Rollback Target

- Use the latest verified annotated tag matching:
  - `nexcall-request-demo-go-<shortsha>`
- The tag should point to the verified request-demo release commit for the current cycle.

## Rollback Procedure

1. Identify the rollback tag to restore.
2. Redeploy that tagged commit in Vercel.
3. Confirm the production alias `nexcall.one` points to the rollback deployment.
4. Rerun:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-production-parity.ps1`
5. Confirm the public route contract:
   - `/` -> `200`
   - `/health` -> `200` safe JSON
   - `/command` -> `200`
   - `/checkout` -> `404`
   - `POST /api/checkout` -> `503`
   - `/admin` -> `404`
   - `/admin/login` -> `404`

## Rollback Verification

- Confirm the homepage still presents the request-demo posture.
- Confirm the health route returns only:
  - `{"ok":true,"service":"nexcall","status":"healthy"}`
- Confirm admin remains fail-closed.
- Confirm checkout remains disabled.
- Confirm exposure paths remain blocked.

## Notes

- Do not roll back by force-pushing `main`.
- Do not weaken security controls to recover from a deploy regression.
- If a rollback is required because of deployment drift rather than code breakage, fix the Vercel alias/deployment issue first where possible.
