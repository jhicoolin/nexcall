# MISATO Desktop Build Instructions (Windows)

## Auth mode model
- **Local Solo Mode** (dev/local PC): easiest, no desktop token required.
- **Preview Simple Mode** (cloud preview): one token (`MISATO_DESKTOP_AUTH_TOKEN`).
- **Production Locked Mode**: owner-only + desktop token + approval gate.

## Easiest local use
Terminal 1:
```bash
cd C:\Users\pixel\nexcall
npm run dev
```
Then launch:
```text
C:\Users\pixel\nexcall\src-tauri\target\release\misato-desktop.exe
```
In MISATO.exe:
- Mode: **Local**
- API Base URL: `http://localhost:3000/api/misato`
- Click **Test Connection**
- Run: `What needs attention today?`

## Preview use
In MISATO.exe:
- Mode: **Preview**
- API Base URL: `https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app/api/misato`
- Desktop Token: `MISATO_DESKTOP_AUTH_TOKEN`
- Click **Test Connection**

Use Vercel bypass token only in **Advanced** when Preview Protection is enabled.

## Build commands
```bash
cd C:\Users\pixel\nexcall
npm run lint
npm run build
npm run desktop:build
```
