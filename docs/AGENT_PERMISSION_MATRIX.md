# Agent Permission Matrix

## Runtime modes
- mock: no side effects
- assisted: plans/patches only
- controlled: PRs with approval
- automated: future only

## New specialist agents
- Watchtower Agent: monitoring summaries only; no public status publication without approval.
- Design Librarian Agent: design governance only; no auth/secret changes.
- Secret Sentinel Agent: redacted findings only; no delete/rotate/remediate actions without approval.

## Active v1 council registry

The canonical code registry is `lib/misato/subagents/registry.ts`.

Agents 001-020:
- 001 MISATO Core
- 002 Strategy Agent
- 003 UI Builder Agent
- 004 Backend Agent
- 005 Security Agent
- 006 QA Agent
- 007 Vercel Deploy Agent
- 008 Business Ops Agent
- 009 Marketing Agent
- 010 Finance Agent
- 011 Research Agent
- 012 Claude UI Agent
- 013 Hermes Architecture Agent
- 014 Obsidian Librarian Agent
- 015 GitHub Handoff Agent
- 016 Watchtower Agent
- 017 Design Librarian Agent
- 018 Secret Sentinel Agent
- 019 Codex Client QA Agent
- 020 Approval Gate Agent

Risky actions are blocked by Approval Gate: production deploys, env changes, DNS, auth changes, database migrations, deleting data, sending emails, social posting, billing, contact exports, real Discord/Obsidian writes, live automations, GitHub merge to main, and Vercel production deploys.
