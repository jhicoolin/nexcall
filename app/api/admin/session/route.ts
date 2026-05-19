import { NextResponse } from "next/server";
import { adminCookieName, createAdminSessionValue } from "@/lib/admin-auth";
import { cleanText, readJsonObject, validationResponse } from "@/lib/security";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 1000);
  } catch (error) {
    return validationResponse(error);
  }

  const submittedToken = cleanText(payload.token, 500);
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN || "development-admin-token";

  if (submittedToken !== adminToken) {
    return NextResponse.json({ ok: false, error: "Invalid admin token." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieName());

  return response;
}
