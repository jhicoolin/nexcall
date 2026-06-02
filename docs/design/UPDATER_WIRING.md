# MISATO Updater Wiring

## Status
The updater is not implemented in the current branch.

This document defines the shape of the future wiring so we can add it without guessing.

## Architecture

### Check for updates
- The desktop app should ask a version endpoint for the latest signed release metadata.
- The endpoint should return:
  - latest version
  - download URL
  - SHA-256 or signature metadata
  - release notes
  - minimum supported version if applicable

### Download
- The desktop app downloads the installer or bundle to a temporary path.
- The download should be resumable if possible.
- The UI should show a clear progress state and never claim success before verification.

### Verify
- The downloaded artifact should be signature-checked before install.
- If signature verification fails, the update must be blocked and logged.

### Install / restart
- The desktop app should hand off to the platform installer or update agent.
- After install, the app should restart cleanly and preserve the user’s state where feasible.

### Rollback
- If install fails, the app should preserve the previous working version.
- Any failed update must surface an explicit recovery path and ledger entry.

## MVP versus production

### MVP
- Stubbed version check
- No auto-download
- No silent install
- Clear "Updater not enabled yet" state

### Production
- Signed release metadata
- Verified download
- Installer handoff
- Restart with version confirmation
- Rollback on failure

## Package.json TODO scripts
- `misato:updater-check`
- `misato:updater-download`
- `misato:updater-install`

These are placeholders in the current branch and intentionally do not perform a real update flow yet.

## Notes for Hermes
- Keep updater behavior separated from runtime origin and API base selection.
- Do not let a failed update mutate runtime state or hide the current version.
