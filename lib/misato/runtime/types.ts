export type MisatoEventType =
  | "command_received"
  | "context_loaded"
  | "plan_generated"
  | "agent_assigned"
  | "agent_updated"
  | "task_started"
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "task.status_changed"
  | "task.priority_changed"
  | "command.received"
  | "command.planned"
  | "command.completed"
  | "command.blocked"
  | "command.classified"
  | "mission_created"
  | "mission_updated"
  | "task.started"
  | "agent.selected"
  | "agents.selected"
  | "agents.assigned"
  | "plan.generated"
  | "risk.scan.completed"
  | "approval.queued"
  | "risk_detected"
  | "approval_requested"
  | "approval.created"
  | "approval.approved"
  | "approval.rejected"
  | "approval.deferred"
  | "approval_resolved"
  | "log"
  | "log.created"
  | "status_change"
  | "watchtower.checked"
  | "secret.scan.checked";

export type MisatoRuntimeEvent = {
  eventId: string;
  timestamp: string;
  type: MisatoEventType;
  source: string;
  payload: Record<string, unknown>;
};

export type RuntimeStatus = "connected" | "not_running" | "degraded";

export type RuntimeState = {
  mode: "local-first" | "preview-simple" | "production-locked";
  runtimeStatus: RuntimeStatus;
  lastCommandAt: string | null;
  approvalsPending: number;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  project: string;
  priority: string;
  status: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  taskIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  handoffNote: string | null;
};

export type RuntimeStore = {
  agents: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  approvals: Array<Record<string, unknown>>;
  logs: Array<Record<string, unknown>>;
  missions: Mission[];
  runtime: RuntimeState;
};
