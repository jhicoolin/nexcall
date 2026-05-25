# MISATO Agent Runtime Fork Checklist

## Upstream

- Upstream repo: `https://github.com/nousresearch/hermes-agent`
- Private target repo: `misato-agent`
- Current status: planned only; no fork created in this lane.

## Required Rules

- Preserve upstream license and notices.
- Keep the target repo private.
- Do not commit secrets, `.env` files, tokens, reports with raw findings, or local machine paths containing sensitive data.
- Use branches:
  - `upstream-main` for upstream sync snapshots
  - `misato-main` for private MISATO runtime work

## Integration Shape

- MISATO.exe talks to NexCall/MISATO backend APIs only.
- NexCall/MISATO backend talks to private `misato-agent` runtime through server-side interfaces only.
- Browser and desktop UI never receive runtime secrets.
- Hermes Orchestrator maps MISATO commands into runtime tasks, agent paths, risk decisions, and approval-gated execution.

## Current vs Future

- Current v1: mock-safe Hermes shim inside `lib/misato/hermes`.
- Future v2: private `misato-agent` can provide real assisted planning after owner approval.
- Future controlled execution requires Approval Gate, audit logs, rollback notes, and preview-first GitHub/Vercel flow.

## Approval Needed Before Execution

Owner approval is required before creating/forking the repo, connecting live runtime credentials, enabling automations, or letting a runtime write to GitHub, Vercel, Discord, Obsidian, billing, email, or production services.
