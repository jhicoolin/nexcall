# Hermes ↔ Codex Runtime Contract (MISATO)

**Date:** 2026-05-24  
**Branch target:** `misato-hermes-backend` (or runtime-audit lane for integration testing)  
**Purpose:** Make MISATO act like a private AI operator on owner PC with real-time dashboard visibility, while keeping strict safety/approval boundaries.

---

## 1) System Intent

MISATO should support:
1. **Local execution** on owner PC (scripts, checks, maintenance tasks).
2. **Real-time status updates** to MISATO dashboard.
3. **Split-lane parallel development** without stepping on each other.
4. **Safety-first operation** (no uncontrolled side effects, no secret leakage).

---

## 2) Lane Ownership (Parallel Build Contract)

## Codex lane ("Hands" / Runtime Reliability)
Codex owns:
- Desktop/runtime execution bridge.
- Command runner reliability (timeouts, retries, exit-code handling).
- Client-side persistence hardening (no empty env overwrite).
- Local watcher adapters (safe, scoped, owner-approved).
- Event emitter to MISATO backend endpoints.

Codex must **not** bypass:
- Owner approval gate semantics.
- Secret redaction policy.
- Auth contract for MISATO APIs.

## Hermes lane ("Brain" / Orchestration + Policy)
Hermes owns:
- Command intent routing and task decomposition.
- Approval gate policy engine.
- Risk scoring + action class gating.
- Event/status taxonomy and dashboard contract.
- Security redaction rules and audit log schema.

Hermes must **not** break:
- Runtime reliability constraints from Codex.
- Transport/auth assumptions Codex relies on.

---

## 3) Runtime Modes (Required)

- `mock`: No real side effects; simulated outcomes only.
- `manual`: Real commands allowed only when owner explicitly triggers.
- `scheduled`: Cron/watch tasks allowed for low-risk checks only.
- `assisted`: Proposes actions, requires explicit owner approval for execution.
- `controlled-auto` (future): Auto-run **only** low-risk allowlisted actions.

Default mode: `manual` (or `mock` in unconfigured environments).

---

## 4) Approval Gate Levels

- **L0 (Info):** Read-only status, logs, summaries. Auto-allowed.
- **L1 (Safe local ops):** Build/test/lint/health checks/repo-only scans. Auto-allowed in manual/scheduled.
- **L2 (Mutable local ops):** File edits, git commits, local config writes. Owner approval required unless allowlisted.
- **L3 (External side effects):** Deploys, DNS, prod env edits, webhooks affecting live systems. Owner approval always required.
- **L4 (Sensitive/security critical):** Secret rotation, deleting files, broad scans outside repo, auth policy changes. Owner approval + confirmation required.

---

## 5) API Contract (Backend endpoints MISATO runtime writes to)

These are internal/private MISATO endpoints (owner auth required):

- `POST /api/misato/logs`
  - append runtime event logs (redacted)
- `POST /api/misato/tasks`
  - create/update task execution status
- `POST /api/misato/watchtower/events`
  - publish health/uptime incidents and recoveries
- `POST /api/misato/secrets/events`
  - publish redacted gitleaks summary deltas
- `GET /api/misato/runtime/status`
  - current runtime mode, heartbeat, last action, queue depth

If write endpoints are not ready, Codex can buffer locally and Hermes consumes via polling adapter until API routes are present.

---

## 6) Unified Event Schema (Codex → Hermes/backend)

```json
{
  "eventId": "evt_20260524_001",
  "timestamp": "2026-05-24T00:00:00.000Z",
  "source": "runtime|watcher|desktop|manual",
  "module": "watchtower|secrets|design|council|core",
  "type": "status|task|incident|scan|command",
  "severity": "info|low|medium|high|critical",
  "approvalLevel": "L0|L1|L2|L3|L4",
  "action": "string",
  "status": "queued|running|success|failed|blocked",
  "project": "nexcall",
  "summary": "human-readable summary",
  "details": {
    "safe": true,
    "redacted": true,
    "fields": {}
  },
  "nextRecommendedAction": "string"
}
```

Rules:
- Never include raw secret values.
- Use `[REDACTED]` for sensitive fields.
- Include explicit `approvalLevel` + `status` for dashboard decisions.

---

## 7) Desktop Real-Time UX Contract

Desktop should show:
- Runtime heartbeat (`online/offline/degraded`).
- Last command status + duration.
- Watchtower service health card.
- Secret Sentinel latest scan card (counts only, redacted).
- Approval queue (pending L2/L3/L4 actions).
- Connection state (`Connected`, `Unauthorized`, `404`, `Failed`, `Vercel Protected`).

Update transport:
1. Preferred: event push (SSE/WebSocket/private channel).
2. Fallback: polling every 5–15s.

---

## 8) Security / Redaction Requirements

Hard rules:
- No token values printed to UI/logs/docs.
- No raw gitleaks findings rendered.
- No committing `.security/` reports.
- Backend-only handling of third-party credentials (Uptime Kuma, etc.).
- No auto-remediation of secrets.
- No scans outside repo by default.

---

## 9) Safe Automation Scope (v1)

Allowed now:
- lint/build/test
- repo-only secret scans (redacted)
- health checks/status snapshots
- task/log status updates

Blocked for now:
- production deploy
- DNS changes
- secret rotation/deletion actions
- broad host-wide scans
- autonomous external integrations with side effects

---

## 10) Integration Sequence (Execution order)

1. Codex finalizes runtime reliability spine in worktree.
2. Hermes finalizes policy/risk/event contracts in backend lane.
3. Merge into `misato-hermes-backend` behind flags.
4. Validate with mock mode + manual mode.
5. Enable scheduled low-risk checks.
6. Add approval queue UX for L2+ actions.
7. Pilot controlled-auto for allowlisted L1 actions only.

---

## 11) Definition of Done (for "MISATO like Hermes")

MISATO is considered "operator-functional" when all are true:
- Stable auth between desktop and backend.
- Runtime command execution reliable (success/failure states correct).
- Real-time dashboard updates flowing.
- Approval gate enforced by level.
- Secret redaction proven in logs/UI/API.
- Watchtower + Secret Sentinel modules active in safe mode.

---

## 12) Owner Actions Required

Before real automation:
1. Confirm runtime mode target (`manual` first recommended).
2. Approve allowlist for L1 auto actions.
3. Approve whether scheduled scans are enabled.
4. Approve any move from `manual` to `assisted`/`controlled-auto`.

---

## 13) Non-Goals (this contract)

- No merge to `main`.
- No production deployment.
- No DNS changes.
- No bypassing approval gate.
- No public exposure of MISATO internals.
