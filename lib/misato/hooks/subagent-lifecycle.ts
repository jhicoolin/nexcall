/**
 * MISATO Hook: Subagent Lifecycle (start + stop annotations)
 *
 * Fires when a specialist subagent begins or ends work.
 * Updates agent status in the store. Emits SSE events.
 * Writes annotations to the run ledger.
 *
 * Usage:
 *   await runSubagentStart({ agent: 'codex', taskId, taskTitle, intent });
 *   // ... agent does its work ...
 *   await runSubagentStop({ agent: 'codex', taskId, status: 'completed', summary, result });
 */

import { loadStore, saveStore, appendEventJsonl } from "../runtime/store";
import { publishEvent } from "../runtime/event-bus";

export type SubagentStartInput = {
  agent: string;          // "codex" | "claude" | "runtime-auditor" | "dashboard-polisher" | etc.
  taskId: string;         // which task this agent is working on
  taskTitle: string;      // human-readable task description
  intent: string;         // what the agent should accomplish
  commandId?: string;
};

export type SubagentStopInput = {
  agent: string;
  taskId: string;
  status: "completed" | "failed" | "blocked";
  summary: string;        // brief human-readable outcome
  result?: unknown;       // what the agent produced (will be sanitized)
  commandId?: string;
  approvalId?: string;    // if the stop was due to an approval gate
};

function nowIso(): string {
  return new Date().toISOString();
}

function rid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  const secrets = /\b(token|secret|password|key|auth|bearer|credential)\b/i;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      secrets.test(k) ? "[REDACTED]" : v,
    ])
  );
}

function findAgentInStore(store: any, agentId: string): any {
  return store.agents.find(
    (a: any) => a.agentId === agentId || a.id === agentId || a.name?.toLowerCase().includes(agentId.toLowerCase())
  ) || null;
}

/**
 * Mark a subagent as active and beginning work on a task.
 * Updates store agent status. Emits SSE + ledger entry.
 */
export async function runSubagentStart(input: SubagentStartInput): Promise<void> {
  const { agent, taskId, taskTitle, intent, commandId } = input;

  const store = loadStore();
  const agentObj = findAgentInStore(store, agent);

  if (agentObj) {
    agentObj.status = "active";
    agentObj.currentTaskId = taskId;
    agentObj.currentTask = taskTitle;
    agentObj.startedAt = nowIso();
    agentObj.lastActivityAt = nowIso();
    agentObj.progress = 0;
    saveStore(store);
  }

  const event = {
    id: rid("evt"),
    eventId: rid("evt"),
    timestamp: nowIso(),
    type: "agent_started",
    source: "misato.hooks",
    severity: "info" as const,
    payload: {
      agent,
      taskId,
      taskTitle,
      intent,
    },
    agentId: agent,
    taskId,
    ...(commandId ? { commandId } : {}),
  };

  publishEvent(event as any);
  appendEventJsonl(event);
}

/**
 * Mark a subagent as completed, failed, or blocked.
 * Updates store agent and task status. Emits SSE + ledger entry.
 * Links approval if the stop was due to an approval gate.
 */
export async function runSubagentStop(input: SubagentStopInput): Promise<void> {
  const { agent, taskId, status, summary, result, commandId, approvalId } = input;

  const store = loadStore();
  const agentObj = findAgentInStore(store, agent);

  if (agentObj) {
    agentObj.status = status === "completed" ? "idle" : "blocked";
    agentObj.currentTaskId = null;
    agentObj.currentTask = null;
    agentObj.completedAt = nowIso();
    agentObj.lastActivityAt = nowIso();
    agentObj.progress = status === "completed" ? 100 : agentObj.progress;
    saveStore(store);
  }

  // Update the linked task status
  const task = store.tasks.find((t: any) => t.id === taskId);
  if (task) {
    if (status === "completed") {
      task.status = "Done";
      task.completedAt = nowIso();
      task.completedBy = agent;
    } else if (status === "blocked") {
      task.status = "Blocked";
      task.linkedApprovalId = approvalId || task.linkedApprovalId;
    } else if (status === "failed") {
      task.status = "Blocked";
    }
    task.updatedAt = nowIso();
    saveStore(store);
  }

  const event = {
    id: rid("evt"),
    eventId: rid("evt"),
    timestamp: nowIso(),
    type: "agent_completed",
    source: "misato.hooks",
    severity: status === "failed" ? "error" as const : "info" as const,
    payload: {
      agent,
      taskId,
      status,
      summary,
      result: sanitize(result),
      ...(approvalId ? { blockedByApproval: approvalId } : {}),
    },
    agentId: agent,
    taskId,
    ...(commandId ? { commandId } : {}),
    ...(approvalId ? { approvalId } : {}),
  };

  publishEvent(event as any);
  appendEventJsonl(event);
}
