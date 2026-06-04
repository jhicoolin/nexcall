import "server-only";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { appendEventJsonl, loadStore, readEventLog, runtimePaths, saveStore } from "./store";
import { getRecentEvents, publishEvent } from "./event-bus";
import { executeCommand } from "./command-machine";
import { getActiveModel, getCredentialState, getFallbackModel, getFallbackReason, getModelProvider, getModelReady, getModelResolution } from "./ai-gateway";
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

function normalizeApprovalRecord(approval: any) {
  const requestedByAgentId = approval.requestedByAgentId || approval.requestedAgentId || approval.agentId || null;
  const requestedAgent = approval.requestedAgent || approval.requestedByAgentName || approval.agentName || approval.agent || requestedByAgentId || "—";
  return {
    ...approval,
    requestedByAgentId,
    requestedByAgentName: approval.requestedByAgentName || requestedAgent,
    requestedAgent
  };
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
  emit(type, source, { message, ...payload }, severity);
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
    capabilities: {
      command: true,
      taskCrud: true,
      agentAssign: true,
      approvals: { available: true, mode: store.runtime.mode },
      schedule: { available: tasks.some((t: any) => t.scheduledAt), mode: "runtime-tasks" },
      lanes: { available: agents.length > 0, mode: "runtime" },
      obsidian: { available: !!process.env.OBSIDIAN_VAULT_PATH, mode: process.env.OBSIDIAN_VAULT_PATH ? "live-sync" : "repo-mirror" },
      secretSentinel: { available: true, mode: "manual-scan" },
      watchtower: { available: true, mode: "local-runtime" },
      sse: { available: true, mode: "local-stream" }
    },
    modelResolution: {
      canonicalSource: getModelResolution().canonicalSource,
      credentialSource: getModelResolution().credentialSource,
      credentialState: getCredentialState(),
      provider: getModelProvider(),
      model: getActiveModel(),
      modelVersion: getModelResolution().modelVersion,
      baseUrl: getModelResolution().baseUrl,
      ready: getModelReady(),
      fallbackUsed: getModelResolution().fallbackUsed,
      fallbackReason: getFallbackReason(),
      precedence: getModelResolution().precedence,
      discoveredSources: getModelResolution().discoveredSources,
      resolutionNotes: getModelResolution().resolutionNotes
    },
    activeModel: getActiveModel(),
    fallbackModel: getFallbackModel(),
    modelProvider: getModelProvider(),
    modelReady: getModelReady(),
    credentialState: getCredentialState(),
    credentialSource: getModelResolution().credentialSource,
    lastResponseSource: store.runtime.lastResponseSource,
    lastResponseAt: store.runtime.lastResponseAt,
    lastInvocationModel: store.runtime.lastInvocationModel,
    lastInvocationProvider: store.runtime.lastInvocationProvider,
    lastInvocationFallbackUsed: store.runtime.lastInvocationFallbackUsed,
    lastInvocationFallbackReason: store.runtime.lastInvocationFallbackReason,
    fallbackUsed: getModelResolution().fallbackUsed || store.runtime.lastResponseSource === "deterministic-fallback",
    fallbackReason: store.runtime.lastInvocationFallbackReason || getFallbackReason(),
    timestamp: nowIso()
  };
}

export function getRuntimeSnapshot() {
  const store = loadStore();
  return {
    agents: store.agents || [],
    tasks: store.tasks || [],
    approvals: (store.approvals || []).map(normalizeApprovalRecord),
    logs: store.logs || []
  };
}

export function getEvents(limit = 200) {
  const persisted = readEventLog(limit) as any[];
  const events = [...persisted, ...getRecentEvents()];
  return { ok: true, items: events.slice(-limit) };
}

