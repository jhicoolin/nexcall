import { NextResponse } from 'next/server';
import { notifyNexCallLead } from '@/lib/lead-notifications';
import { cleanText, isHoneypotTriggered, readJsonObject } from '@/lib/security';

const E164_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const rateLimitStore = globalThis.__outboundCallRateLimitStore || new Map();
const CALL_SUCCESS_MESSAGE = "Your demo call is starting now.";
const CALL_FAILURE_MESSAGE = "We could not start the demo call right now. Please try again or contact NexCall.";

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

function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 4 ? `***${digits.slice(-4)}` : 'unknown';
}

function cleanLeadName(value) {
  return cleanText(value, 80) || 'Valued Lead';
}

function cleanTimeZone(value) {
  const cleaned = String(value || "")
    .replace(/[<>{}[\]\\]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .slice(0, 80);

  return /^[A-Za-z_/-]+$/.test(cleaned) ? cleaned : "America/New_York";
}

function cleanTrackingField(value, fallback) {
  const cleaned = String(value || "")
    .replace(/[<>{}[\]\\]/g, "")
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .replace(/_+/g, "_")
    .trim()
    .slice(0, 80);

  return cleaned || fallback;
}

function summarizeProviderDetail(value) {
  if (!value) return "Provider rejected request";

  if (typeof value === "string") return value.slice(0, 240);

  if (Array.isArray(value)) {
    return value
      .map((item) => item?.msg || item?.message || item?.type || "provider validation issue")
      .join("; ")
      .slice(0, 240);
  }

  if (typeof value === "object") {
    return String(value.message || value.msg || value.type || "provider validation issue").slice(0, 240);
  }

  return "Provider rejected request";
}

function providerAcceptedCall(responseData) {
  return Boolean(
    responseData?.success === true ||
      responseData?.conversation_id ||
      responseData?.conversationId ||
      responseData?.callSid ||
      responseData?.call_sid ||
      responseData?.sip_call_id
  );
}

function buildRequestId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

function rateLimitBucket() {
  return Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
}

async function checkHourlyRateLimit(ip) {
  const upstash = getUpstashConfig();
  const now = Date.now();

  if (upstash) {
    const resetAt = (rateLimitBucket() + 1) * RATE_LIMIT_WINDOW_MS;
    const key = `nexcall:outbound-call:${rateLimitBucket()}:${ip}`;
    try {
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

      if (response.ok) {
        const results = await response.json().catch(() => []);
        const count = Number(results?.[0]?.result || 0);

        return {
          allowed: count <= RATE_LIMIT_MAX_REQUESTS,
          remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - count),
          resetAt
        };
      }

      console.warn("Outbound call rate limiter unavailable; using in-memory limiter", {
        status: response.status
      });
    } catch (error) {
      console.warn("Outbound call rate limiter unavailable; using in-memory limiter", {
        message: error instanceof Error ? error.message : "Unknown rate limiter error"
      });
    }
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

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(request) {
  const requestId = buildRequestId();

  try {
    let body;

    try {
      body = await readJsonObject(request, 4000);
    } catch (error) {
      console.warn("[NEXCALL_CALL_DEMO_REQUEST]", {
        requestId,
        status: error?.status || 400,
        message: error instanceof Error ? error.message : "Invalid request"
      });
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Invalid JSON body." },
        { status: error?.status || 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }

    if (isHoneypotTriggered(body)) {
      console.warn("[NEXCALL_CALL_DEMO_REQUEST]", { requestId, botLike: true });
      return NextResponse.json({ success: true, message: CALL_SUCCESS_MESSAGE });
    }

    const { name, phone, user_timezone } = body || {};
    const source = cleanTrackingField(body.source, "call_demo");
    const page = cleanTrackingField(body.page, "homepage");
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsAgentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId =
      process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID ||
      process.env.ELEVENLABS_PHONE_NUMBER_ID ||
      process.env.TWILIO_PHONE_NUMBER_ID;
    const userTimeZone = cleanTimeZone(user_timezone);

    console.info("[NEXCALL_CALL_DEMO_REQUEST]", {
      requestId,
      source,
      page,
      hasName: Boolean(cleanText(name, 80)),
      hasPhone: Boolean(phone)
    });

    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone number is mandatory." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!E164_PHONE_PATTERN.test(normalizedPhone)) {
      console.warn("[NEXCALL_CALL_DEMO_INVALID_PHONE]", {
        requestId,
        phone: maskPhone(phone),
        source,
        page
      });
      return NextResponse.json(
        { success: false, message: "Invalid phone number format. Please include your country code (e.g., +1)." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const limit = await checkHourlyRateLimit(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many demo call requests. Please try again in about 5 minutes." },
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
      console.error("[NEXCALL_CALL_DEMO_CONFIG_MISSING]", {
        requestId,
        hasApiKey: Boolean(elevenLabsApiKey),
        hasAgentId: Boolean(elevenLabsAgentId),
        hasAgentPhoneNumberId: Boolean(agentPhoneNumberId)
      });
      await notifyNexCallLead({
        subject: "New NexCall Call Demo Lead",
        source: "outbound-call-provider-missing",
        name: cleanLeadName(name),
        phone: normalizedPhone,
        inquiryType: "call demo",
        message: "A visitor requested the live phone demo, but the ElevenLabs outbound provider is not configured.",
        metadata: { userTimezone: userTimeZone, source, page }
      });

      return NextResponse.json(
        { success: false, message: CALL_FAILURE_MESSAGE },
        { status: 503 }
      );
    }

    const leadName = cleanLeadName(name);
    await notifyNexCallLead({
      subject: "New NexCall Call Demo Lead",
      source: "outbound-call-request",
      name: leadName,
      phone: normalizedPhone,
      inquiryType: "call demo",
      message: "A visitor requested the live NexCall phone demo.",
      metadata: { userTimezone: userTimeZone, source, page }
    });

    console.info("[NEXCALL_CALL_DEMO_PROVIDER_ATTEMPT]", {
      requestId,
      leadNameProvided: leadName !== "Valued Lead",
      phone: maskPhone(normalizedPhone),
      user_timezone: userTimeZone,
      hasAgentId: Boolean(elevenLabsAgentId),
      agentIdPrefix: elevenLabsAgentId ? elevenLabsAgentId.slice(0, 8) : "missing",
      hasAgentPhoneNumberId: Boolean(agentPhoneNumberId),
      phoneNumberIdPrefix: agentPhoneNumberId ? agentPhoneNumberId.slice(0, 8) : "missing",
      endpoint: "https://api.elevenlabs.io/v1/convai/twilio/outbound-call"
    });

    // Build the native ElevenLabs Twilio outbound request. Runtime values must be
    // passed as dynamic_variables so the agent can access them during the call.
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
          dynamic_variables: {
            lead_name: leadName,
            customer_name: leadName,
            caller_name: leadName,
            user_timezone: userTimeZone,
            source,
            page
          }
        }
      })
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const upstreamStatus = response.status;
      const providerMsg = responseData?.message || summarizeProviderDetail(responseData?.detail) || '';
      const providerDetail = JSON.stringify(responseData).slice(0, 600);

      console.error("[NEXCALL_CALL_DEMO_PROVIDER_ERROR]", {
        requestId,
        upstreamStatus,
        phone: maskPhone(normalizedPhone),
        providerMsg,
        providerDetail,
        detail: responseData?.detail ? summarizeProviderDetail(responseData.detail) : undefined,
        errorType: responseData?.error || responseData?.type || undefined
      });

      // Map common upstream codes to actionable messages
      let userMessage = CALL_FAILURE_MESSAGE;
      if (upstreamStatus === 401 || upstreamStatus === 403) {
        userMessage = 'Call service authentication error (code 401/403). Contact NexCall support.';
      } else if (upstreamStatus === 422) {
        userMessage = `Call configuration error (code 422): ${providerMsg || 'invalid agent or phone number ID'}. Contact NexCall support.`;
      } else if (upstreamStatus === 404) {
        userMessage = 'Call service resource not found (code 404) — agent or phone number ID may be incorrect.';
      } else if (upstreamStatus === 429) {
        userMessage = 'Too many demo call attempts right now. Please wait a moment and try again.';
      } else if (providerMsg) {
        userMessage = `Demo call failed: ${providerMsg}`;
      }

      return NextResponse.json({ success: false, message: userMessage, _upstream: upstreamStatus }, { status: 502 });
    }

    if (!providerAcceptedCall(responseData)) {
      console.error("[NEXCALL_CALL_DEMO_PROVIDER_UNEXPECTED]", {
        requestId,
        status: response.status,
        phone: maskPhone(normalizedPhone),
        providerMessage: responseData?.message || "Missing provider success flag",
        responseBody: JSON.stringify(responseData).slice(0, 600)
      });
      return NextResponse.json({ success: false, message: CALL_FAILURE_MESSAGE }, { status: 502 });
    }

    console.info("[NEXCALL_CALL_DEMO_PROVIDER_SUCCESS]", {
      requestId,
      phone: maskPhone(normalizedPhone),
      hasConversationId: Boolean(responseData?.conversation_id || responseData?.conversationId),
      hasCallSid: Boolean(responseData?.callSid || responseData?.call_sid || responseData?.sip_call_id)
    });

    return NextResponse.json(
      { success: true, message: CALL_SUCCESS_MESSAGE },
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
    console.error("[NEXCALL_CALL_DEMO_UNHANDLED_ERROR]", {
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown outbound call error",
      stack: error instanceof Error ? error.stack?.slice(0, 400) : undefined
    });
    return NextResponse.json({ success: false, message: CALL_FAILURE_MESSAGE }, { status: 502 });
  }
}
