import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";
import { getObsidianStatus, getRuntimeSnapshot, getSecretsStatus, getWatchtower, runCommand } from "@/lib/misato/runtime/service";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);

  const body = (await request.json().catch(() => ({}))) as { command?: string };
  const command = (body.command || "").trim();
  if (!command) {
    return withMisatoCors(NextResponse.json({ ok: false, error: "invalid_request", hint: "Command is required." }, { status: 400 }), request);
  }

  const result = await runCommand(command);
  const runtimeSnapshot = getRuntimeSnapshot() as any;
  const watchtower = getWatchtower();
  const secretSentinel = getSecretsStatus();
  const obsidianMirror = getObsidianStatus();
  const blocked = Boolean(result.approvalRequired || result.commandStatus === "blocked_by_approval");

  const missionSummary =
    result.responseText?.split("\n").filter(Boolean).slice(0, 2).join(" ") ||
    `Intent ${result.intent} for ${result.project}`;

  const hermesPlan = {
    summary: `${result.intent} · ${result.project} · ${result.riskLevel}`,
    executionMode: blocked ? "approval-required" : "assisted",
    recommendedAgentPath: Array.isArray(result.selectedAgents) ? result.selectedAgents : [],
  };

  const councilFeedback = [
    {
      source: "Hermes Runtime",
      message: result.responseText?.slice(0, 240) || "Runtime command completed.",
      intent: result.intent,
      project: result.project,
    },
  ];

  const subtasksCreated = Array.isArray(result.tasksCreated)
    ? result.tasksCreated.map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignedAgentId: task.assignedAgentId || task.ownerAgentId || null,
      }))
    : [];

  const risksDetected = Array.isArray(result.riskScan?.risks) ? result.riskScan.risks : [];

  const logsCreated = Array.isArray(result.timeline)
    ? result.timeline.map((stage: any) => ({
        stage: stage.stage,
        status: stage.status,
        timestamp: stage.timestamp,
        detail: stage.detail || null,
      }))
    : [];

  const moduleStatus = {
    watchtower,
    designSystem: {
      ok: true,
      status: "available",
      source: "desktop-ui",
      live: true,
    },
    secretSentinel: secretSentinel,
    obsidianMirror,
    githubHandoffs: {
      ok: true,
      status: "available",
      source: "docs/agent-handoffs",
      live: true,
    },
  };

  return withMisatoCors(
    NextResponse.json({
      ...result,
      mode: runtimeSnapshot.runtimeMode || runtimeSnapshot.mode || "local-runtime",
      missionSummary,
      projectDetected: result.project,
      hermesPlan,
      agentsAssigned: Array.isArray(result.agentsAssigned) ? result.agentsAssigned : [],
      councilFeedback,
      subtasksCreated,
      risksDetected,
      approvalRequired: blocked,
      approvalReason: result.approvalReason || (blocked ? "Protected action requires owner approval." : null),
      logsCreated,
      nextRecommendedActions: Array.isArray(result.nextRecommendedActions) ? result.nextRecommendedActions : [],
      moduleStatus,
      result,
    }),
    request
  );
}
