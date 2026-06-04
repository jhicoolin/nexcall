import "server-only";
import {
  isConfiguredValue,
  isStripeCheckoutEnabledInEnv
} from "@/lib/checkout-readiness";

let validated = false;

function shouldRequireStripeWebhookSecret() {
  return isStripeCheckoutEnabledInEnv();
}

function shouldRequireTwilioAuthToken() {
  return (
    isConfiguredValue(process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER) ||
    isConfiguredValue(process.env.TWILIO_MEDIA_STREAM_URL) ||
    isConfiguredValue(process.env.VOICE_AGENT_WEBHOOK_URL)
  );
}

function shouldRequireVapiWebhookSecret() {
  return (
    isConfiguredValue(process.env.VAPI_API_KEY) ||
    String(process.env.DEFAULT_VOICE_PROVIDER || "").toUpperCase() === "VAPI"
  );
}

export function validateSecurityEnvOnce() {
  if (validated || process.env.NODE_ENV !== "production") {
    return;
  }

  validated = true;

  const missing: string[] = [];

  if (!isConfiguredValue(process.env.NEXT_PUBLIC_SITE_URL)) {
    missing.push("NEXT_PUBLIC_SITE_URL");
  }

  if (!isConfiguredValue(process.env.ADMIN_DASHBOARD_TOKEN)) {
    missing.push("ADMIN_DASHBOARD_TOKEN");
  }

  if (!isConfiguredValue(process.env.ADMIN_SESSION_SECRET) && !isConfiguredValue(process.env.SECRET_ENCRYPTION_KEY)) {
    missing.push("ADMIN_SESSION_SECRET or SECRET_ENCRYPTION_KEY");
  }

  if (shouldRequireStripeWebhookSecret() && !isConfiguredValue(process.env.STRIPE_SECRET_KEY)) {
    missing.push("STRIPE_SECRET_KEY");
  }

  if (shouldRequireStripeWebhookSecret() && !isConfiguredValue(process.env.STRIPE_WEBHOOK_SECRET)) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }

  if (shouldRequireTwilioAuthToken() && !isConfiguredValue(process.env.TWILIO_AUTH_TOKEN)) {
    missing.push("TWILIO_AUTH_TOKEN");
  }

  if (shouldRequireVapiWebhookSecret() && !isConfiguredValue(process.env.VAPI_WEBHOOK_SECRET)) {
    missing.push("VAPI_WEBHOOK_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production security env vars: ${missing.join(", ")}`);
  }
}
