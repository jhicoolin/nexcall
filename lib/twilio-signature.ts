import { createHmac, timingSafeEqual } from "crypto";

function getPublicRequestUrl(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const incoming = new URL(request.url);

  if (!configuredOrigin) return request.url;

  return `${configuredOrigin}${incoming.pathname}${incoming.search}`;
}

/**
 * Validates Twilio's X-Twilio-Signature for form-encoded webhooks.
 *
 * If TWILIO_AUTH_TOKEN is not configured, validation is skipped so local
 * development and first setup tests do not fail. Production should always set
 * TWILIO_AUTH_TOKEN.
 */
export function isValidTwilioWebhookRequest(
  request: Request,
  params: URLSearchParams,
  signature = request.headers.get("x-twilio-signature") || ""
) {
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!token) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const url = getPublicRequestUrl(request);
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const base = sortedParams.reduce((value, [key, paramValue]) => `${value}${key}${paramValue}`, url);
  const expected = createHmac("sha1", token).update(base).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
