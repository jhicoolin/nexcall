# MISATO Secret Sentinel Audit

## Status

- Gitleaks config exists: yes
- GitHub workflow exists: yes
- Local scan scripts exist: yes
- Report redaction configured: yes
- Raw secrets avoided: yes
- Repo-only scan scope: yes

## Local Tooling

`gitleaks` was not installed during local validation. `npm run secrets:scan` exited safely with install guidance and did not scan outside the repository by default.

Install options:

```powershell
winget install gitleaks.gitleaks
```

```bash
brew install gitleaks
```

## Scan Commands

```bash
npm run secrets:scan
npm run secrets:scan:staged
```

Reports write to `.security/gitleaks-report.redacted.json`, which is gitignored.

## Risks / Notes

- Do not commit `.security/` or raw scan exports.
- Secret Sentinel may summarize redacted findings only.
- Destructive remediation, file deletion, and secret rotation require owner approval.
- Real findings are pending until gitleaks is installed locally or the GitHub workflow runs.
