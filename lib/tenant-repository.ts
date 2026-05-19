import "server-only";
import type { Tenant, TenantStatus, VoiceProvider } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/secret-vault";
import { cleanIdentifier, cleanText, isAllowedServerUrl } from "@/lib/security";

export type TenantRuntimeConfig = {
  id: string;
  slug: string;
  businessName: string;
  twilioPhoneNumber: string;
  phoneNumbers: string[];
  assignedTwilioNumber: string;
  systemPrompt: string;
  calendarWebhookUrl: string;
  leadWebhookUrl: string;
  smsWebhookUrl: string;
  huggingFaceModelId: string;
  speechToTextModelId: string;
  llmModelId: string;
  timezone: string;
  greeting?: string;
  escalationPhone?: string;
  crmProvider?: string;
  calendarProvider?: string;
  voiceProvider: VoiceProvider | "VAPI" | "LIVEKIT" | "CUSTOM_STREAM" | "EXTERNAL_WEBHOOK";
  vapiAssistantId?: string;
  livekitAgentName?: string;
  externalVoiceWebhookUrl?: string;
  maxMonthlyMinutes: number;
  maxMonthlySpendCents: number;
  status: TenantStatus | "ACTIVE" | "PAUSED" | "ONBOARDING" | "CANCELLED";
};

export type TenantUpsertInput = {
  slug: string;
  businessName: string;
  assignedTwilioNumber: string;
  systemPrompt: string;
  status?: TenantStatus;
  industry?: string;
  timezone?: string;
  greeting?: string;
  escalationPhone?: string;
  calendarProvider?: string;
  crmProvider?: string;
  voiceProvider?: VoiceProvider;
  vapiAssistantId?: string;
  livekitAgentName?: string;
  externalVoiceWebhookUrl?: string;
  calendarWebhookUrl?: string;
  leadWebhookUrl?: string;
  smsWebhookUrl?: string;
  huggingFaceModelId?: string;
  speechToTextModelId?: string;
  llmModelId?: string;
  maxMonthlyMinutes?: number;
  maxMonthlySpendCents?: number;
};

function normalizePhone(value = "") {
  const compact = value.replace(/[^\d+]/g, "");

  if (compact.startsWith("+")) return compact;
  if (compact.length === 10) return `+1${compact}`;
  return compact;
}

export function normalizeTenantPhone(value: unknown) {
  return normalizePhone(cleanText(value, 40));
}

function cleanModelId(value: unknown, fallback: string) {
  const model = cleanText(value, 160);

  return /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(model) ? model : fallback;
}

function demoTenant(): TenantRuntimeConfig {
  const phone = normalizeTenantPhone(
    process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER ||
      process.env.NEXT_PUBLIC_DEMO_PHONE_NUMBER ||
      "+15551234567"
  );

  return {
    id: "demo",
    slug: "demo",
    businessName: "Revenue Guard Demo",
    twilioPhoneNumber: phone,
    assignedTwilioNumber: phone,
    phoneNumbers: [phone],
    systemPrompt:
      process.env.DEFAULT_RECEPTIONIST_SYSTEM_PROMPT ||
      "You are a warm, concise AI receptionist. Ask one question at a time, verify contact details, book only when availability is confirmed, and escalate complex requests to a human.",
    calendarWebhookUrl: process.env.CALENDAR_WEBHOOK_URL || "",
    leadWebhookUrl: process.env.LEAD_WEBHOOK_URL || "",
    smsWebhookUrl: process.env.SMS_WEBHOOK_URL || "",
    huggingFaceModelId: process.env.HUGGINGFACE_TTS_MODEL || "hexgrad/Kokoro-82M",
    speechToTextModelId: process.env.HUGGINGFACE_STT_MODEL || "openai/whisper-large-v3-turbo",
    llmModelId: process.env.HUGGINGFACE_LLM_MODEL || "mistralai/Mistral-7B-Instruct-v0.3",
    timezone: "America/New_York",
    greeting: "Thanks for calling Revenue Guard. I can help with appointments, questions, and follow-up.",
    calendarProvider: "Demo calendar",
    crmProvider: "Demo lead storage",
    voiceProvider: (process.env.DEFAULT_VOICE_PROVIDER as TenantRuntimeConfig["voiceProvider"]) || "VAPI",
    externalVoiceWebhookUrl: process.env.VOICE_AGENT_WEBHOOK_URL || "",
    maxMonthlyMinutes: 500,
    maxMonthlySpendCents: 20000,
    status: "ACTIVE"
  };
}

