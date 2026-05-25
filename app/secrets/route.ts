import { NextResponse } from "next/server";
import { getSecretsStatus } from "../../lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "../../lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  return withMisatoCors(NextResponse.json(getSecretsStatus()), request);
}
