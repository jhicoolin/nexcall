# MISATO LIVE v2.0 Release Report

## Patch summary
- Expanded the MISATO test matrix with explicit automated-check coverage.
- Added a desktop acceptance JSON checker for packaging, tray, single-instance, and autostart proof.
- Documented updater wiring, desktop acceptance usage, and error recovery patterns.
- Added a GitHub review guide and CI workflow for MISATO release verification.
- Added placeholder updater commands so the repo advertises the missing surface explicitly instead of silently omitting it.

## File list changed
- `package.json`
- `scripts/misato-desktop-acceptance.mjs`
- `docs/skills/DESKTOP_ACCEPTANCE_SKILL.md`
- `docs/design/UPDATER_WIRING.md`
- `.github/AGENTS.md`
- `.github/workflows/misato-ci.yml`
- `docs/misato/ERROR_RECOVERY_PATTERNS.md`
- `docs/tests/MISATO_TEST_MATRIX.md`
- `docs/agent-handoffs/codex-to-hermes.md`
- `Final_commit_and_report.md`

## Test output summary
- `node --check scripts/misato-desktop-acceptance.mjs`: PASS
- `npm run misato:desktop-acceptance`: PASS, JSON `ok: true`, `verified: 7`, `loaded: 1`, `unverified: 4`, `failed: 0`
- `gitleaks version`: BLOCKED, tool not installed on this host

## Packaging notes
- The desktop shell keeps the canonical runtime origin separate from preview API handling.
- The release build artifacts were already verified in the previous packaging pass:
  - `src-tauri/target/release/misato-desktop.exe`
  - `src-tauri/target/release/bundle/nsis/MISATO_0.1.0_x64-setup.exe`
- Tray, single-instance, window-state, and autostart plugins are registered structurally.
- Updater wiring remains a documented TODO, not a live implementation.

## Parity report

| Capability | Old Path | New Path | What Got Worse | Fix | Test | Status |
|---|---|---|---|---|---|---|
| Desktop packaging acceptance | No dedicated checker | `misato:desktop-acceptance` | Tray/autostart remain environment-bound | Added explicit loaded / unverified split | JSON report | PASS |
| Release automation | No CI lane | `.github/workflows/misato-ci.yml` | None | Added Windows CI workflow | Workflow file | PASS |
| Security lane | Local-only scan scripts | Workflow + audit docs + fail-soft scripts | Live scan blocked by missing `gitleaks` | Documented install and blocked state | Audit file | BLOCKED |
| Updater story | Missing entirely | Documented MVP and production shape | No live updater yet | Added updater wiring doc + placeholder scripts | Doc + scripts | DOCUMENTED |

## Final pass/fail report
- Desktop acceptance script: PASS
- Secret Sentinel live scan: BLOCKED
- Tray / single-instance / autostart live behavior: UNVERIFIED
- Updater wiring: DOCUMENTED / NOT IMPLEMENTED
- Ready for owner test: YES, with the above gaps explicitly labeled

## Commit hash
- Pending at the time of writing

## Push result
- Pending at the time of writing
