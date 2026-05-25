import type { HermesCommandInput, HermesPlan, HermesTaskType } from "./types";

const riskyMatchers: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bproduction\b|\bprod\b|\bdeploy\b|\bvercel\b/i, reason: "Production or deployment action requires owner approval." },
  { pattern: /\benv\b|environment variable|secret|token|key/i, reason: "Environment and secret changes require owner approval." },
  { pattern: /\bdns\b|domain|nexcall\.one/i, reason: "DNS or production domain changes require owner approval." },
  { pattern: /\bauth\b|login|session|owner-only|middleware/i, reason: "Auth changes require owner approval and security review." },
  { pattern: /migration|database|db\b|delete|drop|truncate|remove data/i, reason: "Database, migration, or deletion work requires owner approval." },
  { pattern: /send email|email campaign|social post|post to|billing|invoice|charge|export contacts/i, reason: "External communications, billing, and contact exports require owner approval." },
  { pattern: /discord bot|obsidian vault|live automation|automation/i, reason: "Live integrations and automations are disabled until owner approval." },
  { pattern: /merge.*main|main.*merge|github merge|pull request merge/i, reason: "GitHub merges to main require owner approval." }
];

function detectTaskType(command: string): HermesTaskType {
  const lower = command.toLowerCase();
  if (/what needs attention|today|daily|blockers/.test(lower)) return "daily-command";
  if (/deploy|vercel|production|preview/.test(lower)) return "deployment";
  if (/secret|gitleaks|security|vulnerability|audit/.test(lower)) return "security-audit";
  if (/runtime|hermes|agent|orchestrator/.test(lower)) return "runtime-integration";
  if (/ui|design|claude|polish/.test(lower)) return "design-polish";
  if (/ops|business|client|project/.test(lower)) return "operations";
  return "unknown";
}

function detectProject(command: string) {
  const lower = command.toLowerCase();
  if (lower.includes("nexcall")) return "NexCall";
  if (lower.includes("bad genetics")) return "Bad Genetics";
  if (lower.includes("client")) return "Client Sites";
  if (lower.includes("personal")) return "Personal Ops";
  return "MISATO";
}

function approvalReason(command: string) {
  return riskyMatchers.find((item) => item.pattern.test(command))?.reason || null;
}

function agentPath(taskType: HermesTaskType, approvalRequired: boolean) {
  const base = ["MISATO Core", "Hermes Architecture Agent"];
  const pathByType: Record<HermesTaskType, string[]> = {
    "daily-command": ["Strategy Agent", "Business Ops Agent", "Watchtower Agent", "Secret Sentinel Agent", "GitHub Handoff Agent"],
    deployment: ["Vercel Deploy Agent", "Codex Client QA Agent", "Security Agent"],
    "security-audit": ["Secret Sentinel Agent", "Security Agent", "Codex Client QA Agent"],
    "runtime-integration": ["Backend Agent", "Hermes Architecture Agent", "QA Agent"],
    "design-polish": ["Claude UI Agent", "Design Librarian Agent", "QA Agent"],
    operations: ["Business Ops Agent", "Strategy Agent", "Finance Agent"],
    unknown: ["Strategy Agent", "Research Agent", "QA Agent"]
  };
  return approvalRequired ? [...base, ...pathByType[taskType], "Approval Gate Agent"] : [...base, ...pathByType[taskType]];
}

export function routeCommandToMockHermes(input: HermesCommandInput): HermesPlan & { projectDetected: string } {
  const command = input.command.trim();
  const taskType = detectTaskType(command);
  const projectDetected = detectProject(command);
  const reason = approvalReason(command);
  const approvalRequired = Boolean(reason);
  const recommendedAgentPath = agentPath(taskType, approvalRequired);

  return {
    summary: approvalRequired
      ? `Hermes prepared a mock-safe plan for ${projectDetected}; execution is blocked by Approval Gate.`
      : `Hermes prepared a mock-safe plan for ${projectDetected}.`,
    taskType,
    executionMode: approvalRequired ? "approval-required" : "mock-safe",
    recommendedAgentPath,
    projectDetected,
    riskLevel: approvalRequired ? "High" : taskType === "unknown" ? "Medium" : "Low",
    approvalRequired,
    approvalReason: reason,
    logs: [
      "Hermes received command from MISATO Core",
      `Detected task type: ${taskType}`,
      `Detected project: ${projectDetected}`,
      `Selected agents: ${recommendedAgentPath.join(", ")}`,
      approvalRequired ? "Approval Gate required before execution" : "No side effects requested; mock-safe response only"
    ]
  };
}
