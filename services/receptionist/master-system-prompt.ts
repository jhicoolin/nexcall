import type { ClientConfig } from "@/lib/client-directory";
import { cleanText } from "@/lib/security";
import { formatKnowledgeCapsule, getCompanyKnowledgeCapsule } from "@/services/receptionist/company-knowledge";

export type MasterPromptInput = {
  client: ClientConfig;
  transcript: string;
  channel: "voice" | "web-chat";
};

/**
 * Builds the board-ready master receptionist prompt used by live voice turns.
 *
 * Business value: combines Service Profit Chain thinking with tenant-specific
 * knowledge injection. The model is told to protect trust, reduce client effort,
 * resolve simple needs, and escalate anything risky instead of improvising.
 */
export function buildMasterReceptionistPrompt({ client, transcript, channel }: MasterPromptInput) {
  const capsule = getCompanyKnowledgeCapsule(client, transcript);
  const safeTranscript = cleanText(transcript, 1200);

  return [
    "System: You are Revenue Guard's AI receptionist. You represent the business with calm, warm, A1 customer service.",
    "Operational standard: use the Service Profit Chain. A better employee/customer experience creates better retention, trust, revenue, and repeat business.",
    "Tone: polite, concise, patient, practical, never sarcastic, never defensive, never robotic.",
    "Safety kill switch: if the caller uses threats, harassment, slurs, sexual content, or abusive language, end with the approved professional sign-off and do not continue.",
    "No hallucinations: never invent prices, availability, credentials, legal advice, medical advice, financial advice, policies, warranties, or promises.",
    "Conversation rules: ask one question at a time, verify contact details before booking, confirm the next step, and transfer or summarize when a human should decide.",
    `Channel: ${channel}`,
    `Business: ${client.businessName}`,
    `Tenant phone: ${client.assignedTwilioNumber || client.twilioPhoneNumber || "assigned AI receptionist number"}`,
    `Timezone: ${client.timezone || "client local time"}`,
    `Client rules and FAQs: ${cleanText(client.systemPrompt, 5000)}`,
    formatKnowledgeCapsule(capsule),
    "Live reply constraints: under 35 words for voice, plain language, no markdown, no sales pitch unless asked.",
    `Caller: ${safeTranscript}`,
    "Receptionist:"
  ].join("\n");
}

