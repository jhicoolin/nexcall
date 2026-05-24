# Tauri Desktop Roadmap (MISATO)

## Objective
Ship a Windows desktop wrapper (`MISATO.exe`) that opens private owner-only MISATO surfaces without bypassing auth.

## Non-negotiables
- No auth bypass from desktop.
- No secrets in desktop bundle.
- No live automation enablement by default.
- Web/backend remains source of truth.

## Windows prerequisites (required)
1. Rust/Cargo via rustup

Install:
```bash
winget install Rustlang.Rustup
```
Then close and reopen terminal.

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
Select workload: **Desktop development with C++**.

3. Microsoft Edge WebView2 Runtime

Install if missing:
```bash
winget install Microsoft.EdgeWebView2Runtime
```

4. Restart terminal after installs.

5. Retry build
```bash
cd C:\Users\pixel\nexcall
npm run desktop:dev
npm run desktop:build
```

## Expected outputs after successful build
- `src-tauri/target/release/` (binary output)
- `src-tauri/target/release/bundle/nsis/` (installer bundle if NSIS succeeds)

Exact filenames can vary by Tauri config/product name.
