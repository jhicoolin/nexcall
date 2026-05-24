import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ ok: true, mode: "mock", backend: "online", ownerAuthRequired: true, liveAutomations: false });
}
