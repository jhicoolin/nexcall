export type WatchtowerStatus = "up" | "down" | "degraded" | "unknown";
export type WatchtowerSource = "mock" | "uptime-kuma" | "vercel" | "manual";

export type WatchtowerMonitor = {
  id: string;
  name: string;
  url: string;
  status: WatchtowerStatus;
  responseTimeMs: number;
  uptimePercent: number;
  lastCheckedAt: string;
  incidentCount: number;
  source: WatchtowerSource;
  notes?: string;
};

export type WatchtowerPayload = {
  ok: boolean;
  mode: "mock" | "planned" | "connected";
  source: "mock" | "uptime-kuma";
  monitors: WatchtowerMonitor[];
  timestamp: string;
};
