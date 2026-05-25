import { NextRequest, NextResponse } from "next/server";

const OWNER_COOKIE = "misato_owner_session";

const highCostRoutes = [
  "/api/ai/respond",
  "/api/tts/elevenlabs",
  "/api/tts/huggingface",
  "/api/chat/nexcall",
  "/api/chat/huggingface",
  "/api/leads",
  "/api/checkout",
  "/api/twilio/voice",
  "/api/calendar-booking",
  "/api/calendar",
  "/api/outbound-call",
  "/api/voice/schedule"
];

const webhookRoutes = ["/api/stripe/webhook", "/api/inngest"];

function getIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
}

function isHighCost(pathname: string) {
  return highCostRoutes.some((route) => pathname.startsWith(route));
}

function isWebhook(pathname: string) {
  return webhookRoutes.some((route) => pathname.startsWith(route));
}

function isProtectedMisatoRoute(pathname: string) {
  return pathname === "/misato" || pathname.startsWith("/misato/");
}

function isProtectedMisatoApi(pathname: string) {
  return pathname.startsWith("/api/misato/") || pathname === "/api/misato";
}

function isMisatoAuthApi(pathname: string) {
  return pathname === "/api/misato/auth/login" || pathname === "/api/misato/auth/logout";
}

function hasValidDesktopToken(request: NextRequest) {
  const configured = (process.env.MISATO_DESKTOP_AUTH_TOKEN || "").trim();
  const provided = (request.headers.get("x-misato-desktop-token") || "").trim();
  return Boolean(configured && provided && configured === provided);
}

async function signOwnerEmailForEdge(email: string) {
  const secret = process.env.OWNER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SECRET_ENCRYPTION_KEY || "misato-dev-session-secret";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hasValidOwnerCookie(value: string) {
  const owner = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!owner || !value) return false;
  const idx = value.lastIndexOf(":");
  if (idx <= 0) return false;
  const email = value.slice(0, idx);
  const signature = value.slice(idx + 1);
  if (!email || !signature) return false;
  if (email !== owner) return false;
  const expected = await signOwnerEmailForEdge(owner);
  return signature === expected;
}

type LimitConfig = { limit: number; windowSeconds: number; prefix: string };
type MemoryLimitEntry = { count: number; reset: number };

const middlewareState = globalThis as typeof globalThis & { __nexcallMiddlewareRateLimitStore?: Map<string, MemoryLimitEntry> };
const memoryRateLimitStore = middlewareState.__nexcallMiddlewareRateLimitStore || new Map<string, MemoryLimitEntry>();
middlewareState.__nexcallMiddlewareRateLimitStore = memoryRateLimitStore;

const standardLimit: LimitConfig = { limit: 120, windowSeconds: 60, prefix: "nexcall:rl:standard" };
const highCostLimit: LimitConfig = { limit: 20, windowSeconds: 60, prefix: "nexcall:rl:high-cost" };
const webhookLimit: LimitConfig = { limit: 300, windowSeconds: 60, prefix: "nexcall:rl:webhooks" };

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function minuteBucket(windowSeconds: number) {
  return Math.floor(Date.now() / (windowSeconds * 1000));
}

function shouldFailClosedWithoutRateLimit() {
  return process.env.REQUIRE_UPSTASH_RATE_LIMIT === "true";
}

async function limitRequest(identity: string, config: LimitConfig) {
  const upstash = getUpstashConfig();
  if (!upstash) return limitRequestInMemory(identity, config);

  const reset = (minuteBucket(config.windowSeconds) + 1) * config.windowSeconds * 1000;
  const key = `${config.prefix}:${minuteBucket(config.windowSeconds)}:${identity}`;
  const response = await fetch(`${upstash.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${upstash.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", key], ["EXPIRE", key, config.windowSeconds + 5]])
  });

  if (!response.ok) return { configured: true, success: false, limit: config.limit, remaining: 0, reset };

  const results = (await response.json()) as Array<{ result?: number }>;
  const count = Number(results[0]?.result || 0);
  return { configured: true, success: count <= config.limit, limit: config.limit, remaining: Math.max(0, config.limit - count), reset };
}

function limitRequestInMemory(identity: string, config: LimitConfig) {
  const now = Date.now();
  const reset = now + config.windowSeconds * 1000;
  const key = `${config.prefix}:${minuteBucket(config.windowSeconds)}:${identity}`;
  memoryRateLimitStore.forEach((entry, storedKey) => { if (entry.reset <= now) memoryRateLimitStore.delete(storedKey); });

  const existing = memoryRateLimitStore.get(key);
  if (!existing || existing.reset <= now) {
    memoryRateLimitStore.set(key, { count: 1, reset });
    return { configured: false, success: true, limit: config.limit, remaining: config.limit - 1, reset };
  }

  existing.count += 1;
  memoryRateLimitStore.set(key, existing);
  return { configured: false, success: existing.count <= config.limit, limit: config.limit, remaining: Math.max(0, config.limit - existing.count), reset: existing.reset };
}

function isLocalSoloAllowed(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL) return false;
  const host = (request.headers.get("host") || "").toLowerCase();
  const localhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const envEnabled = (process.env.MISATO_LOCAL_SOLO_MODE || "false").toLowerCase() === "true";
  return localhost || envEnabled;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localSoloAllowed = isProtectedMisatoApi(pathname) && isLocalSoloAllowed(request);
  const desktopTokenAuthenticated = isProtectedMisatoApi(pathname) && !isMisatoAuthApi(pathname) && hasValidDesktopToken(request);

  if (isProtectedMisatoRoute(pathname) || (isProtectedMisatoApi(pathname) && !isMisatoAuthApi(pathname))) {
    const session = request.cookies.get(OWNER_COOKIE)?.value || "";
    if (!localSoloAllowed && !desktopTokenAuthenticated && !session) {
      if (isProtectedMisatoApi(pathname)) return NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 401 });
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!localSoloAllowed && !desktopTokenAuthenticated && session && !(await hasValidOwnerCookie(session))) {
      if (isProtectedMisatoApi(pathname)) return NextResponse.json({ ok: false, error: "Owner authentication required." }, { status: 403 });
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const upstash = getUpstashConfig();
  if (!upstash && shouldFailClosedWithoutRateLimit()) {
    return NextResponse.json({ ok: false, error: "API protection is not configured. Set Upstash Redis before launch." }, { status: 503 });
  }

  const limiter = isWebhook(pathname) ? webhookLimit : isHighCost(pathname) ? highCostLimit : standardLimit;
  const identity = `${getIp(request)}:${pathname}`;
  const result = await limitRequest(identity, limiter);

  if (!result.success) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please wait a moment and try again." }, {
      status: 429,
      headers: {
        "Retry-After": Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)).toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString()
      }
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  response.headers.set("X-RateLimit-Mode", result.configured ? "upstash" : "memory-fallback");
  return response;
}

export const config = {
  matcher: ["/misato/:path*", "/api/misato/:path*", "/api/:path*"]
};
