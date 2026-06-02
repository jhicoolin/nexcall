# MISATO Ownership Matrix
**Version:** 1.0  
**Date:** 2026-06-02  
**Governs:** Who owns what across all MISATO features. No ambiguity. No dual ownership without explicit agreement.

---

## Reading This Matrix

- **Hermes** = backend runtime, API routes, state store, SSE stream, approval gate logic, run ledger writes
- **Claude** = UI wiring, interaction design, prompt architecture, subagent prompts, copy, status taxonomy, safety language
- **Codex** = TypeScript implementation, desktop build, test verification, hook integration, performance, refactors
- **Owner** = final approval on all releases, all risky actions, all breaking changes

For each feature row:
- **Source of truth** = who creates and maintains the data
- **UI wiring** = who writes the code that reads and renders it
- **Test verification** = who runs and signs off on functional tests
- **Release gate** = who must sign off before shipping this feature

---

## Feature Ownership Table

| Feature | Source of Truth | UI Wiring | Test Verification | Release Gate |
|---------|----------------|-----------|------------------|--------------|
| **Runtime state (agents, tasks, approvals)** | Hermes | Claude | Codex | Hermes + Codex |
| **SSE event stream** | Hermes | Claude | Codex | Hermes |
| **Run ledger writes** | Hermes | — | Codex | Hermes |
| **Run ledger reads (display)** | Hermes | Claude | Codex | Claude |
| **Command routing + classification** | Hermes (AI Gateway) | Claude (command center) | Codex | Hermes |
| **Approval gate (creation)** | Hermes | Claude (renders card) | Codex | Hermes |
| **Approval gate (decision UI)** | Hermes (persists) | Claude (buttons + flow) | Codex | Claude |
| **Task CRUD** | Hermes | Claude (kanban + modals) | Codex | Hermes |
| **Agent progress fields** | Hermes | Claude (progress bars) | Codex | Hermes |
| **Schedule viewData** | Hermes (/schedule endpoint) | Claude (Day/Week/Agenda) | Codex | Hermes |
| **Lane cards** | Hermes (/lanes endpoint) | Claude (lane renderer) | Codex | Hermes |
| **Watchtower health tiles** | Hermes (/status endpoint) | Claude (tile renderer) | Codex | Claude |
| **Secret scan results** | Hermes (gitleaks runner) | Claude (sentinel screen) | Codex | Hermes |
| **Obsidian vault sync** | Hermes (/obsidian/sync) | Claude (mirror screen) | Codex | Owner |
| **MCP allowlist catalog** | Hermes (mcp-config.json) | Claude (tool catalog screen) | Codex | Owner |
| **Token storage** | Codex (OS keychain) | Claude (password inputs) | Codex | Codex |
| **Status taxonomy** | Claude (this doc) | Claude (all surfaces) | Codex | Claude |
| **System prompt + persona** | Claude (SYSTEM_PROMPT.md) | — | Claude | Claude |
| **Subagent prompts** | Claude (docs/subagents/) | — | Claude | Claude |
| **Hook policies** | Claude (docs/misato/HOOKS.md) | Codex (TypeScript impl) | Codex | Hermes + Codex |
| **Field normalization** | Claude (FIELD_NORMALIZATION.md) | Claude (normalizer fns) | Codex | Claude |
| **UX copy deck** | Claude (UX_COPY_DECK.md) | Claude (all surfaces) | Claude | Claude |
| **Trust policy** | Claude (TRUST_POLICY.md) | Codex (enforcement) | Codex | Owner |
| **Test matrix** | Claude (MISATO_TEST_MATRIX.md) | — | Codex | Codex |
| **Release checklist** | Claude (RELEASE_CHECKLIST.md) | — | Codex | Owner |
| **Acceptance gates** | Claude (ACCEPTANCE_GATES.md) | — | Codex | Owner |
| **Desktop build (Tauri)** | Codex | — | Codex | Codex |
| **Windows installer signing** | Codex | — | Codex | Owner |
| **Tray support + autostart** | Codex | — | Codex | Codex |
| **Error surfacing (fetch fails)** | Hermes (status codes) | Claude (error messages) | Codex | Claude |
| **CORS policy** | Hermes (cors.ts) | — | Codex | Hermes |
| **Auth gate (owner guard)** | Hermes (owner-guard.ts) | Claude (auth state display) | Codex | Hermes |
| **Performance monitoring** | Codex | — | Codex | Codex |
| **Memory + learned preferences** | Hermes (memory store) | Claude (memory UI) | Codex | Owner |
| **Regression audit reports** | Claude (REGRESSION_FORMAT.md) | — | Codex | Claude |

---

## Conflict Resolution

When two owners disagree:

1. **Hermes vs. Claude (data shape)**: Hermes defines the API response shape. Claude adapts the normalizer. Claude may request shape changes via the handoff doc, but cannot break existing consumers.

2. **Claude vs. Codex (implementation)**: Claude defines the behavior (what it should do). Codex implements (how it gets done). If implementation conflicts with spec, Claude is authoritative on UX, Codex is authoritative on runtime constraints.

3. **Any agent vs. Owner**: Owner wins. Always.

---

## Responsibility by Incident Type

| Incident | First responder | Escalation |
|----------|----------------|-----------|
| API returns wrong shape | Hermes | Claude updates normalizer |
| UI shows wrong data | Claude | Hermes if API is wrong |
| Build fails | Codex | Claude/Hermes depending on source |
| SSE drops events | Hermes | Codex checks event bus |
| Approval gate bypassed | Hermes | Owner notified immediately |
| Secret visible in UI | Claude (immediate fix) | Hermes (root cause), Codex (redaction hook) |
| Desktop crash | Codex | Owner + Hermes depending on trigger |
| Run ledger corrupted | Hermes | Codex for file-system recovery |
| Mock data in production | Claude (UI fix) | Hermes if data source wrong |
| Stale badge shows healthy | Claude | Hermes if timestamp field missing |

---

## Handoff Protocol

When work crosses ownership boundaries:

1. **Hermes → Claude**: Update `docs/agent-handoffs/hermes-to-claude.md` with new endpoint shapes, field additions, or behavior changes.
2. **Claude → Hermes**: Update `docs/agent-handoffs/claude-to-hermes.md` with UI requirements, field requests, and endpoint blockers.
3. **Claude → Codex**: Update `docs/agent-handoffs/claude-to-codex.md` with test requirements, implementation specs, and known issues.
4. **Codex → Claude**: Update `docs/agent-handoffs/codex-to-claude.md` with implementation constraints, performance notes, and QA results.

All handoff docs must be updated before marking work complete.
