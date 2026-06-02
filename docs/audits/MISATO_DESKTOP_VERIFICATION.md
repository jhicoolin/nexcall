# MISATO Desktop App Verification
**Version:** 1.0  
**Date:** 2026-06-02  
**Auditor:** Claude UI Agent (Sonnet 4.6)  
**Artifact:** `src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe`

Status uses MISATO verification taxonomy: `verified` | `partially_verified` | `unverified` | `failed`

---

## Installer Artifact

| Property | Value | Status |
|----------|-------|--------|
| File | `MISATO_0.1.0_x64-setup.exe` | SOURCE_VERIFIED |
| Size | 1,852,844 bytes (~1.8MB) | SOURCE_VERIFIED |
| Format | PE32 executable, NSIS self-extracting archive, 5 sections | SOURCE_VERIFIED |
| Architecture | Intel i386 (32-bit NSIS wrapper, 64-bit app) | SOURCE_VERIFIED |
| Build date | 2026-06-02 03:10 UTC | SOURCE_VERIFIED |

**Check:** `ls -la src-tauri/target/release/bundle/nsis/`

---

## Source-Verified Behaviors (`src-tauri/src/main.rs`)

These behaviors are confirmed by reading the Rust source — not by running the installed app.

| Behavior | Source evidence | Status |
|----------|-----------------|--------|
| No terminal window in release | `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` line 1 | SOURCE_VERIFIED |
| Single instance enforcement | `tauri_plugin_single_instance::init(...)` — second launch calls `show_main_window(app)` | SOURCE_VERIFIED |
| System tray icon | `TrayIconBuilder::new().icon(...).menu(&menu)` — tray built on desktop | SOURCE_VERIFIED |
| Tray menu: Show / Quit | `MenuBuilder::new(app).text("show-window", "Show MISATO").text("quit", "Quit")` | SOURCE_VERIFIED |
| Left-click tray → show window | `TrayIconEvent::Click { button: MouseButton::Left } → show_main_window(app)` | SOURCE_VERIFIED |
| X button → hide to tray | `WindowEvent::CloseRequested` → `api.prevent_close()` + `tray_window.hide()` | SOURCE_VERIFIED |
| Quit from tray → exit cleanly | `"quit" => app.exit(0)` | SOURCE_VERIFIED |
| Window state persisted | `tauri_plugin_window_state::Builder::default().build()` | SOURCE_VERIFIED |
| runtime-origin injected | `window.__MISATO_RUNTIME_ORIGIN__ = "http://127.0.0.1:3010"` injected via `window.eval()` | SOURCE_VERIFIED |
| RUNTIME_ORIGIN ≠ API_BASE_URL | `MISATO_RUNTIME_ORIGIN` and `MISATO_API_BASE_URL` handled as separate env vars | SOURCE_VERIFIED |
| localStorage not overwritten | `if (!localStorage.getItem('misato_runtime_origin'))` guard before setting | SOURCE_VERIFIED |
| No PowerShell dependency | NSIS installer; Tauri runtime; no PowerShell scripts in main.rs or build chain | SOURCE_VERIFIED |

---

## Unverified Behaviors (Environment-Bound)

These require a running Windows machine with the installer — cannot be confirmed from source alone.

| Behavior | Why unverified | How to verify |
|----------|---------------|---------------|
| Installer runs without admin | Cannot confirm UAC behavior without running it | Run `MISATO_0.1.0_x64-setup.exe` on Windows, observe UAC prompt (or absence) |
| App connects to Hermes on launch | Requires MISATO.exe + Hermes running simultaneously | Launch MISATO.exe, start `npm run dev`, observe "Connected" badge |
| Single instance: second launch focuses window | Behavioral — requires running the app twice | Launch MISATO.exe twice; second launch should focus first window |
| Tray icon visible in system tray | Requires taskbar — cannot verify without screen | Look at Windows taskbar after launch |
| X button actually hides (not exits) | Behavioral — source is correct but needs observed confirmation | Click X on MISATO window; verify it stays in tray |
| Window position remembered across restarts | `tauri_plugin_window_state` handles this but needs verification | Move window, restart app, verify position restored |
| Autostart option (if implemented) | Not in current source — not implemented | N/A — not a current feature |

---

## `window.__MISATO_RUNTIME_ORIGIN__` Contract

The Tauri shell injects `window.__MISATO_RUNTIME_ORIGIN__` at startup from `main.rs`:

```rust
let runtime_origin = std::env::var("MISATO_RUNTIME_ORIGIN")
    .unwrap_or_else(|| "http://127.0.0.1:3010".to_string());
// injected via:
window.eval("window.__MISATO_RUNTIME_ORIGIN__ = \"http://127.0.0.1:3010\";")
```

This is the canonical runtime-origin contract. The browser-layer check (`npm run misato:browser-contract-check`) verifies this global is set correctly.

**Current status:** Injection is SOURCE_VERIFIED from main.rs. The value at runtime is UNVERIFIED (browser-required) — run `npm run misato:browser-contract-check` with MISATO.exe running to confirm.

---

## Runtime-Origin Separation Contract

Both `MISATO_RUNTIME_ORIGIN` and `MISATO_API_BASE_URL` are handled as distinct env vars in main.rs (lines 24–31). They are kept separate in:
- `src-tauri/src/main.rs` — two distinct env var reads
- `desktop-ui/app.js` — `hermesBase()` for runtime, `apiBase()` for preview API
- `scripts/misato-runtime-smoke.mjs` — uses only `MISATO_RUNTIME_ORIGIN`
- `scripts/misato-browser-contract-check.mjs` — verifies `window.__MISATO_RUNTIME_ORIGIN__`

Status: SOURCE_VERIFIED (the separation is in the code). Runtime behavior: UNVERIFIED (browser-required).

---

## Summary

| Check | Status |
|-------|--------|
| Installer artifact present and valid | SOURCE_VERIFIED |
| No terminal window in release | SOURCE_VERIFIED |
| Single instance enforcement | SOURCE_VERIFIED |
| System tray (icon, menu, left-click) | SOURCE_VERIFIED |
| X button → hide to tray | SOURCE_VERIFIED |
| Quit from tray → clean exit | SOURCE_VERIFIED |
| Window state persistence | SOURCE_VERIFIED |
| runtime-origin injection | SOURCE_VERIFIED |
| Runtime/API URL separation | SOURCE_VERIFIED |
| No PowerShell dependency | SOURCE_VERIFIED |
| Installer admin requirement | UNVERIFIED (run on Windows) |
| Live tray behavior | UNVERIFIED (run on Windows) |
| window.__MISATO_RUNTIME_ORIGIN__ at runtime | UNVERIFIED (browser-required) |
