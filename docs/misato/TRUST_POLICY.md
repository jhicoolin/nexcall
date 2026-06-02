# MISATO MCP Trust Policy
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Claude UI Agent (language) · Codex (enforcement) · Owner (approval for changes)  
**File:** `lib/misato/mcp-policy.ts` (enforcement) · `.misato/mcp-config.json` (config)

---

## Governing Principle

Default deny. Trust is explicit and inspectable. No tool runs silently.

The goal is not to enable everything. The goal is to make every enabled tool visible, auditable, and revocable.

---

## Trust Tiers

### Tier 1 — Hermes-Curated (Enabled by default, no user action required)

These MCPs are vetted by Hermes and safe for local-first use. Enabled on first launch.

| MCP ID | Name | Transport | Scope | Capabilities | Blocked from |
|--------|------|-----------|-------|-------------|-------------|
| `hermes-native` | Hermes Native Tools | stdio | Same process | Task CRUD, approval decisions, agent routing, ledger writes | External network, file system outside workspace |
| `mcp-filesystem` | Filesystem (read-only) | stdio | Project workspace only | Read files, list directories | Write, delete, chmod, any path outside project root |
| `mcp-git` | Git Operations | stdio | Project repo only | Status, diff, log, branch list | Push, force-push, rebase, tag, remote operations |

**Activation:** Auto-enabled. Owner can disable in Settings → MCP Catalog.  
**Token required:** No.  
**Approval gate:** Required for any write operation (even within Tier 1).

---

### Tier 2 — Official Vendor (Disabled by default, user enables per MCP)

Official MCPs from known vendors. User must explicitly enable. Token stored in OS keychain.

| MCP ID | Vendor | Transport | Purpose | Auth required | Destructive? |
|--------|--------|-----------|---------|--------------|-------------|
| `vercel-api` | Vercel | HTTP + token | Deployment management, preview URLs, env vars | API token | Yes (deploy, env mutations) |
| `claude-web` | Anthropic | HTTP | Web search, fetch | None | No |
| `obsidian-mcp` | Community (official plugin) | HTTP localhost | Vault read/write | Vault path config | Yes (vault writes) |
| `github-api` | GitHub | HTTP + token | PR management, issue tracking, branch ops | PAT token | Yes (push, merge, delete) |

**Activation flow:**
1. Owner goes to Settings → MCP Catalog → Enable [MCP name]
2. UI prompts for token (password input — never shown again)
3. Token stored in Windows Credential Manager under key `misato.mcp.[id]`
4. Config file updated with keychain path (not the token value)
5. MCP server starts on next Hermes restart

**Token handling:**
```
CORRECT: config stores → { "vercel-api": { "token": "keychain://misato.mcp.vercel-api" } }
WRONG:   config stores → { "vercel-api": { "token": "tok_1234abcd..." } }
```

**Destructive action gate:** Even when enabled, destructive tools (deploy, env write, vault write, merge, delete) require approval (L3 or L4). See risk classification in SYSTEM_PROMPT.md.

---

### Tier 3 — In-Repo Local (Disabled by default, requires install + enable)

Custom MCPs shipped inside the MISATO repo. stdio only. User installs the underlying tool, then enables the MCP.

| MCP ID | Location | Tool required | Purpose | Install command |
|--------|----------|--------------|---------|----------------|
| `scan-gitleaks` | `mcp/gitleaks-mcp/` | gitleaks | Secret scanning | `winget install gitleaks` or `scoop install gitleaks` |
| `obs-sync` | `mcp/obsidian-sync/` | Obsidian vault path | Vault projection | Set `OBSIDIAN_VAULT_PATH` env var |

**Activation flow:**
1. Install required tool
2. Settings → MCP Catalog → [MCP name] → Click "Retry detection"
3. MISATO detects the tool is available
4. Owner clicks Enable
5. MCP starts

---

### Tier 4 — Third-Party (Never enabled without explicit approval flow)

Any MCP not in Tiers 1–3. Treated as untrusted until explicitly reviewed.

**Activation flow:**
1. Owner requests to add an MCP (by name or URL)
2. MISATO shows security assessment card:
   - Is it open source? (GitHub link)
   - Is it maintained? (last commit date)
   - What permissions does it request?
   - Community trust signals
3. Owner reads assessment and clicks "I understand the risks. Enable this MCP."
4. MCP is tagged `{ "tier": 4, "third_party": true }` in config
5. Every time a Tier 4 MCP is called, UI shows: `⚠ Using third-party MCP: {name}. Review its permissions in MCP Catalog.`

