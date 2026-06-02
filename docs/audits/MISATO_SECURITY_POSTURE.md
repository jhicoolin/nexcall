# MISATO Security Posture Audit
**Version:** 1.0  
**Date:** 2026-06-02  
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
| gitleaks scan redaction (live) | UNVERIFIED (environment-bound) | Requires gitleaks installed + scan run |
| MCP runtime enforcement | UNVERIFIED | Requires live MCP tool bus |

---

## Remaining Security Items (Unverified)

These require hands-on Windows testing or a running MCP bus:

| Item | How to verify |
|------|--------------|
| Browser console token absence | Open MISATO.exe → DevTools Console → enter token → confirm no log output |
| Installer UAC behavior | Run `MISATO_0.1.0_x64-setup.exe` on fresh Windows → verify no UAC prompt |
| Sentinel redaction (live scan) | Install gitleaks → run Sentinel scan → verify `[REDACTED]` in all findings |
| MCP token in OS keychain only | Enable vercel-api MCP → verify `mcp-config.json` shows `keychain://` not raw token |
| MCP network deny enforcement | In Claude Code session, try `curl` → verify blocked by `.claude/settings.json` deny rule |
