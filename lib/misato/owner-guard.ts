import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/misato/auth";
import { withMisatoCors } from "@/lib/misato/http/cors";

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
  const hostCandidates = [
    request.headers.get("x-forwarded-host") || "",
    request.headers.get("host") || "",
    request.headers.get("origin") || "",
    request.headers.get("referer") || ""
  ].map((v) => v.toLowerCase());

  return hostCandidates.some((raw) => {
    if (!raw) return false;
    const normalized = raw.replace(/^https?:\/\//, "").replace(/^tauri:\/\//, "");
    return normalized.startsWith("localhost") || normalized.startsWith("127.0.0.1") || normalized.startsWith("::1") || normalized.startsWith("tauri.localhost");
  });
}

export function isLocalSoloMode(request?: Request) {
  if (isVercelRuntime()) return false;
  const envEnabled = (process.env.MISATO_LOCAL_SOLO_MODE || "false").toLowerCase() === "true";
  return envEnabled || localHostOnly(request);
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
  const provided = tokenFromRequest(request);
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
