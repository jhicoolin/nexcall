import { cleanText } from "@/lib/security";

export type SafetyDecision = {
  allowed: boolean;
  reason?: "profanity" | "harassment" | "threat" | "sexual" | "abuse";
  signOff?: string;
};

const customBlockedTerms = (process.env.SAFETY_BLOCKLIST || "")
  .split(",")
  .map((term) => cleanText(term, 80).toLowerCase())
  .filter(Boolean);

const blockedPatterns: Array<{ reason: NonNullable<SafetyDecision["reason"]>; pattern: RegExp }> = [
  { reason: "threat", pattern: /\b(kill\s+yourself|kys|i\s+will\s+hurt|i\s+will\s+kill|death\s+threat)\b/i },
  { reason: "sexual", pattern: /\b(sexual\s+favor|explicit\s+sexual|send\s+nudes|nude\s+photo)\b/i },
  { reason: "harassment", pattern: /\b(slur|racial\s+insult|hate\s+speech|worthless\s+idiot)\b/i },
  { reason: "abuse", pattern: /\b(fraud\s+this|scam\s+them|steal\s+from|hack\s+their)\b/i },
  { reason: "profanity", pattern: /\b(fuck|shit|bitch|asshole|cunt|dickhead)\b/i }
];

const safetySignOff =
  "I apologize, but I have to end this conversation because the language is not appropriate for a professional service chat. Have a good day.";

/**
 * Protects the business and staff experience by ending hostile or unsafe chats.
 *
 * Business value: every automated receptionist should reduce front-office stress,
 * not force a client team to absorb harassment. The decision object lets web chat,
 * phone turns, and future WebSocket workers all apply the same kill-switch policy.
 */
export function evaluateConversationSafety(input: unknown): SafetyDecision {
  const text = cleanText(input, 1200).toLowerCase();

  if (!text) return { allowed: true };

  const customTerm = customBlockedTerms.find((term) => text.includes(term));

  if (customTerm) {
    return { allowed: false, reason: "harassment", signOff: safetySignOff };
  }

  const match = blockedPatterns.find(({ pattern }) => pattern.test(text));

  if (!match) return { allowed: true };

  return { allowed: false, reason: match.reason, signOff: safetySignOff };
}

