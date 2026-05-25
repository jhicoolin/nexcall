# MISATO Hermes Command Pipeline

## Current v1 Pipeline

Owner
-> MISATO.exe
-> MISATO Core
-> Hermes Orchestrator shim
-> MISATO Council / specialist agents
-> Codex QA / Security / Build checks when code is involved
-> GitHub branch / PR / handoff
-> Vercel preview
-> Owner Approval Gate
-> Production only after owner approves

## Role Boundaries

MISATO receives owner commands, maintains desktop state, displays council feedback, queues approvals, shows logs/status, and asks Hermes for execution planning.

Hermes decomposes commands, picks agents, prepares executable plans, sends tasks to agents in mock-safe form, creates handoffs, and proposes GitHub/Vercel actions. Hermes cannot bypass Approval Gate.

Codex audits code, patches bugs, runs lint/build/desktop build, checks secrets, verifies endpoints, and reports vulnerabilities to Hermes/MISATO. Codex cannot merge or deploy without approval.

Claude owns UI polish, design-system execution, and desktop visual refinement. Claude does not touch auth, backend, or security without explicit approval.

## Current Runtime Mode

V1 is mock-safe. The Hermes shim returns plans, risk classifications, and agent paths. It does not execute production deploys, live automations, Discord actions, Obsidian writes, DNS changes, or GitHub merges.
