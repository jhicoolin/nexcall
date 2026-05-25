import { NextResponse } from "next/server";
import { getOwnerEmail } from "@/lib/misato/auth";
import { runMisatoMockCommand } from "@/lib/misato/mock/data";
import { assertOwnerJson } from "@/lib/misato/owner-guard";

export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) {
    return NextResponse.json(
      {
        ok: false,
        auth: "invalid",
        error: "unauthorized",
        hint: "Missing or invalid owner session or MISATO desktop token."
      },
      { status: 401 }
    );
  }

  const owner = getOwnerEmail();
  if (!owner) {
    return NextResponse.json(
      {
        ok: false,
        error: "misconfigured",
        hint: "OWNER_EMAIL is required for owner-only MISATO APIs."
      },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { command?: string };
  const command = (body.command || "").trim();
  if (!command) {
    return NextResponse.json(
      { ok: false, error: "invalid_request", hint: "Command is required." },
      { status: 400 }
    );
  }

  const result = runMisatoMockCommand(command);
  return NextResponse.json({
    ok: true,
    mode: "mock-safe",
    ownerOnly: true,
    liveAutomations: false,
    result,
    timestamp: new Date().toISOString()
  });
}
