import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getEvents, getHealth, getRuntimeSnapshot } from "@/lib/misato/runtime/service";
import { isDesktopTokenRequired, isLocalSoloMode, misatoRuntimeMode } from "@/lib/misato/owner-guard";
import { getModelResolution } from "@/lib/misato/runtime/ai-gateway";
import { CANONICAL_BASE_URL, validateCanonicalPort } from "@/lib/misato/runtime/config";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  try {
    const unauthorized = await assertOwnerJson(request);
    if (unauthorized) return withMisatoCors(unauthorized, request);

    // Runtime-health gate: fail loud if runtime is unavailable
    const portCheck = validateCanonicalPort();
    if (!portCheck.ok) {
      return withMisatoCors(
        NextResponse.json({ ok: false, error: portCheck.message, baseUrl: CANONICAL_BASE_URL }, { status: 503 }),
        request
      );
    }

    const health = getHealth();
    const snapshot = getRuntimeSnapshot();
    const latestEvent = getEvents(1).items.at(-1) as { timestamp?: string } | undefined;
    const agents = snapshot.agents || [];
    const tasks = snapshot.tasks || [];
    const activeAgents = agents.filter((agent: any) => {
      const status = String(agent?.status || agent?.state || "").toLowerCase();
      return ["active", "online", "thinking", "doing"].includes(status);
    }).length;
    const activeTasks = tasks.filter((task: any) => String(task?.status || "").toLowerCase() === "doing").length;
    const pendingApprovals = (snapshot.approvals || []).filter((approval: any) => String(approval?.status || "").toLowerCase() === "pending").length;
    const localSoloMode = isLocalSoloMode(request);
    const resolution = getModelResolution();

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
        baseUrl: CANONICAL_BASE_URL,
        runtimeOrigin: CANONICAL_BASE_URL,
        connectionMode: health.runtimeStatus === "connected" ? "local-runtime" : "not-connected",
        activeModel: resolution.model,
        resolvedModel: resolution.model,
        resolvedVersion: resolution.modelVersion,
        fallbackModel: health.fallbackModel,
        modelProvider: resolution.provider,
        modelReady: resolution.ready,
        credentialState: resolution.credentialState,
        credentialSource: resolution.credentialSource,
        credentialSources: resolution.discoveredSources,
        lastResponseSource: health.lastResponseSource,
        lastResponseAt: health.lastResponseAt,
        lastInvocationModel: health.lastInvocationModel,
        lastInvocationProvider: health.lastInvocationProvider,
        lastInvocationFallbackUsed: health.lastInvocationFallbackUsed,
        lastInvocationFallbackReason: health.lastInvocationFallbackReason,
        fallbackUsed: health.fallbackUsed,
        fallbackReason: health.fallbackReason,
        modelResolution: resolution,
        verificationStatus: health.lastResponseSource === "hermes-ai" ? "verified" : health.lastResponseSource === "deterministic-fallback" ? "fallback_explicit" : resolution.ready ? "credential_resolved" : "unverified",
        persistenceMode: health.paths?.persistence || "filesystem",
        activeAgents,
        activeTasks,
        pendingApprovals,
        totalAgents: agents.length,
        queueDepth: activeTasks,
        lastEventAt: latestEvent?.timestamp || health.timestamp || null,
        lastVerifiedAt: health.lastResponseAt || health.timestamp,
        capabilities: {
          command: true,
          taskCrud: true,
          agentAssign: true,
          approvals: true,
          schedule: true,
          lanes: true,
          obsidian: !!process.env.OBSIDIAN_VAULT_PATH,
          secretSentinel: true,
          watchtower: true,
          sse: true
        }
      }),
      request
    );
  } catch (err) {
    return withMisatoCors(
      NextResponse.json({ ok: false, error: "status_failed", message: String(err) }, { status: 500 }),
      request
    );
  }
}
