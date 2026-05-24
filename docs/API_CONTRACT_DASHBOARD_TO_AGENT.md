# API Contract: Dashboard -> Agent Runtime

## Endpoint
`POST /api/misato/command`

## Request
```json
{ "command": "string" }
```

## Response (v1 mock/live-style)
```json
{
  "ok": true,
  "mode": "mock",
  "result": {
    "missionSummary": "string",
    "projectDetected": "string",
    "agentsAssigned": ["string"],
    "councilFeedback": [{"agent":"string","feedback":"string"}],
    "subtasksCreated": ["string"],
    "risksDetected": ["string"],
    "approvalRequired": true,
    "logsCreated": ["string"],
    "nextRecommendedActions": ["string"],
    "activityFeed": ["string"]
  }
}
```

## Security
- Owner session required.
- No secret material in response payload.
- Risky action classes marked and routed to Approval Gate in v1.
