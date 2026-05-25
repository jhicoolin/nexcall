import type { WatchtowerMonitor } from "./types";

const now = () => new Date().toISOString();

export const mockWatchtowerMonitors: WatchtowerMonitor[] = [
  { id: "wt-1", name: "NexCall production", url: "https://nexcall.one", status: "unknown", responseTimeMs: 0, uptimePercent: 99.1, lastCheckedAt: now(), incidentCount: 1, source: "mock", notes: "Production route visibility is intentionally separate from MISATO preview." },
  { id: "wt-2", name: "NexCall Vercel preview", url: "https://nexcall-git-misato-full-build-pixelmiles1-5825s-projects.vercel.app", status: "up", responseTimeMs: 240, uptimePercent: 99.8, lastCheckedAt: now(), incidentCount: 0, source: "mock", notes: "Primary preview lane for MISATO validation." },
  { id: "wt-3", name: "MISATO API status", url: "/api/misato/status", status: "up", responseTimeMs: 180, uptimePercent: 99.7, lastCheckedAt: now(), incidentCount: 0, source: "mock", notes: "Owner-only auth expected." },
  { id: "wt-4", name: "MISATO command endpoint", url: "/api/misato/command", status: "up", responseTimeMs: 260, uptimePercent: 99.6, lastCheckedAt: now(), incidentCount: 0, source: "mock", notes: "Mock-safe council output only in v1." },
  { id: "wt-5", name: "Vercel deployment status", url: "vercel://nexcall/misato-full-build", status: "degraded", responseTimeMs: 0, uptimePercent: 98.9, lastCheckedAt: now(), incidentCount: 1, source: "manual", notes: "Requires manual redeploy confirmation when env changes." },
  { id: "wt-6", name: "GitHub repo status", url: "https://github.com/jhicoolin/nexcall", status: "up", responseTimeMs: 120, uptimePercent: 99.9, lastCheckedAt: now(), incidentCount: 0, source: "mock", notes: "Branch workflow active." },
  { id: "wt-7", name: "Obsidian bridge status", url: "obsidian://vault", status: "unknown", responseTimeMs: 0, uptimePercent: 100, lastCheckedAt: now(), incidentCount: 0, source: "manual", notes: "Vault writes disabled until owner approval." },
  { id: "wt-8", name: "Discord bot status", url: "discord://misato", status: "unknown", responseTimeMs: 0, uptimePercent: 100, lastCheckedAt: now(), incidentCount: 0, source: "manual", notes: "Planning/mock-safe only." },
  { id: "wt-9", name: "Desktop client status", url: "misato-desktop://local", status: "up", responseTimeMs: 90, uptimePercent: 99.5, lastCheckedAt: now(), incidentCount: 0, source: "manual", notes: "Desktop build should be validated with tauri build." }
];
