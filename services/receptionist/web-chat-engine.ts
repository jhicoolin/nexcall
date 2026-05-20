import { cleanText } from "@/lib/security";
import { getHumanizedChatAnswer } from "@/lib/live-chat-response-bank";
import { evaluateConversationSafety } from "@/services/receptionist/safety-policy";

type WebChatAnswer = {
  answer: string;
  topic: string;
  keywords: string[];
  variants: number;
  needsHuman: boolean;
  terminated: boolean;
  safetyReason?: string;
  responseId?: string;
};

function buildResponseId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function answerFrontDeskChat(question: string): WebChatAnswer {
  const cleanedQuestion = cleanText(question, 700);
  const safety = evaluateConversationSafety(cleanedQuestion);

  if (!safety.allowed) {
    return {
      answer:
        safety.signOff ||
        "I need to keep this chat professional. You can reach the NexCall team directly at nexcall@proton.me or (202) 200-6578.",
      topic: "Safety sign-off",
      keywords: ["safety", "professional", "handoff"],
      variants: 1,
      needsHuman: false,
      terminated: true,
      safetyReason: safety.reason,
      responseId: buildResponseId()
    };
  }

  const result = getHumanizedChatAnswer(cleanedQuestion);

  return {
    answer: result.answer,
    topic: result.topic,
    keywords: result.keywords,
    variants: result.variants,
    needsHuman: result.needsHuman,
    terminated: result.terminated,
    responseId: buildResponseId()
  };
}
