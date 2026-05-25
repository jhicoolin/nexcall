import type { RiskLevel } from "@/lib/misato/types";

export type HermesExecutionMode = "mock-safe" | "assisted" | "approval-required";

export type HermesTaskType =
  | "daily-command"
  | "deployment"
  | "security-audit"
  | "runtime-integration"
  | "design-polish"
  | "operations"
  | "unknown";

export type HermesPlan = {
  summary: string;
  taskType: HermesTaskType;
  executionMode: HermesExecutionMode;
  recommendedAgentPath: string[];
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  approvalReason: string | null;
  logs: string[];
};

export type HermesCommandInput = {
  command: string;
};
