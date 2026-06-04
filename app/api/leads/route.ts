import { NextResponse } from "next/server";
import { getClientForPayload } from "@/lib/client-directory";
import { notifyNexCallLead } from "@/lib/lead-notifications";
import {
  assertAllowedFields,
  checkRateLimit,
  cleanIdentifier,
  cleanText,
  isHoneypotTriggered,
  isAllowedServerUrl,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  originGuardResponse,
  rateLimitResponse,
  readJsonObject,
  validationResponse
} from "@/lib/security";
import { normalizePhoneToE164 } from "@/lib/phone";

type LeadPayload = {
  clientId?: string;
  clientBusinessName?: string;
  businessPhone?: string;
  trucks?: string;
  service?: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
  businessName?: string;
  businessType?: string;
  selectedPlan?: string;
  requestedTime?: string;
};

export async function POST(request: Request) {
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const limit = await checkRateLimit(request, {
    bucket: "leads",
    limit: 8,
    windowSeconds: 5 * 60
  });

  if (!limit.allowed) return rateLimitResponse(limit);

  let rawPayload: Record<string, unknown>;

  try {
    rawPayload = await readJsonObject(request);
  } catch (error) {
    return validationResponse(error);
  }

  try {
    assertAllowedFields(
      rawPayload,
      [
        "businessName",
        "businessPhone",
        "businessType",
        "clientBusinessName",
        "clientId",
        "companyWebsiteConfirm",
        "email",
        "message",
        "name",
        "phone",
        "requestedTime",
        "selectedPlan",
        "service",
        "source",
        "trucks",
        "website",
        "websiteConfirm"
      ],
      "lead payload"
    );
  } catch (error) {
    return validationResponse(error);
  }

  if (isHoneypotTriggered(rawPayload)) {
    return NextResponse.json({
      ok: true,
      notification: { ok: true, delivered: false, captured: false }
    });
  }

  const payload: LeadPayload = {
    clientId: cleanIdentifier(rawPayload.clientId, 80),
    businessPhone: cleanText(rawPayload.businessPhone, 40),
    trucks: cleanText(rawPayload.trucks, 80),
    service: cleanText(rawPayload.service, 120),
    email: normalizeEmail(rawPayload.email),
    phone: normalizePhoneToE164(rawPayload.phone),
    message: cleanText(rawPayload.message, 1000),
    source: cleanIdentifier(rawPayload.source || "ai-receptionist-site", 100),
    businessName: cleanText(rawPayload.businessName, 160),
    businessType: cleanText(rawPayload.businessType, 120),
    selectedPlan: cleanIdentifier(rawPayload.selectedPlan, 80),
    requestedTime: cleanText(rawPayload.requestedTime, 160)
  };

  payload.trucks =
    payload.trucks ||
    cleanText(rawPayload.name, 120) ||
    payload.businessName ||
    "Not provided";
  payload.service =
    payload.service ||
    payload.businessType ||
    payload.businessName ||
    payload.message ||
    "General inquiry";

  if (!payload.email && !payload.phone) {
    return NextResponse.json(
      { ok: false, error: "Enter an email address or phone number." },
      { status: 400 }
    );
  }

  if (payload.email && !isValidEmail(payload.email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  if (payload.phone && !isValidPhone(payload.phone)) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
  }

  const client = await getClientForPayload(rawPayload);
  const lead = {
    ...payload,
    clientId: payload.clientId || client?.id || "demo",
    clientBusinessName: client?.businessName || "NexCall Demo",
    createdAt: new Date().toISOString()
  };
  const leadWebhookUrl = client?.leadWebhookUrl || process.env.LEAD_WEBHOOK_URL;

  if (leadWebhookUrl) {
    if (!isAllowedServerUrl(leadWebhookUrl)) {
      console.error("Lead webhook URL is not allowed", { source: lead.source });
    } else {
      try {
        const response = await fetch(leadWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead)
        });

        if (!response.ok) {
          console.error("Lead webhook rejected the request", {
            status: response.status,
            source: lead.source
          });
        }
      } catch (error) {
        console.error("Lead webhook failed", {
          source: lead.source,
          message: error instanceof Error ? error.message : "Unknown lead webhook error"
        });
      }
    }
  }

  const notification = await notifyNexCallLead({
    subject: lead.source?.includes("chat") ? "New NexCall Contact Request" : "New NexCall Demo Request",
    source: lead.source || "nexcall-site",
    name: cleanText(rawPayload.name, 120) || lead.trucks,
    email: lead.email,
    phone: lead.phone,
    businessName: payload.businessName || lead.service,
    inquiryType: lead.source?.includes("chat") ? "human follow-up" : "demo request",
    appointmentType: payload.selectedPlan,
    requestedTime: payload.requestedTime,
    message: lead.message || `Team size: ${lead.trucks}. Business type: ${payload.businessType || lead.service}.`,
    metadata: {
      clientId: lead.clientId,
      clientBusinessName: lead.clientBusinessName,
      businessType: payload.businessType,
      selectedPlan: payload.selectedPlan,
      requestedTime: payload.requestedTime
    }
  });

  return NextResponse.json({
    ok: true,
    notification: {
      ok: notification.ok,
      delivered: notification.delivered,
      captured: notification.captured
    }
  });
}
