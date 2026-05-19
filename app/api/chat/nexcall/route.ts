import { NextResponse } from "next/server";
import { cleanLiveChatQuestion } from "@/lib/live-chat-knowledge";
import { readJsonObject, validationResponse } from "@/lib/security";
import { answerFrontDeskChat } from "@/services/receptionist/web-chat-engine";

type ChatPayload = {
  question?: unknown;
};

export async function POST(request: Request) {
  let body: ChatPayload;

  try {
    body = await readJsonObject(request, 2500);
  } catch (error) {
    return validationResponse(error);
  }

  const question = typeof body.question === "string" ? cleanLiveChatQuestion(body.question) : "";

  if (!question) {
    return NextResponse.json({ ok: false, error: "Ask a question first." }, { status: 400 });
  }

  const result = answerFrontDeskChat(question);

  return NextResponse.json({
    ok: true,
    mode: "tenant-aware-nexcall-chat",
    answer: result.answer,
    topic: result.topic,
    keywords: result.keywords,
    responseVariants: result.variants,
    responseId: result.responseId,
    needsHuman: result.needsHuman,
    terminated: result.terminated,
    safetyReason: result.safetyReason
  });
}
