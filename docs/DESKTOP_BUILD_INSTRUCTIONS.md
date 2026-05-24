# MISATO Desktop Build Instructions (Windows)

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
- Dev mode (`npm run desktop:dev`) opens `http://localhost:3000/login` from the local Next.js server.
- Packaged `.exe` mode does **not** bundle the Next.js server. It loads a safe local shell page, then redirects only when `MISATO_DESKTOP_URL` is set.
- Use `.env`/system env (not committed) for private hosted URL.
- NexCall production target:
  - `MISATO_DESKTOP_URL=https://nexcall.one/misato`
  - If `/misato` is not deployed yet: `MISATO_DESKTOP_URL=https://nexcall.one/login`
- Build-time embed (Windows PowerShell):
  - `$env:MISATO_DESKTOP_URL="https://nexcall.one/misato"`
  - `npm run desktop:build`
- Build-time embed (bash/git-bash):
  - `export MISATO_DESKTOP_URL="https://nexcall.one/misato" && npm run desktop:build`
- If `MISATO_DESKTOP_URL` is missing, the shell shows setup instructions instead of failing.
- Owner login and `/misato/*` + `/api/misato/*` protection remain enforced by the web app.

## Expected output folders after successful build
- `src-tauri/target/release/`
- `src-tauri/target/release/bundle/nsis/`

Notes:
- `src-tauri/target/release/` may contain the built app binary.
- `src-tauri/target/release/bundle/nsis/` should contain the Windows installer bundle if NSIS packaging succeeds.
- Exact file names may vary by Tauri config/app name.
