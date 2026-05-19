import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listTenants, upsertTenant } from "@/lib/tenant-repository";
import { readJsonObject, validationResponse } from "@/lib/security";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const tenants = await listTenants();

  return NextResponse.json({ ok: true, tenants });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 12000);
  } catch (error) {
    return validationResponse(error);
  }

  try {
    const tenant = await upsertTenant({
      slug: String(payload.slug || ""),
      businessName: String(payload.businessName || ""),
      assignedTwilioNumber: String(payload.assignedTwilioNumber || payload.twilioPhoneNumber || ""),
      systemPrompt: String(payload.systemPrompt || ""),
      status: payload.status === "ACTIVE" ? "ACTIVE" : payload.status === "PAUSED" ? "PAUSED" : "ONBOARDING",
      industry: String(payload.industry || ""),
      timezone: String(payload.timezone || ""),
      greeting: String(payload.greeting || ""),
      escalationPhone: String(payload.escalationPhone || ""),
      calendarProvider: String(payload.calendarProvider || ""),
      crmProvider: String(payload.crmProvider || ""),
      voiceProvider:
        payload.voiceProvider === "LIVEKIT"
          ? "LIVEKIT"
          : payload.voiceProvider === "CUSTOM_STREAM"
            ? "CUSTOM_STREAM"
            : payload.voiceProvider === "EXTERNAL_WEBHOOK"
              ? "EXTERNAL_WEBHOOK"
              : "VAPI",
      vapiAssistantId: String(payload.vapiAssistantId || ""),
      livekitAgentName: String(payload.livekitAgentName || ""),
      externalVoiceWebhookUrl: String(payload.externalVoiceWebhookUrl || ""),
      calendarWebhookUrl: String(payload.calendarWebhookUrl || ""),
      leadWebhookUrl: String(payload.leadWebhookUrl || ""),
      smsWebhookUrl: String(payload.smsWebhookUrl || ""),
      huggingFaceModelId: String(payload.huggingFaceModelId || ""),
      speechToTextModelId: String(payload.speechToTextModelId || ""),
      llmModelId: String(payload.llmModelId || ""),
      maxMonthlyMinutes: Number(payload.maxMonthlyMinutes || 500),
      maxMonthlySpendCents: Number(payload.maxMonthlySpendCents || 20000)
    });

    return NextResponse.json({ ok: true, tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save tenant.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