function runtimeFromTenant(tenant: Tenant): TenantRuntimeConfig {
  const calendarWebhookUrl = decryptSecret({
    ciphertext: tenant.calendarWebhookCiphertext || undefined,
    iv: tenant.calendarWebhookIv || undefined,
    authTag: tenant.calendarWebhookAuthTag || undefined
  });
  const leadWebhookUrl = decryptSecret({
    ciphertext: tenant.leadWebhookCiphertext || undefined,
    iv: tenant.leadWebhookIv || undefined,
    authTag: tenant.leadWebhookAuthTag || undefined
  });
  const smsWebhookUrl = decryptSecret({
    ciphertext: tenant.smsWebhookCiphertext || undefined,
    iv: tenant.smsWebhookIv || undefined,
    authTag: tenant.smsWebhookAuthTag || undefined
  });

  return {
    id: tenant.id,
    slug: tenant.slug,
    businessName: tenant.businessName,
    twilioPhoneNumber: tenant.assignedTwilioNumber,
    assignedTwilioNumber: tenant.assignedTwilioNumber,
    phoneNumbers: [tenant.assignedTwilioNumber],
    systemPrompt: tenant.systemPrompt,
    calendarWebhookUrl,
    leadWebhookUrl,
    smsWebhookUrl,
    huggingFaceModelId: tenant.huggingFaceModelId,
    speechToTextModelId: tenant.speechToTextModelId,
    llmModelId: tenant.llmModelId,
    timezone: tenant.timezone,
    greeting: tenant.greeting || undefined,
    escalationPhone: tenant.escalationPhone || undefined,
    crmProvider: tenant.crmProvider || undefined,
    calendarProvider: tenant.calendarProvider || undefined,
    voiceProvider: tenant.voiceProvider,
    vapiAssistantId: tenant.vapiAssistantId || undefined,
    livekitAgentName: tenant.livekitAgentName || undefined,
    externalVoiceWebhookUrl: tenant.externalVoiceWebhookUrl || undefined,
    maxMonthlyMinutes: tenant.maxMonthlyMinutes,
    maxMonthlySpendCents: tenant.maxMonthlySpendCents,
    status: tenant.status
  };
}

export async function listTenants() {
  if (!isDatabaseConfigured()) return [demoTenant()];

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" }
  });

  return tenants.map(runtimeFromTenant);
}

export async function findTenantById(id: unknown) {
  const cleanId = cleanIdentifier(id, 100);
  if (!cleanId) return null;
  if (!isDatabaseConfigured()) return cleanId === "demo" ? demoTenant() : null;

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: cleanId }, { slug: cleanId }]
    }
  });

  return tenant ? runtimeFromTenant(tenant) : null;
}

export async function findTenantByPhone(phone: unknown) {
  const normalized = normalizeTenantPhone(phone);
  if (!normalized) return null;
  if (!isDatabaseConfigured()) {
    const demo = demoTenant();
    return demo.assignedTwilioNumber === normalized ? demo : null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { assignedTwilioNumber: normalized }
  });

  return tenant ? runtimeFromTenant(tenant) : null;
}

export async function findTenantForPayload(payload: Record<string, unknown>) {
  return (
    (await findTenantById(payload.tenantId || payload.clientId)) ||
    (await findTenantByPhone(
      payload.assignedTwilioNumber || payload.twilioPhoneNumber || payload.businessPhone || payload.to || payload.To
    ))
  );
}

function encryptedWebhook(value: string | undefined) {
  const cleanValue = cleanText(value, 500);

  if (!cleanValue) return {};
  if (!isAllowedServerUrl(cleanValue)) {
    throw new Error("Webhook URL must be a valid HTTPS URL.");
  }

  const encrypted = encryptSecret(cleanValue);

  return {
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag
  };
}

