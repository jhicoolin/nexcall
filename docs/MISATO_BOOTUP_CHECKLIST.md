# MISATO Boot-up Checklist (Simplified Auth Modes)

## Mode 1 — Local Solo (recommended daily)
1. Terminal 1:
   - `cd C:\Users\pixel\nexcall`
   - `npm run dev`
2. Launch MISATO desktop:
   - `C:\Users\pixel\nexcall\src-tauri\target\release\misato-desktop.exe`
3. In MISATO.exe:
   - Mode: **Local**
   - API Base URL: `http://localhost:3000/api/misato`
   - Click **Save**
   - Click **Test Connection**
4. Expected:
   - **Connected** / HTTP 200
5. Run command:
   - `What needs attention today?`

## Mode 2 — Preview Simple
1. Mode: **Preview**
2. API Base URL:
   - `https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato`
3. Desktop Token:
   - `MISATO_DESKTOP_AUTH_TOKEN` value from Vercel Preview
4. Click **Save** then **Test Connection**

If app shows **Vercel Protected**:
- "Vercel Preview Protection is blocking this. Disable it for this preview or use Advanced bypass token."
- Use bypass token only under **Advanced** when protection is enabled.

## Mode 3 — Production Locked (future)
- Keep owner-only protections on.
- Keep desktop token required.
- Keep Approval Gate required.
- Do not expose MISATO publicly.
