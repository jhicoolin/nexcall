import { NextResponse } from "next/server";
import { adminCookieName, createAdminSessionValue } from "@/lib/admin-auth";
import {
  assertAllowedFields,
  checkRateLimit,
  cleanText,
  originGuardResponse,
  rateLimitResponse,
  readJsonObject,
  timingSafeEqualText,
  validationResponse
} from "@/lib/security";

export async function POST(request: Request) {
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const limit = await checkRateLimit(request, {
    bucket: "admin-session",
    limit: 5,
    windowSeconds: 5 * 60
  });

  if (!limit.allowed) return rateLimitResponse(limit);

  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 1000);
  } catch (error) {
    return validationResponse(error);
  }

  try {
    assertAllowedFields(payload, ["token"]);
  } catch (error) {
    return validationResponse(error);
  }

  const submittedToken = cleanText(payload.token, 500);
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN || "";
  const expectedToken = adminToken || "development-admin-token";

  if (!adminToken && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Admin login is not configured." }, { status: 503 });
  }

  if (!timingSafeEqualText(submittedToken, expectedToken)) {
    return NextResponse.json({ ok: false, error: "Invalid admin token." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}

export async function DELETE(request: Request) {
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookieName());
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}
