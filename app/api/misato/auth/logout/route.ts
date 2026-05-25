import { NextResponse } from "next/server";
import { OWNER_COOKIE } from "@/lib/misato/auth";
import { misatoOptions, withMisatoCors } from "@/lib/misato/http/cors";

export function OPTIONS() {
  return misatoOptions();
}

export async function POST() {
  const response = withMisatoCors(NextResponse.json({ ok: true }));
  response.cookies.set(OWNER_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
