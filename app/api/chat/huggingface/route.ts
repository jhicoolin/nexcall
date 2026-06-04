import { NextResponse } from "next/server";
import { cleanLiveChatQuestion } from "@/lib/live-chat-knowledge";
import {
  checkRateLimit,
  originGuardResponse,
  rateLimitResponse,
  readJsonObject,
  validationResponse
} from "@/lib/security";
import { answerFrontDeskChat } from "@/services/receptionist/web-chat-engine";

type ChatPayload = {
  question?: unknown;
};

export async function POST(request: Request) {
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const limit = await checkRateLimit(request, {
    bucket: "chat-legacy",
    limit: 18,
    windowSeconds: 60
  });

  if (!limit.allowed) return rateLimitResponse(limit);

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
    answer: result.answer,
    needsHuman: result.needsHuman,
    terminated: result.terminated
  });
}
