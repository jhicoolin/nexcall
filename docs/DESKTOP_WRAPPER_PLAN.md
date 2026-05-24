# MISATO Desktop Wrapper Plan (Future)

## Recommendation
Use **Tauri** first for a lightweight Windows `.exe`, fallback to Electron only if compatibility blocks delivery.

## Build order
1. Stabilize private web app on Vercel
2. Persist data in Supabase
3. Harden auth/approval/audit controls
4. Add real agent runtime safely
5. Build desktop wrapper last

## Desktop rules
- Web app remains source of truth
- Owner login still required
- No raw secret storage in desktop local files
- Use secure OS keychain only if local tokens are ever needed
- Optional native notifications after core stability

## Minimal desktop MVP
- Window shell pointing to private MISATO URL
- Deep-link support to `/daily`, `/approvals`, `/projects`
- Signed installer and update channel
