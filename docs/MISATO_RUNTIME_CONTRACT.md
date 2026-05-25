# MISATO Runtime Contract

## Command Endpoint

`POST /api/misato/command`

Request:

```json
{
  "command": "What needs attention today?"
}
```

Success response:

```json
{
  "ok": true,
  "mode": "mock-safe",
  "commandReceived": "...",
  "missionSummary": "...",
  "projectDetected": "...",
  "hermesPlan": {
    "summary": "...",
    "executionMode": "mock-safe",
    "recommendedAgentPath": []
  },
  "agentsAssigned": [],
  "councilFeedback": [],
  "subtasksCreated": [],
  "risksDetected": [],
  "approvalRequired": false,
  "approvalReason": null,
  "logsCreated": [],
  "nextRecommendedActions": [],
  "moduleStatus": {
    "watchtower": {},
    "designSystem": {},
    "secretSentinel": {},
    "obsidianMirror": {},
    "githubHandoffs": {}
  }
}
```

The response also includes `result` for backward compatibility with the existing desktop UI.

## Risk Gate

The endpoint must set `approvalRequired: true` for production deploys, env var changes, DNS changes, auth changes, database migrations, deleting data, sending emails, social posting, billing changes, exporting contacts, real Discord bot actions, real Obsidian vault writes, live automations, GitHub merge to main, and Vercel production deploys.

## Runtime Modes

Current v1 is a mock-safe Hermes-style runtime. Future v2 can connect to a private `misato-agent` fork based on Hermes Agent after owner approval. Do not claim the runtime is already a real fork unless that private repository exists and is connected through owner-approved backend APIs.
