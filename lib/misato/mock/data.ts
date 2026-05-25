import { CommandResponse, CouncilAgent, LogEntry, MemoryEntry, Project, Task, ToolPermission, Approval } from "@/lib/misato/types";

export const projects: Project[] = [
  { id: "p1", name: "NexCall", slug: "nexcall", description: "AI receptionist operations", status: "Launch", priority: "High", currentObjective: "Increase paying clients", nextAction: "Finalize outbound sequence", dueDate: "2026-05-30", notes: "Focus medspa and dental first", riskLevel: "Medium" },
  { id: "p2", name: "Bad Genetics", slug: "bad-genetics", description: "Brand and drop ops", status: "Planning", priority: "High", currentObjective: "Plan first drop", nextAction: "Lock supplier shortlist", dueDate: "2026-06-03", notes: "Keep MOQ-safe", riskLevel: "Medium" },
  { id: "p3", name: "Client Sites", slug: "client-sites", description: "Client build queue", status: "Active", priority: "Medium", currentObjective: "Reduce blockers", nextAction: "Prioritize overdue tickets", dueDate: "2026-05-29", notes: "Triage by SLA", riskLevel: "Low" },
  { id: "p4", name: "Personal Ops", slug: "personal-ops", description: "Founder systems", status: "Active", priority: "Medium", currentObjective: "Calendar stabilization", nextAction: "Batch deep-work blocks", dueDate: "2026-05-28", notes: "Protect mornings", riskLevel: "Low" },
  { id: "p5", name: "Research Lab", slug: "research-lab", description: "AI experiments", status: "Exploring", priority: "Low", currentObjective: "Evaluate runtime options", nextAction: "Draft benchmark matrix", dueDate: "2026-06-06", notes: "Mock-first", riskLevel: "Medium" }
];

export const tasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Draft dentist campaign", status: "Doing", priority: "High", dueDate: "2026-05-25", assignedAgentId: "agent-backend", riskLevel: "Low", approvalRequired: false },
  { id: "t2", projectId: "p1", title: "Design approval queue UX", status: "Idea", priority: "High", dueDate: "2026-05-27", assignedAgentId: "agent-ui", riskLevel: "Medium", approvalRequired: false },
  { id: "t3", projectId: "p2", title: "Supplier outreach", status: "Blocked", priority: "High", dueDate: "2026-05-24", assignedAgentId: "agent-business", riskLevel: "Medium", approvalRequired: false },
  { id: "t4", projectId: "p3", title: "Fix mobile nav issue", status: "Done", priority: "Medium", dueDate: "2026-05-23", assignedAgentId: "agent-qa", riskLevel: "Low", approvalRequired: false },
  { id: "t5", projectId: "p4", title: "Prepare deploy checklist", status: "Idea", priority: "Medium", dueDate: "2026-05-30", assignedAgentId: "agent-vercel", riskLevel: "High", approvalRequired: true }
];

