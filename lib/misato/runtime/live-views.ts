import { projects as seedProjects } from "../mock/data";
import { getRuntimeSnapshot } from "./service";

type LiveTask = Record<string, any>;
type LiveAgent = Record<string, any>;
type LiveApproval = Record<string, any>;
type LiveLog = Record<string, any>;

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function projectKey(task: LiveTask) {
  return String(task.projectId || task.project || "runtime").trim() || "runtime";
}

function priorityRank(priority: string) {
  const normalized = String(priority || "Medium").toLowerCase();
  if (normalized === "high") return 3;
  if (normalized === "medium") return 2;
  return 1;
}

function riskRank(risk: string) {
  const normalized = String(risk || "Low").toLowerCase();
  if (normalized === "high") return 3;
  if (normalized === "medium") return 2;
  return 1;
}

function statusRank(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "blocked") return 4;
  if (normalized === "doing") return 3;
  if (normalized === "idea") return 2;
  if (normalized === "done") return 1;
  return 0;
}

function deriveProjectStatus(tasks: LiveTask[]) {
  if (tasks.some((task) => String(task.status || "").toLowerCase() === "blocked")) return "Blocked";
  if (tasks.some((task) => String(task.status || "").toLowerCase() === "doing")) return "Active";
  if (tasks.length > 0 && tasks.every((task) => String(task.status || "").toLowerCase() === "done")) return "Complete";
  return tasks.length > 0 ? "Planning" : "Idea";
}

function mapProjectName(key: string) {
  const seed = seedProjects.find((project) => project.id === key || project.slug === key || slugify(project.name) === key);
  if (seed) return seed.name;
  if (key === "runtime") return "Runtime";
  return titleCase(key);
}

function mapProjectDescription(key: string, count: number) {
  const seed = seedProjects.find((project) => project.id === key || project.slug === key || slugify(project.name) === key);
  if (seed) return seed.description;
  return `Live runtime project derived from ${count} task${count === 1 ? "" : "s"}.`;
}

