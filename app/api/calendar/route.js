import { NextResponse } from 'next/server';
import { createIcsEvent } from '@/lib/ics';
import { notifyNexCallLead } from '@/lib/lead-notifications';
import {
  checkRateLimit,
  cleanText,
  isHoneypotTriggered,
  originGuardResponse,
  rateLimitResponse,
  readJsonObject
} from '@/lib/security';

const CAL_REQUEST_TIMEOUT_MS = 8000;
const EVENT_TYPE_MAP = {
  demo: process.env.CAL_EVENT_DEMO_ID,
  follow_up: process.env.CAL_EVENT_FOLLOWUP_ID || process.env.CAL_EVENT_DEMO_ID,
  default: process.env.CAL_EVENT_DEMO_ID
};

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function maskEmail(value) {
  if (!isValidEmail(value)) return "invalid-or-missing";

  const [name, domain] = value.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function cleanBookingText(value, maxLength = 160) {
  return cleanText(value, maxLength);
}

export async function POST(request) {
  const originDenied = originGuardResponse(request);
  if (originDenied) return originDenied;

  const limit = await checkRateLimit(request, {
    bucket: "calendar",
    limit: 8,
    windowSeconds: 5 * 60
  });

  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    let payload;

    try {
      payload = await readJsonObject(request, 8000);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid JSON body." },
        { status: error?.status || 400 }
      );
    }

    if (isHoneypotTriggered(payload)) {
      return NextResponse.json(
        {
          status: "fallback_captured",
          message: "Appointment request captured. The NexCall team will confirm the best time shortly."
        },
        { status: 202 }
      );
    }

    const caller_name = cleanBookingText(payload.caller_name, 120);
    const caller_email = cleanBookingText(payload.caller_email, 254);
    const appointment_date = cleanBookingText(payload.appointment_date, 20);
    const appointment_time = cleanBookingText(payload.appointment_time, 20);
    const meeting_type = cleanBookingText(payload.meeting_type, 80);
    const user_timezone = cleanBookingText(payload.user_timezone, 80);
    console.log("Incoming calendar booking request", {
      meeting_type,
      appointment_date,
      appointment_time,
      caller_email: maskEmail(caller_email),
      user_timezone: user_timezone || "not-provided"
    });

    if (!caller_email || !appointment_date || !appointment_time) {
      await notifyNexCallLead({
        subject: "New NexCall Voice Scheduling Lead",
        source: "calendar-route-missing-fields",
        name: caller_name || "Valued Lead",
        email: caller_email,
        inquiryType: "calendar booking fallback",
        appointmentType: meeting_type || "demo",
        requestedTime: [appointment_date, appointment_time].filter(Boolean).join(" "),
        message: "A calendar booking payload was missing email, date, or time. NexCall should follow up manually."
      });

      return NextResponse.json(
        {
          status: "fallback_captured",
          message: "Appointment request captured. The NexCall team will confirm the best time shortly."
        },
        { status: 202 }
      );
    }

    if (!isValidEmail(caller_email) || !isValidDate(appointment_date) || !isValidTime(appointment_time)) {
      return NextResponse.json(
        { error: "Invalid booking fields. Use a valid email, YYYY-MM-DD date, and HH:mm time." },
        { status: 400 }
      );
    }

    if (!process.env.CAL_API_KEY) {
      console.warn("Calendar booking provider is not configured");
      await notifyNexCallLead({
        subject: "New NexCall Voice Scheduling Lead",
        source: "calendar-route-cal-missing",
        name: caller_name || "Valued Lead",
        email: caller_email,
        inquiryType: "calendar booking fallback",
        appointmentType: meeting_type || "demo",
        requestedTime: `${appointment_date} ${appointment_time}`,
        message: "Calendar booking is not configured. NexCall should follow up manually."
      });

      return NextResponse.json(
        {
          status: "fallback_captured",
          message: "Appointment request captured. The NexCall team will confirm the best time shortly."
        },
        { status: 202 }
      );
    }

    const eventTypeId = parseInt(EVENT_TYPE_MAP[meeting_type] || EVENT_TYPE_MAP.default, 10);

    if (!Number.isFinite(eventTypeId)) {
      await notifyNexCallLead({
        subject: "New NexCall Voice Scheduling Lead",
        source: "calendar-route-event-missing",
        name: caller_name || "Valued Lead",
        email: caller_email,
        inquiryType: "calendar booking fallback",
        appointmentType: meeting_type || "demo",
        requestedTime: `${appointment_date} ${appointment_time}`,
        message: "Cal.com event type is not configured. NexCall should follow up manually."
      });

      return NextResponse.json(
        {
          status: "fallback_captured",
          message: "Appointment request captured. The NexCall team will confirm the best time shortly."
        },
        { status: 202 }
      );
    }

    const startTimeIso = `${appointment_date}T${appointment_time}:00Z`;
    const attendeeTimeZone = typeof user_timezone === "string" && user_timezone.trim()
      ? user_timezone.trim()
      : "America/New_York";

    const bookingPayload = {
      start: startTimeIso,
      eventTypeId: eventTypeId,
      attendee: {
        name: caller_name || "Valued Lead",
        email: caller_email,
        timeZone: attendeeTimeZone
      }
    };

    console.log("Sending booking request to configured calendar provider", {
      eventTypeId,
      start: startTimeIso,
      attendeeTimeZone,
      caller_email: maskEmail(caller_email)
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CAL_REQUEST_TIMEOUT_MS);
    let response;

    try {
      response = await fetch('https://api.cal.com/v2/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CAL_API_KEY}`,
          'cal-api-version': '2024-08-13',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload),
        signal: controller.signal
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        console.error("Cal.com booking timeout after 8 seconds", {
          eventTypeId,
          start: startTimeIso,
          attendeeTimeZone,
          caller_email: maskEmail(caller_email)
        });
        await notifyNexCallLead({
          subject: "New NexCall Voice Scheduling Lead",
          source: "calendar-route-timeout",
          name: caller_name || "Valued Lead",
          email: caller_email,
          inquiryType: "calendar booking fallback",
          appointmentType: meeting_type || "demo",
          requestedTime: startTimeIso,
          icsContent: createIcsEvent({
            start: new Date(startTimeIso),
            summary: "NexCall Demo Request",
            description: `Name: ${caller_name || "Valued Lead"}\nEmail: ${caller_email}\nRequested start: ${startTimeIso}`,
            uidPrefix: "nexcall-calendar-timeout"
          }),
          message: "Calendar booking timed out after 8 seconds. NexCall should confirm manually."
        });

        return NextResponse.json({
          status: "timeout_fallback",
          message: "Appointment request captured. The NexCall team will confirm the best time shortly.",
          fallback: {
            bookingStatus: "pending_confirmation",
            callerEmail: caller_email,
            callerName: caller_name || "Valued Lead",
            requestedStart: startTimeIso,
            timeZone: attendeeTimeZone,
            recommendedAction: "Tell the caller the appointment request was captured and will be confirmed by text or email."
          }
        }, { status: 202 });
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Calendar booking provider rejected the request", {
        status: response.status,
        eventTypeId,
        start: startTimeIso
      });
      await notifyNexCallLead({
        subject: "New NexCall Voice Scheduling Lead",
        source: "calendar-route-cal-rejected",
        name: caller_name || "Valued Lead",
        email: caller_email,
        inquiryType: "calendar booking fallback",
        appointmentType: meeting_type || "demo",
        requestedTime: startTimeIso,
        icsContent: createIcsEvent({
          start: new Date(startTimeIso),
          summary: "NexCall Demo Request",
          description: `Name: ${caller_name || "Valued Lead"}\nEmail: ${caller_email}\nRequested start: ${startTimeIso}`,
          uidPrefix: "nexcall-calendar-rejected"
        }),
        message: "Calendar booking provider rejected the request. NexCall should confirm manually.",
        metadata: { calStatus: response.status }
      });

      return NextResponse.json(
        {
          status: "fallback_captured",
          message: "Appointment request captured. The NexCall team will confirm the best time shortly."
        },
        { status: 202 }
      );
    }

    await notifyNexCallLead({
      subject: "New NexCall Voice Scheduling Lead",
      source: "calendar-route-booked",
      name: caller_name || "Valued Lead",
      email: caller_email,
      inquiryType: "calendar booking confirmed",
      appointmentType: meeting_type || "demo",
      requestedTime: startTimeIso,
      message: "Calendar booking provider confirmed a NexCall booking.",
      metadata: {
        bookingConfirmed: true,
        bookingId: responseData?.id || responseData?.uid || undefined
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Appointment request confirmed.",
      bookingConfirmed: true
    }, { status: 201 });

  } catch (error) {
    console.error("Calendar route failed", {
      message: error instanceof Error ? error.message : "Unknown calendar route error"
    });
    return NextResponse.json(
      { error: "Appointment request could not be processed right now." },
      { status: 502 }
    );
  }
}
