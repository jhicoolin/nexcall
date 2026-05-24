export type MockSubagent = {
  id: string;
  name: string;
  role: string;
  projectScope: string;
  level: 1 | 2 | 3 | 4;
  status: "Online" | "Idle" | "Blocked";
  blockedActions: string[];
};

export const mockSubagents: MockSubagent[] = [
  { id: "sa-ui", name: "UI Builder Agent", role: "Frontend implementation", projectScope: "MISATO", level: 2, status: "Online", blockedActions: ["Production deploy", "Env var changes"] },
  { id: "sa-backend", name: "Backend Agent", role: "API and data workflows", projectScope: "MISATO", level: 2, status: "Online", blockedActions: ["DB migration execution", "Secret access"] },
  { id: "sa-security", name: "Security Agent", role: "Policy and risk review", projectScope: "MISATO", level: 3, status: "Online", blockedActions: ["Auth override", "Billing/DNS changes"] },
  { id: "sa-vercel", name: "MISATO Vercel Deploy Agent", role: "Deploy planning and checklist", projectScope: "MISATO", level: 2, status: "Idle", blockedActions: ["Real deploy", "Env var edits", "DNS changes"] }
];
