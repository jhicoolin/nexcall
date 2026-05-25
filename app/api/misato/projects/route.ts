import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";
import { projects } from "@/lib/misato/mock/data";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  return withMisatoCors(NextResponse.json({ ok: true, items: projects }), request);
}
