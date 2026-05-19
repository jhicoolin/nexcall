import "server-only";

import { cleanText, isAllowedServerUrl } from "@/lib/security";
import { maskPhone } from "@/lib/phone";

export const NEXCALL_LEAD_EMAIL = "nexcall@proton.me";

type LeadNotificationInput = {
  subject: string;
  source: string;
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  inquiryType?: string;
  message?: string;
  notes?: string;
  requestedTime?: string;
  appointmentType?: string;
  icsContent?: string | null;
  metadata?: Record<string, unknown>;
};

type NotificationResult = {
  ok: true;
  delivered: boolean;
  captured: boolean;
  provider: "resend" | "sendgrid" | "webhook" | "server-log" | "fallback-log";
};

function safeValue(value: unknown, maxLength = 600) {
  return cleanText(typeof value === "string" ? value : String(value || ""), maxLength);
}

function maskEmail(value?: string) {
  if (!value) return "not-provided";
  const [name, domain] = value.split("@");
  if (!domain) return "invalid-or-missing";

  return `${name.slice(0, 2)}***@${domain}`;
}

function buildTextEmail(input: LeadNotificationInput) {
  const metadata = input.metadata
    ? JSON.stringify(input.metadata, (key, value) => {
        if (/secret|token|key|authorization/i.test(key)) {
          return "[redacted]";
        }

        return value;
      }, 2)
    : "";

  return [
    `${input.subject}`,
    "",
    `Source: ${safeValue(input.source)}`,
    `Timestamp: ${new Date().toISOString()}`,
    `Name: ${safeValue(input.name || "Not provided")}`,
    `Email: ${safeValue(input.email || "Not provided")}`,
    `Phone: ${safeValue(input.phone || "Not provided")}`,
    `Business: ${safeValue(input.businessName || "Not provided")}`,
    `Inquiry type: ${safeValue(input.inquiryType || "Not provided")}`,
    `Appointment type: ${safeValue(input.appointmentType || "Not provided")}`,
    `Requested time: ${safeValue(input.requestedTime || "Not provided")}`,
    "",
    "Message:",
    safeValue(input.message || input.notes || "No message provided.", 3000),
    metadata ? "\nMetadata:" : "",
    metadata,
    input.icsContent ? "\nICS fallback:\n" + input.icsContent : ""
  ].filter(Boolean).join("\n");
}

async function sendWithResend(input: LeadNotificationInput, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "NexCall <onboarding@resend.dev>",
      to: [NEXCALL_LEAD_EMAIL],
      subject: input.subject,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Resend rejected notification with ${response.status}`);
  }

  return { ok: true as const, delivered: true, captured: true, provider: "resend" as const };
}

async function sendWithSendgrid(input: LeadNotificationInput, text: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: NEXCALL_LEAD_EMAIL }] }],
      from: { email: process.env.EMAIL_FROM_ADDRESS || "noreply@nexcall.one", name: "NexCall" },
      subject: input.subject,
      content: [{ type: "text/plain", value: text }]
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid rejected notification with ${response.status}`);
  }

  return { ok: true as const, delivered: true, captured: true, provider: "sendgrid" as const };
}

async function sendWithWebhook(input: LeadNotificationInput, text: string) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL;

  if (!webhookUrl) return null;
  if (!isAllowedServerUrl(webhookUrl)) {
    throw new Error("Configured lead webhook is not an allowed HTTPS URL.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      to: NEXCALL_LEAD_EMAIL,
      text,
      createdAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Lead webhook rejected notification with ${response.status}`);
  }

  return { ok: true as const, delivered: true, captured: true, provider: "webhook" as const };
}

export async function notifyNexCallLead(input: LeadNotificationInput): Promise<NotificationResult> {
  const cleaned: LeadNotificationInput = {
    ...input,
    subject: safeValue(input.subject, 120),
    source: safeValue(input.source, 120),
    name: safeValue(input.name, 120),
    email: safeValue(input.email, 254),
    phone: safeValue(input.phone, 40),
    businessName: safeValue(input.businessName, 160),
    inquiryType: safeValue(input.inquiryType, 120),
    message: safeValue(input.message, 3000),
    notes: safeValue(input.notes, 3000),
    requestedTime: safeValue(input.requestedTime, 160),
    appointmentType: safeValue(input.appointmentType, 80)
  };
  const text = buildTextEmail(cleaned);

  try {
    const delivered =
      (await sendWithResend(cleaned, text)) ||
      (await sendWithSendgrid(cleaned, text)) ||
      (await sendWithWebhook(cleaned, text));

    if (delivered) return delivered;

    console.warn("NexCall lead captured without email provider", {
      subject: cleaned.subject,
      source: cleaned.source,
      email: maskEmail(cleaned.email),
      phone: maskPhone(cleaned.phone),
      destination: NEXCALL_LEAD_EMAIL
    });

    return { ok: true, delivered: false, captured: true, provider: "server-log" };
  } catch (error) {
    console.error("NexCall lead notification fallback capture", {
      subject: cleaned.subject,
      source: cleaned.source,
      email: maskEmail(cleaned.email),
      phone: maskPhone(cleaned.phone),
      destination: NEXCALL_LEAD_EMAIL,
      message: error instanceof Error ? error.message : "Unknown notification error"
    });

    return { ok: true, delivered: false, captured: true, provider: "fallback-log" };
  }
}
