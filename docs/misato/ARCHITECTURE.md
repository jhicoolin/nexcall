# MISATO Architecture Plan
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Claude UI Agent (interaction layer) · Hermes (runtime layer) · Codex (implementation)

---

## Core Principle

MISATO is a **single shared runtime truth layer with multiple views**.

Every surface — chat, lanes, approvals, schedule, scans, mirror, watchtower, event feed — is a read-only projection of state that Hermes owns. No surface invents state. No surface holds its own copy of truth.

If a surface cannot read from the real backend, it shows one of five honest states:
`loading` · `stale` · `failed` · `setup_required` · `offline`

It never pretends.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         moe joe (Owner)                              │
│                    MISATO.exe — Windows Desktop                      │
│                         Tauri Shell                                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP + SSE (localhost:3010)
          ┌─────────────────┼──────────────────────┐
          │                 │                       │
          ▼                 ▼                       ▼
   ┌────────────┐    ┌─────────────┐     ┌──────────────────┐
   │ SSE Stream │    │  REST API   │     │  Obsidian Vault  │
   │ (live feed)│    │  (CRUD +    │     │  (mirror write)  │
   │            │    │   command)  │     │                  │
   └─────┬──────┘    └──────┬──────┘     └────────┬─────────┘
         │                  │                      │
         └──────────────────┼──────────────────────┘
                            │
         ┌──────────────────▼──────────────────────┐
         │          HERMES RUNTIME                  │
         │          localhost:3010                  │
         │                                          │
         │  ┌─────────────┐  ┌──────────────────┐  │
         │  │ Command      │  │ Approval Gate    │  │
         │  │ Router       │  │ (L0–L4 classify) │  │
         │  └──────┬───────┘  └────────┬─────────┘  │
         │         │                   │             │
         │  ┌──────▼───────────────────▼──────────┐  │
         │  │         AI Gateway                  │  │
         │  │  OpenRouter / local Ollama / vLLM   │  │
         │  │  Deterministic fallback always ready│  │
         │  └─────────────────────────────────────┘  │
         │                                          │
         │  ┌──────────────┐  ┌────────────────┐   │
         │  │ Task Engine  │  │ Agent Registry │   │
         │  │ (CRUD, dedup │  │ (status,       │   │
         │  │  approval    │  │  progress,     │   │
         │  │  linking)    │  │  lane/branch)  │   │
         │  └──────────────┘  └────────────────┘   │
         │                                          │
         │  ┌──────────────┐  ┌────────────────┐   │
         │  │ Event Bus    │  │ Run Ledger     │   │
         │  │ (pub/sub SSE)│  │ (events.jsonl  │   │
         │  │              │  │  immutable)    │   │
         │  └──────────────┘  └────────────────┘   │
         │                                          │
         │  ┌──────────────┐  ┌────────────────┐   │
         │  │ State Store  │  │ MCP Tool Bus   │   │
         │  │ (state.json  │  │ (Tier 1–4      │   │
         │  │  or memory)  │  │  trust policy) │   │
         │  └──────────────┘  └────────────────┘   │
         └──────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────────┐
         │                  │                       │
         ▼                  ▼                       ▼
  ┌──────────┐    ┌──────────────┐      ┌────────────────┐
  │ MCP:     │    │ MCP:         │      │ Local Model    │
  │ Vercel   │    │ Git (stdio)  │      │ Provider       │
  │ (HTTP+   │    │ Filesystem   │      │ (Ollama/vLLM)  │
  │  token)  │    │ (stdio)      │      │                │
  └──────────┘    └──────────────┘      └────────────────┘
```

---

## Data Ownership

### Single Source of Truth: Hermes State Store

Hermes owns all runtime state. The UI only reads it.

```
state.agents      ← GET /api/misato/agents
  agentId, name, status, progress, branch, lane, lastActivityAt

state.tasks       ← GET /api/misato/tasks
  id, title, status, projectId, assignedAgentId, scheduledAt, linkedApprovalId

state.approvals   ← GET /api/misato/approvals
  id, title, description, riskLevel, status, requestedByAgentName, decisionAt

state.schedule    ← GET /api/misato/schedule
  viewData.agenda[], viewData.day{}, viewData.week{}, unscheduledTasks

state.lanes       ← GET /api/misato/lanes
  items[]: id, name, branch, status, current, next, blockers, ownerAgentName

state.logs        ← GET /api/misato/logs
  id, timestamp, type, source, severity, message, payload

state.runtimeCtx  ← GET /api/misato/status
  runtimeMode, activeModel, approvalsPending, obsidian.{configured,vaultPath,lastSync}

state.watchtower  ← GET /api/misato/watchtower
  services[], monitors[]

state.sentinel    ← GET /api/misato/secrets
  gitleaksInstalled, scanAvailable, critical, high, warnings, findings[]

SSE events        ← GET /api/misato/events/stream
  eventId, type, source, severity, payload, timestamp
