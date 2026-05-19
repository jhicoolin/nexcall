import type { ClientConfig } from "@/lib/client-directory";
import { cleanText } from "@/lib/security";

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function xmlResponse(twiml: string) {
  return new Response(twiml, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function buildFallbackTwiml(message: string) {
  const safeMessage = escapeXml(cleanText(message, 320));

  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${safeMessage}</Say></Response>`;
}

export function buildRedirectTwiml(url: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Redirect method="POST">${escapeXml(url)}</Redirect></Response>`;
}

/**
 * Starts a bidirectional Twilio Media Stream for the identified tenant.
 *
 * Twilio connects to the configured WebSocket URL and immediately sends a
 * `start` event containing these custom parameters. The media server uses them
 * to call back into /api/ai/respond with the correct tenant context.
 */
export function buildMediaStreamTwiml({
  client,
  websocketUrl,
  callerPhone,
  calledPhone,
  callSid
}: {
  client: ClientConfig;
  websocketUrl: string;
  callerPhone: string;
  calledPhone: string;
  callSid: string;
}) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    "  <Connect>",
    `    <Stream url="${escapeXml(websocketUrl)}">`,
    `      <Parameter name="clientId" value="${escapeXml(client.id)}" />`,
    `      <Parameter name="businessName" value="${escapeXml(client.businessName)}" />`,
    `      <Parameter name="callerPhone" value="${escapeXml(callerPhone)}" />`,
    `      <Parameter name="calledPhone" value="${escapeXml(calledPhone)}" />`,
    `      <Parameter name="callSid" value="${escapeXml(callSid)}" />`,
    "    </Stream>",
    "  </Connect>",
    "</Response>"
  ].join("");
}
