export type Priority = "Low" | "Medium" | "High";
export type RiskLevel = "Low" | "Medium" | "High";
export type TaskStatus = "Idea" | "Doing" | "Blocked" | "Done";
export type PermissionLevel = 1 | 2 | 3 | 4 | 5;

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  priority: Priority;
  currentObjective: string;
  nextAction: string;
  dueDate: string;
  notes: string;
  riskLevel: RiskLevel;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignedAgentId?: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
};

export type CouncilAgent = {
  id: string;
  name: string;
  role: string;
  abilities: string[];
  blockedActions: string[];
  allowedTools: string[];
  memoryScope: string;
  riskLevel: RiskLevel;
  permissionLevel: PermissionLevel;
  approvalRules: string[];
  status: "Online" | "Idle" | "Blocked";
};

export type Approval = {
  id: string;
  project: string;
  requestedAgent: string;
  actionType: string;
  reason: string;
  preview: string;
  riskLevel: RiskLevel;
  status: "Pending" | "Approved" | "Rejected" | "Revision Requested";
  createdAt: string;
};

export type LogEntry = {
  id: string;
  timestamp: string;
  project: string;
  agent: string;
  action: string;
  status: string;
  riskLevel: RiskLevel;
  details: string;
};

export type MemoryEntry = {
  id: string;
  project: string;
  scope: string;
  summary: string;
};

export type ToolPermission = {
  id: string;
  agentId: string;
  tool: string;
  allowed: boolean;
  permissionLevel: PermissionLevel;
  approvalRequired: boolean;
  riskLevel: RiskLevel;
};

export type CommandResponse = {
  missionSummary: string;
  projectDetected: string;
  hermesPlan: string[];
  agentsAssigned: string[];
  councilFeedback: Array<{ agent: string; feedback: string }>;
  subtasksCreated: string[];
  risksDetected: string[];
  approvalRequired: boolean;
  approvalReason: string | null;
  logsCreated: string[];
  nextRecommendedActions: string[];
  activityFeed: string[];
};
