import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getWatchtowerStatus } from "@/lib/misato/watchtower/uptimeKumaClient";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);

  const data = await getWatchtowerStatus();
  return withMisatoCors(NextResponse.json(data), request);
}
