# DESKTOP_ACCEPTANCE_SKILL

## What this does
`npm run misato:desktop-acceptance` emits structured JSON for the MISATO desktop packaging lane.

It checks:
- release executable exists
- NSIS installer exists
- Tauri config still points to the bundled desktop UI
- single-instance plugin is wired in
- tray handlers are wired in
- window-state plugin is wired in
- autostart plugin is wired in
- running MISATO.exe can be detected on Windows
- optional second-instance verification can be enabled with `MISATO_DESKTOP_ACCEPTANCE_INTERACTIVE=1`

## When to use it
Use it after packaging changes, desktop shell changes, or tray / autostart / single-instance work.

Trigger phrases:
- "run desktop acceptance"
- "test packaging"
- "verify installer"
- "check tray behavior"

## Inputs
- None by default
- Optional environment variable:
  - `MISATO_DESKTOP_ACCEPTANCE_INTERACTIVE=1` to attempt a second-instance launch check on Windows

## Outputs
- Structured JSON with:
  - `schemaVersion`
  - `checks[]`
  - `summary`
  - `ok`
  - `humanReadable`

## Honest limits
- Tray click / restore behavior is not fully proven by the structural checker alone.
- Autostart enablement is still environment-bound.
- Second-instance focus behavior needs a live Windows session to prove end-to-end.

## Safety note
- The script does not touch secrets.
- The script does not change runtime state unless the interactive second-instance mode is explicitly enabled on Windows.
