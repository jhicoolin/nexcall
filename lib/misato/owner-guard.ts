import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/misato/auth";
import { withMisatoCors } from "@/lib/misato/http/cors";
import { getDesktopToken, isLocalRequest } from "@/lib/misato/request-context";

function configuredDesktopToken() {
  return (process.env.MISATO_DESKTOP_AUTH_TOKEN || "").trim();
}

function isProdRuntime() {
  return process.env.NODE_ENV === "production";
}

function isVercelRuntime() {
  return !!process.env.VERCEL;
}

export function isLocalSoloMode(request?: Request) {
  if (isVercelRuntime()) return false;
  const envEnabled = (process.env.MISATO_LOCAL_SOLO_MODE || "false").toLowerCase() === "true";
  return envEnabled || isLocalRequest(request);
}

export function isDesktopTokenRequired() {
  if (isProdRuntime()) return true;
  const configured = (process.env.MISATO_REQUIRE_DESKTOP_TOKEN || "true").toLowerCase();
  return configured !== "false";
}

export function misatoRuntimeMode() {
  return (process.env.MISATO_RUNTIME_MODE || "mock").trim() || "mock";
}

export function misatoAuthMode(request?: Request) {
  if (isLocalSoloMode(request)) return "local-solo";
  if (isProdRuntime()) return "production-locked";
  return "preview-simple";
}

function hasValidDesktopToken(request?: Request) {
  const configured = configuredDesktopToken();
  const provided = getDesktopToken(request);
  return !!configured && !!provided && configured === provided;
}

export async function assertOwnerJson(request?: Request) {
  if (isLocalSoloMode(request)) return null;

  if (isProdRuntime()) {
    return hasValidDesktopToken(request)
      ? null
      : withMisatoCors(NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 401 }), request || new Request("http://localhost"));
  }

  if (await hasOwnerSession()) return null;
  if (hasValidDesktopToken(request)) return null;
  if (!isDesktopTokenRequired()) return null;

  return withMisatoCors(NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 401 }), request || new Request("http://localhost"));
}
