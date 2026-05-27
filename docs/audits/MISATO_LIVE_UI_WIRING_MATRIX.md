# MISATO Live UI Wiring Matrix
**Version:** app.js v6.5  
**Branch:** misato-claude-live-ui-wiring  
**Date:** 2026-05-26  
**Author:** Claude UI Agent  

---

## Global Runtime Client

| Feature | Status | Notes |
|---------|--------|-------|
| Single hermesBase() source | PASS | 127.0.0.1:3010 canonical |
| apiGet HTML rejection | PASS | Rejects 200 HTML (SSO wall) |
| hermesMutate error surfacing | PASS | URL + reason shown in toast |
| Fetch error shows endpoint | PASS | All errors include `e.url` |
| No tokens logged | PASS | Password inputs only |

---

## Screen-by-screen wiring status

### Overview
| Control | Endpoint | Status |
|---------|----------|--------|
| Health tiles | `/api/misato/status` health | PASS |
| Active model tile | `ctx.activeModel` from `/status` | PASS — shows when field present |
| Agent Status list | `/api/misato/agents` | PASS |
| Active Work list | `/api/misato/tasks` | PASS |
| Approval Backlog | `/api/misato/approvals` | PASS |
| Mock banner suppression | n/a | PASS — hidden when Hermes connected |
| Loading state | n/a | PASS — spinner while fetching |
| Refresh button | `loadAllFromHermes()` | PASS |

### Command Center
| Control | Endpoint | Status |
|---------|----------|--------|
| Send command | `POST /api/misato/command` | PASS |
| Response text | `data.responseText` | PASS |
| Model badge | `data.modelUsed` | PASS — shows if field present |
| Fallback badge | `data.responseSource` | PASS — amber badge if `deterministic-fallback` |
| Quick actions | same as send | PASS |
| Timeline stages | SSE events | PASS |
| Error state | endpoint + reason | PASS |
| Clear messages | local state | PASS |

### AgentDex
| Control | Endpoint | Status |
|---------|----------|--------|
| Load agents | `GET /api/misato/agents` | PASS |
| Filter pills | local state | PASS |
| Filter counts | computed from data | PASS |
| Agent card click → drawer | local state | PASS |
| Progress bar | `agent.progress` | PASS — shows when field present |
| lastActivityAt in drawer | `agent.lastActivityAt` | PASS |
| Assign Task modal | `POST /api/misato/tasks/create` | PASS |
| Mock banner suppression | n/a | PASS |
| Loading state | n/a | PASS |

### Schedule
| Control | Endpoint | Status |
|---------|----------|--------|
| Agenda tab | tasks with `scheduledAt` | PASS |
| Day tab | tasks with `scheduledAt` → hour buckets | PASS |
| Week tab | tasks with `scheduledAt` → date buckets | PASS |
| Tab state | `state.scheduleView` | PASS — wired and stateful |
| Waiting state (no scheduledAt) | n/a | PASS — honest message |
| Mock banner suppression | n/a | PASS |
| + New Task | modal → `POST /api/misato/tasks/create` | PASS |

### Kanban
| Control | Endpoint | Status |
|---------|----------|--------|
| Load tasks | `GET /api/misato/tasks` | PASS |
| Status cycle | `POST /api/misato/tasks/update` | PASS |
| Priority cycle | `POST /api/misato/tasks/update` | PASS |
| Delete task | `POST /api/misato/tasks/delete` | PASS |
| High-risk delete → approval gate | local state | PASS |
| Mock banner suppression | n/a | PASS |

### Approvals
| Control | Endpoint | Status |
|---------|----------|--------|
| Load approvals | `GET /api/misato/approvals` | PASS |
| Filter tabs | `state.approvalFilter` | PASS — wired |
| Pending filter | local filter | PASS |
| Approved/Rejected/Deferred filters | local filter | PASS |
| Dedup by ID | local dedup | PASS — approval spam collapsed |
| Approve button | `POST /api/misato/approvals/action` | PASS |
| Reject button | `POST /api/misato/approvals/action` | PASS |
| Defer button | `POST /api/misato/approvals/action` | PASS |
| Card normalizes `requestedByAgentName` | local | PASS |
| Card normalizes `riskLevel` | local | PASS |
| safeExecutionMode badge | `a.safeExecutionMode` | PASS |
| Mock banner suppression | n/a | PASS |
| Loading state | n/a | PASS |

