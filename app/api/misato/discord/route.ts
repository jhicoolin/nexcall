import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ ok: true, connected: false, mode: "mock", note: "Discord command center not connected in v1." });
}
