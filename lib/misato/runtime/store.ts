import "server-only";
import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { approvals as seedApprovals, councilAgents, logs as seedLogs, tasks as seedTasks } from "../mock/data";
import { RuntimeStore } from "./types";

const DATA_DIR = join(process.cwd(), ".misato-runtime");
const STORE_PATH = join(DATA_DIR, "state.json");
const EVENTS_PATH = join(DATA_DIR, "events.jsonl");
const USE_FILESYSTEM_STORE = !process.env.VERCEL;

type MemoryRuntime = {
  store?: RuntimeStore;
  events: string[];
};

const memoryState = globalThis as typeof globalThis & { __misatoRuntimeMemory?: MemoryRuntime };
const runtimeMemory: MemoryRuntime = memoryState.__misatoRuntimeMemory || { events: [] };
memoryState.__misatoRuntimeMemory = runtimeMemory;

function defaultStore(): RuntimeStore {
  return {
    agents: councilAgents.map((a) => ({
      agentId: a.id,
      name: a.name,
      role: a.role,
      status: String(a.status).toLowerCase(),
      riskTier: a.permissionLevel >= 4 ? "L4" : `L${Math.max(0, a.permissionLevel - 1)}`,
      permissions: a.allowedTools,
      blockedActions: a.blockedActions,
      allowedActions: a.abilities,
      approvalRequiredFor: a.approvalRules
    })),
    tasks: seedTasks,
    approvals: seedApprovals,
    logs: seedLogs,
    missions: [],
    runtime: {
      mode: "local-first",
      runtimeStatus: "connected",
      lastCommandAt: null,
      approvalsPending: seedApprovals.filter((a) => a.status === "Pending").length
    }
  };
}

function cloneStore(store: RuntimeStore): RuntimeStore {
  return JSON.parse(JSON.stringify(store)) as RuntimeStore;
}

function getMemoryStore(): RuntimeStore {
  if (!runtimeMemory.store) runtimeMemory.store = cloneStore(defaultStore());
  return runtimeMemory.store;
}

function ensureDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

export function loadStore(): RuntimeStore {
  if (!USE_FILESYSTEM_STORE) return getMemoryStore();
  ensureDir();
  if (!existsSync(STORE_PATH)) {
    const store = defaultStore();
    writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return store;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as RuntimeStore;
  return parsed;
}

export function saveStore(store: RuntimeStore) {
  if (!USE_FILESYSTEM_STORE) {
    runtimeMemory.store = cloneStore(store);
    return;
  }
  ensureDir();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function appendEventJsonl(event: unknown) {
  if (!USE_FILESYSTEM_STORE) {
    runtimeMemory.events.push(JSON.stringify(event));
    if (runtimeMemory.events.length > 1000) runtimeMemory.events.splice(0, runtimeMemory.events.length - 1000);
    return;
  }
  ensureDir();
  appendFileSync(EVENTS_PATH, `${JSON.stringify(event)}\n`, "utf8");
}

export function readEventLog(limit = 200) {
  if (!USE_FILESYSTEM_STORE) {
    return runtimeMemory.events.slice(-limit).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  }
  ensureDir();
  if (!existsSync(EVENTS_PATH)) return [];
  const lines = readFileSync(EVENTS_PATH, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

export function runtimePaths() {
  if (!USE_FILESYSTEM_STORE) {
    return { dataDir: "memory://misato-runtime", storePath: "memory://state.json", eventsPath: "memory://events.jsonl", persistence: "memory" };
  }
  return { dataDir: DATA_DIR, storePath: STORE_PATH, eventsPath: EVENTS_PATH, persistence: "filesystem" };
}
