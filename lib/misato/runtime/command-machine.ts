/**
 * Command State Machine — 10-stage execution loop
 *
 * Each stage: emits SSE event, updates store, appends log
 * Stages: received → classified → plan → agents → assign → tasks → start → risk → approval → complete
 */

import { getRecentEvents, publishEvent } from "./event-bus";
import { loadStore, saveStore, appendEventJsonl } from "./store";
import { classifyCommand, isAiConfigured, getActiveModel, getFallbackModel, getModelProvider } from "./ai-gateway";
import type { AiClassification } from "./ai-gateway";

const riskyPattern = /(deploy|production|dns|env|auth|migration|delete|billing|payment|secret|rotate|external|automation|merge)/i;

function rid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizePayload(input: Record<string, unknown>) {
  const txt = JSON.stringify(input);
  return JSON.parse(txt.replace(/(token|secret|password|key)"\s*:\s*"[^"]*"/gi, '$1":"[REDACTED]"'));
}

function emit(type: string, source: string, payload: Record<string, unknown> = {}, severity: "info" | "warn" | "error" = "info") {
  const event = {
    id: rid("evt"),
    eventId: rid("evt"),
    timestamp: nowIso(),
    type,
    source,
    severity,
    payload: sanitizePayload(payload),
    ...(payload.agentId ? { agentId: payload.agentId } : {}),
    ...(payload.taskId ? { taskId: payload.taskId } : {}),
    ...(payload.approvalId ? { approvalId: payload.approvalId } : {}),
    ...(payload.commandId ? { commandId: payload.commandId } : {})
  };
  publishEvent(event as any);
  appendEventJsonl(event);
  return event;
}

function logEvent(store: any, message: string, source = "misato.runtime", severity: "info" | "warn" | "error" = "info", payload: Record<string, unknown> = {}) {
  const log = {
    id: rid("log"),
    timestamp: nowIso(),
    source,
    severity,
    message,
    type: "log.created",
    payload: sanitizePayload(payload)
  };
  store.logs.unshift(log);
  emit("log.created", source, { message, ...payload }, severity);
  return log;
}

function createDedupeKey(title: string, project: string): string {
  return `dedupe:${project}:${title.toLowerCase().trim()}`;
}

function findDupTask(store: any, dedupeKey: string): any | null {
  return store.tasks.find((t: any) =>
    t.dedupeKey === dedupeKey &&
    !["Done", "Deleted", "Cancelled"].includes(String(t.status || ""))
  ) || null;
}

export type CommandTimelineStage = {
  stage: string;
  status: "completed" | "skipped" | "blocked" | "pending";
  timestamp: string;
  detail?: string;
};

export type CommandResult = {
  ok: boolean;
  commandId: string;
  command: string;
  intent: string;
  project: string;
  riskLevel: string;
  activeModel: string;
  fallbackModel: string;
  modelUsed: string;
  modelProvider: string;
  responseSource: string;
  planSteps: string[];
  selectedAgents: string[];
  agentsAssigned: { agentId: string; name: string }[];
  tasksCreated: any[];
  tasksUpdated: any[];
  approvalsCreated: any[];
  riskScan: { risks: string[]; safe: boolean };
  responseText: string;
  approvalRequired: boolean;
  approvalReason: string | null;
  timeline: CommandTimelineStage[];
  nextRecommendedActions: string[];
  commandStatus: "completed" | "blocked_by_approval" | "error";
};

function refreshApprovalCount(store: any) {
  store.runtime.approvalsPending = store.approvals.filter((a: any) => String(a.status).toLowerCase() === "pending").length;
}

function createApprovalRecord(store: any, command: string, commandId: string, reason: string, riskLevel: string, dedupeKey: string) {
  const approval = {
    id: rid("apr"),
    dedupeKey,
    title: `Approval required: ${command.slice(0, 50)}`,
    description: reason,
    riskLevel,
    requestedByAgentId: "agent-hermes",
    commandId,
    affects: ["runtime"],
    status: "Pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    actionType: "Protected action",
    safeExecutionMode: "manual",
    notes: "doesNotAutoExecuteProduction=true",
    doesNotAutoExecuteProduction: true
  };
  store.approvals.unshift(approval);
  refreshApprovalCount(store);
  emit("approval.created", "misato.approvals", { approvalId: approval.id, dedupeKey, approval, commandId }, "warn");
  return approval;
}

function getAgentFromStore(store: any, agentId: string): any {
  return store.agents.find((a: any) => a.agentId === agentId) || null;
}

const PLAN_STAGE_NAMES = [
  "command.received",
  "command.classified",
  "plan.generated",
  "agents.selected",
  "agents.assigned",
  "tasks.created_or_updated",
  "task.started",
  "risk.scan.completed",
  "approval.queued",
  "command.completed"
] as const;

export async function executeCommand(command: string): Promise<CommandResult> {
  const store = loadStore();
  const commandId = rid("cmd");
  const timeline: CommandTimelineStage[] = [];

  const stages = {
    command_received: () => {
      emit("command.received", "misato.runtime", { commandId, command }, "info");
      logEvent(store, `Command received: ${command.slice(0, 80)}`, "misato.runtime", "info", { commandId });
      timeline.push({ stage: "command.received", status: "completed", timestamp: nowIso(), detail: `"${command.slice(0, 60)}"` });
    },

    command_classified: async () => {
      const classification: AiClassification = await classifyCommand(command);
      emit("command.classified", "misato.orchestrator", {
        commandId, command,
        intent: classification.intent,
        project: classification.project,
        riskLevel: classification.riskLevel,
        confidence: classification.confidence
      }, "info");
      logEvent(store, `Classified: ${classification.intent} (${classification.project}, ${classification.riskLevel})`, "misato.orchestrator", "info", { commandId });
      timeline.push({ stage: "command.classified", status: "completed", timestamp: nowIso(), detail: `intent=${classification.intent} project=${classification.project} risk=${classification.riskLevel}` });
      return classification;
    },

    plan_generated: (classification: AiClassification) => {
      emit("plan.generated", "misato.orchestrator", { commandId, command, plan: classification.planSteps, intent: classification.intent }, "info");
      classification.planSteps.forEach((step: string, index: number) => {
        emit("plan_generated", "misato.orchestrator", { commandId, step, index }, "info");
      });
      logEvent(store, `Generated ${classification.planSteps.length} plan steps for ${classification.intent}`, "misato.orchestrator", "info", { commandId });
      timeline.push({ stage: "plan.generated", status: "completed", timestamp: nowIso(), detail: `${classification.planSteps.length} steps` });
      return classification;
    },

    agents_selected: (classification: AiClassification) => {
      // Greeting and daily_summary are informational intents — skip agent selection
      if (classification.intent === "greeting") {
        emit("agents.selected", "misato.orchestrator", { commandId, agents: [], skipped: true, reason: "Casual chat does not require agent assignment" }, "info");
        timeline.push({ stage: "agents.selected", status: "skipped", timestamp: nowIso(), detail: "Casual chat — no agent assignment needed" });
        return [];
      }
      if (classification.intent === "daily_summary") {
        emit("agents.selected", "misato.orchestrator", { commandId, agents: [], skipped: true, reason: "Daily summary is informational, no agent assignment needed" }, "info");
        timeline.push({ stage: "agents.selected", status: "skipped", timestamp: nowIso(), detail: "Daily summary — informational, no agent assignment" });
        return [];
      }
      if (classification.agentsRequired.length === 0) {
        emit("agents.selected", "misato.orchestrator", { commandId, agents: [], skipped: true, reason: "No agents needed for this intent" }, "info");
        timeline.push({ stage: "agents.selected", status: "skipped", timestamp: nowIso(), detail: "No agents needed" });
        return [];
      }
      const resolvedAgents = classification.agentsRequired.map((agentId: string) => {
        const agent = getAgentFromStore(store, agentId);
        return { agentId, name: agent?.name || agentId };
      });
      emit("agents.selected", "misato.orchestrator", { commandId, agents: resolvedAgents }, "info");
      logEvent(store, `Selected ${resolvedAgents.length} agents: ${resolvedAgents.map((a: any) => a.name).join(", ")}`, "misato.orchestrator", "info", { commandId });
      timeline.push({ stage: "agents.selected", status: "completed", timestamp: nowIso(), detail: `${resolvedAgents.length} agent(s)` });
      return resolvedAgents;
    },

    agents_assigned: (agents: { agentId: string; name: string }[]) => {
      if (agents.length === 0) {
        emit("agents.assigned", "misato.orchestrator", { commandId, agents: [], skipped: true, reason: "No agents to assign" }, "info");
        timeline.push({ stage: "agents.assigned", status: "skipped", timestamp: nowIso(), detail: "No agents to assign" });
        return [];
      }
      const dedupeKey = createDedupeKey(`Command: ${command.slice(0, 80)}`, "runtime");
      const dupTask = findDupTask(store, dedupeKey);
      const taskId = dupTask?.id;

      const assigned: { agentId: string; name: string; taskId?: string }[] = [];
      for (const agent of agents) {
        const agentObj = getAgentFromStore(store, agent.agentId);
        if (agentObj) {
          agentObj.currentTaskId = taskId || null;
          agentObj.currentTask = `Command: ${command.slice(0, 60)}`;
          agentObj.status = "active";
          agentObj.lastActivityAt = nowIso();
          emit("agent.assigned", "misato.agents", { commandId, agentId: agent.agentId, taskId, agent: agentObj }, "info");
          assigned.push({ ...agent, taskId });
        }
      }
      emit("agents.assigned", "misato.orchestrator", { commandId, agents: assigned, taskId }, "info");
      logEvent(store, `Assigned ${assigned.length} agent(s) to command`, "misato.orchestrator", "info", { commandId });
      timeline.push({ stage: "agents.assigned", status: "completed", timestamp: nowIso(), detail: `${assigned.length} agent(s)` });
      return assigned;
    },

    tasks_created_or_updated: (classification: AiClassification) => {
      // Greeting and daily_summary are read-only / informational — no task needed
      if (classification.intent === "greeting") {
        emit("tasks.skipped", "misato.tasks", { commandId, skipped: true, reason: "No task requested for greeting" }, "info");
        timeline.push({ stage: "tasks.created_or_updated", status: "skipped", timestamp: nowIso(), detail: "Greeting — no task needed" });
        return { tasksCreated: [], tasksUpdated: [] };
      }
      if (classification.intent === "daily_summary") {
        emit("tasks.skipped", "misato.tasks", { commandId, skipped: true, reason: "Daily summary is informational — no task needed" }, "info");
        timeline.push({ stage: "tasks.created_or_updated", status: "skipped", timestamp: nowIso(), detail: "Daily summary — no task needed" });
        return { tasksCreated: [], tasksUpdated: [] };
      }
      const title = `Command: ${command.slice(0, 80)}`;
      const dedupeKey = createDedupeKey(title, classification.project);
      const existingTask = findDupTask(store, dedupeKey);

      if (existingTask) {
        existingTask.updatedAt = nowIso();
        existingTask.activity = existingTask.activity || [];
        existingTask.activity.push({ at: nowIso(), event: "command.repeated", commandId });
        emit("task.updated", "misato.tasks", { commandId, taskId: existingTask.id, task: existingTask }, "info");
        logEvent(store, `Task updated (repeated command): ${title}`, "misato.tasks", "info", { commandId });
        timeline.push({ stage: "tasks.created_or_updated", status: "completed", timestamp: nowIso(), detail: "Updated existing task (deduplicated)" });
        return { tasksCreated: [], tasksUpdated: [existingTask] }; // Fixed: return object consistently
      }

      const task = {
        id: rid("task"),
        dedupeKey,
        sourceCommandId: commandId,
        title,
        description: classification.responseText || "",
        project: classification.project,
        priority: classification.riskLevel === "L4" ? "Urgent" : classification.riskLevel === "L0" ? "Normal" : "High",
        status: "Doing",
        ownerAgentId: classification.agentsRequired[0] || null,
        assignedAgentId: classification.agentsRequired[0] || null,
        assignedBy: "MISATO Hermes",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        scheduledAt: null,
        dueAt: null,
        tags: [classification.intent, classification.project],
        riskLevel: classification.riskLevel,
        approvalRequired: riskyPattern.test(command),
        linkedApprovalId: null,
        activity: [{ at: nowIso(), event: "task.created", commandId }]
      };
      store.tasks.unshift(task);
      emit("task.created", "misato.tasks", { commandId, taskId: task.id, task }, "info");
      logEvent(store, `Task created: ${title}`, "misato.tasks", "info", { commandId });
      timeline.push({ stage: "tasks.created_or_updated", status: "completed", timestamp: nowIso(), detail: `Created: ${task.id}` });
      return { tasksCreated: [task], tasksUpdated: [] };
    },

    task_started: (classification: AiClassification) => {
      if (classification.intent === "greeting") {
        timeline.push({ stage: "task.started", status: "skipped", timestamp: nowIso(), detail: "No task start needed for greeting" });
        return;
      }
      emit("task.started", "misato.tasks", { commandId, status: "Doing" }, "info");
      timeline.push({ stage: "task.started", status: "completed", timestamp: nowIso(), detail: "Task state: Doing" });
    },

    risk_scan_completed: (classification: AiClassification) => {
      const risks: string[] = [];
      if (riskyPattern.test(command)) {
        risks.push("Risky action category detected (deploy/auth/env/data/external action)");
        risks.push("Execution blocked pending owner approval");
      }
      if (classification.riskLevel === "L4") {
        risks.push("L4 risk threshold triggered. Requires explicit owner approval.");
      }
      const safe = risks.length === 0;
      emit("risk.scan.completed", "misato.approvals", { commandId, command, risks, safe }, safe ? "info" : "warn");
      logEvent(store, safe ? "Risk scan: safe" : `Risk scan: ${risks.length} risk(s) found`, "misato.approvals", safe ? "info" : "warn", { commandId });
      timeline.push({ stage: "risk.scan.completed", status: safe ? "completed" : "completed", timestamp: nowIso(), detail: safe ? "No risks" : `${risks.length} risk(s)` });
      return { risks, safe };
    },

    approval_queued: (classification: AiClassification) => {
      const needsApproval = riskyPattern.test(command) || classification.riskLevel === "L4";
      if (!needsApproval) {
        emit("approval.queued", "misato.approvals", { commandId, skipped: true, reason: "No approval needed" }, "info");
        timeline.push({ stage: "approval.queued", status: "skipped", timestamp: nowIso(), detail: "No approval needed" });
        return { approval: null, blocked: false };
      }

      // Approval deduplication — check for existing pending approval with same dedupeKey
      const approvalDedupeKey = `approval:${command.toLowerCase().trim()}:${classification.intent}:${classification.riskLevel}`;
      const existingApproval = (store.approvals || []).find(
        (a: any) => a.dedupeKey === approvalDedupeKey && String(a.status).toLowerCase() === "pending"
      );
      if (existingApproval) {
        emit("approval.queued", "misato.approvals", { commandId, skipped: true, reason: "Duplicate approval — superseding existing", existingApprovalId: existingApproval.id }, "info");
        existingApproval.status = "Superseded";
        existingApproval.updatedAt = nowIso();
        emit("approval.superseded", "misato.approvals", { commandId, approvalId: existingApproval.id }, "info");
        timeline.push({ stage: "approval.queued", status: "completed", timestamp: nowIso(), detail: `Superseded existing approval ${existingApproval.id}` });
        timeline.push({ stage: "approval.superseded", status: "completed", timestamp: nowIso(), detail: `Old approval ${existingApproval.id} superseded` });
        timeline.push({ stage: "command.completed", status: "blocked", timestamp: nowIso(), detail: "Blocked by approval gate (existing)" });
        return { approval: existingApproval, blocked: true };
      }

      const approval = createApprovalRecord(store, command, commandId, classification.approvalReason || "Protected action requires owner approval.", classification.riskLevel, approvalDedupeKey);

      // Link approval to blocking task
      const blockingTask = store.tasks.find((t: any) => t.sourceCommandId === commandId);
      if (blockingTask) {
        blockingTask.linkedApprovalId = approval.id;
        blockingTask.status = "Blocked";
        blockingTask.updatedAt = nowIso();
        emit("task.updated", "misato.tasks", { commandId, taskId: blockingTask.id, task: blockingTask }, "info");
      }

      emit("command.blocked", "misato.runtime", { commandId, command, approvalId: approval.id, reason: "Awaiting owner approval" }, "warn");
      timeline.push({ stage: "approval.queued", status: "completed", timestamp: nowIso(), detail: `Approval ${approval.id} created` });
      timeline.push({ stage: "command.completed", status: "blocked", timestamp: nowIso(), detail: "Blocked by approval gate" });
      return { approval, blocked: true };
    },

    command_completed: (classification: AiClassification, approvalResult: { approval: any; blocked: boolean }) => {
      if (approvalResult.blocked) return; // already blocked above

      emit("command.completed", "misato.runtime", { commandId, command, approvalRequired: false, intent: classification.intent }, "info");
      store.runtime.lastCommandAt = nowIso();
      refreshApprovalCount(store);
      logEvent(store, `Command completed: ${command.slice(0, 60)}`, "misato.runtime", "info", { commandId });
      emit("status_change", "misato.runtime", { runtimeStatus: "connected", approvalsPending: store.runtime.approvalsPending, lastCommandAt: nowIso() }, "info");
      timeline.push({ stage: "command.completed", status: "completed", timestamp: nowIso(), detail: "Completed" });
    }
  };

  // === EXECUTE PIPELINE ===
  stages.command_received();

  const classification = await stages.command_classified();
  stages.plan_generated(classification);
  const agents = stages.agents_selected(classification);
  const assigned = stages.agents_assigned(agents);
  const { tasksCreated, tasksUpdated } = stages.tasks_created_or_updated(classification);
  stages.task_started(classification);
  const { risks, safe } = stages.risk_scan_completed(classification);
  const { approval, blocked } = stages.approval_queued(classification);
  stages.command_completed(classification, { approval, blocked });

  saveStore(store);

  return {
    ok: true,
    commandId,
    command,
    intent: classification.intent,
    project: classification.project,
    riskLevel: classification.riskLevel,
    activeModel: getActiveModel(),
    fallbackModel: getFallbackModel(),
    modelUsed: getActiveModel(),
    modelProvider: getModelProvider(),
    responseSource: classification.responseSource,
    planSteps: classification.planSteps,
    selectedAgents: classification.agentsRequired,
    agentsAssigned: assigned,
    tasksCreated: tasksCreated || [],
    tasksUpdated: tasksUpdated || [],
    approvalsCreated: approval ? [approval] : [],
    riskScan: { risks, safe },
    responseText: classification.responseText,
    approvalRequired: !!approval,
    approvalReason: classification.approvalReason,
    timeline,
    nextRecommendedActions: blocked
      ? ["Review and approve the pending approval card", "Run post-approval checklist in controlled mode"]
      : ["Run next command or check task status", "Review blockers and pending approvals"],
    commandStatus: blocked ? "blocked_by_approval" : "completed"
  };
}