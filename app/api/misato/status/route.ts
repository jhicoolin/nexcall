import { NextResponse } from "next/server";
import { assertOwnerJson, isDesktopTokenRequired, isLocalSoloMode, misatoAuthMode, misatoRuntimeMode } from "@/lib/misato/owner-guard";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) {
    return withMisatoCors(
      NextResponse.json(
        {
          ok: false,
          auth: "invalid",
          error: "unauthorized",
          hint: "Missing or invalid owner session or MISATO desktop token (unless Local Solo Mode)."
        },
        { status: 401 }
      ),
      request
    );
  }

  const localSolo = isLocalSoloMode(request);
  const desktopTokenRequired = isDesktopTokenRequired();

  return withMisatoCors(
    NextResponse.json({
      ok: true,
      service: "MISATO",
      mode: misatoAuthMode(request),
      ownerOnly: !localSolo,
      auth: "valid",
      desktopClient: true,
      desktopTokenRequired,
      localSoloMode: localSolo,
      runtimeMode: misatoRuntimeMode(),
      liveAutomations: false,
      availableEndpoints: ["/api/misato/status", "/api/misato/command"],
      timestamp: new Date().toISOString()
    }),
    request
  );
}
