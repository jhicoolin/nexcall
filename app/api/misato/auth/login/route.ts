import { NextResponse } from "next/server";
import { OWNER_COOKIE, createOwnerSession, getOwnerEmail } from "@/lib/misato/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; token?: string };
  const email = (body.email || "").trim().toLowerCase();
  const token = body.token || "";

  if (!email || email !== getOwnerEmail()) {
    return NextResponse.json({ ok: false, error: "Unauthorized owner email." }, { status: 403 });
  }

  const requiredToken = process.env.ADMIN_DASHBOARD_TOKEN || "";
  if (!requiredToken || token !== requiredToken) {
    return NextResponse.json({ ok: false, error: "Invalid owner token." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_COOKIE, createOwnerSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