export const councilAgents: CouncilAgent[] = [
  { id: "agent-strategy", name: "Strategy Agent", role: "High-level planning", abilities: ["Roadmapping", "Prioritization"], blockedActions: ["Production deploy"], allowedTools: ["Docs", "Planning"], memoryScope: "Cross-project summaries", riskLevel: "Medium", permissionLevel: 2, approvalRules: ["Needs approval for execution"], status: "Online" },
  { id: "agent-ui", name: "UI Builder Agent", role: "Interface building", abilities: ["Component design", "Responsive layouts"], blockedActions: ["Auth edits", "Deploy"], allowedTools: ["React", "Tailwind"], memoryScope: "UI layer only", riskLevel: "Low", permissionLevel: 2, approvalRules: ["Needs approval for major redesign"], status: "Online" },
  { id: "agent-backend", name: "Backend Agent", role: "API and data flows", abilities: ["Route handlers", "Validation"], blockedActions: ["DB destructive migrations"], allowedTools: ["TypeScript", "Next API"], memoryScope: "Backend only", riskLevel: "Medium", permissionLevel: 3, approvalRules: ["Approval for migrations"], status: "Online" },
  { id: "agent-security", name: "Security Agent", role: "Risk review", abilities: ["Threat detection", "Policy checks"], blockedActions: ["Direct prod changes"], allowedTools: ["Audit", "Policy"], memoryScope: "Security notes", riskLevel: "High", permissionLevel: 3, approvalRules: ["Approval for any enforcement change"], status: "Online" },
  { id: "agent-qa", name: "QA Agent", role: "Validation", abilities: ["Test planning", "Regression checks"], blockedActions: ["Deploy"], allowedTools: ["Test runner", "Playwright"], memoryScope: "Test summaries", riskLevel: "Low", permissionLevel: 2, approvalRules: ["Approval for production test toggles"], status: "Idle" },
  { id: "agent-vercel", name: "Vercel Deploy Agent", role: "Deployment prep", abilities: ["Checklist drafting", "Preview diagnostics"], blockedActions: ["Prod deploy execution", "Env mutation"], allowedTools: ["Build logs", "Docs"], memoryScope: "Deployment docs", riskLevel: "High", permissionLevel: 2, approvalRules: ["Always approval-gated"], status: "Online" },
  { id: "agent-business", name: "Business Ops Agent", role: "Operations workflows", abilities: ["SOP drafting", "Intake triage"], blockedActions: ["Billing changes"], allowedTools: ["Spreadsheets", "Docs"], memoryScope: "Business ops", riskLevel: "Medium", permissionLevel: 2, approvalRules: ["Approval for customer-facing sends"], status: "Idle" },
  { id: "agent-marketing", name: "Marketing Agent", role: "Campaign planning", abilities: ["Messaging", "Funnel planning"], blockedActions: ["Live ad publish"], allowedTools: ["Copy", "Analytics"], memoryScope: "Campaign notes", riskLevel: "Medium", permissionLevel: 2, approvalRules: ["Approval for publishing"], status: "Idle" },
  { id: "agent-finance", name: "Finance Agent", role: "Budget analysis", abilities: ["Forecasting", "Cost checks"], blockedActions: ["Payment execution"], allowedTools: ["Sheets", "Reporting"], memoryScope: "Finance scoped", riskLevel: "High", permissionLevel: 2, approvalRules: ["Approval for payment actions"], status: "Idle" },
  { id: "agent-research", name: "Research Agent", role: "Research synthesis", abilities: ["Literature scan", "Summary"], blockedActions: ["External posting"], allowedTools: ["Web research", "Docs"], memoryScope: "Research scoped", riskLevel: "Low", permissionLevel: 1, approvalRules: ["Approval for outbound publishing"], status: "Online" },
  { id: "agent-claude-ui", name: "Claude UI Agent", role: "UI polish", abilities: ["Visual polish", "Interaction tuning"], blockedActions: ["Auth", "Secrets", "Deploy settings"], allowedTools: ["Frontend only"], memoryScope: "UI-only scope", riskLevel: "Low", permissionLevel: 2, approvalRules: ["Approval before merge"], status: "Idle" },
  { id: "agent-hermes-arch", name: "Hermes Architecture Agent", role: "Runtime architecture", abilities: ["Agent topology", "Control-room planning"], blockedActions: ["Prod execution"], allowedTools: ["Architecture docs", "Planning"], memoryScope: "Architecture scoped", riskLevel: "Medium", permissionLevel: 2, approvalRules: ["Approval for runtime integration"], status: "Online" }
];

export const approvals: Approval[] = [
  { id: "ap1", project: "NexCall", requestedAgent: "Vercel Deploy Agent", actionType: "Production deploy", reason: "Release pending owner review", preview: "Deploy commit abc123 to production", riskLevel: "High", status: "Pending", createdAt: "2026-05-24T12:00:00Z" },
  { id: "ap2", project: "Client Sites", requestedAgent: "Backend Agent", actionType: "Auth config change", reason: "Route scope update", preview: "Modify auth middleware paths", riskLevel: "High", status: "Pending", createdAt: "2026-05-24T12:15:00Z" }
];

export const logs: LogEntry[] = [
  { id: "l1", timestamp: "2026-05-24T11:50:00Z", project: "NexCall", agent: "MISATO Core", action: "Command parsed", status: "Success", riskLevel: "Low", details: "Sanitized mission intent generated" },
  { id: "l2", timestamp: "2026-05-24T11:55:00Z", project: "NexCall", agent: "Security Agent", action: "Risk scan", status: "Warning", riskLevel: "Medium", details: "Deploy keyword detected; approval queued" }
];

export const memoryEntries: MemoryEntry[] = [
  { id: "m1", project: "NexCall", scope: "Project", summary: "Lead capture priority is dental + medspa outreach." },
  { id: "m2", project: "Bad Genetics", scope: "Agent: Business Ops", summary: "Supplier MOQ must be verified before launch decisions." }
];

export const agents = councilAgents;

export const toolPermissions: ToolPermission[] = councilAgents.flatMap((agent) =>
  agent.allowedTools.map((tool, i) => ({ id: `${agent.id}-${i}`, agentId: agent.id, tool, allowed: true, permissionLevel: agent.permissionLevel, approvalRequired: agent.permissionLevel >= 3, riskLevel: agent.riskLevel }))
);

const riskyPattern = /(deploy|production|dns|env|auth|migration|delete|email|social|billing|payment|export|contacts|discord|obsidian|automation|merge)/i;

