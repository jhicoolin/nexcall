# MISATO Verification Glossary
**Version:** 1.0  
**Date:** 2026-06-02  
**Authority:** Claude UI Agent — governs verification language across all MISATO docs, scripts, and agent outputs

Every MISATO document, script, subagent, and handoff memo must use these definitions precisely.  
No paraphrasing. No new synonyms. If a situation doesn't fit, add a new term here first.

---

## Core Result Values

### `loaded`

**Precise definition:**  
A browser shell or desktop application opened at the target URL without an HTTP error (≥ 200, < 400). The DOM rendered and the page has a non-empty title and body. No assertions were made about the runtime contract, API responses, or window globals.

**What it proves:**  
The Tauri shell or browser opened. The static files were served.

**What it does NOT prove:**  
- That `window.__MISATO_RUNTIME_ORIGIN__` is set correctly
- That Hermes endpoints are reachable
- That the UI is reading from live data
- That no console errors occurred (unless explicitly checked and noted)

**Use it when:**  
The shell-load check (`npm run misato:browser-shell-check`) completes without HTTP failure.

**Do NOT use it when:**  
- You have checked API endpoints — use `verified` or `partially_verified` instead
- You have observed the running UI behavior — use `verified`

**Example:**
```
Check: shell-load
Result: loaded
Evidence: { url: "http://127.0.0.1:1420", httpStatus: 200, title: "MISATO", bodyHasText: true }
Notes: Shell responded with HTTP 200. DOM rendered. runtime-origin contract not checked in this pass.
```

---

### `verified`

**Precise definition:**  
An explicit assertion was made against observable evidence, and the assertion held. The assertion must be stated in the `evidence` field. The assertion must be specific — "it worked" is not evidence.

**What it proves:**  
The specific assertion in the `evidence` field holds at the moment the check ran.

**What it does NOT prove:**  
- That the assertion will hold after the next deployment or state change
- That related assertions also hold (those need their own checks)
- That the behavior will hold under different inputs or conditions

**Use it when:**  
- An HTTP endpoint returned the expected fields (evidence: endpoint + HTTP status + field names)
- A source file contains the expected pattern (evidence: file path + matching string)
- A browser global has the expected value (evidence: `window.__X__ === "expected"`)
- A behavior was directly observed with recorded evidence

**Do NOT use it when:**  
- You're asserting source code but haven't run the runtime — use `SOURCE_VERIFIED`
- You're asserting an HTTP endpoint but haven't run the endpoint — use `unverified`
- A check partially passed — use `partially_verified`

**Example:**
```
Check: endpoint-status
Result: verified
Evidence: { url: "http://127.0.0.1:3010/api/misato/status", httpStatus: 200, fields: ["runtimeMode", "capabilities"] }
Notes: /api/misato/status returned HTTP 200 with all required fields. Contract confirmed.
```

---

### `SOURCE_VERIFIED`

**Precise definition:**  
A code pattern, configuration entry, or text string was confirmed by reading the source file. The runtime behavior that the pattern implies was NOT observed in a live session.

**What it proves:**  
The code as written would exhibit the claimed behavior if executed correctly. The developer intent is clear from the source.

**What it does NOT prove:**  
- That the code path is actually executed at runtime
- That the behavior has been observed in a real browser or live Hermes session
- That there are no other code paths that override or contradict this behavior

**Use it when:**  
- Confirming that `sanitizePayload()` redacts secrets — source confirms the regex is there
- Confirming that `assertOwnerJson()` is called on every route — source grep confirms it
- Confirming that a deny rule is in `.claude/settings.json` — source confirms the entry

**Notation in docs:** Written as `SOURCE_VERIFIED` (uppercase, no spaces). In script JSON output, use `result: "verified"` with a note explicitly stating "Source text confirms this pattern. NOT a runtime observation."

**Example:**
```
Check: sse-no-context-loaded
Result: SOURCE_VERIFIED
Evidence: app/events/stream/route.ts does not contain 'type: "context_loaded"'
Notes: Source text confirms no synthetic context_loaded event. NOT a runtime observation — behavior not observed in a live browser session.
```

---

### `API_VERIFIED`

**Precise definition:**  
An HTTP request was sent to a live endpoint and the response matched the expected contract (status code, content type, required fields). The request and response are the evidence.

**What it proves:**  
The endpoint exists, is reachable, and returns the expected shape at the moment the check ran.

**What it does NOT prove:**  
- That the UI actually renders the data from this endpoint correctly
- That the endpoint behaves correctly under all inputs
- That the browser can reach this endpoint (may differ from server-side due to CORS)

**Notation in docs:** Written as `API_VERIFIED` (uppercase). In script JSON output, use `result: "verified"` with evidence including the URL, HTTP status, and fields checked.

**Example:**
```
Check: command-risky-gate
Result: API_VERIFIED
Evidence: POST /api/misato/command { command: "Deploy to production now" } → HTTP 200, approvalRequired: true, riskLevel: "L4"
Notes: Risky command correctly gated. approvalRequired: true confirmed.
```

---

### `partially_verified`

**Precise definition:**  
A check ran and some sub-assertions passed with evidence, but at least one required sub-assertion either: (a) did not hold, (b) could not be run due to missing data, or (c) produced inconclusive evidence. The partial evidence is recorded. This is NOT a failure — it is an honest statement that the check is incomplete.

**What it proves:**  
The parts of the assertion that produced evidence were confirmed. The remaining parts are explicitly unresolved.

**Use it when:**  
- 3 of 4 required fields are present on an approval card
- An agent status is "active" but `lastActivityAt` is absent (cannot confirm freshness)
- Some but not all schedule views show the same task count

**Do NOT use it when:**  
- All assertions passed — use `verified`
- The check could not run at all — use `unverified`
- A critical assertion failed — use `failed`

