import { NextResponse } from "next/server";
import { assertOwnerJson } from "../../../../lib/misato/owner-guard";
import { getRuntimeSnapshot } from "../../../../lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "../../../../lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  const { agents } = getRuntimeSnapshot();
  return withMisatoCors(NextResponse.json({ ok: true, items: agents }), request);
}
