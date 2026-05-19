import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { findTenantById, upsertTenant } from "@/lib/tenant-repository";
import { readJsonObject, validationResponse } from "@/lib/security";

export async function PATCH(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { tenantId } = await context.params;
  const existing = await findTenantById(tenantId);

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Tenant not found." }, { status: 404 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 12000);
  } catch (error) {
    return validationResponse(error);
  }

  try {
    const tenant = await upsertTenant({
      slug: String(payload.slug || existing.slug),
      businessName: String(payload.businessName || existing.businessName),
      assignedTwilioNumber: String(payload.assignedTwilioNumber || existing.assignedTwilioNumber),
      systemPrompt: String(payload.systemPrompt || existing.systemPrompt),
      status: payload.status === "ACTIVE" ? "ACTIVE" : payload.status === "PAUSED" ? "PAUSED" : "ONBOARDING",
      timezone: String(payload.timezone || existing.timezone),
      greeting: String(payload.greeting || existing.greeting || ""),
      escalationPhone: String(payload.escalationPhone || existing.escalationPhone || ""),
      calendarProvider: String(payload.calendarProvider || existing.calendarProvider || ""),
      crmProvider: String(payload.crmProvider || existing.crmProvider || ""),
      voiceProvider:
        payload.voiceProvider === "LIVEKIT"
          ? "LIVEKIT"
          : payload.voiceProvider === "CUSTOM_STREAM"
            ? "CUSTOM_STREAM"
            : payload.voiceProvider === "EXTERNAL_WEBHOOK"
              ? "EXTERNAL_WEBHOOK"
              : "VAPI",
      vapiAssistantId: String(payload.vapiAssistantId || existing.vapiAssistantId || ""),
      livekitAgentName: String(payload.livekitAgentName || existing.livekitAgentName || ""),
      externalVoiceWebhookUrl: String(payload.externalVoiceWebhookUrl || existing.externalVoiceWebhookUrl || ""),
      calendarWebhookUrl: String(payload.calendarWebhookUrl || existing.calendarWebhookUrl || ""),
      leadWebhookUrl: String(payload.leadWebhookUrl || existing.leadWebhookUrl || ""),
      smsWebhookUrl: String(payload.smsWebhookUrl || existing.smsWebhookUrl || ""),
      huggingFaceModelId: String(payload.huggingFaceModelId || existing.huggingFaceModelId),
      speechToTextModelId: String(payload.speechToTextModelId || existing.speechToTextModelId),
      llmModelId: String(payload.llmModelId || existing.llmModelId),
      maxMonthlyMinutes: Number(payload.maxMonthlyMinutes || existing.maxMonthlyMinutes),
      maxMonthlySpendCents: Number(payload.maxMonthlySpendCents || existing.maxMonthlySpendCents)
    });

    return NextResponse.json({ ok: true, tenant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update tenant.";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
