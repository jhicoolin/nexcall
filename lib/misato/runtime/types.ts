export type MisatoEventType =
  | "command_received"
  | "context_loaded"
  | "plan_generated"
  | "agent_assigned"
  | "task_started"
  | "task_updated"
  | "risk_detected"
  | "approval_requested"
  | "approval_resolved"
  | "log"
  | "status_change";

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

export type RuntimeStore = {
  agents: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  approvals: Array<Record<string, unknown>>;
  logs: Array<Record<string, unknown>>;
  runtime: RuntimeState;
};