### Watchtower
| Control | Endpoint | Status |
|---------|----------|--------|
| Tiles | health + status state | PASS |
| Service cards | `GET /api/misato/watchtower` | PASS |
| Agent state map | `/api/misato/agents` | PASS |
| Recent incidents | SSE risk events + logs | PASS |
| Refresh button | `loadAllFromHermes()` | PASS |
| Mock banner suppression | n/a | PASS |

### Secret Sentinel
| Control | Endpoint | Status |
|---------|----------|--------|
| Load status | `GET /api/misato/secrets` | PASS |
| gitleaksInstalled panel | `data.gitleaksInstalled` | PASS |
| scanAvailable panel | `data.scanAvailable` | PASS |
| Findings list | `data.findings` | PASS — no raw secrets shown |
| Severity counts | `data.critical/high/warnings` | PASS — normalized |
| Scan Now button | `POST /api/misato/secrets/scan-summary` | PASS — **fixed endpoint** |
| Button disabled when unavailable | `!scanAvailable` | PASS |
| Error shows endpoint URL | `e.url` in toast | PASS |
| Mock banner suppression | n/a | PASS |
| Loading state | n/a | PASS |

### Logs
| Control | Endpoint | Status |
|---------|----------|--------|
| Load logs | `GET /api/misato/logs` | PASS |
| Severity filter | `state.logFilter` | PASS |
| Mock banner suppression | n/a | PASS |
| Refresh button | `loadAllFromHermes()` | PASS |

### Live Feed
| Control | Endpoint | Status |
|---------|----------|--------|
| SSE connection | `GET /api/misato/events/stream` | PASS |
| Noise filtering | FEED_NOISE_TYPES Set | PASS — heartbeat/stream events filtered |
| Deduplication | eventId-based | PASS |
| Filter: ALL | all events | PASS |
| Filter: ALERTS | risk_detected + sev=warn/error | PASS |
| Filter: AGENTS | agent_assigned, status_change | PASS |
| Filter: CMDS | command_received, plan_generated | PASS |
| Filter: TASKS | task_updated | PASS |
| Filter: APPV | approval_requested, approval_resolved | PASS — new |
| Pause / Follow Live | local state | PASS |
| SSE fallback polling | 15s poll of `/logs` | PASS |

### Integrations
| Control | Status |
|---------|--------|
| Hermes card reflects live state | PASS |
| Vercel card reflects test state | PASS |
| Static cards show mode/next | PASS |

### Lanes
| Control | Status |
|---------|--------|
| Live lanes from agent branch/lane fields | PASS — uses live when available |
| Static manifest fallback | PASS |
| Mock banner suppressed when Hermes connected | PASS — shows waiting state instead |

### Obsidian Mirror
| Control | Endpoint | Status |
|---------|----------|--------|
| Live vault state | `ctx.obsidian` from `/status` | PASS |
| Configured banner | `obsidian.configured` | PASS |
| Not configured instructions | n/a | PASS |
| Sync Now | `POST /api/misato/obsidian/sync` | PASS — wired |
| Open in Obsidian disabled | when not configured | PASS |

### Design Library
| Control | Status |
|---------|--------|
| Tokens tab | PASS |
| Components tab | PASS |
| Patterns tab | PASS |

---

## Security audit

| Check | Status |
|-------|--------|
| No raw secrets in any render path | PASS |
| Sentinel shows `[REDACTED]` only | PASS |
| Token inputs are `type=password` | PASS |
| Token values never rendered after save | PASS |
| No `console.log` of tokens | PASS |
| Production actions require approval | PASS |

---

## Pending / blocked

| Item | Blocked by |
|------|-----------|
| Schedule Day/Week populated | Hermes needs `scheduledAt` in tasks |
| Lanes fully live | Hermes needs `branch`/`lane` in agents |
| Active model badge | Hermes needs `activeModel` in `/status` |
| Obsidian live sync | Owner needs `OBSIDIAN_VAULT_PATH` + Hermes `/obsidian/sync` |
| Progress bar on agents | Hermes needs `progress` field in agents |
| `desktop:build` result | Must run with MISATO.exe closed |
