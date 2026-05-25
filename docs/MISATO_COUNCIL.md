# MISATO Council

## New v1 agents
- Watchtower Agent: uptime monitoring, service status summaries, response-time checks.
- Design Librarian Agent: maintains DESIGN.md and enforces UI consistency.
- Secret Sentinel Agent: manages redacted gitleaks scan summaries and remediation guidance.
- Codex Client QA Agent: reports bugs, failing routes, CORS/fetch issues, build failures, secret leak risks, and unsafe env/documentation issues.
- GitHub Handoff Agent: coordinates branch/PR handoffs without merging to main.
- Approval Gate Agent: blocks risky actions until owner approval.

## Safety constraints
- Never expose raw secrets.
- No destructive file changes without owner approval.
- No live automation execution in v1.
- No production deployment, DNS change, env mutation, GitHub merge to main, Discord bot action, or Obsidian write without owner approval.
