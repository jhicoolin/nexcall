import { NextRequest, NextResponse } from "next/server";

const highCostRoutes = [
  "/api/ai/respond",
  "/api/tts/elevenlabs",
  "/api/tts/huggingface",
  "/api/chat/nexcall",
  "/api/chat/huggingface",
  "/api/twilio/voice",
  "/api/calendar-booking",
  "/api/calendar",
  "/api/outbound-call",
  "/api/voice/schedule"
];

const webhookRoutes = ["/api/stripe/webhook", "/api/inngest"];

type LimitConfig = {
  limit: number;
  windowSeconds: number;
  prefix: string;
};

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

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function isHighCost(pathname: string) {
  return highCostRoutes.some((route) => pathname.startsWith(route));
}

function isWebhook(pathname: string) {
  return webhookRoutes.some((route) => pathname.startsWith(route));
}

function shouldFailClosedWithoutRateLimit() {
  return process.env.VERCEL === "1" || process.env.REQUIRE_UPSTASH_RATE_LIMIT === "true";
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
    return {
      configured: false,
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + config.windowSeconds * 1000
    };
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const upstash = getUpstashConfig();

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!upstash && shouldFailClosedWithoutRateLimit()) {
    return NextResponse.json(
      { ok: false, error: "API protection is not configured. Set Upstash Redis before launch." },
      { status: 503 }
    );
  }

  if (!upstash) {
    return NextResponse.next();
  }

  const limiter = isWebhook(pathname) ? webhookLimit : isHighCost(pathname) ? highCostLimit : standardLimit;
  const ip = getIp(request);
  const identity = `${ip}:${pathname}`;
  const result = await limitRequest(identity, limiter);

  if (!result.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests. Please slow down."
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

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());

  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};
