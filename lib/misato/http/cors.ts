import { NextResponse } from "next/server";

const desktopSchemes = ["tauri://localhost", "http://tauri.localhost", "http://localhost:1420", "http://127.0.0.1:1420"];

function normalizeOrigin(origin: string | null) {
  return (origin || "").trim();
}

export function buildMisatoCorsHeaders(request: Request) {
  const origin = normalizeOrigin(request.headers.get("origin"));
  const allowOrigin = desktopSchemes.includes(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,authorization,x-misato-desktop-token,x-vercel-protection-bypass",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    // narrow CORP override for desktop/MISATO API only
    "Cross-Origin-Resource-Policy": "cross-origin"
  } as const;
}

export function withMisatoCors(response: NextResponse, request: Request) {
  const headers = buildMisatoCorsHeaders(request);
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}

export function misatoOptionsResponse(request: Request) {
  return withMisatoCors(new NextResponse(null, { status: 204 }), request);
}
