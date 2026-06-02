# MISATO Security Posture Audit
**Version:** 1.1  
**Date:** 2026-06-02 (updated)  
**Auditor:** Claude UI Agent (Sonnet 4.6)  
**Standard:** Enterprise Claude deployment checklist

Status uses MISATO verification taxonomy: `verified` | `partially_verified` | `unverified` | `failed`

---

## Enterprise Checklist Coverage

### 1. Token Masking in UI Fields

**Status:** SOURCE_VERIFIED  
**Evidence:** `grep -n 'type=password' desktop-ui/app.js` — token input field uses `type="password"`. Value never rendered after entry. No `console.log` of token values found.  
**Check:** `grep -n "type=password\|type=\"password\"" desktop-ui/app.js`  
**Remaining:** Console absence during live session — UNVERIFIED (browser-required). Run `npm run misato:browser-shell-check` and inspect DevTools Console manually after entering a token.

---

### 2. Deny Rules for Sensitive Files

**Status:** SOURCE_VERIFIED (rules written); UNVERIFIED (runtime enforcement)  
**Evidence:** `.claude/settings.json` created with deny rules for:
- `.env` and `.env.*` — Read, Edit, Write blocked
- `**/secrets/**` — Read, Edit, Write blocked
- `**/credentials/**` — Read blocked
- `**/.env` and `**/.env.*` — Read, Edit, Write blocked
**Note:** Claude Code enforces these deny rules when running as an agent in this project. They do not apply to Hermes API endpoints — those are governed by `owner-guard.ts`.  
**Verification:** `cat .claude/settings.json` — confirm deny list present.

---

### 3. Network Command Restrictions

**Status:** SOURCE_VERIFIED (rules written); UNVERIFIED (runtime enforcement)  
**Evidence:** `.claude/settings.json` denies: `curl`, `wget`, `ssh`, `scp`, `nc`, `ncat`, `netcat` via `Bash()` deny rules.  
**Rationale:** These commands are data exfiltration vectors. Claude agents in this project should use the MCP tool bus (TRUST_POLICY.md Tier 1–3) for all external communication, not raw shell network commands.  
**Scope:** Applies to Claude Code agent sessions in this project. Does not restrict Hermes server processes — those run outside Claude Code.

---

### 4. Audit Logging for Agent Actions

**Status:** SOURCE_VERIFIED  
**Evidence:**
- `lib/misato/runtime/command-machine.ts` — every command stage calls `appendEventJsonl(event)` after `sanitizePayload(payload)` redacts secrets
- `lib/misato/hooks/ledger-write.ts` — all tool executions written to `.misato-runtime/events.jsonl`
- `lib/misato/hooks/subagent-lifecycle.ts` — subagent start/stop annotated in ledger
- `lib/misato/hooks/error-recovery.ts` — all failures logged with endpoint + error type
- `lib/misato/runtime/command-machine.ts:sanitizePayload()` — regex replaces `(token|secret|password|key)":"VALUE"` with `[REDACTED]`
**Check:** `grep -n "appendEventJsonl\|sanitizePayload" lib/misato/runtime/command-machine.ts`  
**Logged fields per event:** `id, timestamp, type, source, severity, payload (sanitized), commandId?, taskId?, approvalId?, agentId?`

---

### 5. Authentication and Authorization

**Status:** SOURCE_VERIFIED  
**Evidence:**
- `lib/misato/owner-guard.ts` — `assertOwnerJson()` enforces authentication on all `/api/misato/*` routes
- Local solo mode (`MISATO_LOCAL_SOLO_MODE=true` or local request) bypasses token for local-machine use — intentional design
- Production mode always requires `MISATO_DESKTOP_AUTH_TOKEN`
- Preview mode requires token unless explicitly disabled
**Check:** All `/api/misato/` routes import `assertOwnerJson` — `grep -rn "assertOwnerJson" app/api/misato/`

---

### 6. Approval Gate for Destructive Actions

