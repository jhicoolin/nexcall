# MISATO Council Report — Local-First Runtime Alignment

Date: 2026-05-25
Branch: `misato-hermes-backend`

## Council outcome
- Local-first runtime is now the canonical daily path.
- Cloud integrations are formally optional and approval-gated.
- Stable schemas for command response + event stream are defined.
- Agent permission/approval model is normalized around L0-L4.

## Architecture decisions locked
1. Local discovery-first boot process with clear connected/not-running states.
2. SSE as v1 live event channel (`/events/stream`).
3. SQLite for durable state + JSONL append-only event history.
4. Approval queue as mandatory control plane for L3/L4 actions.

## Module summary contract
`moduleStatus` must keep current status for:
- Watchtower
- Secret Sentinel
- Design Library
- Obsidian Mirror
- GitHub/Vercel
- Lanes

## Current implementation note
Existing Next runtime already provides partial compatibility under `/api/misato/*`.
Canonical flat endpoints (`/health`, `/agents`, `/logs`, `/events/stream`) are defined and should be implemented/validated in local bridge runtime track.

## Validation targets
- MISATO.exe local connect without Vercel
- Command pipeline live
- Approval gate live
- Event stream live
- Persistence live
- Redaction guarantees maintained

## Blockers (if unresolved)
- Missing canonical flat endpoint shims
- Missing SSE route in local runtime
- Missing durable state wiring (SQLite/JSONL) if still mock-only
