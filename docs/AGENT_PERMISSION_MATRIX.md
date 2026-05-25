# Agent Permission Matrix

**Authoritative agent registry and permission tiers for MISATO runtime.**

## Agent Registry (20 agents)

| ID | Name | Role | Status | Risk Tier | Permissions |
|----|------|------|--------|-----------|-------------|
| agent-hermes | Hermes (Orchestrator) | Runtime orchestration, command routing, agent dispatch | active | L1 | `command.create`, `agent.assign`, `task.create`, `event.emit` |
| agent-strategy | Strategy Agent | High-level planning, mission sequencing, objective scoping | active | L1 | `mission.plan`, `objective.scope` |
| agent-backend | Backend Agent | API contracts, data persistence, runtime services | online | L2 | `runtime.read`, `data.write`, `config.update` |
| agent-security | Security Agent | Auth scanning, policy enforcement, risk assessment | online | L2 | `auth.verify`, `risk.assess`, `secret.scan` |
| agent-qa | QA Agent | Validation checklists, test preparation, quality gates | idle | L1 | `test.plan`, `validation.run` |
| agent-vercel | Vercel Deploy Agent | Deployment pipeline, build verification, preview environments | online | L1 | `deploy.preview`, `build.verify` |
| agent-business | Business Ops Agent | Supplier outreach, business workflows, operational tasks | idle | L1 | `ops.read`, `ops.task` |
| agent-marketing | Marketing Agent | Campaign planning, content scheduling | idle | L1 | `marketing.read`, `content.draft` |
| agent-finance | Finance Agent | Budget tracking, financial analysis | idle | L1 | `finance.read`, `report.view` |
| agent-research | Research Agent | Domain research, exploration, experiments | online | L0 | `research.read`, `explore.execute` |
| agent-claude-ui | Claude UI Agent | UI polish, layout styling, frontend components | idle | L1 | `ui.read`, `ui.update` |
| agent-hermes-arch | Hermes Architecture Agent | Architecture decisions, system design | online | L1 | `arch.read`, `arch.design` |
| agent-watchtower | Watchtower Agent | Runtime health monitoring, uptime checks | standby | L0 | `monitor.read`, `health.check` |
| agent-secret-sentinel | Secret Sentinel Agent | Secret scanning, credential leak detection | standby | L2 | `secret.scan`, `secret.alert` |
| agent-design-librarian | Design Librarian Agent | Design system management, component library | standby | L1 | `design.read`, `design.catalog` |
| agent-obsidian-mirror | Obsidian Mirror Agent | Knowledge base sync, note management | standby | L1 | `knowledge.read`, `knowledge.sync` |
| agent-codex-reliability | Codex Reliability Lane | Backend reliability, security hardening, endpoint proof | active | L2 | `backend.read`, `backend.write`, `security.harden` |
| agent-council-coord | Council Coordinator Agent | Cross-agent communication, meeting orchestration | standby | L1 | `council.manage`, `handoff.write` |
| agent-data-steward | Data Steward Agent | Data integrity, migration, backup oversight | standby | L2 | `data.read`, `data.migrate` |
| agent-deploy-pilot | Deploy Pilot Agent | Production deploy coordination, rollout sequencing | standby | L4 | `deploy.plan`, `deploy.execute` (requires approval) |

## Approval Policy Tiers (L0–L4)

### L0 — Read-Only / Exploration
- **Action:** Read status, view agents, list tasks, explore research
- **Approval:** Never required
- **Examples:** `hi bb`, `What needs attention today?`, research queries

### L1 — Standard Operations
- **Action:** Create tasks, assign agents, update priorities, run mock commands
- **Approval:** Never required
- **Examples:** `Assign Codex to verify the desktop build`, `Ask Claude to polish AgentDex`

### L2 — Configuration / Data Changes
- **Action:** Update env config, modify agent permissions, write data
- **Approval:** Required for sensitive config changes
- **Examples:** Modify agent permissions, change runtime config, import/export data

### L3 — Environment Changes
- **Action:** Modify runtime state, update deployment config, connect services
- **Approval:** Required — creates approval record, blocks execution until resolved
- **Examples:** Change Vercel env vars, connect Discord bridge, modify rate limits

### L4 — Production / Destructive
- **Action:** Deploy to production, modify auth, delete data, execute live automations
- **Approval:** **Always required.** Creates `Pending` approval with `doesNotAutoExecuteProduction: true`. NO action taken until explicit owner approval.
- **Examples:** `deploy to production now`, "delete all tasks", "modify auth tokens"

## Queue Policy

If a requested action exceeds the requesting agent's permission level:
1. Create an approval item with risk detail
2. Mark the originating task as `Blocked`
3. Emit `approval_requested` event
4. Do NOT execute or queue the action
5. When resolution arrives (`approval.approved` / `rejected` / `deferred`):
   - **Approved:** Action may proceed
   - **Rejected:** Task cancelled
   - **Deferred:** Task stays Blocked
