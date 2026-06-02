export type SubagentRole = {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  approvalRequiredFor: string[];
  promptFile?: string;  // path to docs/subagents/*.md for full system prompt
  invokedBy?: string;   // who triggers this subagent
  outputFormat?: string; // what the agent returns
};

// ── Original council agents (unchanged) ────────────────────────────────────

export const councilAgents: SubagentRole[] = [
  {
    id: "watchtower-agent",
    name: "Watchtower Agent",
    role: "uptime monitoring and incident summaries",
    capabilities: ["service health snapshots", "response-time trend summaries", "Uptime Kuma integration planning"],
    approvalRequiredFor: ["public status page changes", "live monitor publication"]
  },
  {
    id: "design-librarian-agent",
    name: "Design Librarian Agent",
    role: "maintains DESIGN.md and UI consistency",
    capabilities: ["design token governance", "component polish tracking", "Claude/Hermes style guardrails"],
    approvalRequiredFor: ["brand-level redesigns"]
  },
  {
    id: "secret-sentinel-agent",
    name: "Secret Sentinel Agent",
    role: "gitleaks scan orchestration and redacted reporting",
    capabilities: ["redacted findings summary", "high-risk file alerts", "remediation checklist generation"],
    approvalRequiredFor: ["file deletions", "secret rotations", "destructive remediation"]
  }
];

// ── Specialist subagents (new — MISATO LIVE blueprint) ──────────────────────
// Full system prompts are in docs/subagents/*.md
// These are read-only auditors and reconcilers — they do not mutate state directly.

export const specialistSubagents: SubagentRole[] = [
  {
    id: "runtime-auditor",
    name: "Runtime Auditor",
    role: "Verify that system behavior matches the run ledger. Cross-references commands, tasks, approvals, agent status, and schedule truth.",
    capabilities: [
      "command-to-task consistency check",
      "approval queue integrity check",
      "agent status freshness check",
      "schedule truth verification",
      "lane sync verification",
      "SSE event ledger completeness check",
      "approval decision propagation check",
      "Obsidian sync currency check"
    ],
    approvalRequiredFor: [],  // read-only — no approval needed
    promptFile: "docs/subagents/runtime-auditor.md",
    invokedBy: "Hermes (scheduled every 15 min) · Owner (manual audit command)",
    outputFormat: "JSON audit report with PASS/FAIL/WARN per check"
  },
  {
    id: "dashboard-polisher",
    name: "Dashboard Polisher",
    role: "Verify every surface shows real state, honest fallback, or clear setup. No fake states. No mock in production.",
    capabilities: [
      "surface-by-surface truth verification",
      "no mystery spinner check",
      "no blank requester name check",
      "no dead tab check",
      "no stale badge implying health check",
      "no mock placeholder in production check",
      "no success message without ledger event check",
      "no hidden approval flow check",
      "no ambiguous error language check"
    ],
    approvalRequiredFor: [],
    promptFile: "docs/subagents/dashboard-polisher.md",
    invokedBy: "Claude (before marking any UI change complete) · Codex (before release)",
    outputFormat: "JSON report with surfaceResults and checks arrays"
  },
  {
    id: "approval-guardian",
    name: "Approval Guardian",
    role: "Ensure the approval gate is transparent, secure, and functioning end to end. Catches gate bypass, incomplete cards, and stale queue.",
    capabilities: [
      "risky command gate integrity check",
      "approval card completeness check",
      "deduplication check",
      "decision propagation check",
      "queue hygiene check",
      "risk language quality check"
    ],
    approvalRequiredFor: [],
    promptFile: "docs/subagents/approval-guardian.md",
    invokedBy: "Hermes (after every L2+ command) · Codex (during testing)",
    outputFormat: "JSON report with checks, queueState, gateIntegrity"
  },
  {
    id: "obsidian-scribe",
    name: "Obsidian Scribe",
    role: "Project runtime truth into the Obsidian vault as a live, accurate mirror. Writes 8 vault files from current state.",
    capabilities: [
      "vault file writing (01-OVERVIEW through 08-LEARNING)",
      "secret redaction before vault writes",
      "sync retry on failure",
      "partial sync with error reporting",
      "sync timestamp management"
    ],
    approvalRequiredFor: ["vault writes outside OBSIDIAN_VAULT_PATH"],
    promptFile: "docs/subagents/obsidian-scribe.md",
    invokedBy: "Hermes (POST /api/misato/obsidian/sync) · Schedule (every 5 min if configured)",
    outputFormat: "JSON sync result: { ok, filesWritten, filesFailed, syncNumber, timestamp, errors }"
  },
  {
    id: "schedule-reconciler",
    name: "Schedule Reconciler",
    role: "Verify Agenda, Day, and Week views show the same data from the same source. Catches view inconsistencies and wrong time formatting.",
    capabilities: [
      "data source verification",
      "cross-view consistency check (Agenda vs Day vs Week)",
      "time accuracy check",
      "unscheduled task count verification",
      "empty state honesty check",
      "tab switching performance check"
    ],
    approvalRequiredFor: [],
    promptFile: "docs/subagents/schedule-reconciler.md",
    invokedBy: "Hermes (after any task with scheduledAt changes) · Codex (during release testing)",
    outputFormat: "JSON consistency report with viewCounts, checks, readyForRelease"
  },
  {
    id: "scan-triager",
    name: "Scan Triager",
    role: "Verify secret scans run correctly, display results honestly, and never leak secret values. Last line of defense against secret exposure in the UI.",
    capabilities: [
      "gitleaks availability check",
      "scan endpoint health check",
      "severity count accuracy check",
      "secret redaction verification (CRITICAL security check)",
      "finding display format check",
      "UI state honesty check per scenario",
      "run ledger entry verification",
      "finding triage with recommended actions"
    ],
    approvalRequiredFor: [],
    promptFile: "docs/subagents/scan-triager.md",
    invokedBy: "Hermes (after POST /api/misato/secrets/scan-summary) · Codex (before release)",
    outputFormat: "JSON scan health report: { gitleaksInstalled, counts, checks, triage, criticalSecurityIssues }"
  }
];

// ── Unified registry ─────────────────────────────────────────────────────────

export const subagentRegistry: SubagentRole[] = [
  ...councilAgents,
  ...specialistSubagents
];

export function getSubagentById(id: string): SubagentRole | undefined {
  return subagentRegistry.find(a => a.id === id);
}

export function getSpecialistSubagents(): SubagentRole[] {
  return specialistSubagents;
}

export function getCouncilAgents(): SubagentRole[] {
  return councilAgents;
}
