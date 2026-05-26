import { appendEventJsonl, loadStore, readEventLog, runtimePaths, saveStore } from "./store";
import { getRecentEvents, publishEvent } from "./event-bus";
import { executeCommand } from "./command-machine";
import { getActiveModel, getFallbackModel } from "./ai-gateway";
import { CANONICAL_BASE_URL } from "./config";

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
      { id: "local-runtime", name: "Local Hermes runtime", status: "up", target: `${CANONICAL_BASE_URL}/health` },
      { id: "command", name: "Command endpoint", status: "up", target: `${CANONICAL_BASE_URL}/api/misato/command` },
      { id: "events", name: "SSE stream", status: "up", target: `${CANONICAL_BASE_URL}/api/misato/events/stream` }
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
  const { agentId, taskId, title, description, priority, project, scheduledAt } = payload || {};

  // If taskId not provided, auto-create task from title
  if (!taskId && title) {
    const taskResult = createTask({
      title,
      description: description || "",
      project: project || "runtime",
      priority: priority || "Medium",
      status: "Doing",
      ownerAgentId: agentId,
      assignedAgentId: agentId,
      scheduledAt: scheduledAt || null,
      dedupeKey: false // allow duplicate assignments
    });
    const newTaskId = (taskResult as any)?.task?.id;
    if (!newTaskId) return { ok: false, error: "task_creation_failed" as const };
    return assignAgent({ agentId, taskId: newTaskId });
  }

  const agent = store.agents.find((a: any) => a.agentId === agentId);
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

  // Deduplication check
  const title = String(payload?.title || "Untitled task");
  const project = String(payload?.project || "runtime");
  const dedupeKey = payload?.dedupeKey || `dedupe:${project}:${title.toLowerCase().trim()}`;
  const existingTask = store.tasks.find((t: any) =>
    t.dedupeKey === dedupeKey &&
    !["Done", "Deleted", "Cancelled"].includes(String(t.status || ""))
  );
  if (existingTask && payload?.dedupeKey !== false) {
    existingTask.updatedAt = nowIso();
    existingTask.activity = (existingTask.activity as any[]) || [];
    (existingTask.activity as any[]).push({ at: nowIso(), event: "task.repeated", sourceCommandId: payload?.sourceCommandId });
    if (payload?.scheduledAt) existingTask.scheduledAt = payload.scheduledAt;
    emit("task.updated", "misato.tasks", { taskId: existingTask.id, task: existingTask }, "info");
    logEvent(store, `Task deduplicated (updated): ${title}`, "misato.tasks");
    saveStore(store);
    return { ok: true, task: existingTask, deduplicated: true };
  }

  const task = {
    id: rid("task"),
    dedupeKey,
    sourceCommandId: payload?.sourceCommandId || null,
    title,
    description: String(payload?.description || ""),
    project,
    priority: String(payload?.priority || "Medium"),
    status: String(payload?.status || "Idea"),
    ownerAgentId: payload?.ownerAgentId || null,
    assignedAgentId: payload?.assignedAgentId || null,
    assignedBy: payload?.assignedBy || "MISATO",
    scheduledAt: payload?.scheduledAt || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    dueAt: payload?.dueAt || null,
    tags: Array.isArray(payload?.tags) ? payload.tags : [],
    riskLevel: String(payload?.riskLevel || "Low"),
    approvalRequired: Boolean(payload?.approvalRequired),
    linkedApprovalId: payload?.linkedApprovalId || null,
    activity: ([{ at: nowIso(), event: "task.created", sourceCommandId: payload?.sourceCommandId }] as any[])
  };
  store.tasks.unshift(task);
  emit("task.created", "misato.tasks", { taskId: task.id, task }, "info");
  logEvent(store, `Task created: ${title}`, "misato.tasks");
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
  
  // Clean up mission references
  if (store.missions && task.id) {
    for (const mission of store.missions) {
      const tidx = (mission.taskIds || []).indexOf(String(task.id || ""));
      if (tidx >= 0) {
        mission.taskIds.splice(tidx, 1);
        mission.updatedAt = nowIso();
      }
    }
  }
  
  emit("task.deleted", "misato.tasks", { taskId, task }, "warn");
  logEvent(store, `Task deleted: ${task.title}`, "misato.tasks", "warn");
  saveStore(store);
  return { ok: true, id: taskId };
}

export function getMissions() {
  const store = loadStore();
  return { ok: true, items: (store.missions || []).slice().reverse() };
}

export function createMission(payload: any) {
  const store = loadStore();
  if (!store.missions) store.missions = [];
  const mission = {
    id: rid("msn"),
    title: String(payload?.title || "Untitled mission"),
    description: String(payload?.description || ""),
    project: String(payload?.project || "runtime"),
    priority: String(payload?.priority || "Medium"),
    status: String(payload?.status || "Pending"),
    assignedAgentId: payload?.assignedAgentId || null,
    assignedAgentName: payload?.assignedAgentName || null,
    taskIds: Array.isArray(payload?.taskIds) ? payload.taskIds : [],
    createdBy: String(payload?.createdBy || "MISATO"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
    handoffNote: payload?.handoffNote || null
  };
  store.missions.push(mission);
  emit("mission_created", "misato.agents", { missionId: mission.id, mission }, "info");
  logEvent(store, `Mission created: ${mission.title}`, "misato.agents");
  saveStore(store);
  return { ok: true, mission };
}

export function dispatchAgent(payload: any) {
  const store = loadStore();
  if (!store.missions) store.missions = [];
  const agentId = String(payload?.agentId || "").trim();
  const missionId = String(payload?.missionId || "").trim();
  const taskTitle = String(payload?.taskTitle || "Dispatched task").trim();
  const handoffNote = payload?.handoffNote || null;

  const agent = store.agents.find((a: any) => a.agentId === agentId);
  if (!agent) return { ok: false, error: "agent_not_found" as const };

  const mission = store.missions.find((m: any) => m.id === missionId);
  if (mission) {
    mission.assignedAgentId = agentId;
    mission.assignedAgentName = (agent.name as string) || agentId;
    mission.updatedAt = nowIso();
    mission.handoffNote = handoffNote;
    emit("mission_updated", "misato.agents", { missionId: mission.id, mission }, "info");
  }

  const taskResult = createTask({
    title: taskTitle,
    project: payload?.project || (mission ? mission.project : "runtime"),
    priority: payload?.priority || "Medium",
    status: "Doing",
    ownerAgentId: agentId
  });

  const taskId = (taskResult as any)?.task?.id;
  if (taskId) {
    const agentResult = assignAgent({ agentId, taskId });
    if (!agentResult.ok) {
      logEvent(store, `Dispatch: task created but assign failed for ${agent.name || agentId}`, "misato.agents", "warn");
    }
    if (mission && taskId && !mission.taskIds.includes(taskId)) {
      mission.taskIds.push(taskId);
    }
  }

  saveStore(store);
  return {
    ok: true,
    agent: { agentId: agent.agentId, name: agent.name },
    taskId,
    missionId: mission?.id || null,
    handoffNote
  };
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

export async function runCommand(command: string) {
  // Use the new 10-stage command state machine
  // Returns complete timeline with all stages
  return executeCommand(command);
}
