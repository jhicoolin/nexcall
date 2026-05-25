import { NextResponse } from "next/server";
import { getRuntimeSnapshot } from "../../lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "../../lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const { tasks } = getRuntimeSnapshot();
  return withMisatoCors(NextResponse.json({ ok: true, items: tasks }), request);
}
