#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="$REPO_ROOT/.security"
REPORT_PATH="$REPORT_DIR/gitleaks-report.redacted.json"
STAGED="${1:-}"

mkdir -p "$REPORT_DIR"

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks is not installed. Install it to enable local Secret Sentinel scans:"
  echo "  https://github.com/gitleaks/gitleaks"
  exit 0
fi

cd "$REPO_ROOT"
if [ "$STAGED" = "--staged" ] || [ "$STAGED" = "staged" ]; then
  gitleaks protect --staged --redact --verbose=false
else
  gitleaks detect --source "." --redact --report-format json --report-path "$REPORT_PATH"
fi