```

### Views Are Projections — They Do Not Own State

```
Chat               ← SSE stream events + command responses
Approvals screen   ← state.approvals (filtered, normalized, deduplicated)
Schedule (all tabs)← state.schedule.viewData (Day/Week/Agenda same source)
Kanban             ← state.tasks (grouped by status)
AgentDex           ← state.agents (filtered by status pill)
Lanes              ← state.lanes.items (or agent.branch fallback)
Watchtower tiles   ← live state derived (no hardcoded values)
Live Feed          ← SSE events (filtered by FEED_NOISE_TYPES)
Obsidian Mirror    ← state.runtimeCtx.obsidian + POST /api/misato/obsidian/sync
Sentinel           ← state.sentinel + POST /api/misato/secrets/scan-summary
```

---

## Mutation Flow

All mutations travel: UI → Hermes API → state change → ledger entry → SSE event → UI refresh

```
User action (e.g., clicks Approve)
  ↓
UI sends: POST /api/misato/approvals/action { approvalId, action: 'approve' }
  ↓
Hermes:
  1. Updates approval.status = 'Approved'
  2. Updates linked task.status = 'Doing' (if applicable)
  3. Writes ledger: approval.decided event
  4. Emits SSE: approval_resolved event
  ↓
UI receives SSE event
  ↓
Refresh: state.approvals updated, card moves to Approved tab
  ↓
Toast: "✓ Approval #apr-xxx approved by owner."
```

Optimistic updates (for status/priority cycling) apply locally and are overwritten on next SSE event or refresh. Mutations that fail always show the endpoint URL in the error toast.

---

## Command Pipeline

```
User types command → sends via POST /api/misato/command
  ↓
Hermes: command.received event → classify → plan → approve? → execute → complete
  ↓
Each stage emits SSE event (shown in Live Feed as it happens)
  ↓
If risky (L2+):
  - approval.created SSE event
  - approval card appears in Approvals screen
  - command.blocked event in chat
  - execution halts until owner decides
  ↓
If approved:
  - command.resumed → agents assigned → tasks created → complete
  ↓
If rejected:
  - command.rejected → chat shows reason → task stays blocked
```

---

## SSE Event Flow

```
app/events/stream/route.ts
  ↓ re-exports from
app/events/stream/route.ts (real implementation)
  ↓ streams from
lib/misato/runtime/event-bus.ts (publishEvent / subscribeEvents)
  ↓ events published by
