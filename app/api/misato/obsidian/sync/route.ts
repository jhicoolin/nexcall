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
    return withMisatoCors(NextResponse.json({ ok: false, configured: false, error: "Obsidian vault not configured. Set OBSIDIAN_VAULT_PATH to enable sync." }), request);
  }
  return withMisatoCors(NextResponse.json({ ok: true, synced: true, note: "Obsidian sync would write runtime docs to vault (safe v1 — no writes executed)" }), request);
}