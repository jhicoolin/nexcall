import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/misato/auth";

function tokenFromRequest(request?: Request) {
  if (!request) return "";
  return (request.headers.get("x-misato-desktop-token") || "").trim();
}

function configuredDesktopToken() {
  return (process.env.MISATO_DESKTOP_AUTH_TOKEN || "").trim();
}

function isProdRuntime() {
  return process.env.NODE_ENV === "production";
}

function isVercelRuntime() {
  return !!process.env.VERCEL;
}

function localHostOnly(request?: Request) {
  if (!request) return false;
  const host = (request.headers.get("host") || "").toLowerCase();
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export function isLocalSoloMode(request?: Request) {
  if (isProdRuntime() || isVercelRuntime()) return false;
  const envEnabled = (process.env.MISATO_LOCAL_SOLO_MODE || "false").toLowerCase() === "true";
  return envEnabled || localHostOnly(request);
}

export function isDesktopTokenRequired() {
  if (isProdRuntime()) return true;
  const configured = (process.env.MISATO_REQUIRE_DESKTOP_TOKEN || "true").toLowerCase();
  return configured !== "false";
}

function hasValidDesktopToken(request?: Request) {
  const configured = configuredDesktopToken();
  const provided = tokenFromRequest(request);
  return !!configured && !!provided && configured === provided;
}

export async function assertOwnerJson(request?: Request) {
  if (await hasOwnerSession()) return null;
  if (isLocalSoloMode(request)) return null;
  if (hasValidDesktopToken(request)) return null;
  if (!isDesktopTokenRequired() && !isProdRuntime()) return null;
  return NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 401 });
}