export function getLiveProjects() {
  const { tasks } = getRuntimeSnapshot();
  const groups = new Map<string, LiveTask[]>();

  for (const task of tasks as LiveTask[]) {
    const key = projectKey(task);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  }

  return Array.from(groups.entries())
    .map(([key, projectTasks]) => {
      const openTasks = projectTasks.filter((task) => !["done", "deleted", "cancelled"].includes(String(task.status || "").toLowerCase()));
      const completedTasks = projectTasks.filter((task) => String(task.status || "").toLowerCase() === "done");
      const blockedTasks = projectTasks.filter((task) => String(task.status || "").toLowerCase() === "blocked");
      const highestPriority = projectTasks.reduce((acc, task) => Math.max(acc, priorityRank(task.priority)), 1);
      const highestRisk = projectTasks.reduce((acc, task) => Math.max(acc, riskRank(task.riskLevel)), 1);
      const earliestDue = [...projectTasks]
        .map((task) => String(task.dueDate || task.dueAt || ""))
        .filter(Boolean)
        .sort()[0] || null;
      const nextOpen = openTasks[0] || projectTasks[0] || null;
      const liveProjectId = key;
      const seed = seedProjects.find((project) => project.id === key || project.slug === key || slugify(project.name) === key);
      const slug = seed?.slug || slugify(seed?.name || projectTasks[0]?.project || key || "runtime") || key;

      return {
        id: liveProjectId,
        slug,
        name: mapProjectName(key),
        description: mapProjectDescription(key, projectTasks.length),
        status: deriveProjectStatus(projectTasks),
        priority: highestPriority === 3 ? "High" : highestPriority === 2 ? "Medium" : "Low",
        currentObjective: nextOpen?.title || "Review live runtime backlog",
        nextAction: blockedTasks.length
          ? `Clear ${blockedTasks.length} blocked task${blockedTasks.length === 1 ? "" : "s"}`
          : nextOpen
            ? `Advance ${nextOpen.title}`
            : "No open tasks remain",
        dueDate: earliestDue || new Date().toISOString().slice(0, 10),
        notes: `Live MISATO runtime view derived from ${projectTasks.length} task${projectTasks.length === 1 ? "" : "s"}.`,
        riskLevel: highestRisk === 3 ? "High" : highestRisk === 2 ? "Medium" : "Low",
        taskCount: projectTasks.length,
        openCount: openTasks.length,
        completedCount: completedTasks.length,
        blockedCount: blockedTasks.length,
        tasks: projectTasks
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getLiveProjectBySlug(slug: string) {
  const needle = String(slug || "").toLowerCase();
  return getLiveProjects().find((project) => String(project.slug).toLowerCase() === needle || String(project.id).toLowerCase() === needle || slugify(project.name) === needle) || null;
}

export function getLiveProjectTasks(slugOrId: string) {
  const needle = String(slugOrId || "").toLowerCase();
  const { tasks } = getRuntimeSnapshot();
  return (tasks as LiveTask[]).filter((task) => {
    const key = projectKey(task).toLowerCase();
    const slug = slugify(String(task.project || task.projectId || ""));
    return key === needle || slug === needle || String(task.projectId || "").toLowerCase() === needle;
  });
}

export function getLiveCouncilAgents() {
  const { agents } = getRuntimeSnapshot();
  return (agents as LiveAgent[]).map((agent) => ({
    id: String(agent.agentId || agent.id || ""),
    name: String(agent.name || agent.agentName || agent.agentId || "Agent"),
    role: String(agent.role || "Runtime role"),
    abilities: Array.isArray(agent.allowedActions) ? agent.allowedActions : Array.isArray(agent.abilities) ? agent.abilities : [],
    blockedActions: Array.isArray(agent.blockedActions) ? agent.blockedActions : [],
    allowedTools: Array.isArray(agent.permissions) ? agent.permissions : Array.isArray(agent.allowedTools) ? agent.allowedTools : [],
    memoryScope: String(agent.memoryScope || "Live runtime scope"),
    riskLevel: String(agent.riskTier || agent.riskLevel || "Low").replace(/^L\d+$/i, "Low"),
    permissionLevel: Number(agent.permissionLevel || agent.permission || 2),
    approvalRules: Array.isArray(agent.approvalRequiredFor) ? agent.approvalRequiredFor : Array.isArray(agent.approvalRules) ? agent.approvalRules : [],
    status: String(agent.status || "Idle")
  }));
}

export function getLiveCouncilAgent(id: string) {
  const needle = String(id || "").toLowerCase();
  return getLiveCouncilAgents().find((agent) => String(agent.id).toLowerCase() === needle) || null;
}

export function getLiveToolPermissions() {
  return getLiveCouncilAgents().flatMap((agent) =>
    (agent.allowedTools || []).map((tool: string, index: number) => ({
      id: `${agent.id}-${index}`,
      agentId: agent.id,
      tool,
      allowed: true,
      permissionLevel: agent.permissionLevel,
      approvalRequired: agent.permissionLevel >= 3,
      riskLevel: agent.riskLevel
    }))
  );
}

export function getLiveMemoryEntries() {
  const { tasks, approvals, logs } = getRuntimeSnapshot();
  const liveLogs = (logs as LiveLog[]).slice(0, 2);
  const pendingApprovals = (approvals as LiveApproval[]).filter((approval) => String(approval.status || "").toLowerCase() === "pending");
  const openTasks = (tasks as LiveTask[]).filter((task) => !["done", "deleted", "cancelled"].includes(String(task.status || "").toLowerCase()));

  const entries = [
    ...liveLogs.map((log, index) => ({
      id: `log-${index}`,
      project: String(log.project || "MISATO"),
      scope: "Runtime log",
      summary: String(log.action || log.message || "Live runtime log event")
    })),
    ...(pendingApprovals[0]
      ? [{
          id: "approval-summary",
          project: String(pendingApprovals[0].project || "MISATO"),
          scope: "Approval queue",
          summary: `${pendingApprovals.length} approval${pendingApprovals.length === 1 ? "" : "s"} pending live review.`
        }]
      : []),
    ...(openTasks[0]
      ? [{
          id: "task-summary",
          project: String(openTasks[0].project || openTasks[0].projectId || "MISATO"),
          scope: "Task ledger",
          summary: `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} in the live runtime.`
        }]
      : [])
  ];

  if (entries.length === 0) {
    return [{
      id: "memory-empty",
      project: "MISATO",
      scope: "Runtime memory",
      summary: "Live memory summaries are not yet populated."
    }];
  }

  return entries;
}

export function getLiveProjectSummaryCounts() {
  const projects = getLiveProjects();
  return {
    total: projects.length,
    highPriority: projects.filter((project) => String(project.priority).toLowerCase() === "high").length,
    blocked: projects.filter((project) => String(project.status).toLowerCase() === "blocked").length,
    active: projects.filter((project) => String(project.status).toLowerCase() === "active").length
  };
}
