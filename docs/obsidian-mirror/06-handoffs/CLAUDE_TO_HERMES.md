# CLAUDE → HERMES HANDOFF
**Date:** 2026-05-24  
**Lane:** Claude UI → Hermes Backend  
**Branch:** `misato-claude-ui` (from `misato-full-build`)

---

## Status

| Item | State |
|---|---|
| Tactical HUD v2 UI | ✅ Complete |
| Bypass token wired in sidebar | ✅ Done |
| 7 connection states | ✅ Done |
| Handoff doc written | ✅ This file |
| Files copied to `nexcall/desktop-ui/` | ⏳ Owner action required |
| `cargo tauri build` | ⏳ Owner action required |
| Vercel redeploy | ⏳ Hermes action required |

---

## What Claude Built

Three files in `desktop-ui/` fully rebuilt:

- `index.html` — shell with Inter + JetBrains Mono
- `styles.css` — tactical HUD design system (dark graphite, grid texture, scanlines, LED glows, corner accents, 8-tab nav)
- `app.js` — all 8 views, API + mock fallback, both auth tokens in every request

No backend changes. No auth changes. No middleware touched.

---

## What Hermes Must Do

1. Redeploy `misato-full-build` so `MISATO_DESKTOP_AUTH_TOKEN` takes effect
2. Confirm `GET /api/misato/status` → `200 application/json` post-redeploy
3. Confirm bypass token header passes Vercel edge → reaches Next.js routes
4. Verify env var scope is `Preview` (not Production only)
5. Do NOT merge `misato-claude-ui` → `main`

---

## API Shape Claude UI Expects

All endpoints: `GET /api/misato/{status|council|projects|tasks|approvals|logs}`  
Command: `POST /api/misato/{command|council}` → streaming text  
Auth headers sent on every request:
- `x-misato-desktop-token` (MISATO app auth)
- `x-vercel-protection-bypass` (Vercel SSO bypass)

Full shape specs → see `docs/agent-handoffs/claude-to-hermes.md`

---

## Security Notes

- Bypass token stored in `localStorage` only — never hardcoded
- Token inputs masked (`type="password"`) — value never rendered to screen
- No `console.log` of any token value anywhere in `app.js`
- No secrets in this file

---

## Cross-Reference

Full handoff doc: `docs/agent-handoffs/claude-to-hermes.md`  
UI source: `outputs/desktop-ui-v2/` (copy to `nexcall/desktop-ui/`)  
Commit msg: `style: sharpen MISATO desktop command center UI`
