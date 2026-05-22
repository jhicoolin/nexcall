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
 * Jailbreak / prompt-injection detection patterns.
 * These are NOT auto-blocked — the LLM system prompt handles them correctly.
 * They are detected so the route can: log the attempt, and pass an extra
 * signal to the AI (via the system prompt addendum) that an injection was tried.
 *
 * We deliberately do NOT reveal to the user that we detected an attempt.
 */
const jailbreakPatterns: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?)/i,
  /you\s+are\s+now\s+(dan|gpt|an?\s+unrestricted|a\s+different)/i,
  /pretend\s+(you\s+have\s+no|there\s+are\s+no)\s+(rules?|restrictions?|limits?|guidelines?)/i,
  /act\s+as\s+(if\s+you\s+(have\s+no|are\s+without)|your\s+alter\s+ego|a\s+different\s+ai)/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /what\s+are\s+your\s+(instructions?|rules?|prompts?|system\s+prompt)/i,
  /forget\s+(everything|all)\s+(you\s+(know|were\s+told)|previous)/i,
  /\[system\]|\[assistant\]|\[user\]/i,       // explicit role tag injection
  /###\s*(system|instruction|override)/i,      // markdown heading role injection
  /<\|?(system|im_start|im_end)\|?>/i,        // token-level injection patterns
  /do\s+anything\s+now|DAN\s+mode/i,
  /disregard\s+(all\s+)?(prior|previous|earlier)\s+(instructions?|context)/i,
  /new\s+instruction[s]?:/i,
  /system\s+prompt\s+(is|was|says|contains)/i
];

/**
 * Returns true if the input contains a known prompt-injection attempt.
 * Does not modify or block — caller decides what to do with the signal.
 */
export function detectJailbreakAttempt(input: string): boolean {
  const text = cleanText(input, 1500).toLowerCase();
  return jailbreakPatterns.some((p) => p.test(text));
}

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
