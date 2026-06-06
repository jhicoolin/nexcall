import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, OPTIONS",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}

export async function GET(_request: Request) {
  return NextResponse.json(
    { ok: true, service: "nexcall", status: "healthy" },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache"
      }
    }
  );
}
