import { NextResponse } from "next/server";

export type JsonObject = Record<string, unknown>;

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type ReplayEntry = {
  expiresAt: number;
};

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowSeconds: number;
  identity?: string;
};

type RateLimitResult = {
  allowed: boolean;
  configured: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  failClosed?: boolean;
};

const globalSecurityState = globalThis as typeof globalThis & {
  __nexcallRouteRateLimitStore?: Map<string, RateLimitEntry>;
  __nexcallReplayProtectionStore?: Map<string, ReplayEntry>;
};
const routeRateLimitStore =
  globalSecurityState.__nexcallRouteRateLimitStore || new Map<string, RateLimitEntry>();
const replayProtectionStore =
  globalSecurityState.__nexcallReplayProtectionStore || new Map<string, ReplayEntry>();

globalSecurityState.__nexcallRouteRateLimitStore = routeRateLimitStore;
globalSecurityState.__nexcallReplayProtectionStore = replayProtectionStore;

const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a moment and try again.";

export async function readRawBody(request: Request, maxBytes = 12000): Promise<string> {
  const body = await request.text();

  if (new TextEncoder().encode(body).length > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  return body;
}

export async function readJsonObject(request: Request, maxBytes = 12000): Promise<JsonObject> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new RequestValidationError("Expected application/json.", 415);
  }

  const body = await request.text();

  if (!body.trim()) {
    throw new RequestValidationError("Request body is required.");
  }

  if (new TextEncoder().encode(body).length > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  try {
    const parsed = JSON.parse(body) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new RequestValidationError("JSON body must be an object.");
    }

    return parsed as JsonObject;
  } catch (error) {
    if (error instanceof RequestValidationError) {
      throw error;
    }

    throw new RequestValidationError("Invalid JSON body.");
  }
}

export function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanIdentifier(value: unknown, maxLength = 80) {
  return cleanText(value, maxLength).replace(/[^a-zA-Z0-9_.:-]/g, "-");
}

export function isHoneypotTriggered(
  payload: Record<string, unknown>,
  fields = ["companyWebsiteConfirm", "websiteConfirm", "website"]
) {
  return fields.some((field) => cleanText(payload[field], 120).length > 0);
}

export function assertAllowedFields(
  payload: Record<string, unknown>,
  allowedFields: string[],
  context = "request body"
) {
  const allowed = new Set(allowedFields);
  const unexpected = Object.keys(payload).filter((field) => !allowed.has(field));

  if (unexpected.length > 0) {
    throw new RequestValidationError(
      `Unexpected field in ${context}: ${cleanIdentifier(unexpected[0], 80)}.`,
      400
    );
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isValidPhone(value: string) {
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized.length >= 7 && normalized.length <= 20;
}

export function isAllowedServerUrl(value: string) {
  try {
    const url = new URL(value);
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && isLocal);
  } catch {
    return false;
  }
}

export function getSafeSiteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (configured && isAllowedServerUrl(configured)) {
    return configured.replace(/\/$/, "");
  }

  const origin = request.headers.get("origin") || "";

  if (origin && isAllowedServerUrl(origin)) {
    return origin.replace(/\/$/, "");
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
    const fromHost = `${proto}://${host}`;

    if (isAllowedServerUrl(fromHost)) {
      return fromHost.replace(/\/$/, "");
    }
  }

  return "http://localhost:3000";
}

export function validationResponse(error: unknown) {
  if (error instanceof RequestValidationError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }

  return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function hashIdentifier(value: unknown) {
  const input = String(value || "unknown");
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
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

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function shouldRequireDurableRateLimit() {
  return process.env.REQUIRE_UPSTASH_RATE_LIMIT === "true";
}

function currentBucket(windowSeconds: number) {
  return Math.floor(Date.now() / (windowSeconds * 1000));
}

function pruneMemoryRateLimits(now: number) {
  for (const [key, entry] of routeRateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      routeRateLimitStore.delete(key);
    }
  }
}

function pruneReplayProtection(now: number) {
  for (const [key, entry] of replayProtectionStore.entries()) {
    if (entry.expiresAt <= now) {
      replayProtectionStore.delete(key);
    }
  }
}

function checkMemoryRateLimit(identity: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const resetAt = (currentBucket(options.windowSeconds) + 1) * options.windowSeconds * 1000;
  const key = `${cleanIdentifier(options.bucket, 80)}:${currentBucket(options.windowSeconds)}:${hashIdentifier(identity)}`;

  pruneMemoryRateLimits(now);

  const existing = routeRateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    routeRateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      configured: false,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAt
    };
  }

  existing.count += 1;
  routeRateLimitStore.set(key, existing);

  return {
    allowed: existing.count <= options.limit,
    configured: false,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt
  };
}

