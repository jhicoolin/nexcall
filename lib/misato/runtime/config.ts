/**
 * MISATO Runtime Config — Single source of truth for the canonical runtime target.
 *
 * Every consumer (API routes, middleware, UI, desktop client, docs) MUST read
 * the canonical base URL from here. Never hardcode `http://127.0.0.1:3010`
 * in individual files.
 */

export const CANONICAL_PORT = 3010;
export const CANONICAL_HOST = "127.0.0.1";
export const CANONICAL_BASE_URL = `http://${CANONICAL_HOST}:${CANONICAL_PORT}`;
export const CANONICAL_ORIGIN = `http://${CANONICAL_HOST}:${CANONICAL_PORT}`;

/** Human-readable label for the runtime connection mode. */
export type ConnectionMode =
  | "local-runtime"   // Running on localhost, prod build
  | "not-connected"   // Runtime store loaded but no health
  | "vercel-prod"     // Running on Vercel production
  | "vercel-preview"  // Running on Vercel preview
  | "railway"         // Running on Railway
  | "unknown";        // Can't determine

export function detectConnectionMode(): ConnectionMode {
  if (process.env.VERCEL && process.env.NODE_ENV === "production") return "vercel-prod";
  if (process.env.VERCEL) return "vercel-preview";
  if (process.env.RAILWAY_SERVICE_NAME) return "railway";
  // On local, runtimeStatus comes from the store
  return "local-runtime";
}

/** Validate that the current process is running on the canonical port. */
export function validateCanonicalPort(): { ok: boolean; message: string } {
  const actualPort = process.env.PORT || "3010";
  if (String(actualPort) !== String(CANONICAL_PORT)) {
    return {
      ok: false,
      message: `Runtime is on port ${actualPort}, but canonical port is ${CANONICAL_PORT}. Set PORT=${CANONICAL_PORT}.`
    };
  }
  return { ok: true, message: `Canonical port ${CANONICAL_PORT}` };
}

/** Validate that a request's host matches the canonical target. */
export function validateRequestTarget(request?: Request | null): { ok: boolean; actual: string; expected: string } {
  const expected = CANONICAL_BASE_URL;
  if (!request) return { ok: true, actual: "no-request", expected };
  const host = request.headers.get("host") || "";
  const origin = request.headers.get("origin") || "";
  const actualTarget = origin || `http://${host}`;
  // Allow localhost variations
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("::1");
  return { ok: isLocal, actual: actualTarget, expected };
}

/** Returns the canonical runtime info object for API responses. */
export function getRuntimeTargetInfo() {
  return {
    baseUrl: CANONICAL_BASE_URL,
    canonicalPort: CANONICAL_PORT,
    connectionMode: detectConnectionMode(),
    isLocal: !process.env.VERCEL,
    isVercel: !!process.env.VERCEL,
    isRailway: !!process.env.RAILWAY_SERVICE_NAME,
    production: process.env.NODE_ENV === "production"
  };
}