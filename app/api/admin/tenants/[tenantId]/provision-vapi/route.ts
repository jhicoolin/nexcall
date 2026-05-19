import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { findTenantById, upsertTenant } from "@/lib/tenant-repository";
import { provisionVapiAssistant } from "@/lib/voice-provider";

export async function POST(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { tenantId } = await context.params;
  const tenant = await findTenantById(tenantId);

  if (!tenant) {
    return NextResponse.json({ ok: false, error: "Tenant not found." }, { status: 404 });
  }

  try {
    const assistantId = await provisionVapiAssistant(tenant);
    const updated = await upsertTenant({
      slug: tenant.slug,
      businessName: tenant.businessName,
      assignedTwilioNumber: tenant.assignedTwilioNumber,
      systemPrompt: tenant.systemPrompt,
      status: tenant.status === "ACTIVE" ? "ACTIVE" : "ONBOARDING",
      timezone: tenant.timezone,
      greeting: tenant.greeting,
      escalationPhone: tenant.escalationPhone,
      calendarProvider: tenant.calendarProvider,
      crmProvider: tenant.crmProvider,
      voiceProvider: "VAPI",
      vapiAssistantId: assistantId,
      livekitAgentName: tenant.livekitAgentName,
      externalVoiceWebhookUrl: tenant.externalVoiceWebhookUrl,
      calendarWebhookUrl: tenant.calendarWebhookUrl,
      leadWebhookUrl: tenant.leadWebhookUrl,
      smsWebhookUrl: tenant.smsWebhookUrl,
      huggingFaceModelId: tenant.huggingFaceModelId,
      speechToTextModelId: tenant.speechToTextModelId,
      llmModelId: tenant.llmModelId,
      maxMonthlyMinutes: tenant.maxMonthlyMinutes,
      maxMonthlySpendCents: tenant.maxMonthlySpendCents
    });

    return NextResponse.json({ ok: true, assistantId, tenant: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not provision Vapi assistant.";

    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
