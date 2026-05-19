import { NextResponse } from 'next/server';

const E164_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 2;
const rateLimitStore = globalThis.__outboundCallRateLimitStore || new Map();

globalThis.__outboundCallRateLimitStore = rateLimitStore;

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function normalizePhoneNumber(phone) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');

  if (raw.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length > 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return digits;
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

function hourBucket() {
  return Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
}

async function checkHourlyRateLimit(ip) {
  const upstash = getUpstashConfig();
  const now = Date.now();

  if (upstash) {
    const resetAt = (hourBucket() + 1) * RATE_LIMIT_WINDOW_MS;
    const key = `nexcall:outbound-call:${hourBucket()}:${ip}`;
    const response = await fetch(`${upstash.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 30]
      ])
    });

    if (!response.ok) {
      return { allowed: false, remaining: 0, resetAt };
    }

    const results = await response.json().catch(() => []);
    const count = Number(results?.[0]?.result || 0);

    return {
      allowed: count <= RATE_LIMIT_MAX_REQUESTS,
      remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - count),
      resetAt
    };
  }

  const existing = rateLimitStore.get(ip);

  for (const [storedIp, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(storedIp);
    }
  }

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  rateLimitStore.set(ip, existing);

  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count),
    resetAt: existing.resetAt
  };
}

export async function POST(request) {
  try {
    const { name, phone, user_timezone } = await request.json();
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsAgentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId =
      process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID ||
      process.env.ELEVENLABS_PHONE_NUMBER_ID ||
      process.env.TWILIO_PHONE_NUMBER_ID;
    const twilioFromNumber = process.env.TWILIO_FROM_NUMBER || process.env.NEXT_PUBLIC_DEMO_PHONE_NUMBER || "";

    if (!phone) {
      return NextResponse.json({ error: "Phone number is mandatory." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!E164_PHONE_PATTERN.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please include your country code (e.g., +1)." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const limit = await checkHourlyRateLimit(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many demo call requests. Please try again in about an hour." },
        {
          status: 429,
          headers: {
            'Retry-After': Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limit.resetAt.toString()
          }
        }
      );
    }

    if (!elevenLabsApiKey || !elevenLabsAgentId || !agentPhoneNumberId) {
      return NextResponse.json(
        {
          error: "Outbound call provider is not configured.",
          setup: "Add ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, and ELEVENLABS_AGENT_PHONE_NUMBER_ID in Vercel Production env vars."
        },
        { status: 503 }
      );
    }

    console.log(`Initiating automated demo pipeline for ${name || 'Valued Lead'} at phone: ${normalizedPhone}`);

    // Build standard outbound request structure mapped directly to ElevenLabs endpoints
    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: elevenLabsAgentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: normalizedPhone,
        conversation_initiation_client_data: {
          custom_vars: {
            lead_name: name || "Valued Lead",
            user_timezone: user_timezone || "America/New_York",
            twilio_from_number: twilioFromNumber
          }
        }
      })
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("ElevenLabs Outbound Engine Rejection:", responseData);
      return NextResponse.json({ error: "Failed to prompt ElevenLabs engine.", details: responseData }, { status: response.status });
    }

    return NextResponse.json(
      { success: true, data: responseData },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.resetAt.toString()
        }
      }
    );
  } catch (error) {
    console.error("Outbound API server error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
