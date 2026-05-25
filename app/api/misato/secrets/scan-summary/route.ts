import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { secretScanSummary } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";
export async function OPTIONS(request: Request) { return misatoOptionsResponse(request); }
export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  const body = await request.json().catch(() => ({}));
  return withMisatoCors(NextResponse.json(secretScanSummary(body)), request);
}
