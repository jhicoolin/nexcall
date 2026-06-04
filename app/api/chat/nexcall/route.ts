/**
 * POST /api/chat/nexcall
 *
 * Nexa live chat endpoint.
 * Tries AI provider first (OpenAI-compatible), falls back to
 * the keyword response bank if AI is unconfigured or fails.
 *
 * Security layers:
 * 1. Middleware rate limit   — 20 req/min per IP (high-cost route)
 * 2. Payload size cap        — 8 KB max body
 * 3. Message length cap      — 2,000 chars
 * 4. History cap             — last 20 messages, each 1,000 chars max
 * 5. Safety policy           — profanity/harassment/threat termination
 * 6. Jailbreak detection     — logged + forwarded as signal to AI
 * 7. SSRF guard              — AI base URL validated against allowlist
 * 8. Output sanitisation     — cleanText + minimum length + leak scan
 * 9. No raw provider errors  — all exceptions return safe fallback copy
 */
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  readJsonObject,
  cleanText,
  cleanIdentifier,
  originGuardResponse,
  rateLimitResponse,
  validationResponse
} from "@/lib/security";
import { callNexaAI, isAIChatConfigured, type ChatMessage } from "@/lib/nexa-chat-ai";
import { answerFrontDeskChat } from "@/services/receptionist/web-chat-engine";
import { evaluateConversationSafety, detectJailbreakAttempt } from "@/services/receptionist/safety-policy";

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 20;
const FALLBACK_RESPONSE =
  "I can still help you. You can try a demo call, view our pricing, or contact the NexCall team at nexcall@proton.me or (202) 200-6578.";
const INTERNAL_DETAILS_RESPONSE =
  "I can explain the service experience, but I do not share internal provider details here. NexCall is built to give callers a professional response and give your team a clean next step.";

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
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const limit = await checkRateLimit(request, {
    bucket: "chat-nexcall",
    limit: 18,
    windowSeconds: 60
  });

  if (!limit.allowed) return rateLimitResponse(limit);

  // ── Parse & validate body ────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
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

  // Clean optional tracking fields — never trust raw values
  const source = cleanIdentifier(body.source, 40) || "live_chat";
  const page = cleanIdentifier(body.page, 40) || "homepage";
  void source; void page; // used for logging context if needed

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
      terminated: true,
      answer: safety.signOff,
      ok: true
    });
  }

  // ── Jailbreak detection — log silently, pass signal to AI ─────────────────
  const injectionAttempted = detectJailbreakAttempt(userMessage);
  if (injectionAttempted) {
    console.warn("[NEXA_CHAT_INJECTION_ATTEMPT]", {
      messageLength: userMessage.length,
      hadHistory: history.length > 0,
      source
    });
    return NextResponse.json({
      success: true,
      message: INTERNAL_DETAILS_RESPONSE,
      actions: [
        { label: "Try a demo call", type: "open_demo" },
        { label: "View pricing", type: "scroll_pricing" }
      ],
      needsHuman: false,
      terminated: false,
      answer: INTERNAL_DETAILS_RESPONSE,
      ok: true
    });
  }

  // ── Try AI provider ───────────────────────────────────────────────────────
  if (isAIChatConfigured()) {
    try {
      const aiResult = await callNexaAI(userMessage, history, injectionAttempted);
      return NextResponse.json({
        success: true,
        message: aiResult.message,
        actions: aiResult.actions,
        needsHuman: aiResult.needsHuman,
        terminated: false,
        answer: aiResult.message,
        ok: true
      });
    } catch (err) {
      console.warn("[NEXA_CHAT_AI_FALLBACK]", {
        reason: err instanceof Error ? err.message.slice(0, 100) : "unknown",
        hadHistory: history.length > 0,
        injectionAttempted
      });
      // Fall through to keyword engine
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
      answer: FALLBACK_RESPONSE,
      ok: true
    });
  }
}
