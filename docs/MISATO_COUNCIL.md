# MISATO Council

## New v1 agents
- Watchtower Agent: uptime monitoring, service status summaries, response-time checks.
- Design Librarian Agent: maintains DESIGN.md and enforces UI consistency.
- Secret Sentinel Agent: manages redacted gitleaks scan summaries and remediation guidance.

## Safety constraints
- Never expose raw secrets.
- No destructive file changes without owner approval.
- No live automation execution in v1.
