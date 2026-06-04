import "server-only";

let validated = false;

function isConfigured(value?: string | null) {
  return Boolean(value && value.trim() && !value.includes("replace_me"));
}

function shouldRequireStripeWebhookSecret() {
  return (
    isConfigured(process.env.STRIPE_SECRET_KEY) ||
    isConfigured(process.env.STRIPE_SETUP_FEE_PRICE_ID) ||
    isConfigured(process.env.STRIPE_WEBHOOK_SECRET)
  );
}

function shouldRequireTwilioAuthToken() {
  return (
    isConfigured(process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER) ||
    isConfigured(process.env.TWILIO_MEDIA_STREAM_URL) ||
    isConfigured(process.env.VOICE_AGENT_WEBHOOK_URL)
  );
}

function shouldRequireVapiWebhookSecret() {
  return (
    isConfigured(process.env.VAPI_API_KEY) ||
    String(process.env.DEFAULT_VOICE_PROVIDER || "").toUpperCase() === "VAPI"
  );
}

export function validateSecurityEnvOnce() {
  if (validated || process.env.NODE_ENV !== "production") {
    return;
  }

  validated = true;

  const missing: string[] = [];

  if (!isConfigured(process.env.NEXT_PUBLIC_SITE_URL)) {
    missing.push("NEXT_PUBLIC_SITE_URL");
  }

  if (!isConfigured(process.env.ADMIN_DASHBOARD_TOKEN)) {
    missing.push("ADMIN_DASHBOARD_TOKEN");
  }

  if (!isConfigured(process.env.ADMIN_SESSION_SECRET) && !isConfigured(process.env.SECRET_ENCRYPTION_KEY)) {
    missing.push("ADMIN_SESSION_SECRET or SECRET_ENCRYPTION_KEY");
  }

  if (shouldRequireStripeWebhookSecret() && !isConfigured(process.env.STRIPE_WEBHOOK_SECRET)) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }

  if (shouldRequireTwilioAuthToken() && !isConfigured(process.env.TWILIO_AUTH_TOKEN)) {
    missing.push("TWILIO_AUTH_TOKEN");
  }

  if (shouldRequireVapiWebhookSecret() && !isConfigured(process.env.VAPI_WEBHOOK_SECRET)) {
    missing.push("VAPI_WEBHOOK_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production security env vars: ${missing.join(", ")}`);
  }
}
