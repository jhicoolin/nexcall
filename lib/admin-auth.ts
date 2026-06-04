import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "rg_admin_session";

export type AdminAuthConfig = {
  token: string;
  secret: string;
};

function getEnvValue(value: string | undefined) {
  return (value || "").trim();
}

export function getAdminAuthConfig(): AdminAuthConfig | null {
  const token = getEnvValue(process.env.ADMIN_DASHBOARD_TOKEN);
  const secret = getEnvValue(process.env.ADMIN_SESSION_SECRET || process.env.SECRET_ENCRYPTION_KEY);

  if (process.env.NODE_ENV === "production" && (!token || !secret)) {
    return null;
  }

  if (!token || !secret) {
    return null;
  }

  return { token, secret };
}

function signToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSessionValue() {
  const config = getAdminAuthConfig();

  if (!config) {
    throw new Error("Admin auth is not configured.");
  }

  return signToken(config.token, config.secret);
}

export async function hasAdminSession() {
  const config = getAdminAuthConfig();
  if (!config) return false;

  const expected = signToken(config.token, config.secret);
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieSession = cookieStore.get(COOKIE_NAME)?.value || "";
  const bearer = headerStore.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (bearer && safeEqual(bearer, config.token)) return true;
  return Boolean(cookieSession && safeEqual(cookieSession, expected));
}

export async function requireAdmin() {
  if (await hasAdminSession()) return null;

  return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
}

export function adminCookieName() {
  return COOKIE_NAME;
}
