import { NextResponse } from "next/server";
import { assertOwnerJson } from "@/lib/misato/owner-guard";
import { getSecretsStatus } from "@/lib/misato/runtime/service";
import { misatoOptionsResponse, withMisatoCors } from "@/lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  try {
    const unauthorized = await assertOwnerJson(request);
    if (unauthorized) return withMisatoCors(unauthorized, request);

    return withMisatoCors(NextResponse.json(getSecretsStatus()), request);
  } catch (err) {
    return withMisatoCors(
      NextResponse.json({ ok: false, error: "secrets_status_failed", message: String(err) }, { status: 500 }),
      request
    );
  }
}