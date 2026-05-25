import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { readRedactedGitleaksSummary } from "@/lib/misato/secrets/gitleaksParser";

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json(readRedactedGitleaksSummary());
}