**Example:**
```
Check: agent-status-freshness
Result: partially_verified
Evidence: 10 of 12 agents have lastActivityAt. 2 agents missing the field.
Notes: Cannot confirm activity freshness for 2 agents. Hermes should add lastActivityAt to all agent records.
```

---

### `unverified`

**Precise definition:**  
The check was NOT run in this pass. This is not a failure. The check may have been skipped because:
- The required environment was not available (no browser, no Tauri, no gitleaks)
- The required data was not present (no scan results, no scheduled tasks)
- The check requires manual observation that cannot be automated here

Every `unverified` entry MUST include a `notes` field explaining why and what command or action to run to verify it.

**What it proves:**  
Nothing about the behavior. Only that we honestly did not check.

**Use it when:**  
- Browser-layer checks requiring Playwright + MISATO.exe in an environment where they're not available
- Live scan checks requiring gitleaks installed
- Obsidian sync checks requiring a configured vault
- Windows-specific installer behaviors

**Do NOT use it when:**  
- A check ran and assertion failed — use `failed`
- A check ran but only some assertions passed — use `partially_verified`
- A check is blocked by something fixable right now — fix it, then run the check

**Example:**
```
Check: runtime-origin-contract
Result: unverified
Evidence: null
Notes: window.__MISATO_RUNTIME_ORIGIN__ not checked — Tauri shell not running in this environment.
       To verify: npm run misato:browser-contract-check (requires MISATO.exe + Hermes + Playwright)
```

---

### `failed`

**Precise definition:**  
The check ran explicitly and the assertion did not hold. The failure must be documented with evidence of what was observed vs. what was expected. A `failed` result is actionable: it requires a fix before release.

**What it proves:**  
The assertion definitively did not hold at the moment the check ran. This is not a transient issue or an environment problem — it's a state mismatch.

**Use it when:**  
- An endpoint returned HTTP 4xx or 5xx when 200 was expected
- A required field was absent from an API response
- A source file contains a pattern it should not contain (stale hardcoded value)
- A browser rendered incorrect data (mock shown when Hermes connected)

**Do NOT use it when:**  
- The check couldn't run — use `unverified`
- The check partially passed — use `partially_verified`
- A security-specific assertion about secret exposure failed — use `security_failed`

**Example:**
```
Check: no-stale-cors-tile
Result: failed
Evidence: desktop-ui/app.js contains "{ name:'CORS Headers'" at line 943
Notes: Watchtower contains hardcoded CORS tile. Must be removed before release.
```

---

### `security_failed`

**Precise definition:**  
A security-specific assertion about secret or credential exposure failed. Specifically: a field that should contain only `[REDACTED]` contains what appears to be a real secret value. This result is the highest priority — it requires immediate action, not just a fix before release.

**Use it exclusively for:**  
Secret, token, password, credential, or API key values that are visible in UI output, logs, run ledger entries, or scan findings where only `[REDACTED]` should appear.

**What it requires:**  
- Immediate notification to the owner
- Secret rotation (the exposed value should be considered compromised)
- A fix before ANY further use of the system

**Do NOT use it for:**  
General failures, non-secret data errors, or partial checks. Only for active secret exposure.

---

## Compound Labels (Used in Documentation)

### `UNVERIFIED (browser-required)`

Used in test matrix `Status` columns to indicate a check that requires a live browser session (Playwright + MISATO.exe or Chrome DevTools). Not a code failure — an environment constraint.

**Canonical format:** `UNVERIFIED (browser-required)` — exact casing, parentheses, no variations.

### `UNVERIFIED (environment-bound)`

Used for checks that require specific physical hardware or OS installation (Windows machine, gitleaks installed, Obsidian vault configured). Cannot be resolved by code changes alone.

**Canonical format:** `UNVERIFIED (environment-bound)` — exact casing.

---

## Anti-Patterns

These are specifically prohibited:

| Prohibited | Reason | Use instead |
|-----------|--------|-------------|
| `PASS` (bare) | Implies verification without stating method | `SOURCE_VERIFIED`, `API_VERIFIED`, or `verified` with evidence |
| `FAIL` (bare) | Implies failure without stating what failed | `failed` with evidence field |
| `WARN` | Ambiguous — could mean degraded, stale, or partially failing | `partially_verified` or note the specific concern |
| `PASS (assumed)` | Assumption is not evidence | `unverified` with note to verify |
| `Verified ✓` | Unclear which method was used | `SOURCE_VERIFIED` or `API_VERIFIED` |
| `Tested` | Does not say what was tested or what passed | `verified` with evidence |
| `Working` | A state claim without evidence | `verified` with evidence, or `loaded` if only the shell was observed |
| `N/A` | Too vague — use only for tests that genuinely cannot apply | Only when the test's precondition is permanently absent for this configuration |

---

## Quick Reference

| State | Runtime run? | Assertion tested? | Assertion passed? | Use |
|-------|-------------|------------------|-------------------|-----|
| `loaded` | Yes (shell only) | No | N/A | Shell opened, no contract check |
| `SOURCE_VERIFIED` | No | Yes (source text) | Yes | Source confirmed, no runtime observation |
| `API_VERIFIED` | Yes (HTTP) | Yes (endpoint shape) | Yes | Endpoint contract confirmed |
| `verified` | Yes | Yes | Yes | Full runtime assertion with evidence |
| `partially_verified` | Yes | Yes | Partial | Some assertions held, some missing/unresolvable |
| `unverified` | No | No | N/A | Environment not available; how-to included |
| `failed` | Yes | Yes | No | Assertion explicitly did not hold |
| `security_failed` | Yes | Yes | No | Secret exposed where [REDACTED] expected |
