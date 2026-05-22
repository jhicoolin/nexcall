/**
 * POST /api/chat/nexcall
 *
 * Nexa live chat endpoint.
 * Tries AI provider first (OpenAI-compatible), falls back to
 * the keyword response bank if AI is unconfigured or fails.
 *
 * Rate limiting: handled by middleware (20 req/min per IP for high-cost routes).
 * This route adds its own payload-size and message-length guards.
 */
import { NextResponse } from "next/server";
import { readJsonObject, cleanText, validationResponse } from "@/lib/security";
import { callNexaAI, isAIChatConfigured, type ChatMessage } from "@/lib/nexa-chat-ai";
import { answerFrontDeskChat } from "@/services/receptionist/web-chat-engine";
import { evaluateConversationSafety } from "@/services/receptionist/safety-policy";

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 20;
const FALLBACK_RESPONSE =
  "I can still help you. You can try a demo call, view our pricing, or contact the NexCall team at nexcall@proton.me or (202) 200-6578.";

type IncomingHistory = Array<{ role?: unknown; content?: unknown }>;

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return (raw as IncomingHistory)
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        (m.content as string).trim().length > 0
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: cleanText(m.content as string, 1000)
    }));
}

export async function POST(request: Request) {
  // ── Parse & validate body ────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    // Generous limit — history can contain multiple messages
    body = await readJsonObject(request, 8000);
  } catch (error) {
    return validationResponse(error);
  }

  // Accept both new { message } and legacy { question } formats
  const rawMessage =
    typeof body.message === "string"
      ? body.message
      : typeof body.question === "string"
      ? body.question
      : "";

  const userMessage = cleanText(rawMessage, MAX_MESSAGE_CHARS);

  if (!userMessage) {
    return NextResponse.json(
      { success: false, message: "Send a message first." },
      { status: 400 }
    );
  }

  const history = sanitizeHistory(body.history);

  // ── Safety check ─────────────────────────────────────────────────────────
  const safety = evaluateConversationSafety(userMessage);
  if (!safety.allowed) {
    return NextResponse.json({
      success: true,
      message:
        safety.signOff ||
        "I need to keep this conversation professional. You can reach the NexCall team at nexcall@proton.me.",
      actions: [],
      needsHuman: false,
      terminated: true
    });
  }

  // ── Try AI provider ───────────────────────────────────────────────────────
  if (isAIChatConfigured()) {
    try {
      const aiResult = await callNexaAI(userMessage, history);
      return NextResponse.json({
        success: true,
        message: aiResult.message,
        actions: aiResult.actions,
        needsHuman: aiResult.needsHuman,
        terminated: false,
        mode: "ai",
        // legacy field for any existing consumers
        answer: aiResult.message,
        ok: true
      });
    } catch (err) {
      // Log safely — never log the message content or API key
      console.warn("[NEXA_CHAT_AI_FALLBACK]", {
        reason: err instanceof Error ? err.message.slice(0, 100) : "unknown",
        hadHistory: history.length > 0
      });
      // Fall through to keyword engine below
    }
  }

  // ── Fallback: keyword engine ──────────────────────────────────────────────
  try {
    const result = answerFrontDeskChat(userMessage);

    if (result.terminated) {
      return NextResponse.json({
        success: true,
        message: result.answer,
        actions: [],
        needsHuman: false,
        terminated: true,
        mode: "fallback",
        answer: result.answer,
        ok: true
      });
    }

    const actions: Array<{ label: string; type: string }> = [];
    if (result.needsHuman) {
      actions.push({ label: "Talk to the team", type: "start_lead_capture" });
    }
    if (
      userMessage.toLowerCase().includes("demo") ||
      userMessage.toLowerCase().includes("try")
    ) {
      actions.push({ label: "Try a demo call", type: "open_demo" });
    }

    return NextResponse.json({
      success: true,
      message: result.answer,
      actions,
      needsHuman: result.needsHuman,
      terminated: false,
      topic: result.topic,
      mode: "fallback",
      answer: result.answer,
      ok: true
    });
  } catch (err) {
    console.error("[NEXA_CHAT_ENGINE_ERROR]", {
      reason: err instanceof Error ? err.message.slice(0, 100) : "unknown"
    });

    return NextResponse.json({
      success: true,
      message: FALLBACK_RESPONSE,
      actions: [
        { label: "Try a demo call", type: "open_demo" },
        { label: "View pricing", type: "scroll_pricing" }
      ],
      needsHuman: true,
      terminated: false,
      mode: "emergency-fallback",
      answer: FALLBACK_RESPONSE,
      ok: true
    });
  }
}
