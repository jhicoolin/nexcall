#!/usr/bin/env bash
set -euo pipefail
mkdir -p .security
if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not installed. Install via winget/choco/scoop or GitHub releases."
  exit 0
fi
gitleaks detect --source . --redact --report-format json --report-path .security/gitleaks-report.redacted.json
