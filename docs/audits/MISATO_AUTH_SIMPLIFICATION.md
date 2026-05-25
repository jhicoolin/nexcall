# MISATO Auth Simplification Audit

Date: 2026-05-25
Branch: `misato-hermes-backend`

## Goal
Reduce dev friction for single-owner MISATO testing while preserving cloud/production safety.

## Implemented
- Added `MISATO_LOCAL_SOLO_MODE` and `MISATO_REQUIRE_DESKTOP_TOKEN` env controls.
- Local solo allowed only for non-production + non-Vercel runtime.
- Local solo supports no-token access for `/api/misato/status` and `/api/misato/command`.
- Preview mode keeps one-token flow (`MISATO_DESKTOP_AUTH_TOKEN`) as default.
- Vercel bypass token moved to desktop **Advanced** flow only.
- Production keeps token-required behavior.
- Approval gate and mock-safe automation behavior unchanged.

## Safety
- No production deploy.
- No main merge.
- No secret/token values logged.
- No live automations enabled.
