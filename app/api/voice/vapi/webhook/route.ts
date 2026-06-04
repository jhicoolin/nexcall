import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { findTenantById } from "@/lib/tenant-repository";
import { cleanText, readJsonObject, validationResponse } from "@/lib/security";

function getVapiSecret() {
  return (process.env.VAPI_WEBHOOK_SECRET || "").trim();
}

function isAuthorized(request: Request) {
  const secret = getVapiSecret();
  if (!secret) return process.env.NODE_ENV !== "production";

  const headerSecret = request.headers.get("x-vapi-secret") || "";
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  return headerSecret === secret || bearer === secret;
}

export async function POST(request: Request) {
  const secret = getVapiSecret();
  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ ok: false, error: "Vapi webhook is not configured." }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized Vapi webhook." }, { status: 401 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 50000);
  } catch (error) {
    return validationResponse(error);
  }

  const tenantId = cleanText(payload.tenantId || payload.clientId || payload.assistantId, 120);
  const tenant = await findTenantById(tenantId);

  await inngest.send({
    name: "call/summary.requested",
    data: {
      tenantId: tenant?.id || tenantId,
      callSid: cleanText(payload.callSid || payload.id || payload.callId, 120),
      fromNumber: cleanText(payload.from || payload.customerNumber, 40),
      toNumber: cleanText(payload.to || payload.phoneNumber, 40),
      durationSeconds: Number(payload.durationSeconds || payload.duration || 0),
      transcript: cleanText(payload.transcript, 20000),
      summary: cleanText(payload.summary || payload.endedReason, 4000),
      bookingSuccess: Boolean(payload.bookingSuccess),
      costCents: Number(payload.costCents || 0),
      rawProvider: "vapi"
    }
  });

  return NextResponse.json({ ok: true, queued: true });
}
