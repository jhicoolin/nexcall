# MISATO Secret Sentinel / Gitleaks

## v1 scope
- Redacted local scan summary ingestion.
- No raw secret values rendered or committed.
- Manual mode default.

## Scripts
- `npm run secrets:scan`
- `npm run secrets:scan:staged`

## Install options
- Windows: `winget install gitleaks.gitleaks` or `choco install gitleaks` or `scoop install gitleaks`
- Docker: `docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source /repo --redact`
