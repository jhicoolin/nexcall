import { NextResponse } from "next/server";
import { OWNER_COOKIE } from "@/lib/misato/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
