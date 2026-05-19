import { NextResponse } from 'next/server';

const CAL_REQUEST_TIMEOUT_MS = 8000;
const EVENT_TYPE_MAP = {
  demo: process.env.CAL_EVENT_DEMO_ID,
  follow_up: process.env.CAL_EVENT_DEMO_ID,
  default: process.env.CAL_EVENT_DEMO_ID
};

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log("Incoming ElevenLabs Webhook Payload:", JSON.stringify(payload, null, 2));

    const { caller_name, caller_email, appointment_date, appointment_time, meeting_type, user_timezone } = payload;

    if (!caller_email || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: "Missing required booking fields (email, date, or time)." },
        { status: 400 }
      );
    }

    const eventTypeId = parseInt(EVENT_TYPE_MAP[meeting_type] || EVENT_TYPE_MAP.default, 10);

    if (!Number.isFinite(eventTypeId)) {
      return NextResponse.json(
        { error: "Cal.com event type is not configured." },
        { status: 503 }
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

    console.log("Sending Payload to Cal.com v2:", JSON.stringify(bookingPayload, null, 2));

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
        console.error("Cal.com booking timeout after 8 seconds:", bookingPayload);
        return NextResponse.json({
          status: "timeout_fallback",
          message: "Cal.com did not confirm within 8 seconds. The booking request should be treated as pending confirmation.",
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
      console.error("Cal.com API Error Response:", responseData);
      return NextResponse.json(
        { error: "Cal.com backend rejected the booking package.", details: responseData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Appointment successfully secured on Cal.com dashboard.",
      booking: responseData
    }, { status: 201 });

  } catch (error) {
    console.error("Fatal internal server error in calendar route:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
