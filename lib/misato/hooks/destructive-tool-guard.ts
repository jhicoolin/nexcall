/**
 * MISATO Hook: Destructive Tool Guard (pre-tool validation)
 *
 * Fires BEFORE any tool execution. Blocks destructive tools pending approval.
 * Implements the pre-tool validation policy from docs/misato/HOOKS.md.
 *
 * Usage in command machine or route handler:
 *
 *   const guard = await runDestructiveToolGuard({ tool, arguments: args, riskLevel });
 *   if (guard.blocked) return { blocked: true, approvalId: guard.approvalId };
 *   // proceed with tool execution
 */

import { loadStore, saveStore } from "../runtime/store";
import { publishEvent } from "../runtime/event-bus";
import { appendEventJsonl } from "../runtime/store";

export type RiskLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export type DestructiveToolGuardInput = {
  tool: string;                         // e.g. "vercel-deploy"
  arguments: Record<string, unknown>;   // tool call arguments
  riskLevel: RiskLevel;                 // classified risk of this specific call
  commandId?: string;                   // if called from command pipeline
  agentId?: string;                     // which agent is calling the tool
  mcpTier?: 1 | 2 | 3 | 4;             // which MCP tier this tool belongs to
};

export type DestructiveToolGuardResult =
  | { blocked: false }
  | { blocked: true; approvalId: string; reason: string };

/** Risk levels that require approval before tool execution. */
const APPROVAL_REQUIRED_LEVELS: RiskLevel[] = ["L2", "L3", "L4"];

/** Tools that are always considered destructive, regardless of risk classification. */
const ALWAYS_DESTRUCTIVE = new Set([
  "vercel-deploy",
  "git-push",
  "git-force-push",
  "docker-run",
  "rotate-secret",
  "update-env",
  "change-password",
  "delete-file",
  "drop-collection",
  "drop-table",
  "clear-cache",
  "send-email",
  "post-to-slack",
  "vault-write",
  "obsidian-write",
]);

function nowIso(): string {
  return new Date().toISOString();
}

function rid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const secretKeys = /\b(token|secret|password|key|api_key|auth|bearer|credential)\b/i;
  return Object.fromEntries(
    Object.entries(args).map(([k, v]) => [
      k,
      secretKeys.test(k) ? "[REDACTED]" : v,
    ])
  );
}

function buildApprovalTitle(tool: string, args: Record<string, unknown>): string {
  const project = args.project || args.name || args.target || tool;
  return `Approve tool execution: ${tool} on ${project}`;
}

function buildRiskReason(tool: string, riskLevel: RiskLevel, mcpTier?: number): string {
  const tierNote = mcpTier === 4 ? " (third-party MCP)" : "";
  const riskNote: Record<RiskLevel, string> = {
    L0: "Read-only operation — no approval needed",
    L1: "Local state change — no approval needed",
    L2: `External write or configuration change${tierNote} — requires owner review`,
    L3: `Data deletion or irreversible operation${tierNote} — requires owner review`,
    L4: `Production action, auth change, or deployment${tierNote} — requires owner review`,
  };
  return riskNote[riskLevel];
}

/**
 * Run the destructive tool guard before executing a tool.
 * Returns { blocked: false } if the tool may proceed.
 * Returns { blocked: true, approvalId, reason } if the tool must wait for approval.
 */
export async function runDestructiveToolGuard(
  input: DestructiveToolGuardInput
): Promise<DestructiveToolGuardResult> {
  const { tool, arguments: args, riskLevel, commandId, agentId, mcpTier } = input;

  const isAlwaysDestructive = ALWAYS_DESTRUCTIVE.has(tool);
  const isHighRisk = APPROVAL_REQUIRED_LEVELS.includes(riskLevel);
  const isThirdParty = mcpTier === 4;

  // L0 and L1 non-destructive tools: allow immediately
  if (!isHighRisk && !isAlwaysDestructive && !isThirdParty) {
    publishEvent({
      eventId: rid("evt"),
      timestamp: nowIso(),
      type: "tool.allowed",
      source: "misato.hooks",
      severity: "info",
      payload: {
        tool,
        riskLevel,
        reason: "Below approval threshold",
        ...(commandId ? { commandId } : {}),
        ...(agentId ? { agentId } : {}),
      },
    } as any);
    return { blocked: false };
  }

  // L2+ or always-destructive or third-party: block and create approval
  const store = loadStore();
  const approvalId = rid("apr");
  const sanitizedArgs = sanitizeArgs(args);
  const reason = buildRiskReason(tool, riskLevel, mcpTier);
  const title = buildApprovalTitle(tool, args);

  const approval = {
    id: approvalId,
    title,
    description: `Tool: ${tool}\nRisk: ${riskLevel}\nReason: ${reason}\nArguments: ${JSON.stringify(sanitizedArgs, null, 2)}`,
    riskLevel: riskLevel === "L4" ? "High" : riskLevel === "L3" ? "High" : "Medium",
    requestedByAgentId: agentId || "misato.runtime",
    requestedByAgentName: agentId || "MISATO Runtime",
    commandId: commandId || null,
    actionType: `tool.${tool}`,
    status: "Pending",
    safeExecutionMode: true,
    doesNotAutoExecuteProduction: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    dedupeKey: `tool:${tool}:${JSON.stringify(sanitizedArgs)}`,
  };

  store.approvals.unshift(approval as any);
  store.runtime.approvalsPending = store.approvals.filter(
    (a: any) => String(a.status).toLowerCase() === "pending"
  ).length;
  saveStore(store);

  const event = {
    eventId: rid("evt"),
    timestamp: nowIso(),
    type: "approval.created",
    source: "misato.hooks",
    severity: "warn" as const,
    payload: {
      approvalId,
      tool,
      riskLevel,
      reason,
      sanitizedArgs,
      ...(commandId ? { commandId } : {}),
      ...(agentId ? { agentId } : {}),
    },
    approvalId,
    ...(commandId ? { commandId } : {}),
    ...(agentId ? { agentId } : {}),
  };

  publishEvent(event as any);
  appendEventJsonl(event);

  return {
    blocked: true,
    approvalId,
    reason,
  };
}
