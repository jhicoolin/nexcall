import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { approvalAction } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";
export async function OPTIONS(request: Request) { return misatoOptionsResponse(request); }
export async function POST(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  const body = await request.json().catch(() => ({}));
  const result = approvalAction(body);
  return withMisatoCors(NextResponse.json(result, { status: result.ok ? 200 : 404 }), request);
}
