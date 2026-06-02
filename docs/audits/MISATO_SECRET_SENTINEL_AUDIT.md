# MISATO Secret Sentinel Audit

## Branch
- `misato-hermes-live-brain`

## Status
- `gitleaks` installed locally: no
- repo-only scan executed: no
- workflow file present: yes
- local fail-soft scripts present: yes
- secret-report ignore rules present: yes

## Verified repository protections
- `.gitignore` excludes:
  - `.security/`
  - `gitleaks-report*.json`
  - `*.sarif`
- Repo-local scripts fail soft when `gitleaks` is missing:
  - `scripts/security/run-gitleaks.ps1`
  - `scripts/security/run-gitleaks.sh`
- GitHub workflow exists at `.github/workflows/gitleaks.yml`.
- Workflow upload artifact behavior is disabled.
- Workflow push coverage now includes `misato-hermes-live-brain`.

## What blocked the live scan
- `gitleaks` is not installed on this machine, so a real redacted repo scan could not be executed.

## Next best action
- Install `gitleaks` on the host, then run:
  - `gitleaks detect --source . --redact --report-format json --report-path .security/gitleaks-report.redacted.json`
- Keep the scan repo-scoped and redacted only.

## Safety note
- No raw secret values were printed during this audit.
