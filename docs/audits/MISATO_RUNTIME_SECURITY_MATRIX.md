# MISATO Runtime Security Matrix

## Branch
- `misato-claude-ui`

## Security Posture

| Surface | Status | Notes |
|---|---:|---|
| `/api/misato/status` | PASS | Auth-guarded, CORS-wrapped, returns runtime fields |
| `/api/misato/command` | PASS | Auth-guarded, approval-gated for risky commands |
| `/api/misato/agents` | PASS | Auth-guarded |
| `/api/misato/agents/assign` | PASS | Auth-guarded mutation route |
| `/api/misato/approvals` | PASS | Auth-guarded |
| `/api/misato/approvals/action` | PASS | Compatibility route added for shell actions |
| `/api/misato/tasks` | PASS | Auth-guarded |
| `/api/misato/tasks/create` | PASS | Mutation route works |
| `/api/misato/tasks/update` | PASS | Mutation route works |
| `/api/misato/tasks/delete` | PASS | Mutation route works |
| `/api/misato/logs` | PASS | Auth-guarded |
| `/api/misato/projects` | PASS | Auth-guarded |
| `/api/misato/discord` | PASS | Mock-safe only, auth-guarded |
| `/api/misato/obsidian` | PASS | Mock-safe only, auth-guarded |
| `/api/misato/lanes` | PASS | Auth-guarded |
| `/api/misato/watchtower/status` | PASS | Auth-guarded |
| `/api/misato/secrets/status` | PASS | Auth-guarded, redacted only |
| `/events/stream` | PASS | Auth-guarded, SSE remains local-first compatible |

## Auth Centralization
- Shared request-local helpers are now in `lib/misato/request-context.ts`
- `lib/misato/owner-guard.ts` and `middleware.ts` consume the same local-host and desktop-token helpers
- Owner-session checks remain in `lib/misato/auth.ts`

## CORS / CORP
- `Access-Control-Allow-Origin` is returned on MISATO API responses
- `Access-Control-Allow-Methods: GET,POST,OPTIONS`
- `Access-Control-Allow-Headers` includes `content-type,authorization,x-misato-desktop-token,x-vercel-protection-bypass`
- `Cross-Origin-Resource-Policy: cross-origin` is used for MISATO API responses

## Local vs Cloud
- Local-first behavior remains enabled on localhost
- Production-simulated requests require owner auth
- Daily use does not require Vercel

## Secret Handling
- No raw secrets are returned
- Sentinel outputs are redacted only
- Token values are not rendered in the desktop shell or API responses

## Verification
- `npm run lint` pass
- `npm run build` pass
- `npm run desktop:build` pass
- Local host simulation returned `401` JSON for protected routes
