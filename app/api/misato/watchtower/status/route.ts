import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getWatchtowerStatus } from "@/lib/misato/watchtower/uptimeKumaClient";

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;

  const data = await getWatchtowerStatus();
  return NextResponse.json(data);
}
