import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionSecret,
  getAdminToken,
  getEffectiveAdminToken
} from "@/lib/admin-shared";

function signToken(token: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(token).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSessionValue() {
  return signToken(getEffectiveAdminToken());
}

export async function hasAdminSession() {
  const token = getEffectiveAdminToken();
  const expected = signToken(token);
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieSession = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";
  const bearer = headerStore.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (bearer && token && safeEqual(bearer, token)) return true;
  return Boolean(cookieSession && safeEqual(cookieSession, expected));
}

export async function requireAdmin() {
  if (await hasAdminSession()) return null;

  return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
}

export function adminCookieName() {
  return ADMIN_SESSION_COOKIE_NAME;
}
