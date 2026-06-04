import { NextRequest, NextResponse } from "next/server";
import { hasAdminSessionInMiddleware } from "@/lib/admin-edge";

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
const adminApiRoutes = ["/api/admin", "/api/admin/session"];

type LimitConfig = {
  limit: number;
  windowSeconds: number;
  prefix: string;
};

type MemoryLimitEntry = {
  count: number;
  reset: number;
};

const middlewareState = globalThis as typeof globalThis & {
  __nexcallMiddlewareRateLimitStore?: Map<string, MemoryLimitEntry>;
};
const memoryRateLimitStore =
  middlewareState.__nexcallMiddlewareRateLimitStore || new Map<string, MemoryLimitEntry>();

middlewareState.__nexcallMiddlewareRateLimitStore = memoryRateLimitStore;

const standardLimit: LimitConfig = {
  limit: 120,
  windowSeconds: 60,
  prefix: "nexcall:rl:standard"
};

const highCostLimit: LimitConfig = {
  limit: 20,
  windowSeconds: 60,
  prefix: "nexcall:rl:high-cost"
};

const webhookLimit: LimitConfig = {
  limit: 300,
  windowSeconds: 60,
  prefix: "nexcall:rl:webhooks"
};

const adminApiLimit: LimitConfig = {
  limit: 20,
  windowSeconds: 5 * 60,
  prefix: "nexcall:rl:admin"
};

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function hashIdentifier(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function isHighCost(pathname: string) {
  return highCostRoutes.some((route) => pathname.startsWith(route));
}

function isWebhook(pathname: string) {
  return webhookRoutes.some((route) => pathname.startsWith(route));
}

function isAdminApi(pathname: string) {
  return adminApiRoutes.some((route) => pathname.startsWith(route));
}

function isAdminPage(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isOperatorLoginPage(pathname: string) {
  return pathname === "/command";
}

function notFoundResponse() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

function applySensitiveHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

function shouldFailClosedWithoutRateLimit() {
  return process.env.REQUIRE_UPSTASH_RATE_LIMIT === "true";
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function minuteBucket(windowSeconds: number) {
  return Math.floor(Date.now() / (windowSeconds * 1000));
}

async function limitRequest(identity: string, config: LimitConfig) {
  const upstash = getUpstashConfig();

  if (!upstash) {
    return limitRequestInMemory(identity, config);
  }

  const reset = (minuteBucket(config.windowSeconds) + 1) * config.windowSeconds * 1000;
  const key = `${config.prefix}:${minuteBucket(config.windowSeconds)}:${identity}`;
  const response = await fetch(`${upstash.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstash.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, config.windowSeconds + 5]
    ])
  });

  if (!response.ok) {
    return {
      configured: true,
      success: false,
      limit: config.limit,
      remaining: 0,
      reset
    };
  }

  const results = (await response.json()) as Array<{ result?: number }>;
  const count = Number(results[0]?.result || 0);
  const remaining = Math.max(0, config.limit - count);

  return {
    configured: true,
    success: count <= config.limit,
    limit: config.limit,
    remaining,
    reset
  };
}

function limitRequestInMemory(identity: string, config: LimitConfig) {
  const now = Date.now();
  const reset = now + config.windowSeconds * 1000;
  const key = `${config.prefix}:${minuteBucket(config.windowSeconds)}:${identity}`;

  for (const [storedKey, entry] of memoryRateLimitStore.entries()) {
    if (entry.reset <= now) {
      memoryRateLimitStore.delete(storedKey);
    }
  }

  const existing = memoryRateLimitStore.get(key);

  if (!existing || existing.reset <= now) {
    memoryRateLimitStore.set(key, { count: 1, reset });
    return {
      configured: false,
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset
    };
  }

  existing.count += 1;
  memoryRateLimitStore.set(key, existing);

  return {
    configured: false,
    success: existing.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    reset: existing.reset
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const upstash = getUpstashConfig();

  if (isAdminPage(pathname)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return notFoundResponse();
    }

    try {
      if (!(await hasAdminSessionInMiddleware(request))) {
        return notFoundResponse();
      }
    } catch {
      return notFoundResponse();
    }

    return applySensitiveHeaders(NextResponse.next());
  }

  if (isOperatorLoginPage(pathname)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return notFoundResponse();
    }

    return applySensitiveHeaders(NextResponse.next());
  }

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!upstash && shouldFailClosedWithoutRateLimit()) {
    return NextResponse.json(
      { ok: false, error: "API protection is temporarily unavailable." },
      { status: 503 }
    );
  }

  const limiter = isWebhook(pathname)
    ? webhookLimit
    : isAdminApi(pathname)
      ? adminApiLimit
      : isHighCost(pathname)
        ? highCostLimit
        : standardLimit;
  const ip = getIp(request);
  const identity = hashIdentifier(`${ip}:${pathname}`);
  const result = await limitRequest(identity, limiter);

  if (!result.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many attempts. Please wait a moment and try again."
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)).toString(),
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString()
        }
      }
    );
  }

  const response = isAdminApi(pathname) ? applySensitiveHeaders(NextResponse.next()) : NextResponse.next();
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  response.headers.set("X-RateLimit-Mode", result.configured ? "upstash" : "memory-fallback");

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin", "/admin/:path*", "/command"]
};
