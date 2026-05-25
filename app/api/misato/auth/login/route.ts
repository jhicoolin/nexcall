import { NextResponse } from "next/server";
import { OWNER_COOKIE, createOwnerSession, getOwnerEmail } from "@/lib/misato/auth";
import { misatoJson, misatoOptions, withMisatoCors } from "@/lib/misato/http/cors";

export function OPTIONS() {
  return misatoOptions();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; token?: string };
  const email = (body.email || "").trim().toLowerCase();
  const token = body.token || "";

  if (!email || email !== getOwnerEmail()) {
    return misatoJson({ ok: false, error: "Unauthorized owner email." }, { status: 403 });
  }

  const requiredToken = process.env.ADMIN_DASHBOARD_TOKEN || "";
  if (!requiredToken || token !== requiredToken) {
    return misatoJson({ ok: false, error: "Invalid owner token." }, { status: 401 });
  }

  const response = withMisatoCors(NextResponse.json({ ok: true }));
  response.cookies.set(OWNER_COOKIE, createOwnerSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
