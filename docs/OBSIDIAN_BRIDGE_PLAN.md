# MISATO Obsidian Bridge (Scaffold Plan)

## Purpose
Provide a safe, optional bridge between MISATO and an Obsidian vault for project notes.

## v1 Scope (no live write automation)
- Define note schema for missions/tasks/approvals.
- Define safe read/write boundaries.
- Keep disabled by default unless owner enables.

## Required env
- `OBSIDIAN_VAULT_PATH=`

## Security
- Never expose private absolute vault paths in frontend.
- No secrets written to notes.
- Approval-gate required for bulk export/write operations.
