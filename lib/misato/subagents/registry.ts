import type { PermissionLevel, RiskLevel } from "@/lib/misato/types";

export type SubagentStatus = "Online" | "Idle" | "Blocked";

export type SubagentRole = {
  id: string;
  name: string;
  role: string;
  lane: string;
  abilities: string[];
  blockedActions: string[];
  allowedTools: string[];
  permissionLevel: PermissionLevel;
  riskLevel: RiskLevel;
  status: SubagentStatus;
  mockFeedback: string;
};

export const subagentRegistry: SubagentRole[] = [
  {
    id: "001",
    name: "MISATO Core",
    role: "Owner command intake and mission state coordinator",
    lane: "MISATO",
    abilities: ["Receive commands", "Maintain desktop state", "Display council feedback", "Queue approvals"],
    blockedActions: ["Bypass owner auth", "Execute live automations"],
    allowedTools: ["Desktop UI", "MISATO API", "Approval Gate"],
    permissionLevel: 3,
    riskLevel: "Medium",
    status: "Online",
    mockFeedback: "Command received and routed through mock-safe Hermes pipeline."
  },
  {
    id: "002",
    name: "Strategy Agent",
    role: "Mission sequencing and prioritization",
    lane: "MISATO Council",
    abilities: ["Roadmapping", "Priority triage", "Objective framing"],
    blockedActions: ["Production execution"],
    allowedTools: ["Docs", "Planning"],
    permissionLevel: 2,
    riskLevel: "Medium",
    status: "Online",
    mockFeedback: "Mission priorities sequenced for owner review."
  },
  {
    id: "003",
    name: "UI Builder Agent",
    role: "Functional interface implementation",
    lane: "Claude UI",
    abilities: ["Component layout", "Responsive surfaces", "Interaction states"],
    blockedActions: ["Auth changes", "Secret display", "Production deploy"],
    allowedTools: ["React", "CSS", "Desktop UI"],
    permissionLevel: 2,
    riskLevel: "Low",
    status: "Idle",
    mockFeedback: "UI work should preserve connection and token safety behavior."
  },
  {
    id: "004",
    name: "Backend Agent",
    role: "API contracts and data flow",
    lane: "Hermes Backend",
    abilities: ["Route handlers", "Validation", "Integration shape"],
    blockedActions: ["Destructive migrations", "Auth weakening"],
    allowedTools: ["Next API", "TypeScript"],
    permissionLevel: 3,
    riskLevel: "Medium",
    status: "Online",
    mockFeedback: "API contract remains mock-safe and owner-only."
  },
  {
    id: "005",
    name: "Security Agent",
    role: "Threat review and policy checks",
    lane: "Codex Audit",
    abilities: ["Auth review", "Secret safety", "Risk detection"],
    blockedActions: ["Reveal secrets", "Disable protections"],
    allowedTools: ["Audit", "Policy", "Gitleaks reports"],
    permissionLevel: 3,
    riskLevel: "High",
    status: "Online",
    mockFeedback: "Risky actions are approval-gated and secrets remain redacted."
  },
  {
    id: "006",
    name: "QA Agent",
    role: "Validation and regression coverage",
    lane: "Codex Audit",
    abilities: ["Lint/build checks", "Endpoint smoke tests", "Desktop regression checks"],
    blockedActions: ["Deploy", "Bypass tests"],
    allowedTools: ["Test runner", "Browser", "Build tools"],
    permissionLevel: 2,
    riskLevel: "Low",
    status: "Online",
    mockFeedback: "Validation checklist prepared for command and desktop flow."
  },
  {
    id: "007",
    name: "Vercel Deploy Agent",
    role: "Preview deployment planning",
    lane: "Hermes Backend",
    abilities: ["Preview diagnostics", "Deployment checklist", "Rollback notes"],
    blockedActions: ["Production deploy", "Env mutation", "DNS changes"],
    allowedTools: ["Vercel docs", "Build logs"],
    permissionLevel: 2,
    riskLevel: "High",
    status: "Idle",
    mockFeedback: "Production deploy remains blocked until owner approval."
  },
  {
    id: "008",
    name: "Business Ops Agent",
    role: "Operations workflow triage",
    lane: "MISATO Council",
    abilities: ["SOP drafting", "Client ops triage", "Daily command review"],
    blockedActions: ["Customer-facing sends", "Billing changes"],
    allowedTools: ["Docs", "Reports"],
    permissionLevel: 2,
    riskLevel: "Medium",
    status: "Idle",
    mockFeedback: "Daily operational blockers summarized."
  },
  {
    id: "009",
    name: "Marketing Agent",
    role: "Campaign planning",
    lane: "MISATO Council",
    abilities: ["Messaging", "Funnel planning", "Positioning"],
    blockedActions: ["Live ad publish", "Social posting"],
    allowedTools: ["Copy", "Analytics"],
    permissionLevel: 2,
    riskLevel: "Medium",
    status: "Idle",
    mockFeedback: "Marketing suggestions are draft-only."
  },
  {
    id: "010",
    name: "Finance Agent",
    role: "Budget and risk analysis",
    lane: "MISATO Council",
    abilities: ["Forecasting", "Cost checks", "Payment-risk review"],
    blockedActions: ["Payment execution", "Billing changes"],
    allowedTools: ["Reports", "Sheets"],
    permissionLevel: 2,
    riskLevel: "High",
    status: "Idle",
    mockFeedback: "Financial actions require explicit owner approval."
  },
  {
    id: "011",
    name: "Research Agent",
    role: "Research synthesis",
    lane: "MISATO Council",
    abilities: ["Reference scanning", "Summaries", "Confidence notes"],
    blockedActions: ["External publishing"],
    allowedTools: ["Docs", "Research"],
    permissionLevel: 1,
    riskLevel: "Low",
    status: "Online",
    mockFeedback: "Research summarized without external posting."
  },
  {
    id: "012",
    name: "Claude UI Agent",
    role: "Visual polish and design execution",
    lane: "Claude UI",
    abilities: ["Visual refinement", "Interaction polish", "Design system execution"],
    blockedActions: ["Auth edits", "Backend security edits", "Token rendering"],
    allowedTools: ["Desktop UI", "Design docs"],
    permissionLevel: 2,
    riskLevel: "Low",
    status: "Idle",
    mockFeedback: "Claude should preserve functional connection states."
  },
  {
    id: "013",
    name: "Hermes Architecture Agent",
    role: "Orchestration and command routing architecture",
    lane: "Hermes Backend",
    abilities: ["Command decomposition", "Agent routing", "Runtime planning"],
    blockedActions: ["Live execution", "Approval bypass"],
    allowedTools: ["Architecture docs", "Mock orchestrator"],
    permissionLevel: 3,
    riskLevel: "Medium",
    status: "Online",
    mockFeedback: "Hermes returns plans only in v1."
  },
  {
    id: "014",
    name: "Obsidian Librarian Agent",
    role: "Knowledge mirror planning",
    lane: "MISATO Memory",
    abilities: ["Mirror summaries", "Vault schema planning", "Decision logs"],
    blockedActions: ["Real vault writes", "Secret sync"],
    allowedTools: ["Obsidian docs", "Mirror templates"],
    permissionLevel: 2,
    riskLevel: "Low",
    status: "Idle",
    mockFeedback: "Obsidian bridge remains plan-only."
  },
  {
    id: "015",
    name: "GitHub Handoff Agent",
    role: "Branch and PR handoff coordination",
    lane: "GitHub",
    abilities: ["Branch notes", "PR checklist", "Handoff summaries"],
    blockedActions: ["Merge to main", "Force push protected branches"],
    allowedTools: ["GitHub docs", "Handoff files"],
    permissionLevel: 2,
    riskLevel: "Medium",
    status: "Online",
    mockFeedback: "GitHub actions remain branch/PR only until approval."
  },
  {
    id: "016",
    name: "Watchtower Agent",
    role: "Monitoring summaries",
    lane: "Watchtower",
    abilities: ["Service health snapshots", "Incident summaries", "Uptime planning"],
    blockedActions: ["Public status publication", "Credential exposure"],
    allowedTools: ["Mock monitors", "Uptime Kuma plan"],
    permissionLevel: 2,
    riskLevel: "Low",
    status: "Online",
    mockFeedback: "Watchtower returns safe mock monitor summaries."
  },
  {
    id: "017",
    name: "Design Librarian Agent",
    role: "Design system governance",
    lane: "Design Library",
    abilities: ["Token governance", "Claude guardrails", "Consistency checks"],
    blockedActions: ["Brand redesign without approval", "Auth/security changes"],
    allowedTools: ["DESIGN.md", "Style guide"],
    permissionLevel: 2,
    riskLevel: "Low",
    status: "Online",
    mockFeedback: "Design guidance stays separated from auth and backend ownership."
  },
  {
    id: "018",
    name: "Secret Sentinel Agent",
    role: "Secret scanning and redacted reporting",
    lane: "Secret Sentinel",
    abilities: ["Gitleaks scan orchestration", "Redacted findings", "Remediation notes"],
    blockedActions: ["Reveal secret values", "Delete files", "Rotate secrets"],
    allowedTools: ["Gitleaks", "Redacted report parser"],
    permissionLevel: 3,
    riskLevel: "High",
    status: "Online",
    mockFeedback: "Secret reports are redacted and repo-scoped."
  },
  {
    id: "019",
    name: "Codex Client QA Agent",
    role: "Reliability, build, and security validation",
    lane: "Codex Audit",
    abilities: ["Bug patching", "Route validation", "CORS/fetch checks", "Build failure triage", "Secret leak risk review"],
    blockedActions: ["Deploy", "Merge main", "Expose tokens", "Bypass auth"],
    allowedTools: ["Lint", "Build", "Desktop build", "Gitleaks scripts"],
    permissionLevel: 3,
    riskLevel: "Medium",
    status: "Online",
    mockFeedback: "Codex reports bugs, failing routes, build failures, and unsafe docs without exposing secrets."
  },
  {
    id: "020",
    name: "Approval Gate Agent",
    role: "Owner authorization gate",
    lane: "Owner Approval",
    abilities: ["Risk blocking", "Approval summaries", "Production lock"],
    blockedActions: ["Self-approve", "Execute without owner"],
    allowedTools: ["Approval queue", "Audit logs"],
    permissionLevel: 4,
    riskLevel: "High",
    status: "Online",
    mockFeedback: "Risky actions are blocked until owner approval."
  }
];
