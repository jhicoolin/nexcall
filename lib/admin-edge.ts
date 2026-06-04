import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionSecret,
  getAdminToken,
  getEffectiveAdminToken,
  timingSafeEqualText
} from "@/lib/admin-shared";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signTokenForMiddleware(token: string) {
  const keyMaterial = new TextEncoder().encode(getAdminSessionSecret());
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(token));

  return bytesToHex(new Uint8Array(signature));
}

export async function hasAdminSessionInMiddleware(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const configuredToken = getAdminToken();

  if (bearer && configuredToken && timingSafeEqualText(bearer, configuredToken)) {
    return true;
  }

  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";

  if (!cookieValue) {
    return false;
  }

  const expectedCookieValue = await signTokenForMiddleware(getEffectiveAdminToken());
  return timingSafeEqualText(cookieValue, expectedCookieValue);
}
