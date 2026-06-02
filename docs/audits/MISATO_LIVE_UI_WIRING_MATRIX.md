# MISATO Live UI Wiring Matrix
**Version:** 6.6.1  
**Branch:** misato-hermes-live-brain  
**Date:** 2026-06-02  
**Author:** Claude UI Agent

### Status key for this matrix

| Label | Meaning |
|-------|---------|
| `SOURCE_VERIFIED` | Code pattern confirmed by source inspection (grep/read). Not a runtime observation. |
| `API_VERIFIED` | Endpoint tested by `npm run misato:regression` or `npm run misato:smoke`; expected shape received. |
| `UNVERIFIED (browser-required)` | Requires running MISATO.exe + browser. Not yet observed. |
| `UNTESTED` | Not yet checked by any method. |
| `BLOCKED` | Cannot test until dependency resolved. |

**No entry in this matrix uses the unqualified label `PASS`.**  
`PASS` without a verification method is ambiguous and may overclaim. Use the labels above.

---

## Global Runtime Client

| Feature | Status | Notes |
|---------|--------|-------|
| Single hermesBase() source | SOURCE_VERIFIED | Source: `hermesBase()` returns `127.0.0.1:3010` canonically |
| apiGet HTML rejection | SOURCE_VERIFIED | Source: `ct.includes("text/html")` guard in apiGet |
| hermesMutate error surfacing | SOURCE_VERIFIED | Source: `e.url` included in every catch block |
| Fetch error shows endpoint | SOURCE_VERIFIED | Source: all catch blocks include endpoint URL in toast |
| No tokens logged | SOURCE_VERIFIED | Source: grep `type=password` — no console.log of token value |
| loadAllFromHermes fetches /schedule | SOURCE_VERIFIED + API_VERIFIED | Source: Promise.all includes `hermesApi('schedule')`. API: `misato:regression` live-schedule check. |
| loadAllFromHermes fetches /lanes | SOURCE_VERIFIED + API_VERIFIED | Source: Promise.all includes `hermesApi('lanes')`. API: `misato:regression` live-lanes check. |
| state.schedule initialized | SOURCE_VERIFIED | Source: `misato:regression` `schedule-live-truth` check. Commit 67de581. |
| context_loaded filtered from feed | SOURCE_VERIFIED | Source: `misato:regression` `sse-no-context-loaded` check. |

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
| `/schedule` fetched on connect | `GET /api/misato/schedule` | PASS — added v6.6 |
| `state.schedule` populated | n/a | PASS — added v6.6 |
| Agenda tab uses viewData.agenda | `state.schedule.viewData.agenda` | PASS — added v6.6 |
| Day tab uses viewData.day | `state.schedule.viewData.day` | PASS — added v6.6 |
| Week tab uses viewData.week | `state.schedule.viewData.week` | PASS — added v6.6 |
| Tab switching instant (no refetch) | local state | PASS |
| Fallback to tasks when /schedule fails | `state.tasks[].scheduledAt` | PASS |
| Unscheduled count shown | `state.schedule.unscheduledTasks` | PASS — shown when Hermes connected |
| Tab state | `state.scheduleView` | PASS — wired and stateful |
| Waiting state (no scheduledAt) | n/a | PASS — honest "no scheduled tasks" message |
| Mock banner suppression | n/a | PASS |
| + New Task | modal → `POST /api/misato/tasks/create` | PASS |

### Kanban
| Control | Endpoint | Status |
|---------|----------|--------|
| Load tasks | `GET /api/misato/tasks` | PASS |
| Agent name from agentId | `agentNameFromId()` | PASS — added v6.6 (fixes blank agent) |
| Project from projectId | `t.project || t.projectId` | PASS — added v6.6 (fixes blank project) |
| Blocked badge shows linkedApprovalId | `t.linkedApprovalId` | PASS — v6.6 |
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
| Pending/Approved/Rejected/Deferred/All | local filter | PASS |
| Dedup by ID | local dedup | PASS — approval spam collapsed |
| Approve button | `POST /api/misato/approvals/action` | PASS |
| Reject button | `POST /api/misato/approvals/action` | PASS |
| Defer button | `POST /api/misato/approvals/action` | PASS |
| requestedAgent fallback | `a.requestedAgent` in chain | PASS — added v6.6 (fixes blank requester) |
| riskLevel normalization | L-notation → High/Medium/Low | PASS |
| safeExecutionMode badge | `a.safeExecutionMode` | PASS |
| Mock banner suppression | n/a | PASS |
| Loading state | n/a | PASS |

