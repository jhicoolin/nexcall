# Hermes Mission Dispatch Matrix

**Date:** 2026-05-25
**Runtime Base URL:** `http://127.0.0.1:3010`
**Branch:** `misato-claude-ui`
**Commit:** `a3319d0`

## Missions Endpoints

| Method | Path | Purpose | Status | Verified |
|--------|------|---------|--------|----------|
| GET | `/api/misato/missions` | List all missions (newest first) | ✅ LIVE | 1 mission, 2 tasks |
| POST | `/api/misato/missions/create` | Create a new mission record | ✅ LIVE | 200, auto-generates msn- ID |
| POST | `/api/misato/missions/dispatch` | Dispatch subagent to mission (creates task + assigns agent) | ✅ LIVE | 200, auto-creates task |

## Mission Schema

```typescript
type Mission = {
  id: string;                 // msn-<uuid>
  title: string;
  description: string;
  project: string;
  priority: string;           // "High" | "Medium" | "Low"
  status: string;             // "Pending" | "Doing" | "Done" | "Blocked"
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  taskIds: string[];          // linked task IDs
  createdBy: string;          // "MISATO Hermes" | agent name
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
  completedAt: string | null;
  handoffNote: string | null;
};
```

## Dispatch Flow

```
POST /api/misato/missions/dispatch
├── agentId: string (required)       → finds agent in store
├── missionId: string (optional)     → links to existing mission
├── taskTitle: string (required)     → creates task
├── project: string (optional)       → defaults to mission project
├── priority: string (optional)      → defaults to "Medium"
└── handoffNote: string (optional)   → attached to mission
    │
    ├── Agent found? → YES
    │   ├── Mission found? → YES → link agent to mission, update handoff
    │   └── Mission found? → NO  → skip mission linking
    │   ├── Task created via createTask()
    │   ├── Agent assigned to task via assignAgent()
    │   ├── Task ID added to mission.taskIds[] (if mission exists)
    │   └── Response: { ok, agent, taskId, missionId, handoffNote }
    │
    └── Agent found? → NO
        └── Response: { ok: false, error: "agent_not_found" }
```

## Verified Missions

| Mission | Agent Dispatched | Tasks Created | State |
|---------|-----------------|---------------|-------|
| Stabilize MISATO runtime for production | Backend Agent | 2 (SSE auth fix + filesystem crash fix) | Doing |

## Event Types Emitted by Missions

| Event | Source | When |
|-------|--------|------|
| `mission_created` | `misato.agents` | Mission record created |
| `mission_updated` | `misato.agents` | Agent or handoffNote changed |
| `agent.assigned` | `misato.agents` | Agent linked to task |
| `task.created` | `misato.tasks` | New task for dispatched agent |
| `task.updated` | `misato.tasks` | Task status/priority changed |

## Councils Subagent Dispatch (by agentId)

| agentId | Name | Dispatchable? | Route |
|---------|------|---------------|-------|
| agent-strategy | Strategy Agent | ✅ YES | `POST /api/misato/agents/assign { agentId, title }` |
| agent-ui | UI Builder Agent | ✅ YES | Same |
| agent-backend | Backend Agent | ✅ YES | Same |
| agent-security | Security Agent | ✅ YES | Same |
| agent-qa | QA Agent | ✅ YES | Same |
| agent-vercel | Vercel Deploy Agent | ✅ YES | Same |
| agent-business | Business Ops Agent | ✅ YES | Same |
| agent-marketing | Marketing Agent | ✅ YES | Same |
| agent-finance | Finance Agent | ✅ YES | Same |
| agent-research | Research Agent | ✅ YES | Same |
| agent-claude-ui | Claude UI Agent | ✅ YES | Same |
| agent-hermes-arch | Hermes Architecture Agent | ✅ YES | Same |

## Dispatch by Intent (Command State Machine)

| Intent | Agents Selected | Risk Level |
|--------|----------------|------------|
| `greeting` | none (skipped) | L0 |
| `daily_summary` | strategy, hermes-arch | L0 |
| `assign_agent` | matched agent (e.g. backend for "Codex") | L1 |
| `query` | research | L0 |
| `config_change` | backend, security | L2 |
| `deploy` | vercel, security, hermes-arch | L4 |
| `unknown` | research | L0 |

## Edge Cases

| Case | Behavior | Status |
|------|----------|--------|
| Dispatch to unknown agentId | `{ ok: false, error: "agent_not_found" }` (404) | ✅ VERIFIED |
| Create mission without title | `"Untitled mission"` fallback | ✅ VERIFIED |
| Dispatch without missionId | Creates task but no mission link | ✅ VERIFIED |
| Dispatch with missionId (not found) | Creates task, skips mission link | ✅ VERIFIED |
| Multiple dispatches to same mission | Each creates separate task, pushes taskIds | ✅ VERIFIED |
| Agent already busy with task | `assignAgent` updates `currentTaskId`, `status="active"` | ✅ VERIFIED |
