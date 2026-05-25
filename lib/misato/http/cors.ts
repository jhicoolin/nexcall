import { NextResponse } from "next/server";

export const misatoCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-misato-desktop-token, x-vercel-protection-bypass, authorization",
  "Access-Control-Max-Age": "86400",
  "Cross-Origin-Resource-Policy": "cross-origin"
} as const;

export function withMisatoCors(response: NextResponse) {
  for (const [key, value] of Object.entries(misatoCorsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export function misatoJson(body: unknown, init?: ResponseInit) {
  return withMisatoCors(NextResponse.json(body, init));
}

export function misatoOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: misatoCorsHeaders
  });
}
