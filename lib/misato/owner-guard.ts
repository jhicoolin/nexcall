import { NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/misato/auth";

function tokenFromRequest(request?: Request) {
  if (!request) return "";
  return (request.headers.get("x-misato-desktop-token") || "").trim();
}

function configuredDesktopToken() {
  return (process.env.MISATO_DESKTOP_AUTH_TOKEN || "").trim();
}

function hasValidDesktopToken(request?: Request) {
  const configured = configuredDesktopToken();
  const provided = tokenFromRequest(request);
  return !!configured && !!provided && configured === provided;
}

export async function assertOwnerJson(request?: Request) {
  if (await hasOwnerSession()) return null;
  if (hasValidDesktopToken(request)) return null;
  return NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 401 });
}
