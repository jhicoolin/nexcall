param(
  [string]$BaseUrl = 'https://nexcall.one',
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Route,
    [string]$Method,
    [int]$ExpectedStatus,
    [int]$ActualStatus,
    [string]$Expected,
    [string]$Evidence,
    [string]$Status,
    [string]$Notes = ''
  )
  $obj = New-Object PSObject -Property @{ 
    route = $Route
    method = $Method
    expectedStatus = $ExpectedStatus
    actualStatus = $ActualStatus
    expected = $Expected
    evidence = $Evidence
    status = $Status
    notes = $Notes
  }
  [void]$results.Add($obj)
}

function Get-UriForRoute {
  param([string]$Route)

  $suffix = "?final-health-proof=$ts"
  switch ($Route) {
    '/' { return "$BaseUrl/$suffix" }
    '/health' { return "$BaseUrl/health$suffix" }
    '/command' { return "$BaseUrl/command$suffix" }
    '/checkout' { return "$BaseUrl/checkout$suffix" }
    '/api/checkout' { return "$BaseUrl/api/checkout$suffix" }
    '/admin' { return "$BaseUrl/admin$suffix" }
    '/admin/login' { return "$BaseUrl/admin/login$suffix" }
    '/.env' { return "$BaseUrl/.env$suffix" }
    '/.git/config' { return "$BaseUrl/.git/config$suffix" }
    '/api/debug' { return "$BaseUrl/api/debug$suffix" }
    '/server-status' { return "$BaseUrl/server-status$suffix" }
    default { return "$BaseUrl$Route$suffix" }
  }
}

function Invoke-Probe {
  param(
    [string]$Route,
    [string]$Method = 'GET',
    [string]$Body = ''
  )

  $uri = Get-UriForRoute -Route $Route
  $headers = @{ accept = 'application/json, text/html;q=0.9, */*;q=0.8' }

  try {
    if ($Method -eq 'POST') {
      return Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body $Body -ContentType 'application/json' -ErrorAction Stop
    }
    return Invoke-WebRequest -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
  } catch {
    if ($_.Exception.Response) {
      return $_.Exception.Response
    }
    throw
  }
}

function Get-StatusCode {
  param($Response)
  try {
    return [int]$Response.StatusCode
  } catch {
    try { return [int]$Response.StatusCode.value__ } catch { return -1 }
  }
}

function Get-HeaderValue {
  param($Response, [string]$Name)
  try {
    return [string]$Response.Headers[$Name]
  } catch {
    return ''
  }
}

function Get-BodyText {
  param($Response)

  try {
    if ($Response.Content) { return [string]$Response.Content }
  } catch {
  }

  try {
    $stream = $Response.GetResponseStream()
    if ($null -eq $stream) { return '' }
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $reader.Dispose()
    $stream.Dispose()
    return $text
  } catch {
    return ''
  }
}

$routeExpectations = @(
  @{ Path = '/'; Method = 'HEAD'; Expected = @(200) },
  @{ Path = '/health'; Method = 'HEAD'; Expected = @(200) },
  @{ Path = '/command'; Method = 'HEAD'; Expected = @(200) },
  @{ Path = '/checkout'; Method = 'HEAD'; Expected = @(404) },
  @{ Path = '/admin'; Method = 'HEAD'; Expected = @(404) },
  @{ Path = '/admin/login'; Method = 'HEAD'; Expected = @(404) },
  @{ Path = '/.env'; Method = 'HEAD'; Expected = @(401, 403, 404) },
  @{ Path = '/.git/config'; Method = 'HEAD'; Expected = @(401, 403, 404) },
  @{ Path = '/api/debug'; Method = 'HEAD'; Expected = @(401, 403, 404) },
  @{ Path = '/server-status'; Method = 'HEAD'; Expected = @(401, 403, 404) }
)

foreach ($route in $routeExpectations) {
  $check = Invoke-Probe -Method $route.Method -Route $route.Path
  $statusCode = Get-StatusCode $check
  $passed = $route.Expected -contains $statusCode
  Add-Result -Route $route.Path -Method $route.Method -ExpectedStatus ($route.Expected[0]) -ActualStatus $statusCode -Expected ($route.Expected -join '/') -Evidence ('status=' + $statusCode) -Status ($(if ($passed) { 'PASS' } else { 'FAIL' }))
}

$checkoutPayload = @{
  planId        = 'starter'
  billingPeriod = 'monthly'
  email         = 'audit@example.com'
  businessName  = 'Audit Co'
  name          = 'Audit User'
  phone         = '2025550199'
  message       = 'Non-destructive parity verification'
} | ConvertTo-Json -Compress

$checkoutResponse = Invoke-Probe -Route '/api/checkout' -Method 'POST' -Body $checkoutPayload
$checkoutStatus = Get-StatusCode $checkoutResponse
Add-Result -Route '/api/checkout' -Method 'POST' -ExpectedStatus 503 -ActualStatus $checkoutStatus -Expected '503 while disabled' -Evidence ('status=' + $checkoutStatus) -Status ($(if ($checkoutStatus -eq 503) { 'PASS' } else { 'FAIL' }))