export async function upsertTenant(input: TenantUpsertInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required to create or update tenants.");
  }

  const calendar = encryptedWebhook(input.calendarWebhookUrl);
  const lead = encryptedWebhook(input.leadWebhookUrl);
  const sms = encryptedWebhook(input.smsWebhookUrl);
  const assignedTwilioNumber = normalizeTenantPhone(input.assignedTwilioNumber);

  if (!assignedTwilioNumber) throw new Error("Assigned Twilio number is required.");

  const data = {
    slug: cleanIdentifier(input.slug, 80),
    businessName: cleanText(input.businessName, 160),
    assignedTwilioNumber,
    systemPrompt: cleanText(input.systemPrompt, 6000),
    status: input.status,
    industry: cleanText(input.industry, 80) || null,
    timezone: cleanText(input.timezone, 80) || "America/New_York",
    greeting: cleanText(input.greeting, 300) || null,
    escalationPhone: normalizeTenantPhone(input.escalationPhone) || null,
    calendarProvider: cleanText(input.calendarProvider, 80) || null,
    crmProvider: cleanText(input.crmProvider, 80) || null,
    voiceProvider: input.voiceProvider || "VAPI",
    vapiAssistantId: cleanText(input.vapiAssistantId, 120) || null,
    livekitAgentName: cleanText(input.livekitAgentName, 120) || null,
    externalVoiceWebhookUrl: cleanText(input.externalVoiceWebhookUrl, 500) || null,
    calendarWebhookCiphertext: calendar.ciphertext,
    calendarWebhookIv: calendar.iv,
    calendarWebhookAuthTag: calendar.authTag,
    leadWebhookCiphertext: lead.ciphertext,
    leadWebhookIv: lead.iv,
    leadWebhookAuthTag: lead.authTag,
    smsWebhookCiphertext: sms.ciphertext,
    smsWebhookIv: sms.iv,
    smsWebhookAuthTag: sms.authTag,
    huggingFaceModelId: cleanModelId(input.huggingFaceModelId, "hexgrad/Kokoro-82M"),
    speechToTextModelId: cleanModelId(input.speechToTextModelId, "openai/whisper-large-v3-turbo"),
    llmModelId: cleanModelId(input.llmModelId, "mistralai/Mistral-7B-Instruct-v0.3"),
    maxMonthlyMinutes: Math.max(0, Math.min(Number(input.maxMonthlyMinutes || 500), 100000)),
    maxMonthlySpendCents: Math.max(0, Math.min(Number(input.maxMonthlySpendCents || 20000), 10000000))
  };

  if (!data.slug || !data.businessName || !data.systemPrompt) {
    throw new Error("Tenant slug, business name, and system prompt are required.");
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: data.slug },
    create: data,
    update: data
  });

  return runtimeFromTenant(tenant);
}

export async function getTenantAnalytics(tenantId?: string) {
  if (!isDatabaseConfigured()) {
    return {
      tenants: [demoTenant()],
      totals: { callsHandled: 0, appointmentsBooked: 0, revenueCents: 0, costCents: 0, profitCents: 0 }
    };
  }

  const where = tenantId ? { tenantId } : {};
  const calls = await prisma.callLog.findMany({ where });
  const billing = await prisma.billingRecord.findMany({ where: tenantId ? { tenantId } : {} });
  const revenueCents = billing.reduce((sum, row) => sum + row.monthlyPriceCents + row.usageCostCents, 0);
  const costCents = calls.reduce((sum, row) => sum + row.costCents, 0);

  return {
    totals: {
      callsHandled: calls.length,
      appointmentsBooked: calls.filter((call) => call.bookingSuccess).length,
      revenueCents,
      costCents,
      profitCents: revenueCents - costCents
    }
  };
}

export function appendTenantContextToUrl(url: string, tenant: TenantRuntimeConfig | null | undefined, params = {}) {
  const target = new URL(url);
  const extraParams = params as Record<string, unknown>;

  if (tenant) {
    target.searchParams.set("tenantId", tenant.id);
    target.searchParams.set("clientId", tenant.id);
    target.searchParams.set("businessName", tenant.businessName);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    const cleanKey = cleanIdentifier(key, 80);
    const cleanValue = cleanText(value, 220);

    if (cleanKey && cleanValue) {
      target.searchParams.set(cleanKey, cleanValue);
    }
  });

  return target.toString();
}