command-machine.ts, service.ts, hooks/*.ts
  ↓ consumed by
desktop-ui/app.js → _sseSource.onmessage
  ↓ filtered by
FEED_NOISE_TYPES Set (heartbeat, stream_connected, context_loaded, ping, pong)
  ↓ rendered in
Live Feed screen + triggers state refreshes
```

**Named events** (sent with `event: heartbeat\n`) → never reach `onmessage` → filtered at transport level

**Data events** (sent with `data: {...}\n\n`) → reach `onmessage` → filtered by FEED_NOISE_TYPES if noisy

---

## Authentication Model

```
Mode              Condition                       Auth required
─────────────────────────────────────────────────────────────────
LOCAL-SOLO        Local machine, MISATO_LOCAL_    None — any local process
                  SOLO_MODE=true or local request may call /api/misato/*

PREVIEW           Vercel/Railway preview          Desktop token OR owner session
                                                  MISATO_REQUIRE_DESKTOP_TOKEN

PRODUCTION        NODE_ENV=production             Desktop token always required
                                                  No bypass
```

Token flow (desktop app):
```
1. User enters token in Settings panel (password input — never shown)
2. Token stored in state.token + localStorage (encrypted at rest via Tauri)
3. Sent as: Authorization: Bearer {token} OR x-misato-desktop-token: {token}
4. Hermes validates via assertOwnerJson() in owner-guard.ts
5. Token never logged, never rendered, never in run ledger
```

---

## MCP Tool Bus

See `docs/misato/TRUST_POLICY.md` for full tier definitions.

```
Tier 1 (auto-enabled):  hermes-native, mcp-filesystem, mcp-git
Tier 2 (user-enables):  vercel-api, claude-web, obsidian-mcp, github-api
Tier 3 (install+enable):scan-gitleaks, obs-sync
Tier 4 (explicit approval): any third-party MCP

All destructive tools (L2+): routed through destructive-tool-guard.ts
All tool results: written to run ledger via ledger-write.ts
```

---

## State Sync Strategy

```
On app startup:
  1. hermesDiscover() — find Hermes at 127.0.0.1:3010
  2. If found: loadAllFromHermes() — parallel fetch of all 9 endpoints
  3. openSSE() — connect to /api/misato/events/stream
  4. On SSE event: update state, re-render affected screen

On every SSE event:
  - command.* events: update chat view
  - task.* events: updateLiveTask(), refresh Kanban
  - approval.* events: updateLiveApproval(), refresh Approvals
  - agent.* events: updateLiveAgent(), refresh AgentDex, Lanes
  - status_change: refresh Watchtower tiles

On connection loss:
  - hermesState = 'not-running'
  - SSE falls back to polling /api/misato/logs every 15 seconds
  - All mutation buttons disabled
  - Last known state shown with stale banner

On reconnect:
  - hermesState = 'connected'
  - Full loadAllFromHermes() clears stale state
  - SSE reopened
  - Stale banners clear
```

---

## Consistency Rules

**Rule 1: Approvals are canonical**
- `approval.status === 'Pending'` → card appears in Pending tab
- `approval.status !== 'Pending'` → card absent from Pending tab
- After approve/reject: optimistic removal + background refresh

**Rule 2: Task status follows approval**
- Task with `linkedApprovalId` + approval still Pending → task stays Blocked
- Approval approved → task moves to Doing (Hermes handles this, UI refreshes)

**Rule 3: Schedule truth has a single source**
- `state.schedule.viewData` exists → ALL THREE TABS use it
- Fallback: `state.tasks[].scheduledAt` → used for all three tabs
- MOCK_SCHEDULE → only when Hermes is completely offline
- Never mix sources between tabs

**Rule 4: Agent status reflects activity**
- `agent.status === 'active'` AND `lastActivityAt` > 10 min ago → show as stale
- `agent.progress` not null → show progress bar
- Agent without progress field → no progress bar (not "0% progress")

**Rule 5: No mock when connected**
- `isHermesConnected() === true` → no mock banners anywhere
- `state.X === null && hermes` → show `hermes-loading` spinner (not mock data)
- `state.X !== null` (even if empty array) → show live empty state

**Rule 6: Ledger is immutable**
- Only `appendEventJsonl()` writes to the ledger
- Nothing reads from the ledger to modify state (read-only projection only)
- If ledger is missing an event, it's gone — no reconstruction

---

## Desktop App (Tauri)

```
Tauri shell wraps the Next.js app running at 127.0.0.1:3010.
The desktop window opens: http://127.0.0.1:3010/misato (or local file if static)

Key Tauri behaviors:
- Single instance enforced (second launch focuses existing window)
- Tray icon on launch
- Close button → minimize to tray (not exit)
- Right-click tray → Quit exits process
- Window state (size/position) persisted across restarts
- Autostart: optional, toggled in Settings
- No PowerShell or terminal dependency at launch

Build:
  npm run desktop:build
  Artifact: src-tauri/target/release/bundle/msi/MISATO-{version}.exe
  Must run with MISATO.exe closed
  Requires Tauri CLI (Rust toolchain)
```

---

## Performance Targets

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|-------------|
| SSE connect | < 500ms | < 2s | > 5s |
| API call latency | < 200ms | < 1s | > 3s |
| UI refresh on SSE event | < 100ms | < 500ms | > 1s |
| Approval decision + sync | < 500ms | < 2s | > 5s |
| Schedule tab switch | < 50ms | < 200ms | > 500ms |
| Dashboard full load | < 1s | < 3s | > 5s |
| SSE stability (24h) | 0 drops | < 1/day | > 1/hour |
| Memory (1h idle) | < 100MB | < 200MB | > 500MB |

---

## Specialist Subagents

Six read-only auditors run against the live system. See `docs/subagents/` for full prompts.

| Subagent | Checks | Triggers |
|----------|--------|---------|
| Runtime Auditor | Ledger vs. state consistency | Every 15 min, on demand |
| Dashboard Polisher | Surface truth verification, 9 audit criteria | Before any release |
| Approval Guardian | Gate integrity, card completeness, decision propagation | After every L2+ command |
| Obsidian Scribe | Vault projection accuracy, sync freshness | Every sync, on demand |
| Schedule Reconciler | Cross-view consistency, time accuracy | After scheduledAt changes |
| Scan Triager | Gitleaks availability, redaction, ledger entry | After every scan |

---

## Hermes Hook Integration Points

Hooks in `lib/misato/hooks/` should be called from these locations in Hermes code:

```typescript
// In command-machine.ts — before any tool call:
import { runDestructiveToolGuard } from '@/lib/misato/hooks';
const guard = await runDestructiveToolGuard({ tool, arguments: args, riskLevel });
if (guard.blocked) return { blocked: true, approvalId: guard.approvalId };

// In command-machine.ts — after any tool call:
import { runLedgerWrite } from '@/lib/misato/hooks';
await runLedgerWrite({ tool, arguments: args, status: 'success', result, durationMs });

// In executeCommand — when routing to subagent:
import { runSubagentStart, runSubagentStop } from '@/lib/misato/hooks';
await runSubagentStart({ agent: 'codex', taskId, taskTitle, intent, commandId });
// ... agent runs ...
await runSubagentStop({ agent: 'codex', taskId, status: 'completed', summary, result });

// In all fetch/API calls that can fail:
import { runErrorRecovery } from '@/lib/misato/hooks';
const recovery = await runErrorRecovery({ operation, endpoint, statusCode, error, attempt });
if (recovery.shouldRetry) { await delay(recovery.retryAfterMs); /* retry */ }
```