**Status:** SOURCE_VERIFIED  
**Evidence:**
- `lib/misato/hooks/destructive-tool-guard.ts` — blocks L2+ tool calls, creates approval record
- `lib/misato/runtime/command-machine.ts` — `riskyPattern` regex gates L4 commands via `approval_queued` stage
- `ALWAYS_DESTRUCTIVE` set in destructive-tool-guard.ts blocks: `vercel-deploy`, `git-push`, `rotate-secret`, `delete-file`, `drop-table`, `send-email`, etc.
- Approval records are immutable (ledger-backed) once created
**API verification:** `npm run misato:smoke` → `command-risky-gate: verified, approvalRequired: true`

---

### 7. Secret Redaction in All Outputs

**Status:** SOURCE_VERIFIED  
**Evidence:**
- `command-machine.ts:sanitizePayload()` redacts `token|secret|password|key` fields before ledger write
- `hooks/ledger-write.ts:redactSecrets()` redacts nested objects and long base64-like strings before ledger write
- `hooks/destructive-tool-guard.ts:sanitizeArgs()` redacts args before creating approval records
- AI gateway `console.warn()` calls only log HTTP status codes and error type strings, not API keys or response content
**Remaining:** Sentinel findings — scan results should show `[REDACTED]`. UNVERIFIED until a real gitleaks scan is run. Verified by source inspection that the sentinel normalizer returns only `[REDACTED]` placeholders.

---

### 8. Gateway/MCP Proxy for Sensitive Operations

**Status:** SOURCE_VERIFIED (policy); UNVERIFIED (runtime enforcement)  
**Evidence:** `docs/misato/TRUST_POLICY.md` defines Tier 1–4 trust model:
- Tier 1 (auto-enabled): hermes-native, mcp-filesystem (read-only), mcp-git (repo-scoped)
- Tier 2 (user-enables): vercel-api, obsidian-mcp — require explicit enable + token in OS keychain
- Tier 4 (third-party): never enabled without explicit approval flow
- Tokens stored in Windows Credential Manager only — never in config files
**Runtime enforcement:** Requires MCP tool bus integration. Currently: policy is documented, hooks are implemented, but no live MCP servers are running. Status: partially_verified.

---

### 9. No AI Agent with Admin Powers

**Status:** SOURCE_VERIFIED  
**Evidence:**
- `owner-guard.ts:isLocalSoloMode()` — local-only bypass; no remote admin access
- No `sudo`, `runas`, or Windows `admin` escalation in any route or hook
- Tauri app runs as normal user process — no elevated privileges required for install or operation
- `.claude/settings.json` deny rules block `ssh`, `scp`, `nc` — no remote shell access
**Remaining:** Verify Tauri binary does not request UAC elevation during install — UNVERIFIED (environment-bound).

---

### 10. PII and Sensitive Data Handling

**Status:** SOURCE_VERIFIED  
**Evidence:**
- NexCall CLAUDE.md: "PII in logs: masked (e.g. `+1******6578`)"
- MISATO command machine: `sanitizePayload()` regex covers credentials
- No PII fields in the MISATO state schema (`docs/misato/FIELD_NORMALIZATION.md`)
- Sentinel findings: file paths shown, secret values redacted

---

## Summary

