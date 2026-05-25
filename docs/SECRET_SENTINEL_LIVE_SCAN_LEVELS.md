# Secret Sentinel Live Scan Levels

## Level 1 (default) Manual local scan
- Run in repo scope only.
- Redacted output only.

## Level 2 Optional staged/pre-commit
- `gitleaks protect --staged --redact`
- Documented only; do not auto-install hooks.

## Level 3 GitHub Actions scan
- Run on push/PR.
- Fail CI if leaks detected.
- Do not upload raw secret artifacts.

## Level 4 Future local watcher
- Owner-approved only.
- Scope-limited.
- Redacted logs.
- No destructive actions.
