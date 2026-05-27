import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getSchedule } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);
  try {
    const data = getSchedule();
    return withMisatoCors(NextResponse.json(data), request);
  } catch (e) {
    return withMisatoCors(NextResponse.json({ ok: false, error: "schedule_error" }, { status: 500 }), request);
  }
}