function detectProject(command: string) {
  const lower = command.toLowerCase();
  if (lower.includes("nexcall")) return "NexCall";
  if (lower.includes("bad genetics")) return "Bad Genetics";
  if (lower.includes("client")) return "Client Sites";
  if (lower.includes("personal")) return "Personal Ops";
  return "Research Lab";
}

function selectCouncil(project: string) {
  const base = ["Strategy Agent", "Backend Agent", "Security Agent", "QA Agent"];
  if (project === "NexCall") return [...base, "Vercel Deploy Agent", "Marketing Agent"];
  if (project === "Bad Genetics") return [...base, "Business Ops Agent", "Finance Agent"];
  return [...base, "Research Agent", "Claude UI Agent"];
}

function feedbackFor(agent: string, command: string) {
  const snippets: Record<string, string> = {
    "Strategy Agent": "Proposed mission sequencing and clarified objective scope.",
    "Backend Agent": "Mapped API and data contracts for the requested flow.",
    "Security Agent": "Scanned request for risky operations and policy violations.",
    "QA Agent": "Prepared validation checklist for safe rollout.",
    "Vercel Deploy Agent": "Prepared preview-first deployment checklist; production blocked pending approval.",
    "Marketing Agent": "Drafted campaign-ready messaging and CTA variants.",
    "Business Ops Agent": "Outlined SOP updates and handoff cadence.",
    "Finance Agent": "Flagged budget and payment-risk checkpoints.",
    "Research Agent": "Compiled research references and confidence notes.",
    "Claude UI Agent": "Proposed polish items for readability and flow.",
    "Hermes Architecture Agent": "Recommended orchestrator path and isolation constraints."
  };
  const base = snippets[agent] || "Provided scoped specialist feedback.";
  return `${base} (command: ${command.slice(0, 72)})`;
}

export function runMisatoMockCommand(command: string): CommandResponse {
  const projectDetected = detectProject(command);
  const agentsAssigned = selectCouncil(projectDetected);
  const approvalRequired = riskyPattern.test(command);

  const projectContext = [
    "NexCall: priority HIGH — stabilize MISATO desktop/backend connection before non-critical work.",
    "Bad Genetics: priority HIGH — supplier outreach currently blocked; queue approval-safe prep only.",
    "Client Sites: ACTIVE — reduce blocker queue and close SLA-overdue tickets.",
    "Personal Ops: ACTIVE — protect deep-work blocks and keep approvals cadence tight.",
    "Research Lab: EXPLORING — runtime experiments remain mock-safe until approval gate matures."
  ];

  return {
    missionSummary: `MISATO reviewed operational priorities and prepared a mock-safe plan for ${projectDetected}.`,
    projectDetected,
    agentsAssigned,
    councilFeedback: [
      ...projectContext.map((line) => ({ agent: "MISATO Core", feedback: line })),
      ...agentsAssigned.map((a) => ({ agent: a, feedback: feedbackFor(a, command) })),
      { agent: "Security Agent", feedback: "Live automations remain disabled; risky actions are approval-gated and not executed in v1." }
    ],
    subtasksCreated: [
      "Parse objective and constraints",
      "Generate mission brief with project priorities",
      "Assign mock-safe analysis tasks to council",
      approvalRequired ? "Create Approval Gate draft item" : "Queue non-destructive next actions"
    ],
    risksDetected: approvalRequired
      ? ["Risky action category detected (deploy/auth/env/data/external action)", "Execution blocked in v1 mock-safe mode"]
      : ["No risky execution keywords detected; safe planning mode only"],
    approvalRequired,
    approvalReason: approvalRequired
      ? "Requested command falls into a protected action category and requires explicit owner approval before any execution."
      : null,
    logsCreated: [
      "Command received",
      "Project intent classified",
      "Council assignment generated",
      "Risk scan complete",
      approvalRequired ? "Approval-required marker added" : "Safe-plan marker added"
    ],
    nextRecommendedActions: approvalRequired
      ? [
          "Review and refine approval request scope",
          "Explicitly approve or reject protected actions",
          "Run post-approval checklist in controlled mode"
        ]
      : [
          "Execute top two safe subtasks",
          "Review blockers and pending approvals",
          "Re-run status check before next command batch"
        ],
    activityFeed: [
      "1) Command received",
      `2) Project detected: ${projectDetected}`,
      "3) Priority context injected (NexCall, Bad Genetics, Client Sites, Personal Ops, Research Lab)",
      `4) Council selected: ${agentsAssigned.join(", ")}`,
      "5) Risk scan completed",
      approvalRequired ? "6) Approval required: execution blocked" : "6) Safe planning output generated"
    ]
  };
}