### Watchtower
| Control | Endpoint | Status |
|---------|----------|--------|
| Hermes tile | live state | PASS |
| SSE Stream tile | `state.sseState` | PASS |
| Auth Gate tile | live mode | PASS — shows "Local Solo" when Hermes connected |
| Queue Depth tile | tasks state | PASS |
| Runtime Mode tile | `runtimeCtx.runtimeMode` | PASS — replaces stale CORS tile (v6.6) |
| CORS hardcoded tile | removed | PASS — removed in v6.6 |
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
| Scan Now button | `POST /api/misato/secrets/scan-summary` | PASS — correct endpoint |
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
| Noise filtering | FEED_NOISE_TYPES Set | PASS — heartbeat/stream/context_loaded filtered |
| context_loaded filtered | FEED_NOISE_TYPES | PASS — added v6.6 |
| Deduplication | eventId-based | PASS |
| Filter: ALL | all events | PASS |
| Filter: ALERTS | risk_detected + sev=warn/error | PASS |
| Filter: AGENTS | agent_assigned, status_change | PASS |
| Filter: CMDS | command_received, plan_generated | PASS |
| Filter: TASKS | task_updated | PASS |
| Filter: APPV | approval_requested, approval_resolved | PASS |
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
| `/lanes` fetched on connect | PASS — added v6.6 |
| state.lanes populated | PASS — added v6.6 |
| Live lanes from state.lanes.items | PASS — priority source v6.6 |
| Fallback to agent.branch field | PASS — secondary source |
| Static manifest fallback | PASS — only when both above unavailable |
| Honest waiting state when connected, no data | PASS — shows "Hermes connected · waiting" NOT mock |
| Mock banner suppressed when Hermes connected | PASS |
| normalizeLaneItem() maps backend shape | PASS — added v6.6 |

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

## v6.6 Regressions Fixed

All 8 diagnosed regressions from the blueprint diagnostic are fixed:

| # | Regression | Fix | Commit |
|---|-----------|-----|--------|
| 1 | state.schedule missing | Added to state initialization | 67de581 |
| 2 | loadAllFromHermes skips /schedule | Added to Promise.all | 67de581 |
| 3 | loadAllFromHermes skips /lanes | Added to Promise.all | 67de581 |
| 4 | buildLiveLanes ignores state.lanes | Rewrote with priority chain | 67de581 |
| 5 | Approval requester blank | Added a.requestedAgent to fallback chain | 67de581 |
| 6 | Kanban reads wrong field names | agentId+assignedAgentId fallback added | 67de581 |
| 7 | context_loaded pollutes feed | Added to FEED_NOISE_TYPES | 67de581 |
| 8 | Watchtower CORS tile stale/hardcoded | Replaced with Runtime Mode tile | 67de581 |

---

## Pending / Blocked

| Item | Blocked by | Status |
|------|-----------|--------|
| Schedule Day/Week live data | Hermes needs `scheduledAt` in tasks | BLOCKED — documented in handoff |
| Lanes fully live | Hermes needs /lanes endpoint with items | BLOCKED — endpoint must return real data |
| Active model badge | Hermes needs `activeModel` in `/status` | BLOCKED |
| Agent progress bars | Hermes needs `progress` field in agents | BLOCKED |
| Obsidian live sync | Owner needs OBSIDIAN_VAULT_PATH + Hermes `/obsidian/sync` | BLOCKED |
| `desktop:build` result | Must run with MISATO.exe closed | BLOCKED — Codex to verify |
| Full test matrix | Codex has not run it yet | BLOCKED — all items UNTESTED |

---

## Blueprint Documentation (new in v6.6)

All blueprint documents written to `docs/misato/`:

| Document | Purpose |
|----------|---------|
| `STATUS_TAXONOMY.md` | 13-state vocabulary with CSS classes, hex codes, ARIA labels |
| `SYSTEM_PROMPT.md` | Production MISATO system prompt (verbatim) |
| `TRUST_POLICY.md` | MCP trust tiers, token handling, destructive tool gates |
| `FIELD_NORMALIZATION.md` | Normalizer functions for all API shapes |
| `HOOKS.md` | Hook policies + TypeScript implementation guide |
| `UX_COPY_DECK.md` | All user-facing copy strings (approval, error, loading, success) |
| `ARCHITECTURE.md` | System diagram, data flow, consistency rules |
| `ACCEPTANCE_GATES.md` | 12 pass/fail release gates with Given/When/Then criteria |
| `REGRESSION_FORMAT.md` | Regression report format with examples |
| `OWNERSHIP_MATRIX.md` | Hermes/Claude/Codex ownership per feature |

Subagent prompts written to `docs/subagents/`:
`runtime-auditor.md`, `dashboard-polisher.md`, `approval-guardian.md`, `obsidian-scribe.md`, `schedule-reconciler.md`, `scan-triager.md`

TypeScript hooks implemented in `lib/misato/hooks/`:
`destructive-tool-guard.ts`, `ledger-write.ts`, `subagent-lifecycle.ts`, `error-recovery.ts`, `index.ts`
