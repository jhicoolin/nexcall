# MISATO ↔ Hermes Command Pipeline (Local Runtime)

## 1) Intake
- Desktop sends command to local `/command`
- Runtime emits `command_received`
- Command normalized + correlation id attached

## 2) Risk + intent classification
- Parse target domain (runtime, code, deploy, security, docs)
- Classify risk level (L0-L4)
- Emit `risk_detected` when risk > L1

## 3) Agent assignment
- Select agents by capability + permission matrix
- Emit `agent_assigned` events per assignment
- Any blocked action reroutes to approval queue

## 4) Plan generation
- Generate `hermesPlan`, subtasks, feedback
- Emit `plan_generated`

## 5) Approval gate
- L0-L2: continue
- L3-L4: enqueue approval, set `approvalRequired=true`, emit `approval_requested`
- Resolved approvals emit `approval_resolved`

## 6) Logging + module rollup
- Write redacted logs
- Update module summaries: Watchtower, Secret Sentinel, Design Library, Obsidian Mirror, GitHub/Vercel, Lanes
- Emit `log` and `status_change` where applicable

## 7) Return response
- Return canonical command response schema
- Include `moduleStatus` and next recommended actions

## Approval blocked actions
- Production deploy/merge
- DNS and billing changes
- Secret rotation/deletion
- Destructive file/system actions
- Live external automation without explicit owner approval

## Event source names
- `misato.runtime`
- `misato.orchestrator`
- `misato.approvals`
- `misato.watchtower`
- `misato.secrets`
