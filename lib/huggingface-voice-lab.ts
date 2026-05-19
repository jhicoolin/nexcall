export type HuggingFaceScenarioId =
  | "appointment"
  | "lead"
  | "restaurant"
  | "support"
  | "ivr"
  | "legal";

export type HuggingFaceVoiceOption = {
  name: string;
  model: string;
  url: string;
  bestFor: string;
  note: string;
  license: string;
};

export const huggingFaceVoiceOptions: HuggingFaceVoiceOption[] = [
  {
    name: "Kokoro",
    model: "hexgrad/Kokoro-82M",
    url: "https://huggingface.co/hexgrad/Kokoro-82M",
    bestFor: "Fast, low-cost open-weight demo clips",
    note: "Small enough to test quickly, with a permissive Apache license and multiple voice options.",
    license: "Apache-2.0"
  },
  {
    name: "Chatterbox",
    model: "ResembleAI/chatterbox",
    url: "https://huggingface.co/ResembleAI/chatterbox",
    bestFor: "Expressive voice-agent scenarios",
    note: "Strong pick for warmer demos because it supports multilingual speech, voice prompts, and emotion intensity control.",
    license: "MIT"
  },
  {
    name: "Qwen3-TTS CustomVoice",
    model: "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    url: "https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    bestFor: "Custom voice design and controlled styles",
    note: "Useful when you want a private-owned-company sound instead of a generic assistant voice.",
    license: "Check model card"
  },
  {
    name: "VibeVoice Realtime",
    model: "microsoft/VibeVoice-Realtime-0.5B",
    url: "https://huggingface.co/microsoft/VibeVoice-Realtime-0.5B",
    bestFor: "Low-latency streaming experiments",
    note: "Designed for streaming text input, which makes it worth testing for live agent response timing.",
    license: "MIT"
  }
];

export const huggingFaceScenarioModels: Record<HuggingFaceScenarioId, string> = {
  appointment: "ResembleAI/chatterbox",
  lead: "hexgrad/Kokoro-82M",
  restaurant: "ResembleAI/chatterbox",
  support: "microsoft/VibeVoice-Realtime-0.5B",
  ivr: "hexgrad/Kokoro-82M",
  legal: "ResembleAI/chatterbox"
};

export const huggingFaceScenarioScripts: Record<HuggingFaceScenarioId, string> = {
  appointment:
    "I can help with that. I see 2:30 PM and 4:15 PM on Thursday. Which works better? Done. Your appointment is confirmed for Thursday at 4:15 PM, and I just sent the details.",
  lead:
    "Absolutely. What area are you looking in, and are you hoping to move in the next six months? Great. I captured that. I can book a buyer consult or transfer you with those details now.",
  restaurant:
    "Yes. I have a 7:15 PM indoor table or an 8 PM patio table. We can note gluten-free for the kitchen. You're confirmed for four on the patio at 8 PM. I sent the confirmation text.",
  support:
    "I can look that up. Can you confirm the email or phone number on the order? Thanks. I found the order, created a support ticket, and sent the tracking link by text.",
  ivr:
    "I can route you. Is this about billing, claims, or changing coverage? I captured both. I'll send you to the coverage team with the billing note attached.",
  legal:
    "I'm sorry that happened. I can gather the basics and make sure the right person follows up. Thank you. I saved the report note and routed this as a priority consultation request."
};

export function isHuggingFaceScenarioId(value: unknown): value is HuggingFaceScenarioId {
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

export function getScenarioTtsScript(scenarioId: HuggingFaceScenarioId) {
  return cleanTtsScript(huggingFaceScenarioScripts[scenarioId]);
}