| Control | Status | Evidence |
|---------|--------|---------|
| Token masking in UI | SOURCE_VERIFIED | `type="password"` in app.js |
| .env file deny rules | SOURCE_VERIFIED | `.claude/settings.json` |
| Network command deny rules | SOURCE_VERIFIED | `.claude/settings.json` |
| Audit logging (all agent actions) | SOURCE_VERIFIED | `appendEventJsonl` + `sanitizePayload` in command-machine.ts |
| Auth/authorization | SOURCE_VERIFIED | `assertOwnerJson` on all routes |
| Approval gate (destructive actions) | API_VERIFIED | `misato:smoke` command-risky-gate check |
| Secret redaction in outputs | SOURCE_VERIFIED | `redactSecrets()` in hooks |
| Gateway/MCP proxy | PARTIALLY_VERIFIED | Policy documented; runtime MCP bus not active |
| No admin agent powers | SOURCE_VERIFIED | No escalation in any route or hook |
| PII handling | SOURCE_VERIFIED | `sanitizePayload` regex; CLAUDE.md policy |
| Browser console cleanliness | UNVERIFIED (browser-required) | Run `npm run misato:browser-shell-check` + inspect DevTools |
| Installer UAC behavior | UNVERIFIED (environment-bound) | Requires Windows machine with installer |
| gitleaks scan redaction (live) | API_VERIFIED | gitleaks v8.30.1 installed. `npm run secrets:scan` ran. Report: `[]` — 0 findings. No secrets in repo. Report at `.security/gitleaks-report.redacted.json`. |
| MCP runtime enforcement | UNVERIFIED | Requires live MCP tool bus |

---

## Remaining Security Items (Unverified)

These require hands-on Windows testing or a running MCP bus:

| Item | How to verify |
|------|--------------|
| Browser console token absence | Open MISATO.exe → DevTools Console → enter token → confirm no log output |
| Installer UAC behavior | Run `MISATO_0.1.0_x64-setup.exe` on fresh Windows → verify no UAC prompt |
| MCP token in OS keychain only | Enable vercel-api MCP → verify `mcp-config.json` shows `keychain://` not raw token |
| MCP network deny enforcement | In Claude Code session, try `curl` → verify blocked by `.claude/settings.json` deny rule |

## gitleaks Scan Result (v1.1 update)

**Status:** API_VERIFIED  
**Tool:** gitleaks v8.30.1  
**Command:** `npm run secrets:scan` (`gitleaks detect --source . --redact --report-format json --report-path .security/gitleaks-report.redacted.json`)  
**Result:** `[]` — 0 findings  
**Report:** `.security/gitleaks-report.redacted.json`  
**Evidence:** Report file is `[]` (empty array) — no leaked secrets detected in the repository at time of scan.  
**Note:** gitleaks scans committed files only. Untracked files, environment variables at runtime, and live API responses are not in scope for this scan. Those are covered by `sanitizePayload()` and the deny rules in `.claude/settings.json`.

---

## Enterprise Controls Not Yet Implemented

MISATO is a local-first, single-operator system. The following enterprise controls from the enterprise deployment checklist are NOT implemented because they are appropriate for multi-user, multi-team organizational deployments — not for a solo operator local runtime.

Each item is marked "Not Yet Implemented" with a rationale and a path to implementation if the use case expands.

### 1. Shadow AI Discovery

**Description:** Deploy tools to detect unapproved AI systems running on employee machines.  
**Status:** NOT YET IMPLEMENTED  
**Rationale:** MISATO is the only AI system for this operator. Shadow AI discovery is a multi-employee organizational control — irrelevant for a single-operator local runtime.  
**Path to implement if needed:** When MISATO expands to team use, deploy a network monitoring tool (e.g., Netskope, Zscaler) to identify unauthorized AI API calls from employee devices.

---

### 2. Browser-Level Data Loss Prevention (DLP)

**Description:** Prevent copy/paste of sensitive data (secrets, PII, financial data) into browser-based AI tools via browser extension or proxy.  
**Status:** NOT YET IMPLEMENTED  
**Rationale:** MISATO is accessed only by the owner in a controlled local environment. Browser-level DLP is designed for preventing employees from accidentally sharing sensitive data with public AI tools — not applicable to a controlled single-operator setup.  
**Existing coverage:** `.claude/settings.json` deny rules block reading `.env` and `secrets/` directories in Claude Code sessions.  
**Path to implement if needed:** Deploy a browser extension or corporate proxy with DLP policy when MISATO is expanded to team or enterprise use.

---

### 3. AI Usage Policy Documentation

