import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { councilAgents } from "@/lib/misato/mock/data";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  return withMisatoCors(NextResponse.json({ ok: true, items: councilAgents }), request);
}
