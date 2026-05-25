# MISATO ↔ Hermes Command Pipeline

## Intent routing
- Input accepted from MISATO.exe command center.
- Hermes parses command intent and classifies risk level (L0-L4).
- Specialist council assigned by project and risk profile.
- Structured contract returned for UI rendering.

## Daily attention command behavior
For `What needs attention today?`, response includes:
- NexCall status
- MISATO connection status
- Watchtower status
- Secret Sentinel status
- Design Library status
- Claude/Hermes/Codex lane status
- Pending approvals state
- Next recommended actions

## Risky command behavior
For risky commands (example: `deploy to production now`):
- `approvalRequired: true`
- execution blocked
- no merge/deploy/DNS/env mutation

## Module status requirements
`moduleStatus` includes:
- Watchtower (health/check/mode)
- Design Library (DESIGN.md + guide + checklist)
- Secret Sentinel (gitleaks + redacted + repo-only)
- Obsidian mirror (status, writes approval requirement)
- GitHub/Vercel (branch/preview, production locked)
- Lanes (Hermes/Codex/Claude/coordinator/owner approval)
