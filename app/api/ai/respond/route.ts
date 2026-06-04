import { NextResponse } from "next/server";
import { getClientForPayload } from "@/lib/client-directory";
import { runReceptionistTurn } from "@/lib/huggingface-receptionist-pipeline";
import { cleanText, readJsonObject, validationResponse } from "@/lib/security";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const token = process.env.AI_TURN_API_TOKEN;

  if (!token) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("x-ai-turn-token") === token;
}

/**
 * Tenant-aware AI turn endpoint.
 *
 * This route is called by the Twilio Media Stream WebSocket bridge after it has
 * buffered caller audio or received a transcript. It is intentionally separate
 * from /api/twilio/voice because Vercel Functions can safely handle short HTTP
 * inference turns, while the long-lived WebSocket should run on a WebSocket
 * capable runtime.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized AI turn request." }, { status: 401 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 220000);
  } catch (error) {
    return validationResponse(error);
  }

  const client = await getClientForPayload(payload);

  if (!client) {
    return NextResponse.json({ ok: false, error: "Unknown client for AI turn." }, { status: 404 });
  }

  try {
    const result = await runReceptionistTurn({
      client,
      transcript: cleanText(payload.transcript, 1000),
      audioMulawBase64: cleanText(payload.audioMulawBase64, 200000),
      callerPhone: cleanText(payload.callerPhone || payload.from, 40),
      callSid: cleanText(payload.callSid, 80)
    });

    return NextResponse.json({ ok: true, clientId: client.id, ...result });
  } catch (error) {
    console.error("[NEXCALL_AI_TURN_ERROR]", {
      clientId: client.id,
      message: error instanceof Error ? error.message : "AI receptionist turn failed."
    });

    return NextResponse.json({ ok: false, error: "AI receptionist turn failed." }, { status: 502 });
  }
}
