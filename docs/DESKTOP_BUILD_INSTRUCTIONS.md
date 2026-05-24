# MISATO Desktop Build Instructions (Windows)

## Desktop architecture
- MISATO.exe bundles its own desktop UI (`desktop-ui/`).
- It does **not** render public NexCall website pages.
- It connects to private backend APIs via `MISATO_API_BASE_URL` (example: `https://nexcall.one/api/misato`).
- Owner auth is still enforced by backend (`/api/misato/*`).

## Dev mode
Run backend and desktop UI separately:
```bash
cd C:\Users\pixel\nexcall
npm run dev
```
In a second terminal:
```bash
cd C:\Users\pixel\nexcall
npm run desktop:dev
```
Desktop UI is served locally and calls `http://localhost:3000/api/misato` when configured.

## Required for MISATO.exe build on Windows

1. Rust/Cargo via rustup

Install:
```bash
winget install Rustlang.Rustup
```
Then close and reopen PowerShell/terminal.

Verify:
```bash
rustc --version
cargo --version
```

2. Microsoft Visual Studio 2022 Build Tools

Install:
```bash
winget install Microsoft.VisualStudio.2022.BuildTools
```
When installer opens, select:
- **Desktop development with C++**

3. Microsoft Edge WebView2 Runtime

Install if needed:
```bash
winget install Microsoft.EdgeWebView2Runtime
```

4. Restart terminal after installs.

5. Retry
```bash
cd C:\Users\pixel\nexcall
npm run dev
npm run desktop:dev
npm run desktop:build
```

## Runtime behavior
- Dev mode (`npm run desktop:dev`) loads bundled desktop UI from local dev server (`desktop-ui/`), not NexCall website routes.
- Packaged `.exe` mode loads bundled desktop UI from `frontendDist`.
- Desktop client calls `MISATO_API_BASE_URL` (for example `https://nexcall.one/api/misato`).
- If `MISATO_API_BASE_URL` is missing, UI shows "Connect MISATO backend" setup state.
- Desktop includes a **Test Connection** panel that calls `GET /status` on your configured API base.
- The diagnostics panel reports: connection state, HTTP status, last-checked timestamp, error text, and suggested next fix.
- Optional local desktop token: `MISATO_DESKTOP_AUTH_TOKEN` (never commit real value).
- Owner login and `/api/misato/*` server protections remain enforced.

## Expected output folders after successful build
- `src-tauri/target/release/`
- `src-tauri/target/release/bundle/nsis/`

Notes:
- `src-tauri/target/release/` may contain the built app binary.
- `src-tauri/target/release/bundle/nsis/` should contain the Windows installer bundle if NSIS packaging succeeds.
- Exact file names may vary by Tauri config/app name.
