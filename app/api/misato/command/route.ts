import { NextResponse } from "next/server";
import { getOwnerEmail } from "@/lib/misato/auth";
import { runMisatoMockCommand } from "@/lib/misato/mock/data";
import { assertOwnerJson, isLocalSoloMode, misatoAuthMode, misatoRuntimeMode } from "@/lib/misato/owner-guard";
import { subagentRegistry } from "@/lib/misato/subagents/registry";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) {
    return withMisatoCors(
      NextResponse.json(
        {
          ok: false,
          auth: "invalid",
          error: "unauthorized",
          hint: "Missing or invalid owner session or MISATO desktop token."
        },
        { status: 401 }
      ),
      request
    );
  }

  const localSolo = isLocalSoloMode(request);
  const owner = getOwnerEmail();
  if (!owner && !localSolo) {
    return withMisatoCors(
      NextResponse.json(
        {
          ok: false,
          error: "misconfigured",
          hint: "OWNER_EMAIL is required for owner-only MISATO APIs."
        },
        { status: 500 }
      ),
      request
    );
  }

  const body = (await request.json().catch(() => ({}))) as { command?: string };
  const command = (body.command || "").trim();
  if (!command) {
    return withMisatoCors(
      NextResponse.json(
        { ok: false, error: "invalid_request", hint: "Command is required." },
        { status: 400 }
      ),
      request
    );
  }

  const result = runMisatoMockCommand(command);
  const moduleStatus = {
    watchtower: { serviceHealth: "healthy", checkState: "mock", mode: "planned", endpoint: "/api/misato/watchtower/status", liveExternalCalls: false },
    designLibrary: { designMdActive: true, claudeUiGuideActive: true, checklistStatus: "in-progress" },
    secretSentinel: { gitleaksStatus: "manual", findingsRedacted: true, repoOnlyScan: true, endpoint: "/api/misato/secrets/status" },
    obsidianMirror: { mirrorStatus: "planned", liveWrites: false, approvalRequiredForWrites: true },
    githubVercel: { branch: process.env.VERCEL_GIT_COMMIT_REF || "misato-hermes-backend", previewState: "allowed", productionLocked: true },
    lanes: {
      hermesBackend: "active",
      codexReliability: "active",
      claudeUi: "active",
      coordinator: "active",
      ownerApproval: result.approvalRequired ? "pending" : "ready"
    }
  };

  return withMisatoCors(
    NextResponse.json({
      ok: true,
      mode: misatoAuthMode(request),
      ownerOnly: !localSolo,
      localSoloMode: localSolo,
      runtimeMode: misatoRuntimeMode(),
      liveAutomations: false,
      commandReceived: command,
      missionSummary: result.missionSummary,
      projectDetected: result.projectDetected,
      hermesPlan: result.hermesPlan,
      agentsAssigned: result.agentsAssigned,
      councilFeedback: result.councilFeedback,
      subtasksCreated: result.subtasksCreated,
      risksDetected: result.risksDetected,
      approvalRequired: result.approvalRequired,
      approvalReason: result.approvalReason ?? null,
      logsCreated: result.logsCreated,
      nextRecommendedActions: result.nextRecommendedActions,
      moduleStatus,
      councilRegistry: subagentRegistry.map(({ id, name, role, capabilities, approvalRequiredFor }) => ({ id, name, role, capabilities, approvalRequiredFor })),
      result: {
        ...result,
        moduleStatus
      },
      timestamp: new Date().toISOString()
    }),
    request
  );
}