export async function checkRateLimit(request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const identity = options.identity || getClientIp(request);
  const upstash = getUpstashConfig();
  const resetAt = (currentBucket(options.windowSeconds) + 1) * options.windowSeconds * 1000;

  if (!upstash) {
    if (shouldRequireDurableRateLimit()) {
      return {
        allowed: false,
        configured: false,
        limit: options.limit,
        remaining: 0,
        resetAt,
        failClosed: true
      };
    }

    return checkMemoryRateLimit(identity, options);
  }

  const key = `nexcall:${cleanIdentifier(options.bucket, 80)}:${currentBucket(options.windowSeconds)}:${hashIdentifier(identity)}`;

  try {
    const response = await fetch(`${upstash.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, options.windowSeconds + 10]
      ])
    });

    if (response.ok) {
      const results = (await response.json().catch(() => [])) as Array<{ result?: number }>;
      const count = Number(results[0]?.result || 0);

      return {
        allowed: count <= options.limit,
        configured: true,
        limit: options.limit,
        remaining: Math.max(0, options.limit - count),
        resetAt
      };
    }

    console.warn("[NEXCALL_RATE_LIMIT_FALLBACK]", {
      bucket: cleanIdentifier(options.bucket, 80),
      status: response.status
    });
  } catch (error) {
    console.warn("[NEXCALL_RATE_LIMIT_FALLBACK]", {
      bucket: cleanIdentifier(options.bucket, 80),
      message: error instanceof Error ? error.message : "Unknown rate limiter error"
    });
  }

  if (shouldRequireDurableRateLimit()) {
    return {
      allowed: false,
      configured: true,
      limit: options.limit,
      remaining: 0,
      resetAt,
      failClosed: true
    };
  }

  return checkMemoryRateLimit(identity, options);
}

async function rememberReplayKeyInMemory(identity: string, ttlSeconds: number) {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  pruneReplayProtection(now);

  const existing = replayProtectionStore.get(identity);

  if (existing && existing.expiresAt > now) {
    return { fresh: false, configured: false };
  }

  replayProtectionStore.set(identity, { expiresAt });
  return { fresh: true, configured: false };
}

export async function rememberReplayKey(bucket: string, identity: string, ttlSeconds: number) {
  const replayIdentity = `nexcall:replay:${cleanIdentifier(bucket, 80)}:${hashIdentifier(identity)}`;
  const upstash = getUpstashConfig();

  if (!upstash) {
    return rememberReplayKeyInMemory(replayIdentity, ttlSeconds);
  }

  try {
    const response = await fetch(`${upstash.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([["SET", replayIdentity, "1", "EX", ttlSeconds, "NX"]])
    });

    if (response.ok) {
      const results = (await response.json().catch(() => [])) as Array<{ result?: string | null }>;
      return {
        fresh: results[0]?.result === "OK",
        configured: true
      };
    }
  } catch (error) {
    console.warn("[NEXCALL_REPLAY_GUARD_FALLBACK]", {
      bucket: cleanIdentifier(bucket, 80),
      message: error instanceof Error ? error.message : "Unknown replay protection error"
    });
  }

  return rememberReplayKeyInMemory(replayIdentity, ttlSeconds);
}

export function rateLimitResponse(result: RateLimitResult) {
  const status = result.failClosed ? 503 : 429;
  const message = result.failClosed ? "API protection is temporarily unavailable." : RATE_LIMIT_MESSAGE;

  return NextResponse.json(
    { ok: false, success: false, error: message, message },
    {
      status,
      headers: {
        "Retry-After": Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)).toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toString()
      }
    }
  );
}

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return "";
  }
}

export function isTrustedRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) return true;

  const allowed = new Set<string>();
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL;
  const configuredOrigin = configuredSite ? normalizeOrigin(configuredSite) : "";
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (configuredOrigin) allowed.add(configuredOrigin);
  if (host) {
    allowed.add(`https://${host}`);
    if (process.env.NODE_ENV !== "production" || forwardedProto === "http") {
      allowed.add(`http://${host}`);
    }
    allowed.add(`${forwardedProto}://${host}`);
  }

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  return allowed.has(normalizeOrigin(origin));
}

export function originGuardResponse(request: Request) {
  if (isTrustedRequestOrigin(request)) return null;

  return NextResponse.json(
    { ok: false, success: false, error: "Invalid request origin.", message: "Invalid request origin." },
    { status: 403 }
  );
}

export function normalizeEmail(value: unknown) {
  return cleanText(value, 254).toLowerCase();
}

export function maskEmailForLog(value?: string) {
  const email = cleanText(value, 254);
  const [name, domain] = email.split("@");

  if (!name || !domain) return "not-provided";

  return `${name.slice(0, 2)}***@${domain}`;
}

export function maskPhoneForLog(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length < 4) return "not-provided";

  return `+${digits.slice(0, 1)}******${digits.slice(-4)}`;
}

export function classifyProviderError(status: number) {
  if (status === 401 || status === 403) return "BAD_API_KEY";
  if (status === 404) return "BAD_AGENT_ID";
  if (status === 422) return "PROVIDER_VALIDATION_ERROR";
  if (status === 429) return "PROVIDER_RATE_LIMIT";
  if (status >= 500) return "UNKNOWN_PROVIDER_ERROR";

  return "UNKNOWN_PROVIDER_ERROR";
}
