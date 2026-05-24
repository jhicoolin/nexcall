# MISATO Desktop Wrapper Plan

## Recommendation
Use **Tauri** first for a lightweight Windows `.exe`, fallback to Electron only if compatibility blocks delivery.

## Current blocker (as of this branch)
`npm run desktop:dev` and `npm run desktop:build` fail when Cargo is unavailable:
- `failed to run command cargo metadata --no-deps --format-version 1: program not found`

## Required for MISATO.exe build on Windows

1. Rust/Cargo via rustup

Install:
```bash
winget install Rustlang.Rustup
```
Then close and reopen PowerShell.

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
npm run desktop:dev
npm run desktop:build
```

## Expected output folders after successful build
- `src-tauri/target/release/`
- `src-tauri/target/release/bundle/nsis/`

Explanation:
- `src-tauri/target/release/` may contain the built app binary.
- `src-tauri/target/release/bundle/nsis/` should contain the Windows installer bundle if NSIS packaging succeeds.
- Exact file names may vary by Tauri config/app name.

## Runtime model (fixed)
- Dev mode: run Next backend separately (`npm run dev`) and desktop app with `npm run desktop:dev`.
- Desktop window loads bundled desktop UI (`desktop-ui/`) in both dev and packaged modes.
- Desktop UI calls private backend via `MISATO_API_BASE_URL`.
- Includes an in-app **Test Connection** diagnostics panel for `/status` checks.
- If `MISATO_API_BASE_URL` is missing, app shows local "Connect MISATO backend" setup state.
- No public NexCall website pages are required to render MISATO desktop UI.

## Desktop rules
- Web app remains source of truth.
- Owner login still required.
- No raw secret storage in desktop local files.
- No auth bypass from desktop.
- Keep live automations disabled by default.