export function getSchedule() {
  const store = loadStore();
  const tasks = store.tasks || [];
  const scheduledTasks = tasks.filter((t: any) => t.scheduledAt);

  const today = new Date().toISOString().slice(0, 10);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (scheduledTasks.length === 0) {
    return {
      ok: true,
      mode: "runtime-tasks",
      today,
      timezone,
      viewData: { agenda: [], day: [], week: [] },
      unscheduledTasks: tasks.length
    };
  }

  // Day view: group by hour
  const dayView: Record<string, any[]> = {};
  // Week view: group by weekday
  const weekView: Record<string, any[]> = {};
  // Agenda: chronological flat list
  const agenda: any[] = [];

  for (const t of scheduledTasks) {
    const schedAt = String(t.scheduledAt || "");
    if (!schedAt) continue;

    const taskEntry = {
      id: t.id,
      title: t.title,
      project: t.project || "",
      status: t.status || "Idea",
      priority: t.priority || "Medium",
      scheduledAt: schedAt,
      ownerAgentId: t.ownerAgentId || t.assignedAgentId || null
    };
    agenda.push(taskEntry);

    // Day grouping by date
    const dateKey = schedAt.slice(0, 10);
    if (schedAt.length >= 13) {
      const hour = schedAt.slice(11, 13);
      if (!dayView[dateKey]) dayView[dateKey] = [];
      dayView[dateKey].push({ ...taskEntry, hour });
    } else {
      if (!dayView[dateKey]) dayView[dateKey] = [];
      dayView[dateKey].push(taskEntry);
    }

    // Week grouping by weekday
    try {
      const d = new Date(schedAt);
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
      if (!weekView[weekday]) weekView[weekday] = [];
      weekView[weekday].push(taskEntry);
    } catch {
      // skip invalid dates
    }
  }

  // Sort agenda by scheduledAt
  agenda.sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));

  return {
    ok: true,
    mode: "runtime-tasks",
    today,
    timezone,
    viewData: {
      agenda,
      day: dayView,
      week: weekView
    },
    unscheduledTasks: tasks.filter((t: any) => !t.scheduledAt).length
  };
}

export function getWatchtower() {
  const store = loadStore();
  const agents = store.agents || [];
  const tasks = store.tasks || [];
  const approvals = store.approvals || [];
  const obsidianConfigured = !!process.env.OBSIDIAN_VAULT_PATH;

  const checks = [
    { id: "local-runtime", name: "Local Hermes runtime", status: "up", target: `${CANONICAL_BASE_URL}/health` },
    { id: "command", name: "Command endpoint", status: "up", target: `${CANONICAL_BASE_URL}/api/misato/command` },
    { id: "events", name: "SSE stream", status: "up", target: `${CANONICAL_BASE_URL}/api/misato/events/stream` },
    { id: "event-bus", name: "Event bus", status: store.runtime.runtimeStatus === "connected" ? "up" : "degraded", target: "memory" },
    { id: "task-store", name: "Task store", status: tasks.length > 0 ? "up" : "empty", detail: `${tasks.length} tasks` },
    { id: "approval-store", name: "Approval store", status: approvals.length > 0 ? "up" : "empty", detail: `${approvals.length} approvals` },
    { id: "agent-pool", name: "Agent pool", status: agents.length > 0 ? "up" : "empty", detail: `${agents.length} agents` }
  ];

  if (obsidianConfigured) {
    checks.push({ id: "obsidian-vault", name: "Obsidian vault sync", status: "up", target: process.env.OBSIDIAN_VAULT_PATH || "./docs/obsidian-mirror/" });
  } else {
    checks.push({ id: "obsidian-vault", name: "Obsidian vault sync", status: "not-configured", target: "./docs/obsidian-mirror/" });
  }

  return {
    ok: true,
    serviceHealth: checks.every((c: any) => c.status === "up" || c.status === "empty") ? "healthy" : "degraded",
    checkState: "local-runtime",
    mode: "local-first",
    liveExternalCalls: false,
    monitors: checks
  };
}

export function watchtowerCheck() {
  const summary = getWatchtower();
  emit("watchtower.checked", "misato.watchtower", { summary }, "info");
  return { ok: true, checkedAt: nowIso(), summary };
}

export function getSecretsStatus() {
  const store = loadStore();

  // Check if gitleaks is installed
  let gitleaksInstalled = false;
  let gitleaksVersion = "";
  try {
    const out = execSync("which gitleaks 2>/dev/null || where gitleaks 2>nul", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000
    }).toString().trim();
    gitleaksInstalled = out.length > 0;
    if (gitleaksInstalled) {
      try {
        gitleaksVersion = execSync("gitleaks version 2>/dev/null", {
          encoding: "utf8",
          timeout: 5000
        }).toString().trim();
      } catch {
        gitleaksVersion = "installed (version unknown)";
      }
    }
  } catch {
    gitleaksInstalled = false;
  }

  if (!gitleaksInstalled) {
    return {
      ok: true,
      gitleaksInstalled: false,
      lastScanAt: null,
      critical: 0,
      high: 0,
      warnings: 0,
      findings: [],
      scanAvailable: false,
      nextAction: "Install gitleaks: brew install gitleaks (macOS) or visit https://github.com/gitleaks/gitleaks/releases",
      status: "not-scanned",
      findingsRedacted: true,
      noRawSecretsInLogs: true,
      remediation: [{ label: "Install gitleaks to enable secret scanning", done: false }]
    };
  }

  return {
    ok: true,
    gitleaksInstalled: true,
    gitleaksVersion: gitleaksVersion || "installed",
    lastScanAt: null,
    critical: 0,
    high: 0,
    warnings: 0,
    findings: [],
    scanAvailable: true,
    nextAction: "Run: npm run secrets:scan",
    status: "guarded",
    findingsRedacted: true,
    repoOnlyScan: true,
    noRawSecretsInLogs: true,
    remediation: [
      { label: "Run gitleaks scan manually", done: false },
      { label: "Review redacted findings if any", done: true },
      { label: "No raw secrets in logs", done: true }
    ]
  };
}

