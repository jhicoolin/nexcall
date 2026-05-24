# MISATO Boot-up Checklist (after PC reboot)

1. Launch MISATO desktop app:
   - Portable EXE: `C:\Users\pixel\nexcall\src-tauri\target\release\misato-desktop.exe`
   - Or installed app: **MISATO Mission Control**

2. API Base URL (paste exactly):
   - `https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato`

3. Desktop Token:
   - Use the same secret value configured in Vercel as `MISATO_DESKTOP_AUTH_TOKEN`.
   - Do not paste/store this token in git files.

4. In app, click:
   - **Save Config**
   - **Test Connection**

5. Expected result:
   - **Connected**
   - **HTTP 200**

6. Then run command:
   - `What needs attention today?`

7. If result is **Unauthorized**:
   - Token mismatch between desktop input and Vercel `MISATO_DESKTOP_AUTH_TOKEN`, or owner auth/session missing.

8. If result is **Failed**:
   - Wrong URL, preview deployment not ready, or network issue.

9. If result is **404**:
   - Wrong deployment URL (likely not the `misato-full-build` preview backend).

10. Important:
   - Do **not** use `https://nexcall.one/api/misato` until production deployment includes MISATO routes.
