export type SubagentRole = {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  approvalRequiredFor: string[];
};

export const subagentRegistry: SubagentRole[] = [
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
