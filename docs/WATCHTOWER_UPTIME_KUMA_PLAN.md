# MISATO Watchtower / Uptime Kuma Plan

## v1 scope
- Mock-safe health grid and API shape.
- Modes: `mock`, `planned`, `connected`.
- No direct frontend calls to Uptime Kuma.
- No credentials committed.

## Environment placeholders
- `UPTIME_KUMA_BASE_URL=`
- `UPTIME_KUMA_API_KEY=`
- `MISATO_WATCHTOWER_MODE=mock`

## Future integration
1. Backend-only client queries Uptime Kuma API.
2. Redact auth headers and token logs.
3. Return safe monitor summaries only.
4. Approval Gate required before any public status publication changes.
