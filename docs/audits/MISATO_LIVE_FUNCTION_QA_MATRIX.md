# MISATO Live Function QA Matrix

## Branch
- `misato-codex-live-ui-qa`

## Local Verification Target
- `http://localhost:4010` (fresh runtime started from this workspace)

## Matrix (2026-05-25)

| Capability | Result | Evidence |
|---|---:|---|
| Health/status readable | PASS | `GET /api/misato/status` `200` with runtime fields |
| Daily command flow | PASS | `POST /api/misato/command` `200` |
| Risky command gate | PASS | `approvalRequired: true`; no auto execution |
| Task create | PASS | `POST /api/misato/tasks/create` `200` |
| Task update | PASS | `POST /api/misato/tasks/update` `200` |
| Task delete | PASS | `POST /api/misato/tasks/delete` `200` |
| Agent assignment | PASS | `POST /api/misato/agents/assign` `200` with valid IDs |
| Approval action | PASS | `POST /api/misato/approvals/action` `200` |
| Mission create | PASS | `POST /api/misato/missions/create` `200` |
| Mission dispatch | PASS | `POST /api/misato/missions/dispatch` `200` with valid IDs |
| Logs endpoint | PASS | `GET /api/misato/logs` `200` |
| Event stream | PASS | `GET /api/misato/events/stream` emits live events |
| Event stream non-local protection | PASS | non-local host probe returned `401` JSON |
| Sensitive route non-local protection | PASS | `/status`, `/tasks`, `/missions` all returned `401` JSON |
| Secrets redaction safety | PASS | redacted payload behavior observed (`[REDACTED]`) |
| Lint/build/desktop build | PASS | all completed successfully |

## Notes
- Some earlier `404` mutation probes were from invalid IDs, not missing routes.
- Cloud/Vercel is optional for daily local runtime use.
