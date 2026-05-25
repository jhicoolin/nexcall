# Codex -> Claude Handoff

## UI Constraints To Preserve

- Do not expose token or Vercel bypass values in visible text, logs, command history, screenshots, or error strings.
- Preserve these connection states: Not configured, Not tested, Connected, Unauthorized, Vercel Protected, 404 / Wrong URL, Failed.
- Commands must stay disabled until API base URL is valid and Test Connection is Connected.
- Desktop UI must call `GET /status` and `POST /command` against the configured `/api/misato` base.
- Preserve `x-misato-desktop-token` and `x-vercel-protection-bypass` headers.

## What Claude Can Polish Later

- Layout density, visual hierarchy, status chips, command result readability, and responsive desktop polish.

## What Claude Should Avoid

- Auth/middleware changes.
- Backend route contract changes.
- Removing non-JSON/Vercel protection handling.
- Rendering raw API errors without escaping.
- Touching public NexCall marketing pages as part of MISATO polish.
