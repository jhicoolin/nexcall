import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";
import { runCommand } from "@/lib/misato/runtime/service";

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
  return withMisatoCors(NextResponse.json(result), request);
}
