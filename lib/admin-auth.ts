import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "rg_admin_session";

function getAdminToken() {
  return process.env.ADMIN_DASHBOARD_TOKEN || "";
}

function signToken(token: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SECRET_ENCRYPTION_KEY || "development-admin-secret";

  return createHmac("sha256", secret).update(token).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSessionValue() {
  const token = getAdminToken();

  if (!token && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_DASHBOARD_TOKEN is required in production.");
  }

  return signToken(token || "development-admin-token");
}

export async function hasAdminSession() {
  const token = getAdminToken() || "development-admin-token";
  const expected = signToken(token);
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieSession = cookieStore.get(COOKIE_NAME)?.value || "";
  const bearer = headerStore.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (bearer && token && safeEqual(bearer, token)) return true;
  return Boolean(cookieSession && safeEqual(cookieSession, expected));
}

export async function requireAdmin() {
  if (await hasAdminSession()) return null;

  return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
}

export function adminCookieName() {
  return COOKIE_NAME;
}
