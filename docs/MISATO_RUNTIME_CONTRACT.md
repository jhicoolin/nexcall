# MISATO Runtime Contract (Local-First Canonical)

## Command pipeline
Owner command in MISATO.exe
→ Runtime discovery selects local target
→ `/command` receives command
→ Hermes Orchestrator classifies intent/risk
→ Specialist agents assigned
→ Approval policy evaluated
→ Structured response returned
→ Events emitted for each transition

## Required command response schema
```json
{
  "ok": true,
  "mode": "local-first|preview-simple|production-locked",
  "commandReceived": "string",
  "missionSummary": "string",
  "projectDetected": "string",
  "hermesPlan": ["string"],
  "agentsAssigned": ["string"],
  "councilFeedback": [{ "agent": "string", "feedback": "string" }],
  "subtasksCreated": ["string"],
  "risksDetected": ["string"],
  "approvalRequired": false,
  "approvalReason": null,
  "logsCreated": ["string"],
  "nextRecommendedActions": ["string"],
  "moduleStatus": {}
}
```

## Required event schema
```json
{
  "eventId": "uuid",
  "timestamp": "iso",
  "type": "command_received|plan_generated|agent_assigned|task_updated|risk_detected|approval_requested|approval_resolved|log|status_change",
  "source": "string",
  "payload": {}
}
```

## Endpoint contract (canonical)
- `GET /health` → runtime health + discovery hints
- `POST /command` → command response schema
- `GET /agents` → registry and statuses
- `GET /tasks` → active tasks
- `GET /approvals` → pending/resolved approvals
- `GET /logs` → redacted operational logs
- `GET /watchtower` → local/service health summary
- `GET /secrets` → secret posture summary (masked)
- `GET /events/stream` → SSE event stream

## Compatibility path map (current Next app)
- Canonical local-first routes are implemented directly for `/health`, `/command`, `/tasks`, `/watchtower`, `/secrets`, `/events/stream`.
- Route-collision-safe shell aliases are implemented for `/agents`, `/approvals`, `/logs` via middleware rewrite:
  - `/agents` (JSON/shell requests) → `/misato-runtime/agents`
  - `/approvals` (JSON/shell requests) → `/misato-runtime/approvals`
  - `/logs` (JSON/shell requests) → `/misato-runtime/logs`
- Browser HTML navigation still resolves to the existing UI pages at `/agents`, `/approvals`, `/logs`.
- Auth-protected mirrors remain available under `/api/misato/*` for owner-only desktop/web dashboard usage.

## Status fields returned by `/api/misato/status`
- `runtimeMode`
- `localSoloMode`
- `desktopTokenRequired`
- `productionLocked`
- `hermesConnected`
- `runtimeConnected`
- `eventStreamAvailable`
- `persistenceMode`
- `activeAgents`
- `activeTasks`
- `pendingApprovals`
- `lastEventAt`

## Mode behavior
- Local-first default always
- If local runtime healthy: UI shows **Connected**
- If local runtime not running: UI shows **Start Hermes / Setup**
- Vercel preview remains optional and secondary
- No daily cloud dependency allowed
