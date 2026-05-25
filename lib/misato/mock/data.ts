import { CommandResponse, CouncilAgent, LogEntry, MemoryEntry, Project, Task, ToolPermission, Approval } from "@/lib/misato/types";
import { routeCommandToHermes } from "@/lib/misato/hermes/routeCommandToHermes";

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
  const hermesPlan = routeCommandToHermes({ command });
  const projectDetected = hermesPlan.projectDetected || detectProject(command);
  const agentsAssigned = hermesPlan.recommendedAgentPath.length ? hermesPlan.recommendedAgentPath : selectCouncil(projectDetected);
  const approvalRequired = hermesPlan.approvalRequired;
  const approvalReason = hermesPlan.approvalReason;

  return {
    missionSummary: `MISATO prepared a mission plan for ${projectDetected}: ${command}`,
    projectDetected,
    hermesPlan: {
      summary: hermesPlan.summary,
      executionMode: hermesPlan.executionMode,
      recommendedAgentPath: hermesPlan.recommendedAgentPath
    },
    agentsAssigned,
    councilFeedback: agentsAssigned.map((a) => ({ agent: a, feedback: feedbackFor(a, command) })),
    subtasksCreated: [
      "Parse objective and constraints",
      "Create mission entry",
      "Create/assign subtasks by council role",
      approvalRequired ? "Queue Approval Gate item" : "Queue safe draft output"
    ],
    risksDetected: approvalRequired ? ["Risky action category detected; execution blocked in v1"] : [],
    approvalRequired,
    approvalReason,
    logsCreated: [
      "Command received",
      "Project detected",
      "Council selected",
      "Risk scan complete",
      ...hermesPlan.logs,
      approvalRequired ? "Approval item drafted" : "No approval required"
    ],
    nextRecommendedActions: approvalRequired
      ? ["Review Approval Gate item", "Approve/Reject/Request revision", "Run post-approval checklist"]
      : ["Review subtasks", "Set due dates", "Move mission to Doing"],
    activityFeed: [
      "1) Command received",
      `2) Project detected: ${projectDetected}`,
      `3) Council selected: ${agentsAssigned.join(", ")}`,
      "4) Agents generated feedback",
      "5) Risks scanned",
      "6) Summary generated",
      approvalRequired ? "7) Approval queued" : "7) Approval not required"
    ]
  };
}
