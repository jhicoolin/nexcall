param([switch]$Staged)

$ErrorActionPreference = "Stop"
if (!(Test-Path ".security")) { New-Item -ItemType Directory -Path ".security" | Out-Null }
if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) {
  Write-Host "gitleaks not installed. Install via winget/choco/scoop or GitHub releases."
  exit 0
}
if ($Staged) {
  gitleaks protect --staged --redact
} else {
  gitleaks detect --source . --redact --report-format json --report-path .security/gitleaks-report.redacted.json
}
