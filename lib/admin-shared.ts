const DEVELOPMENT_ADMIN_TOKEN = "development-admin-token";
const DEVELOPMENT_ADMIN_SECRET = "development-admin-secret";

export const ADMIN_SESSION_COOKIE_NAME = "rg_admin_session";

export function getAdminToken() {
  return process.env.ADMIN_DASHBOARD_TOKEN || "";
}

export function getAdminSessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET || process.env.SECRET_ENCRYPTION_KEY || "";

  if (!configuredSecret && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET is required in production.");
  }

  return configuredSecret || DEVELOPMENT_ADMIN_SECRET;
}

export function getEffectiveAdminToken() {
  const token = getAdminToken();

  if (!token && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_DASHBOARD_TOKEN is required in production.");
  }

  return token || DEVELOPMENT_ADMIN_TOKEN;
}

export function timingSafeEqualText(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}
