import { NextResponse } from "next/server";
import { createIcsEvent } from "@/lib/ics";
import { notifyNexCallLead } from "@/lib/lead-notifications";
import { maskPhone, normalizePhoneToE164 } from "@/lib/phone";
import { cleanText, isValidEmail, readJsonObject, validationResponse } from "@/lib/security";

export const runtime = "nodejs";

const CAL_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_TIMEZONE = "America/New_York";

/**
 * ElevenLabs/Twilio tool config:
 * Tool name: schedule_nexcall_demo
 * Description: Schedules or captures a NexCall demo appointment request.
 * Endpoint: /api/voice/schedule
 * Method: POST
 * Body fields: name, phone, email, businessName, requestedTime, timezone, notes, appointmentType.
 */

function pickString(payload: Record<string, unknown>, keys: string[], maxLength = 500) {
  for (const key of keys) {
    const value = cleanText(payload[key], maxLength);

    if (value) return value;
  }

  return "";
}

function normalizeAppointmentType(value: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  if (clean.includes("follow")) return "follow_up";
  if (clean.includes("support")) return "follow_up";

  return "demo";
}

function getCalEventTypeId(appointmentType: string) {
  const eventId = appointmentType === "follow_up"
    ? process.env.CAL_EVENT_FOLLOWUP_ID || process.env.CAL_EVENT_DEMO_ID
    : process.env.CAL_EVENT_DEMO_ID;
  const parsed = Number.parseInt(eventId || "", 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequestedTime(value: string) {
  if (!value) return null;

  const normalized = value.trim();
  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  return null;
}

async function tryCalBooking(input: {
  name: string;
  email: string;
  start: Date;
  timezone: string;
  appointmentType: string;
}) {
  const eventTypeId = getCalEventTypeId(input.appointmentType);

  if (!process.env.CAL_API_KEY || !eventTypeId || !input.email) {
    return {
      ok: false,
      skipped: true,
      reason: !input.email ? "missing-email" : "cal-not-configured"
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CAL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        start: input.start.toISOString(),
        eventTypeId,
        attendee: {
          name: input.name || "Valued Lead",
          email: input.email,
          timeZone: input.timezone || DEFAULT_TIMEZONE
        }
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Cal.com voice scheduling rejected booking", {
        status: response.status,
        eventTypeId,
        start: input.start.toISOString()
      });

      return { ok: false, skipped: false, reason: "cal-rejected", data };
    }

    return { ok: true, skipped: false, data };
  } catch (error) {
    console.error("Cal.com voice scheduling failed", {
      message: error instanceof Error ? error.message : "Unknown Cal.com error",
      start: input.start.toISOString()
    });

    return { ok: false, skipped: false, reason: "cal-error" };
  } finally {
    clearTimeout(timeout);
  }
}

function voiceSuccess(booked: boolean, fallback: boolean, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({
    success: true,
    booked,
    fallback,
    message,
    ...extra
  });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await readJsonObject(request, 12000);
  } catch (error) {
    return validationResponse(error);
  }

  const name = pickString(payload, ["name", "customerName", "callerName", "fullName"], 120) || "Valued Lead";
  const phone = normalizePhoneToE164(pickString(payload, ["phone", "phoneNumber", "callerPhone"], 60));
  const rawEmail = pickString(payload, ["email", "callerEmail", "customerEmail"], 254);
  const email = rawEmail && isValidEmail(rawEmail) ? rawEmail : "";
  const businessName = pickString(payload, ["businessName", "business", "company"], 160);
  const requestedTime = pickString(payload, ["requestedTime", "dateTime", "time", "preferredTime"], 160);
  const timezone = pickString(payload, ["timezone", "timeZone", "user_timezone"], 80) || DEFAULT_TIMEZONE;
  const notes = pickString(payload, ["notes", "reason", "message", "businessNeed"], 1500);
  const appointmentType = normalizeAppointmentType(
    pickString(payload, ["appointmentType", "meetingType", "type"], 80) || "demo"
  );
  const start = parseRequestedTime(requestedTime);

  if (!phone && !email) {
    return NextResponse.json(
      {
        success: false,
        booked: false,
        fallback: false,
        message: "I need a phone number or email to confirm the request."
      },
      { status: 400 }
    );
  }

  const description = [
    `Name: ${name}`,
    `Phone: ${phone || "Not provided"}`,
    `Email: ${email || "Not provided"}`,
    `Business: ${businessName || "Not provided"}`,
    `Requested time: ${requestedTime || "Not provided"}`,
    `Timezone: ${timezone}`,
    `Notes: ${notes || "No notes provided"}`
  ].join("\n");
  let icsContent: string | null = null;

  if (start) {
    icsContent = createIcsEvent({
      start,
      summary: "NexCall Demo Request",
      description,
      uidPrefix: "nexcall-demo"
    });
  }

  const calResult = start
    ? await tryCalBooking({ name, email, start, timezone, appointmentType })
    : { ok: false, skipped: true, reason: "missing-or-vague-time" };

  await notifyNexCallLead({
    subject: "New NexCall Voice Scheduling Lead",
    source: "voice-schedule",
    name,
    email,
    phone,
    businessName,
    inquiryType: "voice scheduling",
    appointmentType,
    requestedTime: requestedTime || "not provided",
    notes,
    icsContent,
    metadata: {
      booked: calResult.ok,
      calReason: "reason" in calResult ? calResult.reason : "booked",
      calBooking: calResult.ok ? calResult.data : undefined,
      timezone,
      phoneMasked: maskPhone(phone)
    }
  });

  if (calResult.ok) {
    return voiceSuccess(true, false, "You're scheduled. The NexCall team will send confirmation details shortly.", {
      booking: calResult.data
    });
  }

  if (!start) {
    return voiceSuccess(false, true, "I captured your appointment request. The NexCall team will confirm the best time shortly.", {
      reason: "missing_or_vague_time"
    });
  }

  return voiceSuccess(false, true, "I captured your request and the NexCall team will follow up shortly.", {
    reason: "calendar_fallback",
    icsCreated: Boolean(icsContent)
  });
}
