export type NexCallScenarioId =
  | "appointment"
  | "lead"
  | "restaurant"
  | "support"
  | "ivr"
  | "legal";

export type NexCallVoiceOption = {
  name: string;
  provider: string;
  bestFor: string;
  note: string;
  envHint: string;
};

export const nexCallVoiceOptions: NexCallVoiceOption[] = [
  {
    name: "Nexa",
    provider: "ElevenLabs Conversational AI",
    bestFor: "Warm booking and reschedule calls",
    note: "Primary demo voice for callers who need quick, calm help without feeling rushed.",
    envHint: "ELEVENLABS_DEMO_VOICE_ID"
  },
  {
    name: "NexCall Sales Assistant",
    provider: "ElevenLabs TTS",
    bestFor: "Lead qualification and sales intake",
    note: "Confident, friendly voice profile for collecting context and moving qualified leads forward.",
    envHint: "ELEVENLABS_VOICE_ID_LEAD"
  },
  {
    name: "NexCall Support Agent",
    provider: "ElevenLabs TTS",
    bestFor: "Support, status, and FAQ calls",
    note: "Steady voice profile for routine questions, order lookups, and calm handoffs.",
    envHint: "ELEVENLABS_VOICE_ID_SUPPORT"
  },
  {
    name: "NexCall Receptionist",
    provider: "Browser fallback or uploaded MP3",
    bestFor: "Safe public fallback demos",
    note: "If ElevenLabs is not configured, the UI still animates the transcript and uses the best installed browser voice.",
    envHint: "public/audio/*.mp3"
  }
];

export const nexCallScenarioScripts: Record<NexCallScenarioId, string> = {
  appointment:
    "I can help with that. I see 2:30 PM and 4:15 PM on Thursday. Which works better? Done. Your appointment is confirmed for Thursday at 4:15 PM, and I just sent the details.",
  lead:
    "Absolutely. What area are you looking in, and are you hoping to move in the next six months? Great. I captured that. I can book a consult or transfer you with those details now.",
  restaurant:
    "Yes. I have a 7:15 PM indoor table or an 8 PM patio table. We can note gluten-free for the kitchen. You're confirmed for four on the patio at 8 PM. I sent the confirmation text.",
  support:
    "I can look that up. Can you confirm the email or phone number on the order? Thanks. I found the order, created a support ticket, and sent the tracking link by text.",
  ivr:
    "I can route you. Is this about billing, claims, or changing coverage? I captured both. I'll send you to the right team with the note attached.",
  legal:
    "I'm sorry that happened. I can gather the basics and make sure the right person follows up. Thank you. I saved the intake note and routed this as a priority consultation request."
};

export function isNexCallScenarioId(value: unknown): value is NexCallScenarioId {
  return (
    value === "appointment" ||
    value === "lead" ||
    value === "restaurant" ||
    value === "support" ||
    value === "ivr" ||
    value === "legal"
  );
}

export function cleanTtsScript(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 900);
}

export function getScenarioTtsScript(scenarioId: NexCallScenarioId) {
  return cleanTtsScript(nexCallScenarioScripts[scenarioId]);
}
