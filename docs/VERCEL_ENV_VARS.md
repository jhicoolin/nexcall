# Vercel Env Vars for MISATO

## Security-critical
- `OWNER_EMAIL` (owner login email)
- `ADMIN_DASHBOARD_TOKEN` (owner login token)
- `OWNER_SESSION_SECRET` (HMAC signing)

## Optional
- Model provider vars (only when explicitly approved)
- Upstash vars for production-grade rate limiting

## Rules
- Never commit real values.
- Set in Vercel project env UI.
- Rotate secrets on leakage suspicion.
