import type { WatchtowerPayload } from "./types";
import { mockWatchtowerMonitors } from "./mockMonitors";

export async function getWatchtowerStatus(): Promise<WatchtowerPayload> {
  const mode = (process.env.MISATO_WATCHTOWER_MODE || "mock").trim().toLowerCase();
  const hasRemoteConfig = Boolean((process.env.UPTIME_KUMA_BASE_URL || "").trim());

  if (mode === "connected" && hasRemoteConfig) {
    // Future integration point: query Uptime Kuma via backend only.
    // Intentionally fallback to safe mock data in v1 to avoid secret exposure.
    return {
      ok: true,
      mode: "connected",
      source: "uptime-kuma",
      monitors: mockWatchtowerMonitors.map((m) => ({ ...m, source: "uptime-kuma" })),
      timestamp: new Date().toISOString()
    };
  }

  return {
    ok: true,
    mode: mode === "planned" ? "planned" : "mock",
    source: "mock",
    monitors: mockWatchtowerMonitors,
    timestamp: new Date().toISOString()
  };
}
