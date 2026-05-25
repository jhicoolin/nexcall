import { NextResponse } from "next/server";
import { runCommand } from "../../lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "../../lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { command?: string };
  const command = (body.command || "").trim();
  if (!command) {
    return withMisatoCors(NextResponse.json({ ok: false, error: "invalid_request", hint: "Command is required." }, { status: 400 }), request);
  }
  return withMisatoCors(NextResponse.json(runCommand(command)), request);
}
