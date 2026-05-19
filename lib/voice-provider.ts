import "server-only";
import type { TenantRuntimeConfig } from "@/lib/tenant-repository";
import { cleanText, isAllowedServerUrl } from "@/lib/security";

type VapiAssistantResponse = {
  id?: string;
  error?: string | { message?: string };
};

export function buildVapiAssistantPayload(tenant: TenantRuntimeConfig) {
  return {
    name: `${tenant.businessName} Receptionist`,
    firstMessage:
      tenant.greeting ||
      `Thanks for calling ${tenant.businessName}. I can help with scheduling and questions.`,
    model: {
      provider: process.env.VAPI_MODEL_PROVIDER || "openai",
      model: process.env.VAPI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            tenant.systemPrompt,
            "Production voice rules:",
            "- Keep answers under 30 words unless collecting details.",
            "- Allow interruptions and stop speaking when the caller talks.",
            "- Ask one question at a time.",
            "- Never invent availability, prices, policy, credentials, or medical/legal advice.",
            "- Escalate urgent, angry, complex, or human-requested calls."
          ].join("\n")
        }
      ]
    },
    transcriber: {
      provider: process.env.VAPI_TRANSCRIBER_PROVIDER || "deepgram",
      model: process.env.VAPI_TRANSCRIBER_MODEL || "nova-3"
    },
    voice: {
      provider: process.env.VAPI_VOICE_PROVIDER || "11labs",
      voiceId: process.env.VAPI_VOICE_ID || "default"
    },
    silenceTimeoutSeconds: 20,
    maxDurationSeconds: 1800,
    backgroundSound: "off",
    serverMessages: ["end-of-call-report", "transcript", "status-update"],
    endCallFunctionEnabled: true
  };
}

export async function provisionVapiAssistant(tenant: TenantRuntimeConfig) {
  const apiKey = process.env.VAPI_API_KEY;

  if (!apiKey) {
    throw new Error("VAPI_API_KEY is required to provision a Vapi assistant.");
  }

  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildVapiAssistantPayload(tenant))
  });
  const data = (await response.json()) as VapiAssistantResponse;

  if (!response.ok || !data.id) {
    const error =
      typeof data.error === "string" ? data.error : data.error?.message || "Vapi assistant provisioning failed.";
    throw new Error(error);
  }

  return data.id;
}

export function getExternalVoiceWebhook(tenant: TenantRuntimeConfig) {
  const url = cleanText(tenant.externalVoiceWebhookUrl, 500);

  return url && isAllowedServerUrl(url) ? url : "";
}

export function getVoiceProviderLabel(tenant: TenantRuntimeConfig) {
  if (tenant.voiceProvider === "VAPI") return "Vapi low-latency voice agent";
  if (tenant.voiceProvider === "LIVEKIT") return "LiveKit Agents realtime voice";
  if (tenant.voiceProvider === "CUSTOM_STREAM") return "Custom Twilio media stream";
  return "External voice webhook";
}
