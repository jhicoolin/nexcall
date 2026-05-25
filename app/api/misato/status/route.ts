import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
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
          hint: "Missing or invalid owner session or MISATO desktop token."
        },
        { status: 401 }
      ),
      request
    );
  }

  return withMisatoCors(
    NextResponse.json({
      ok: true,
      service: "MISATO",
      mode: "mock-safe",
      ownerOnly: true,
      auth: "valid",
      desktopClient: true,
      liveAutomations: false,
      availableEndpoints: ["/api/misato/status", "/api/misato/command"],
      timestamp: new Date().toISOString()
    }),
    request
  );
}
