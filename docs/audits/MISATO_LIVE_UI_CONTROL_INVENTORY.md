# MISATO Live UI Control Inventory (Backend Contract View)

## Branch
- `misato-codex-live-ui-qa`

## Scope
Backend-side verification only. UI rendering/polish belongs to Claude lane.

## Command Center
| Control | Backend Route | Status | Note |
|---|---|---|---|
| Send command | `POST /api/misato/command` | WORKS | Returns live timeline + approval gating |
| Quick actions | `POST /api/misato/command` | WORKS | Same contract as freeform command |
| Clear timeline/history | UI-local | BACKEND BLOCKED | No dedicated backend clear-history route required today |

## AgentDex
| Control | Backend Route | Status | Note |
|---|---|---|---|
| Agent list/filter | `GET /api/misato/agents` | WORKS | Returns live `items` JSON |
| Assign task to agent | `POST /api/misato/agents/assign` | WORKS | Requires valid `taskId` + `agentId` |

## Schedule / Tasks
| Control | Backend Route | Status | Note |
|---|---|---|---|
| New task | `POST /api/misato/tasks/create` | WORKS | Live mutation emits events |
| Edit task | `POST /api/misato/tasks/update` | WORKS | Live mutation emits events |
| Delete task | `POST /api/misato/tasks/delete` | WORKS | Live mutation emits events |
| Priority/status change | `POST /api/misato/tasks/update` | WORKS | Field update supported |
| scheduledAt | `tasks/create|update` body | WORKS (contract) | Backend accepts `scheduledAt`; UI behavior tracked separately |

## Approvals
| Control | Backend Route | Status | Note |
|---|---|---|---|
| Approve / Reject / Defer | `POST /api/misato/approvals/action` | WORKS | Accepts `action`; compatibility with `decision` mapping exists |

## Live Feed / Logs
| Control | Backend Route | Status | Note |
|---|---|---|---|
| Live stream | `GET /api/misato/events/stream` | WORKS | Auth-protected; emits live events |
| Polling fallback | `GET /api/misato/logs` | WORKS | Returns `{ ok, items }` JSON |

## Watchtower / Secret Sentinel
| Control | Backend Route | Status | Note |
|---|---|---|---|
| Watchtower status | `GET /api/misato/watchtower/status` | WORKS | JSON status |
| Watchtower check | `POST /api/misato/watchtower/check` | WORKS | Emits check event |
| Secret status | `GET /api/misato/secrets/status` | WORKS | Redacted-only contract |

## Missions
| Control | Backend Route | Status | Note |
|---|---|---|---|
| Mission list | `GET /api/misato/missions` | WORKS | Returns `{ ok, items }` |
| Mission create | `POST /api/misato/missions/create` | WORKS | Live mutation |
| Mission dispatch | `POST /api/misato/missions/dispatch` | WORKS | Requires valid mission + agent IDs |
