import { NextResponse } from "next/server";
import { misatoOptionsResponse, withMisatoCors } from "../../lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  return withMisatoCors(
    NextResponse.json(
      {
        ok: true,
        service: "nexcall",
        status: "healthy"
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow"
        }
      }
    ),
    request
  );
}
