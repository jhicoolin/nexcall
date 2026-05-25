import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";
import { getEvents, getHealth, getRuntimeSnapshot } from "@/lib/misato/runtime/service";
import { isDesktopTokenRequired, isLocalSoloMode, misatoRuntimeMode } from "@/lib/misato/owner-guard";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);

  const health = getHealth();
  const snapshot = getRuntimeSnapshot();
  const latestEvent = getEvents(1).items.at(-1) as { timestamp?: string } | undefined;
  const activeAgents = (snapshot.agents || []).filter((agent: any) => {
    const status = String(agent?.status || agent?.state || "").toLowerCase();
    return ["active", "online", "thinking", "doing"].includes(status);
  }).length;
  const activeTasks = (snapshot.tasks || []).filter((task: any) => String(task?.status || "").toLowerCase() === "doing").length;
  const pendingApprovals = (snapshot.approvals || []).filter((approval: any) => String(approval?.status || "").toLowerCase() === "pending").length;
  const localSoloMode = isLocalSoloMode(request);

  return withMisatoCors(
    NextResponse.json({
      ...health,
      runtimeMode: misatoRuntimeMode(),
      localSoloMode,
      desktopTokenRequired: localSoloMode ? false : isDesktopTokenRequired(),
      productionLocked: process.env.NODE_ENV === "production" && !localSoloMode,
      hermesConnected: health.runtimeStatus === "connected",
      runtimeConnected: health.ok === true && health.status === "ok",
      eventStreamAvailable: true,
      persistenceMode: health.paths?.persistence || "filesystem",
      activeAgents,
      activeTasks,
      pendingApprovals,
      lastEventAt: latestEvent?.timestamp || health.timestamp || null
    }),
    request
  );
}
