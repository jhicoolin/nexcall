import { runMisatoMockCommand } from "../mock/data";
import { appendEventJsonl, loadStore, readEventLog, runtimePaths, saveStore } from "./store";
import { getRecentEvents, publishEvent } from "./event-bus";

const riskyPattern = /(deploy|production|dns|env|auth|migration|delete|billing|payment|secret|rotate|external|automation|merge)/i;

function rid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
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
    ...(payload.approvalId ? { approvalId: payload.approvalId } : {})
  };
  publishEvent(event as any);
  appendEventJsonl(event);
  return event;
}

function sanitizePayload(input: Record<string, unknown>) {
  const txt = JSON.stringify(input);
  return JSON.parse(
    txt.replace(/(token|secret|password|key)"\s*:\s*"[^"]*"/gi, '$1":"[REDACTED]"')
  );
}

function refreshApprovalCount(store: any) {
  store.runtime.approvalsPending = store.approvals.filter((a: any) => String(a.status).toLowerCase() === "pending").length;
}

function logEvent(store: any, message: string, source = "misato.runtime", severity: "info" | "warn" | "error" = "info", type = "log.created", payload: Record<string, unknown> = {}) {
  const log = {
    id: rid("log"),
    timestamp: nowIso(),
    source,
    severity,
    message,
    type,
    payload: sanitizePayload(payload)
  };
  store.logs.unshift(log);
  emit("log.created", source, { message, ...payload }, severity);
  return log;
}

export function getHealth() {
  const store = loadStore();
  const agents = store.agents || [];
  const tasks = store.tasks || [];
  return {
    ok: true,
    status: "ok",
    service: "MISATO Hermes Bridge",
    mode: store.runtime.mode,
    runtimeStatus: store.runtime.runtimeStatus,
    version: "1.0.0-local",
    uptime: process.uptime(),
    agents: { active: agents.filter((a: any) => ["active", "online", "thinking", "doing"].includes(String(a.status || "").toLowerCase())).length, total: agents.length },
    tasks: { doing: tasks.filter((t: any) => String(t.status) === "Doing").length, blocked: tasks.filter((t: any) => String(t.status) === "Blocked").length },
    events: getRecentEvents().length,
    localFirst: true,
    cloudOptional: true,
    approvalsPending: store.runtime.approvalsPending,
    paths: runtimePaths(),
    timestamp: nowIso()
  };
}

export function getRuntimeSnapshot() {
  const store = loadStore();
  return { agents: store.agents || [], tasks: store.tasks || [], approvals: store.approvals || [], logs: store.logs || [] };
}

export function getEvents(limit = 200) {
  const persisted = readEventLog(limit) as any[];
  const events = [...persisted, ...getRecentEvents()];
  return { ok: true, items: events.slice(-limit) };
}

export function getWatchtower() {
  return {
    ok: true,
    serviceHealth: "healthy",
    checkState: "local-runtime",
    mode: "local-first",
    liveExternalCalls: false,
    monitors: [
      { id: "local-runtime", name: "Local Hermes runtime", status: "up", target: "http://127.0.0.1:3000/health" },
      { id: "command", name: "Command endpoint", status: "up", target: "http://127.0.0.1:3000/api/misato/command" },
      { id: "events", name: "SSE stream", status: "up", target: "http://127.0.0.1:3000/api/misato/events/stream" }
    ]
  };
}

export function watchtowerCheck() {
  const summary = getWatchtower();
  emit("watchtower.checked", "misato.watchtower", { summary }, "info");
  return { ok: true, checkedAt: nowIso(), summary };
}

export function getSecretsStatus() {
  return {
    ok: true,
    findingsRedacted: true,
    repoOnlyScan: true,
    noRawSecretsInLogs: true,
    status: "guarded",
    findings: [],
    remediation: [{ label: "No action required", done: true }]
  };
}

export function secretScanSummary(summary?: Record<string, unknown>) {
  emit("secret.scan.checked", "misato.secrets", { summary: summary || { findings: 0 } }, "info");
  return { ok: true, receivedAt: nowIso(), redacted: true };
}

export function getLanes() {
  return {
    ok: true,
    items: [
      { id: "lane-hermes", name: "Hermes", branch: "misato-hermes-live-runtime", owner: "Hermes", status: "active", current: "Runtime orchestration", next: "Stabilize IPC fallback", responsibilities: ["runtime", "policy"], blockers: [] },
      { id: "lane-codex", name: "Codex", branch: "misato-codex-client-qa", owner: "Codex", status: "ready", current: "Runtime QA", next: "Desktop smoke", responsibilities: ["qa", "integration"], blockers: [] },
      { id: "lane-claude", name: "Claude", branch: "misato-claude-ui", owner: "Claude", status: "ready", current: "UI consumption", next: "Adapter verification", responsibilities: ["ui", "ux"], blockers: [] }
    ]
  };
}

export function assignAgent(payload: any) {
  const store = loadStore();
  const { agentId, taskId } = payload || {};
  const agent = store.agents.find((a: any) => a.id === agentId || a.agentId === agentId);
  const task = store.tasks.find((t: any) => t.id === taskId);
  if (!agent || !task) return { ok: false, error: "agent_or_task_not_found" as const };
  task.ownerAgentId = agentId;
  task.assignedAgentId = agentId;
  task.agent = agent.name || agentId;
  task.updatedAt = nowIso();
  agent.currentTaskId = taskId;
  agent.currentTask = task.title;
  agent.status = "active";
  agent.lastActivityAt = nowIso();
  emit("agent.assigned", "misato.agents", { agentId, taskId, agent, task }, "info");
  emit("task.updated", "misato.tasks", { taskId, task }, "info");
  logEvent(store, `Assigned ${task.title} to ${agent.name || agentId}`, "misato.agents");
  saveStore(store);
  return { ok: true, agent, task };
}

export function createTask(payload: any) {
  const store = loadStore();
  const task = {
    id: rid("task"),
    title: String(payload?.title || "Untitled task"),
    description: String(payload?.description || ""),
    project: String(payload?.project || "runtime"),
    priority: String(payload?.priority || "Medium"),
    status: String(payload?.status || "Idea"),
    ownerAgentId: payload?.ownerAgentId || null,
    assignedBy: payload?.assignedBy || "MISATO",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    dueAt: payload?.dueAt || null,
    tags: Array.isArray(payload?.tags) ? payload.tags : [],
    riskLevel: String(payload?.riskLevel || "Low"),
    approvalRequired: Boolean(payload?.approvalRequired),
    linkedApprovalId: payload?.linkedApprovalId || null,
    activity: []
  };
  store.tasks.unshift(task);
  emit("task.created", "misato.tasks", { taskId: task.id, task }, "info");
  logEvent(store, `Task created: ${task.title}`, "misato.tasks");
  saveStore(store);
  return { ok: true, task };
}

export function updateTask(payload: any) {
  const store = loadStore();
  const task = store.tasks.find((t: any) => t.id === payload?.id);
  if (!task) return { ok: false, error: "task_not_found" as const };
  const beforeStatus = task.status;
  const beforePriority = task.priority;
  Object.assign(task, payload, { updatedAt: nowIso() });
  emit("task.updated", "misato.tasks", { taskId: task.id, task }, "info");
  if (payload?.status && payload.status !== beforeStatus) emit("task.status_changed", "misato.tasks", { taskId: task.id, from: beforeStatus, to: payload.status }, "info");
  if (payload?.priority && payload.priority !== beforePriority) emit("task.priority_changed", "misato.tasks", { taskId: task.id, from: beforePriority, to: payload.priority }, "info");
  logEvent(store, `Task updated: ${task.title}`, "misato.tasks");
  saveStore(store);
  return { ok: true, task };
}

export function deleteTask(taskId: string) {
  const store = loadStore();
  const idx = store.tasks.findIndex((t: any) => t.id === taskId);
  if (idx < 0) return { ok: false, error: "task_not_found" as const };
  const [task] = store.tasks.splice(idx, 1);
  emit("task.deleted", "misato.tasks", { taskId, task }, "warn");
  logEvent(store, `Task deleted: ${task.title}`, "misato.tasks", "warn");
  saveStore(store);
  return { ok: true, id: taskId };
}

function createApprovalForCommand(store: any, command: string, reason: string) {
  const approval = {
    id: rid("apr"),
    title: `Approval required: ${command.slice(0, 50)}`,
    description: reason,
    riskLevel: "High",
    requestedByAgentId: "agent-hermes",
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
  emit("approval.created", "misato.approvals", { approvalId: approval.id, approval }, "warn");
  return approval;
}

export function approvalAction(payload: any) {
  const store = loadStore();
  const id = String(payload?.approvalId || payload?.id || "").trim();
  const action = String(payload?.action || "").toLowerCase();
  const approval = store.approvals.find((a: any) => a.id === id);
  if (!approval) return { ok: false, error: "approval_not_found" as const };
  const map: any = { approve: "Approved", approved: "Approved", reject: "Rejected", rejected: "Rejected", defer: "Deferred", deferred: "Deferred" };
  if (!map[action]) return { ok: false, error: "invalid_action" as const };
  approval.status = map[action];
  approval.updatedAt = nowIso();
  approval.decisionAt = nowIso();
  approval.decisionBy = payload?.decisionBy || "owner";
  refreshApprovalCount(store);
  const evtType = action.startsWith("approv") ? "approval.approved" : action.startsWith("reject") ? "approval.rejected" : "approval.deferred";
  emit(evtType, "misato.approvals", { approvalId: id, approval }, evtType === "approval.approved" ? "info" : "warn");
  logEvent(store, `Approval ${String(approval.status).toLowerCase()}: ${approval.title}`, "misato.approvals");
  saveStore(store);
  return { ok: true, approval };
}

export function resolveApproval(approvalId: string, decision: "approved" | "rejected", resolvedBy = "owner") {
  return approvalAction({ approvalId, action: decision, decisionBy: resolvedBy });
}

export function runCommand(command: string) {
  const store = loadStore();
  const base = runMisatoMockCommand(command);
  const commandId = rid("cmd");

  emit("command.received", "misato.runtime", { commandId, command }, "info");
  emit("command_received", "misato.runtime", { commandId, command, summary: "Command received" }, "info");
  emit("command.planned", "misato.orchestrator", { commandId, plan: base.hermesPlan }, "info");
  base.hermesPlan.forEach((step: string, index: number) => emit("plan_generated", "misato.orchestrator", { commandId, step, index }, "info"));

  const taskResult = createTask({
    title: `Command: ${command.slice(0, 80)}`,
    project: base.projectDetected || "runtime",
    priority: "High",
    status: "Doing",
    riskLevel: riskyPattern.test(command) ? "High" : "Low",
    approvalRequired: riskyPattern.test(command)
  });

  let approval: any = null;
  if (riskyPattern.test(command) || base.approvalRequired) {
    approval = createApprovalForCommand(
      store,
      command,
      base.approvalReason || "Requested command falls into protected action category."
    );
    emit("approval_requested", "misato.approvals", { commandId, approvalId: approval.id, approval }, "warn");
    emit("risk_detected", "misato.approvals", { commandId, command, risks: base.risksDetected }, "warn");
  }

  store.runtime.lastCommandAt = nowIso();
  refreshApprovalCount(store);
  logEvent(store, `Command processed: ${command}`, "misato.runtime", approval ? "warn" : "info", "command.completed", { commandId });
  emit("status_change", "misato.runtime", { runtimeStatus: "connected", approvalsPending: store.runtime.approvalsPending }, "info");
  emit(approval ? "command.completed" : "command.completed", "misato.runtime", { commandId, approvalRequired: Boolean(approval) }, "info");
  saveStore(store);

  return {
    ok: true,
    commandId,
    mode: store.runtime.mode,
    commandReceived: command,
    missionSummary: base.missionSummary,
    projectDetected: base.projectDetected,
    hermesPlan: base.hermesPlan,
    agentsAssigned: base.agentsAssigned,
    councilFeedback: base.councilFeedback,
    subtasksCreated: base.subtasksCreated,
    risksDetected: base.risksDetected,
    approvalRequired: Boolean(approval || base.approvalRequired),
    approvalReason: approval ? approval.description : base.approvalReason,
    logsCreated: base.logsCreated,
    nextRecommendedActions: base.nextRecommendedActions,
    moduleStatus: {
      watchtower: getWatchtower(),
      secretSentinel: getSecretsStatus(),
      lanes: getLanes().items,
      githubVercel: { optional: true, productionLocked: true }
    }
  };
}
