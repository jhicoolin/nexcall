param(
  [switch]$Staged
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$ReportDir = Join-Path $RepoRoot ".security"
$ReportPath = Join-Path $ReportDir "gitleaks-report.redacted.json"

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) {
  Write-Host "gitleaks is not installed. Install it to enable local Secret Sentinel scans:"
  Write-Host "  winget install Gitleaks.Gitleaks"
  Write-Host "  or see https://github.com/gitleaks/gitleaks"
  exit 0
}

Push-Location $RepoRoot
try {
  if ($Staged) {
    & gitleaks protect --staged --redact --verbose=false
    exit $LASTEXITCODE
  }

  & gitleaks detect --source "." --redact --report-format json --report-path $ReportPath
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
