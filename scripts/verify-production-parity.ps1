[CmdletBinding()]
param(
  [string]$BaseUrl = "https://nexcall.one"
)

$ErrorActionPreference = "Stop"

function New-CheckResult {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Detail
  )

  [pscustomobject]@{
    Name   = $Name
    Passed = $Passed
    Detail = $Detail
  }
}

function Get-CacheBustedUrl {
  param(
    [string]$Root,
    [string]$Path
  )

  $nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $separator = "?"
  if ($Path.Contains("?")) {
    $separator = "&"
  }

  return ("{0}{1}{2}codex_verify={3}" -f $Root.TrimEnd("/"), $Path, $separator, $nonce)
}

function Invoke-CheckedRequest {
  param(
    [string]$Method,
    [string]$Path,
    [int[]]$ExpectedStatus,
    [hashtable]$Headers = @{},
    [string]$Body = "",
    [string]$ContentType = "application/json"
  )

  $url = Get-CacheBustedUrl -Root $BaseUrl -Path $Path
  $requestHeaders = @{
    "Cache-Control" = "no-cache"
    "Pragma"        = "no-cache"
  }

  foreach ($key in $Headers.Keys) {
    $requestHeaders[$key] = $Headers[$key]
  }

  try {
    $params = @{
      Uri                = $url
      Method             = $Method
      Headers            = $requestHeaders
      MaximumRedirection = 0
      ErrorAction        = "Stop"
    }

    if ($Method -ne "GET" -and $Method -ne "HEAD" -and $Body) {
      $params["Body"] = $Body
      $params["ContentType"] = $ContentType
    }

    $response = Invoke-WebRequest @params
    $statusCode = [int]$response.StatusCode
  }
  catch {
    if (-not $_.Exception.Response) {
      throw
    }

    $response = $_.Exception.Response
    $statusCode = [int]$response.StatusCode.value__
  }

  return [pscustomobject]@{
    Url        = $url
    StatusCode = $statusCode
    Response   = $response
  }
}

function Get-ResponseBodyText {
  param(
    [object]$Response
  )

  if ($null -eq $Response) {
    return ""
  }

  if ($Response.PSObject.Properties.Name -contains "Content") {
    return [string]$Response.Content
  }

  try {
    $stream = $Response.GetResponseStream()
    if ($null -eq $stream) {
      return ""
    }

    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $reader.Dispose()
    $stream.Dispose()
    return $text
  }
  catch {
    return ""
  }
}

$results = New-Object System.Collections.Generic.List[object]
$routeMatrix = New-Object System.Collections.Generic.List[object]

$routeExpectations = @(
  @{ Path = "/"; Method = "HEAD"; Expected = @(200) },
  @{ Path = "/health"; Method = "HEAD"; Expected = @(200) },
  @{ Path = "/command"; Method = "HEAD"; Expected = @(200) },
  @{ Path = "/checkout"; Method = "HEAD"; Expected = @(404) },
  @{ Path = "/admin"; Method = "HEAD"; Expected = @(404) },
  @{ Path = "/admin/login"; Method = "HEAD"; Expected = @(404) },
  @{ Path = "/.env"; Method = "HEAD"; Expected = @(401, 403, 404) },
  @{ Path = "/.git/config"; Method = "HEAD"; Expected = @(401, 403, 404) },
  @{ Path = "/api/debug"; Method = "HEAD"; Expected = @(401, 403, 404) },
  @{ Path = "/server-status"; Method = "HEAD"; Expected = @(401, 403, 404) }
)

foreach ($route in $routeExpectations) {
  $check = Invoke-CheckedRequest -Method $route.Method -Path $route.Path -ExpectedStatus $route.Expected
  $passed = $route.Expected -contains $check.StatusCode
  $routeMatrix.Add([pscustomobject]@{
      Route    = $route.Path
      Expected = ($route.Expected -join "/")
      Actual   = $check.StatusCode
      Passed   = $passed
    }) | Out-Null

  $results.Add((New-CheckResult -Name ("route {0}" -f $route.Path) -Passed $passed -Detail ("expected {0}, got {1}" -f ($route.Expected -join "/"), $check.StatusCode))) | Out-Null
}

$checkoutPayload = @{
  planId        = "starter"
  billingPeriod = "monthly"
  email         = "audit@example.com"
  businessName  = "Audit Co"
  name          = "Audit User"
  phone         = "2025550199"
  message       = "Non-destructive parity verification"
} | ConvertTo-Json -Compress

$checkoutCheck = Invoke-CheckedRequest -Method "POST" -Path "/api/checkout" -ExpectedStatus @(503) -Body $checkoutPayload
$routeMatrix.Add([pscustomobject]@{
    Route    = "POST /api/checkout"
    Expected = "503"
    Actual   = $checkoutCheck.StatusCode
    Passed   = ($checkoutCheck.StatusCode -eq 503)
  }) | Out-Null
