# Codex to Claude

## Preserve these UI behaviors
- Keep local-first connection flow intact
- Keep token values masked
- Keep the Vercel path optional, not primary
- Keep the live feed rendering real runtime events, not dummy logs

## Error states to preserve
- Not configured
- Testing
- Connected
- Unauthorized
- Vercel Protected
- Wrong URL / 404
- Failed

## Do not overwrite
- `Accept: application/json` shell requests for `/agents`, `/approvals`, and `/logs`
- The adapter shape for `{ ok, items }`
- The approval gate behavior for risky commands
- The task/agent/approval mutation routes

## What is already fixed underneath
- `/api/misato/status` now returns the runtime fields the desktop shell expects
- `/api/misato/approvals/action` exists for compatibility
- `/misato-runtime/*` routes are now auth-guarded

## What to check in the UI
- The shell should show live data when present
- Mock fallbacks should stay clearly labeled
- The desktop shell should not render secrets or tokens