**Additional requirements for Tier 4:**
- Cannot be enabled in unattended/background mode
- Cannot auto-start on Hermes boot
- Must be re-confirmed every 30 days
- All calls are logged with full arguments in the run ledger

---

## Destructive Tool Gate

These tool categories require approval regardless of which tier they're in:

| Category | Examples | Minimum risk level | Gate |
|----------|----------|-------------------|------|
| Deploy | `vercel-deploy`, `git-push`, `docker-run` | L4 | Always |
| Auth/credentials | `rotate-secret`, `update-env`, `change-password` | L4 | Always |
| Data deletion | `delete-file`, `drop-collection`, `clear-cache`, `rm` | L3 | Always |
| External write | `send-email`, `post-to-slack`, `external-api-write` | L2 | If third-party |
| Config mutation | `update-config`, `modify-settings`, `set-env` | L2 | If production target |
| Vault write | `obsidian-write`, `vault-sync` | L2 | Always |

**Approval gate enforcement:** Implemented in `lib/misato/hooks/destructive-tool-guard.ts`.

---

## Token and Credential Handling

### Storage

All tokens are stored in Windows Credential Manager. Never in:
- Config files (`.misato/mcp-config.json`)
- Environment variables committed to git
- localStorage or sessionStorage
- The run ledger
- Claude context (system prompt or user messages)
- Log output

### Retrieval at runtime

```typescript
// CORRECT — fetch from keychain at call time, discard immediately after
const token = await getFromKeychain('misato.mcp.vercel-api');
const result = await callMcp('vercel-api', { token }, args);
token = null; // discard

// WRONG — caching token in module scope
let cachedToken = await getFromKeychain('misato.mcp.vercel-api'); // never do this
```

### Redaction

Any token or secret that appears in logs, output, or ledger entries must be redacted:

```typescript
function redactSecrets(obj: unknown): unknown {
  const secretPatterns = /\b(token|secret|password|key|api_key|auth|bearer)\b/i;
  const valuePattern = /^.{8,}$/; // looks like a real secret value
  // Replace matching values with [REDACTED]
}
```

---

## Configuration File Format

`.misato/mcp-config.json` — committed to repo, never contains secret values:

```json
{
  "version": 1,
  "updated": "2026-06-02T14:00:00Z",
  "tier1": {
    "hermes-native":    { "enabled": true, "transport": "stdio" },
    "mcp-filesystem":   { "enabled": true, "transport": "stdio", "scope": "project-root" },
    "mcp-git":          { "enabled": true, "transport": "stdio", "scope": "project-repo" }
  },
  "tier2": {
    "vercel-api":       { "enabled": false, "transport": "http", "token": null },
    "claude-web":       { "enabled": false, "transport": "http", "token": null },
    "obsidian-mcp":     { "enabled": false, "transport": "http-localhost", "vaultPath": null }
  },
  "tier3": {
    "scan-gitleaks":    { "enabled": false, "toolInstalled": false },
    "obs-sync":         { "enabled": false, "toolInstalled": false }
  },
  "tier4": [],
  "destructive_approval_required_for": ["L4", "L3"],
  "third_party_reconfirm_days": 30
}
```

When user enables a Tier 2 MCP with a token:
```json
"vercel-api": { "enabled": true, "transport": "http", "token": "keychain://misato.mcp.vercel-api" }
```

The actual token never appears in this file.

---

## Audit Trail

Every MCP call is logged to `.misato-runtime/events.jsonl`:

```json
{
  "id": "evt-xxx",
  "timestamp": "2026-06-02T14:30:00Z",
  "type": "mcp_call.completed",
  "source": "misato.mcp",
  "severity": "info",
  "payload": {
    "mcp": "vercel-api",
    "tool": "deploy-project",
    "tier": 2,
    "arguments": { "project": "nexcall", "ref": "main" },
    "status": "success",
    "durationMs": 8000,
    "approvalId": "apr-123"
  }
}
```

Secrets are redacted before the log entry is written. Arguments with secret-pattern field names have values replaced with `[REDACTED]`.

---

## Release Gate

Before shipping any MISATO release:

- [ ] No Tier 4 MCPs enabled by default
- [ ] No tokens in config files or committed env vars
- [ ] Destructive tool gate enforced for all L2+ operations
- [ ] All MCP calls present in run ledger
- [ ] Token storage uses Windows Credential Manager
- [ ] Disabled MCPs do not appear as available tools in the catalog
- [ ] Third-party MCPs show warning on every use