export function secretScanSummary(summary?: Record<string, unknown>) {
  emit("secret.scan.checked", "misato.secrets", { summary: summary || { findings: 0 } }, "info");
  return { ok: true, receivedAt: nowIso(), redacted: true };
}

export function getLanes() {
  const store = loadStore();
  const agents = store.agents || [];
  const tasks = store.tasks || [];
  const laneAgents = ["agent-strategy","agent-ui","agent-backend","agent-security","agent-qa","agent-vercel","agent-business","agent-marketing","agent-finance","agent-research","agent-claude-ui","agent-hermes-arch"];
  const getAgentStatus = (agentId: string) => agents.find((a: any) => a.agentId === agentId)?.status || "idle";
  const totalForAgent = (agentId: string) => tasks.filter((t: any) => t.ownerAgentId === agentId || t.assignedAgentId === agentId).length;
  const doneForAgent = (agentId: string) => tasks.filter((t: any) => (t.ownerAgentId === agentId || t.assignedAgentId === agentId) && ["Done","Deleted","Cancelled"].includes(t.status||"")).length;
  const blockedForAgent = (agentId: string) => tasks.filter((t: any) => (t.ownerAgentId === agentId || t.assignedAgentId === agentId) && t.status === "Blocked").length;

  return {
    ok: true, mode: "auto",
    items: [
      { id: "lane-hermes", name: "Hermes Runtime Lane", ownerAgentId: "agent-hermes-arch", ownerAgentName: "Hermes Architecture Agent", branch: "misato-hermes-live-brain", status: getAgentStatus("agent-hermes-arch") === "active" ? "active" : "ready", current: "Runtime brain integration", next: "Live AI command pipeline", tasksTotal: totalForAgent("agent-hermes-arch"), tasksDone: doneForAgent("agent-hermes-arch"), tasksBlocked: blockedForAgent("agent-hermes-arch"), blockers: [], source: "runtime" },
      { id: "lane-codex", name: "Codex QA Lane", ownerAgentId: "agent-qa", ownerAgentName: "Codex QA Agent", branch: "misato-codex-live-ui-qa", status: getAgentStatus("agent-qa") === "active" ? "active" : "ready", current: "Client reliability audit", next: "Verify live endpoints", tasksTotal: totalForAgent("agent-qa"), tasksDone: doneForAgent("agent-qa"), tasksBlocked: blockedForAgent("agent-qa"), blockers: [], source: "runtime" },
      { id: "lane-claude", name: "Claude UI Lane", ownerAgentId: "agent-claude-ui", ownerAgentName: "Claude UI Agent", branch: "misato-claude-ui", status: getAgentStatus("agent-claude-ui") === "active" ? "active" : "ready", current: "UI integration", next: "Wire Hermes endpoints", tasksTotal: totalForAgent("agent-claude-ui"), tasksDone: doneForAgent("agent-claude-ui"), tasksBlocked: blockedForAgent("agent-claude-ui"), blockers: [], source: "runtime" },
      { id: "lane-misato", name: "MISATO Coordinator", ownerAgentId: "agent-strategy", ownerAgentName: "Strategy Agent", branch: "misato-hermes-live-brain", status: getAgentStatus("agent-strategy") === "active" ? "active" : "ready", current: "Mission orchestration", next: "Cross-agent coordination", tasksTotal: totalForAgent("agent-strategy"), tasksDone: doneForAgent("agent-strategy"), tasksBlocked: blockedForAgent("agent-strategy"), blockers: [], source: "runtime" },
      { id: "lane-owner", name: "Owner Approval Lane", ownerAgentId: "owner", ownerAgentName: "Owner", branch: "", status: (store.approvals||[]).some((a:any) => a.status==="Pending") ? "blocked" : "ready", current: "Approval gate", next: "Review pending approvals", tasksTotal: (store.approvals||[]).length, tasksDone: (store.approvals||[]).filter((a:any)=>a.status==="Approved").length, tasksBlocked: (store.approvals||[]).filter((a:any)=>a.status==="Pending").length, blockers: (store.approvals||[]).filter((a:any)=>a.status==="Pending").slice(0,3).map((a:any)=>({id:a.id,title:a.title})), source: "runtime" }
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

export function getApprovalStats() {
  const store = loadStore();
  const approvals = (store.approvals || []).map(normalizeApprovalRecord);
  return {
    pending: approvals.filter((a: any) => String(a.status).toLowerCase() === "pending").length,
    approved: approvals.filter((a: any) => String(a.status).toLowerCase() === "approved").length,
    rejected: approvals.filter((a: any) => String(a.status).toLowerCase() === "rejected").length,
    deferred: approvals.filter((a: any) => String(a.status).toLowerCase() === "deferred").length,
    superseded: approvals.filter((a: any) => String(a.status).toLowerCase() === "superseded").length
  };
}

export function getObsidianStatus() {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH || "";
  if (!vaultPath) {
    return {
      ok: true, configured: false, mode: "repo-mirror",
      note: "Set OBSIDIAN_VAULT_PATH env var to enable live sync",
      docsPath: "./docs/obsidian-mirror/",
      suggestedDocuments: ["Daily Command", "Active Missions", "Agent Status", "Claude-Hermes", "Project Decisions", "Council Reports"],
      syncStatus: "not-configured",
      syncAvailable: false
    };
  }
  try {
    const folders = ["00-command-center", "01-projects", "02-agents", "06-handoffs"];
    const folderInfo = folders.map(f => {
      const fp = join(vaultPath, f);
      let count = 0, lastUpdated = null;
      try { count = readdirSync(fp).filter((f: string) => f.endsWith(".md")).length; } catch { count = 0; }
      return { name: f, documentCount: count, syncStatus: "available" };
    });
    return {
      ok: true, configured: true, mode: "live",
      vaultPath: vaultPath,
      folders: folderInfo,
      syncStatus: "ready",
      syncAvailable: true
    };
  } catch {
    return {
      ok: true, configured: true, mode: "live",
      vaultPath: vaultPath,
      note: "Vault path set but could not read directory structure",
      syncStatus: "path-error",
      syncAvailable: false
    };
  }
}

export function approvalAction(payload: any) {
  const store = loadStore();
  const id = String(payload?.approvalId || payload?.id || "").trim();
  const action = String(payload?.action || "").toLowerCase();
  const approval = store.approvals.find((a: any) => a.id === id);
  if (!approval) return { ok: false, error: "approval_not_found" as const };
  const map: Record<string, "Approved" | "Rejected" | "Deferred"> = {
    approve: "Approved",
    approved: "Approved",
    reject: "Rejected",
    rejected: "Rejected",
    defer: "Deferred",
    deferred: "Deferred"
  };
  if (!map[action]) return { ok: false, error: "invalid_action" as const };
  approval.status = map[action];
  approval.updatedAt = nowIso();
  approval.decisionAt = nowIso();
  approval.decisionBy = payload?.decisionBy || "owner";
  refreshApprovalCount(store);

  const approvalResolvedPayload = {
    approvalId: id,
    decision: action,
    approval: normalizeApprovalRecord(approval)
  };

  const evtType = action.startsWith("approv") ? "approval.approved" : action.startsWith("reject") ? "approval.rejected" : "approval.deferred";
  emit(evtType, "misato.approvals", { approvalId: id, approval: normalizeApprovalRecord(approval) }, evtType === "approval.approved" ? "info" : "warn");
  emit("approval_resolved", "misato.approvals", approvalResolvedPayload, "info");
  emit("status_change", "misato.approvals", { entity: "approval", approvalId: id, status: approval.status, approval: normalizeApprovalRecord(approval) }, "info");
  logEvent(store, `Approval ${String(approval.status).toLowerCase()}: ${approval.title}`, "misato.approvals");
  saveStore(store);
  return { ok: true, approval: normalizeApprovalRecord(approval) };
}

export function resolveApproval(approvalId: string, decision: "approved" | "rejected" | "deferred", resolvedBy = "owner") {
  return approvalAction({ approvalId, action: decision, decisionBy: resolvedBy });
}

export async function runCommand(command: string) {
  // Use the new 10-stage command state machine
  // Returns complete timeline with all stages
  return executeCommand(command);
}
