import {
  appendClientContextToUrl,
  getClientByPhone,
  normalizeClientPhone
} from "@/lib/client-directory";
import { isAllowedServerUrl } from "@/lib/security";
import { isValidTwilioWebhookRequest } from "@/lib/twilio-signature";
import { buildFallbackTwiml, buildMediaStreamTwiml, buildRedirectTwiml, xmlResponse } from "@/lib/twilio-twiml";

export const runtime = "nodejs";

async function readTwilioParams(request: Request) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.searchParams);

  if (request.method !== "GET") {
    const contentType = request.headers.get("content-type") || "";
    const body = await request.text();

    if (contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
      const form = new URLSearchParams(body);
      form.forEach((value, key) => params.set(key, value));
    }
  }

  return params;
}

function isSafeWebSocketUrl(value = "") {
  try {
    const url = new URL(value);

    return url.protocol === "wss:" || (process.env.NODE_ENV !== "production" && url.protocol === "ws:");
  } catch {
    return false;
  }
}

/**
 * Twilio switchboard route.
 *
 * Data flow:
 * 1. Twilio POSTs the incoming call payload to this route.
 * 2. The `To` number is normalized and matched against the tenant database.
 * 3. If the tenant exists and TWILIO_MEDIA_STREAM_URL is configured, TwiML
 *    starts a bidirectional Media Stream for real-time audio.
 * 4. If no media stream is configured yet, the route falls back to redirecting
 *    to the tenant's external voice-agent webhook.
 * 5. If neither is configured, the caller hears a safe fallback message.
 */
export async function POST(request: Request) {
  const params = await readTwilioParams(request);

  if (!isValidTwilioWebhookRequest(request, params)) {
    return xmlResponse(buildFallbackTwiml("This call could not be verified. Please try again."));
  }

  const calledNumber = normalizeClientPhone(
    params.get("To") || params.get("Called") || params.get("ForwardedFrom")
  );
  const callerNumber = normalizeClientPhone(params.get("From") || params.get("Caller"));
  const callSid = params.get("CallSid") || "";
  const client = await getClientByPhone(calledNumber);

  if (!client) {
    return xmlResponse(
      buildFallbackTwiml("Thanks for calling. This number is not connected to an AI receptionist yet.")
    );
  }

  const mediaStreamUrl = process.env.TWILIO_MEDIA_STREAM_URL || "";

  if (client.voiceProvider === "CUSTOM_STREAM" && isSafeWebSocketUrl(mediaStreamUrl)) {
    return xmlResponse(
      buildMediaStreamTwiml({
        client,
        websocketUrl: mediaStreamUrl,
        callerPhone: callerNumber,
        calledPhone: calledNumber,
        callSid
      })
    );
  }

  const voiceAgentWebhook = client.externalVoiceWebhookUrl || process.env.VOICE_AGENT_WEBHOOK_URL;
  const safeVoiceAgentWebhook =
    voiceAgentWebhook && isAllowedServerUrl(voiceAgentWebhook) ? voiceAgentWebhook : "";

  if (safeVoiceAgentWebhook) {
    const redirectUrl = appendClientContextToUrl(safeVoiceAgentWebhook, client, {
      to: calledNumber,
      from: callerNumber,
      callSid
    });

    return xmlResponse(buildRedirectTwiml(redirectUrl));
  }

  return xmlResponse(
    buildFallbackTwiml(
      client.greeting ||
        `Thanks for calling ${client.businessName}. The AI receptionist is being connected now. Please call back shortly.`
    )
  );
}

export const GET = POST;
