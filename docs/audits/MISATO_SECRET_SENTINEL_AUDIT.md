# MISATO Secret Sentinel Audit

Date: 2026-05-25
Branch: misato-codex-qa-final

## Scope

Secret Sentinel is limited to repo-local, redacted scanning. It must not scan the full PC, print raw secrets, commit raw finding artifacts, or perform destructive remediation.

## Configuration

- `.gitleaks.toml`: present
- GitHub workflow: present at `.github/workflows/gitleaks.yml`
- Local PowerShell script: present at `scripts/security/run-gitleaks.ps1`
- Local shell script: present at `scripts/security/run-gitleaks.sh`
- Package scripts: `secrets:scan`, `secrets:scan:staged`
- Ignored reports: `.security/`, `gitleaks-report*.json`, `*.sarif`
- Redacted reports: yes, local detect writes `.security/gitleaks-report.redacted.json`
- Missing-tool behavior: fail-soft with install guidance and exit 0

## Validation

- `gitleaks version`: BLOCKED locally; command is not installed.
- `npm run secrets:scan`: PASS fail-soft; exits 0 with install guidance when gitleaks is missing.
- Raw secrets printed: YES avoided.
- Redacted findings only: PLANNED until gitleaks is installed; scripts use `--redact`.

## Risks

- Local scan coverage depends on installing `gitleaks` with `winget install Gitleaks.Gitleaks` or the upstream installer.
- Staged scan uses gitleaks' staged protection mode and must remain redacted.
- Destructive secret remediation remains owner-approved only.
