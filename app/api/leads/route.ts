import { NextResponse } from "next/server";
import { getClientForPayload } from "@/lib/client-directory";
import {
  cleanIdentifier,
  cleanText,
  isAllowedServerUrl,
  isValidEmail,
  isValidPhone,
  readJsonObject,
  validationResponse
} from "@/lib/security";

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
};

export async function POST(request: Request) {
  let rawPayload: Record<string, unknown>;

  try {
    rawPayload = await readJsonObject(request);
  } catch (error) {
    return validationResponse(error);
  }

  const payload: LeadPayload = {
    clientId: cleanIdentifier(rawPayload.clientId, 80),
    businessPhone: cleanText(rawPayload.businessPhone, 40),
    trucks: cleanText(rawPayload.trucks, 80),
    service: cleanText(rawPayload.service, 120),
    email: cleanText(rawPayload.email, 254),
    phone: cleanText(rawPayload.phone, 40),
    message: cleanText(rawPayload.message, 1000),
    source: cleanIdentifier(rawPayload.source || "ai-receptionist-site", 100)
  };

  const missing = ["trucks", "service", "email", "phone"].filter(
    (field) => !payload[field as keyof LeadPayload]
  );

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Missing fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  if (!isValidEmail(payload.email || "")) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isValidPhone(payload.phone || "")) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
  }

  const client = await getClientForPayload(rawPayload);
  const lead = {
    ...payload,
    clientId: payload.clientId || client?.id || "demo",
    clientBusinessName: client?.businessName || "Revenue Guard Demo",
    createdAt: new Date().toISOString()
  };
  const leadWebhookUrl = client?.leadWebhookUrl || process.env.LEAD_WEBHOOK_URL;

  if (leadWebhookUrl) {
    if (!isAllowedServerUrl(leadWebhookUrl)) {
      return NextResponse.json(
        { ok: false, error: "Lead webhook URL must be a secure HTTPS URL." },
        { status: 500 }
      );
    }

    const response = await fetch(leadWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Lead webhook rejected the request." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
