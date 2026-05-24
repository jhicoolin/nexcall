import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const OWNER_COOKIE = "misato_owner_session";

function getSessionSecret() {
  return process.env.OWNER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SECRET_ENCRYPTION_KEY || "misato-dev-session-secret";
}

export function getOwnerEmail() {
  return (process.env.OWNER_EMAIL || "").trim().toLowerCase();
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const SESSION_SEPARATOR = ":";

export function createOwnerSession(email: string) {
  const normalized = email.trim().toLowerCase();
  return `${normalized}${SESSION_SEPARATOR}${sign(normalized)}`;
}

export function isValidOwnerSession(value: string) {
  const idx = value.lastIndexOf(SESSION_SEPARATOR);
  if (idx <= 0) return false;
  const email = value.slice(0, idx);
  const signature = value.slice(idx + 1);
  if (!email || !signature) return false;
  if (email !== getOwnerEmail()) return false;
  return safeEqual(signature, sign(email));
}

export async function hasOwnerSession() {
  const store = await cookies();
  const session = store.get(OWNER_COOKIE)?.value || "";
  return isValidOwnerSession(session);
}