$results.Add((New-CheckResult -Name "route POST /api/checkout" -Passed ($checkoutCheck.StatusCode -eq 503) -Detail ("expected 503, got {0}" -f $checkoutCheck.StatusCode))) | Out-Null

$homeGet = Invoke-CheckedRequest -Method "GET" -Path "/" -ExpectedStatus @(200)
$homeBody = Get-ResponseBodyText -Response $homeGet.Response
$homeHeaders = $homeGet.Response.Headers
$homeBodyNormalized = [regex]::Replace($homeBody, "\s+", " ")

$requiredMarkers = @(
  @{ Name = "hero headline"; Pattern = "Turn missed calls into.*next steps\." },
  @{ Name = "request setup CTA"; Pattern = "Request Setup" }
)

foreach ($marker in $requiredMarkers) {
  $results.Add((New-CheckResult -Name ("homepage marker: {0}" -f $marker.Name) -Passed ($homeBodyNormalized -match $marker.Pattern) -Detail $marker.Pattern)) | Out-Null
}

$forbiddenHomepagePatterns = @(
  @{ Name = "stale preview host"; Pattern = "vercel\.app" },
  @{ Name = "never miss claim"; Pattern = "Never miss" },
  @{ Name = "99.9 claim"; Pattern = "99\.9%" },
  @{ Name = "0s hold claim"; Pattern = "0s hold" },
  @{ Name = "provider leakage"; Pattern = "OpenAI|Anthropic|Hugging Face|Vapi|ElevenLabs|LiveKit|Stripe API|model|provider API" },
  @{ Name = "checkout live claim"; Pattern = "Buy Now|Pay Now|Start Checkout|Checkout is live|self-serve checkout" }
)

foreach ($pattern in $forbiddenHomepagePatterns) {
  $results.Add((New-CheckResult -Name ("homepage forbidden: {0}" -f $pattern.Name) -Passed (-not ($homeBody -match $pattern.Pattern)) -Detail $pattern.Pattern)) | Out-Null
}

$headerChecks = @(
  @{ Name = "Content-Security-Policy"; Present = $homeHeaders["Content-Security-Policy"] },
  @{ Name = "Strict-Transport-Security"; Present = $homeHeaders["Strict-Transport-Security"] },
  @{ Name = "X-Content-Type-Options"; Present = $homeHeaders["X-Content-Type-Options"] },
  @{ Name = "Referrer-Policy"; Present = $homeHeaders["Referrer-Policy"] },
  @{ Name = "Permissions-Policy"; Present = $homeHeaders["Permissions-Policy"] }
)

foreach ($header in $headerChecks) {
  $results.Add((New-CheckResult -Name ("header {0}" -f $header.Name) -Passed (-not [string]::IsNullOrWhiteSpace([string]$header.Present)) -Detail ([string]$header.Present))) | Out-Null
}

$hasFrameHeader = -not [string]::IsNullOrWhiteSpace([string]$homeHeaders["X-Frame-Options"])
$hasFrameAncestors = ([string]$homeHeaders["Content-Security-Policy"]) -match "frame-ancestors"
$results.Add((New-CheckResult -Name "frame protection" -Passed ($hasFrameHeader -or $hasFrameAncestors) -Detail ("X-Frame-Options={0}; frame-ancestors={1}" -f [string]$homeHeaders["X-Frame-Options"], $hasFrameAncestors))) | Out-Null

$healthGet = Invoke-CheckedRequest -Method "GET" -Path "/health" -ExpectedStatus @(200)
$healthBody = Get-ResponseBodyText -Response $healthGet.Response

$healthRequired = @("ok", "service", "nexcall", "healthy")
foreach ($marker in $healthRequired) {
  $results.Add((New-CheckResult -Name ("health required: {0}" -f $marker) -Passed ($healthBody.ToLowerInvariant().Contains($marker)) -Detail $marker)) | Out-Null
}

$healthForbidden = @("misato", "runtime", "database", "secret", "token", "provider")
foreach ($marker in $healthForbidden) {
  $results.Add((New-CheckResult -Name ("health forbidden: {0}" -f $marker) -Passed (-not $healthBody.ToLowerInvariant().Contains($marker)) -Detail $marker)) | Out-Null
}

$failed = @($results | Where-Object { -not $_.Passed })

Write-Host ""
Write-Host "NexCall production parity verification"
Write-Host ("Base URL: {0}" -f $BaseUrl)
Write-Host ""
Write-Host "Route matrix:"
$routeMatrix | Format-Table -AutoSize | Out-String | Write-Host

if ($failed.Count -gt 0) {
  Write-Host "Failed checks:" -ForegroundColor Red
  foreach ($item in $failed) {
    Write-Host ("- {0}: {1}" -f $item.Name, $item.Detail) -ForegroundColor Red
  }

  exit 1
}

Write-Host "All production parity checks passed." -ForegroundColor Green
exit 0
