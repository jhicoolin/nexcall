import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getObsidianStatus } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  const status = getObsidianStatus();
  if (!status.configured) {
    return withMisatoCors(NextResponse.json({ ok: false, configured: false, error: "Obsidian vault not configured." }), request);
  }
  return withMisatoCors(NextResponse.json({
    ok: true, note: "Write queued for approval review (safe v1 — no auto-writes)",
    approvalRequired: true
  }), request);
}