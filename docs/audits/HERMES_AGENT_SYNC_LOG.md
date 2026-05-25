# Hermes Agent Sync Log

**Date:** 2026-05-25
**Runtime Base URL:** `http://127.0.0.1:3010`
**Branch:** `misato-claude-ui`
**Commit:** `a3319d0`

## Current Agent State (Live Store)

| agentId | Name | Status | Risk Tier | Current Task | Last Activity |
|---------|------|--------|-----------|-------------|---------------|
| agent-strategy | Strategy Agent | active | L1 | — | — |
| agent-ui | UI Builder Agent | online | L1 | — | — |
| agent-backend | Backend Agent | online | L2 | Stabilize MISATO (SSE auth) | Recent |
| agent-security | Security Agent | online | L2 | — | — |
| agent-qa | QA Agent | active | L1 | — | — |
| agent-vercel | Vercel Deploy Agent | online | L1 | — | — |
| agent-business | Business Ops Agent | idle | L1 | — | — |
| agent-marketing | Marketing Agent | idle | L1 | — | — |
| agent-finance | Finance Agent | idle | L1 | — | — |
| agent-research | Research Agent | online | L0 | — | — |
| agent-claude-ui | Claude UI Agent | idle | L1 | — | — |
| agent-hermes-arch | Hermes Architecture Agent | online | L1 | — | — |

**Total in store:** 12 agents (8 active/online, 4 idle)

## 20-Agent Registry (Documented in AGENT_PERMISSION_MATRIX.md)

| # | agentId | Name | In Store? | Dispatchable? |
|---|---------|------|-----------|---------------|
| 1 | agent-hermes | Hermes (Orchestrator) | ❌ (runtime role) | N/A — dispatcher |
| 2 | agent-strategy | Strategy Agent | ✅ YES | ✅ YES |
| 3 | agent-backend | Backend Agent | ✅ YES | ✅ YES |
| 4 | agent-security | Security Agent | ✅ YES | ✅ YES |
| 5 | agent-qa | QA Agent | ✅ YES | ✅ YES |
| 6 | agent-vercel | Vercel Deploy Agent | ✅ YES | ✅ YES |
| 7 | agent-business | Business Ops Agent | ✅ YES | ✅ YES |
| 8 | agent-marketing | Marketing Agent | ✅ YES | ✅ YES |
| 9 | agent-finance | Finance Agent | ✅ YES | ✅ YES |
| 10 | agent-research | Research Agent | ✅ YES | ✅ YES |
| 11 | agent-claude-ui | Claude UI Agent | ✅ YES | ✅ YES |
| 12 | agent-hermes-arch | Hermes Architecture Agent | ✅ YES | ✅ YES |
| 13 | agent-watchtower | Watchtower Agent | ❌ (standby status) | Requires add-to-store |
| 14 | agent-secret-sentinel | Secret Sentinel Agent | ❌ (standby status) | Requires add-to-store |
| 15 | agent-design-librarian | Design Librarian Agent | ❌ (standby status) | Requires add-to-store |
| 16 | agent-obsidian-mirror | Obsidian Mirror Agent | ❌ (standby status) | Requires add-to-store |
| 17 | agent-codex-reliability | Codex Reliability Lane | ✅ (as lane-hermes/codex/claude) | Task dispatch via assign |
| 18 | agent-council-coord | Council Coordinator Agent | ❌ (standby status) | Requires add-to-store |
| 19 | agent-data-steward | Data Steward Agent | ❌ (standby status) | Requires add-to-store |
| 20 | agent-deploy-pilot | Deploy Pilot Agent | ❌ (standby status) | Requires add-to-store |

## Command → Agent Dispatch History

| Command | Intent | Agents Selected | Result | Timestamp |
|---------|--------|----------------|--------|-----------|
| hi | greeting | (none) | Completed | Recent |
| What needs attention today? | daily_summary | strategy, hermes-arch | Completed | Recent (×2, deduped) |
| Assign Codex to verify desktop build | assign_agent | backend | Completed | Recent |
| Ask Claude to polish AgentDex | unknown → research | research | Completed | Recent |
| deploy to production now | deploy | vercel, security, hermes-arch | Blocked by approval | Recent (×4) |

## Mission → Agent Dispatch History

| Mission | Agent | taskId | Created | Handoff Note |
|---------|-------|--------|---------|-------------|
| Stabilize MISATO runtime for production | agent-claude-ui | task-449517ed-... | Recent | Wire UI controls to working APIs |
| Stabilize MISATO runtime for production | agent-backend | task-bf1e21f2-... | Recent | Fix CRITICAL: SSE auth + filesystem crash |

## Agent Assign History (POST /api/misato/agents/assign)

| agentId | taskId | Result | Timestamp |
|---------|--------|--------|-----------|
| agent-strategy | rt-1779726280754 (deploy cmd) | ✅ Assigned | Recent |
| agent-strategy | t1 (Draft dentist campaign) | ✅ Assigned | Recent |

## Agent Sync Status

| Check | Status | Detail |
|-------|--------|--------|
| Agent store non-empty | ✅ PASS | 12 agents loaded from seed data |
| All agents have agentId | ✅ PASS | All use `agent-X` naming |
| All agents have status | ✅ PASS | active / online / idle |
| All agents have riskTier | ✅ PASS | L0–L4 mapped from permissionLevel |
| Dispatch by agentId works | ✅ PASS | Verified for agent-backend, agent-claude-ui, agent-strategy |
| AssignAgent with auto-create task | ✅ PASS | `{agentId, title}` creates task and assigns |
| AssignAgent with existing taskId | ✅ PASS | `{agentId, taskId}` links to existing |
| Unknown agentId returns error | ✅ PASS | `{ ok: false, error: "agent_not_found" }` (404) |
| Agent status updates on assign | ✅ PASS | Status → "active", currentTask set |
| Agents visible in GET /api/misato/agents | ✅ PASS | 12 agents returned |
| Agents visible in GET /api/misato/council | ✅ PASS | Council roster |
| Agent selected by command intent | ✅ PASS | greet:none, daily:strategy+hermes-arch, deploy:vercel+security+hermes-arch |

## Known Gaps

| Gap | Impact | Resolution |
|-----|--------|------------|
| 8 of 20 documented agents not yet in store | Standby agents can't be dispatched yet | Codex: add to cold-start/default store |
| Standby agents have no riskTier entries | N/A until added to store | Requires seed data update in store.ts |
| Agent "status" field has no enum validation | Any string accepted | Low priority — cosmetic |
| No heartbeat/health check per agent | No automatic "lastSeen" tracking | Future enhancement |
| No agent-to-agent handoff | Each dispatch creates independent task | HandoffNote field available for manual use |