$rootResp = Invoke-Probe -Route '/' -Method 'GET'
$rootStatus = Get-StatusCode $rootResp
$headerMap = @{
  'Content-Security-Policy' = Get-HeaderValue $rootResp 'Content-Security-Policy'
  'Strict-Transport-Security' = Get-HeaderValue $rootResp 'Strict-Transport-Security'
  'X-Content-Type-Options' = Get-HeaderValue $rootResp 'X-Content-Type-Options'
  'Referrer-Policy' = Get-HeaderValue $rootResp 'Referrer-Policy'
  'Permissions-Policy' = Get-HeaderValue $rootResp 'Permissions-Policy'
}
$missingHeaders = @()
foreach ($key in $headerMap.Keys) {
  if ([string]::IsNullOrWhiteSpace($headerMap[$key])) {
    $missingHeaders += $key
  }
}
$headersOk = ($missingHeaders.Count -eq 0)
Add-Result -Route 'security headers' -Method 'GET' -ExpectedStatus 200 -ActualStatus (Get-StatusCode $rootResp) -Expected 'CSP + HSTS + content-type + referrer + permissions headers present' -Evidence ($headerMap | ConvertTo-Json -Compress) -Status ($(if ($headersOk) { 'PASS' } else { 'FAIL' })) -Notes ($(if ($headersOk) { '' } else { 'Missing: ' + ($missingHeaders -join ', ') }))

$homeBody = Get-BodyText $rootResp
$homeVisible = [regex]::Replace($homeBody, '<!--.*?-->', ' ')
$homeVisible = [regex]::Replace($homeVisible, '<[^>]+>', ' ')
$homeNormalized = ($homeVisible -replace '\s+', ' ')
$requiredMarkers = @(
  'Turn missed calls into next steps',
  'NexCall helps local businesses answer when the team is busy, capture appointment requests, and keep follow-up organized',
  'Request Setup'
)
$forbiddenMarkers = @(
  'Answer more calls. Capture every lead.',
  'Never miss your next call',
  'NexCall picks up every time',
  'Picks up every time',
  '99.9%',
  '0s hold',
  'pay now',
  'buy now',
  'stale preview',
  'vercel.app'
)
$homepageOk = $true
foreach ($marker in $requiredMarkers) {
  if (-not ($homeNormalized -like "*${marker}*")) { $homepageOk = $false }
}
foreach ($marker in $forbiddenMarkers) {
  if ($homeNormalized -like "*${marker}*") { $homepageOk = $false }
}
Add-Result -Route 'homepage markers' -Method 'GET' -ExpectedStatus 200 -ActualStatus $rootStatus -Expected 'current honest homepage copy without stale or checkout-live language' -Evidence ($homeNormalized.Substring(0, [Math]::Min(600, $homeNormalized.Length))) -Status ($(if ($homepageOk) { 'PASS' } else { 'FAIL' })) -Notes ($(if ($homepageOk) { '' } else { 'homepage markers mismatched' }))

$healthResp = Invoke-Probe -Route '/health' -Method 'GET'
$healthStatus = Get-StatusCode $healthResp
$healthBody = Get-BodyText $healthResp
$healthNormalized = ($healthBody -replace '\s+', '')
$healthOk = ($healthStatus -eq 200) -and ($healthNormalized -eq '{"ok":true,"service":"nexcall","status":"healthy"}')
Add-Result -Route '/health body' -Method 'GET' -ExpectedStatus 200 -ActualStatus $healthStatus -Expected 'safe minimal JSON only' -Evidence $healthBody.Trim() -Status ($(if ($healthOk) { 'PASS' } else { 'FAIL' })) -Notes ($(if ($healthOk) { '' } else { 'health payload mismatch' }))

$passCount = ($results | Where-Object { $_.status -eq 'PASS' }).Count
$failCount = ($results | Where-Object { $_.status -eq 'FAIL' }).Count
$suggestedState = $(if ($failCount -eq 0) { 'GO FOR REQUEST-DEMO LAUNCH' } else { 'NO-GO' })

if ($Json) {
  [pscustomobject]@{
    pass = ($failCount -eq 0)
    passCount = $passCount
    failCount = $failCount
    suggestedState = $suggestedState
    results = $results
  } | ConvertTo-Json -Depth 6
  exit $(if ($failCount -eq 0) { 0 } else { 1 })
}

foreach ($row in $results) {
  $line = "[{0}] {1} {2} -> expected {3}, actual {4} | {5}" -f $row.status, $row.method, $row.route, $row.expectedStatus, $row.actualStatus, $row.evidence
  if ($row.notes) { $line += " | $($row.notes)" }
  Write-Output $line
}
Write-Output "Suggested state: $suggestedState"
exit $(if ($failCount -eq 0) { 0 } else { 1 })