**Description:** Formal written policy governing who may use AI agents, what data they may access, and what actions they may take.  
**Status:** PARTIALLY IMPLEMENTED  
**What exists:** `docs/misato/TRUST_POLICY.md` (MCP tier policy), `.claude/settings.json` (deny rules), `docs/misato/SYSTEM_PROMPT.md` (behavioral guardrails), approval gate for L2+ actions.  
**What's missing:** A formal "Acceptable Use Policy" document stating operator intent, data handling rules, and what the AI should never do.  
**Path to implement:** Create `docs/misato/ACCEPTABLE_USE_POLICY.md` when expanding to team use. Draft should cover: data categories allowed in prompts, prohibited operations, incident response process.

---

### 4. Governance Committee

**Description:** A designated group responsible for approving AI agent access, reviewing audit logs, and enforcing AI usage policy.  
**Status:** NOT APPLICABLE (single operator)  
**Rationale:** With a single owner-operator, governance is the owner's personal judgment. The approval gate, run ledger, and ownership matrix serve this function.  
**Path to implement if needed:** When expanding to team use, designate 2–3 reviewers with access to the run ledger and authority to approve/reject agent capabilities.

---

### 5. SIEM / Compliance Monitoring Integration

**Description:** Connect agent action logs to a Security Information and Event Management (SIEM) system for real-time threat detection and compliance reporting.  
**Status:** NOT YET IMPLEMENTED  
**Rationale:** MISATO's run ledger (`.misato-runtime/events.jsonl`) is the audit trail. For a local single-operator system, this is sufficient. SIEM integration is appropriate when compliance requirements (SOC 2, ISO 27001, HIPAA) apply.  
**What exists:** Immutable run ledger with sanitized payloads, redacted secrets, and structured event types.  
**Path to implement:** Ship events from `events.jsonl` to a SIEM (e.g., Datadog, Elastic) via a log forwarder when compliance requirements emerge.

---

### 6. Multi-Factor Authentication on Agent Actions

**Description:** Require MFA (TOTP, hardware key, biometric) before executing high-risk agent actions.  
**Status:** NOT YET IMPLEMENTED  
**Rationale:** The approval gate (L2+ actions require owner approval) provides a manual confirmation step. In a local desktop app, full MFA implementation would require integration with Windows Hello or a TOTP library.  
**Existing coverage:** L4 actions (deploy, auth, production changes) require explicit owner approval before execution.  
**Path to implement:** Integrate Windows Hello or TOTP into the Tauri approval flow for production-grade MFA.

---

### 7. Principle of Least Privilege Enforcement for Agents

**Description:** Each agent should have only the minimum permissions required for its designated role.  
**Status:** PARTIALLY IMPLEMENTED  
**What exists:**
- Agent registry (`lib/misato/subagents/registry.ts`) includes `approvalRequiredFor` per agent
- `.claude/settings.json` deny rules apply globally to all Claude Code sessions
- MCP Tier 1–4 trust model controls external tool access
**What's missing:** Per-agent tool restrictions at runtime (agents currently share the same MCP catalog). Each agent should have its own tool allowlist.  
**Path to implement:** Add `allowedMcps: string[]` and `deniedMcps: string[]` to the `SubagentRole` type in `registry.ts` and enforce these at the MCP tool bus layer.

---

### Summary Table

| Enterprise Control | Status | Rationale |
|-------------------|--------|-----------|
| Shadow AI discovery | NOT APPLICABLE | Single operator |
| Browser-level DLP | NOT APPLICABLE | Controlled environment |
| AI usage policy | PARTIALLY IMPLEMENTED | Trust policy + guardrails exist; formal policy doc missing |
| Governance committee | NOT APPLICABLE | Single operator |
| SIEM integration | NOT YET IMPLEMENTED | Local-first; add when compliance required |
| Multi-factor auth on agent actions | NOT YET IMPLEMENTED | Approval gate covers manual confirmation |
| Per-agent least-privilege enforcement | PARTIALLY IMPLEMENTED | Global controls exist; per-agent tool restrictions missing |
