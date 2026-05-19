import { NextResponse } from "next/server";
import { getClientForPayload } from "@/lib/client-directory";
import { inngest } from "@/inngest/client";
import { createIcsEvent } from "@/lib/ics";
import { notifyNexCallLead } from "@/lib/lead-notifications";
import { cleanText, isValidPhone, readJsonObject, validationResponse } from "@/lib/security";

type BookingPayload = {
  clientId?: string;
  businessPhone?: string;
  name?: string;
  phone?: string;
  address?: string;
  service?: string;
  urgency?: string;
  start?: string;
  notes?: string;
};

export async function POST(request: Request) {
  let rawBooking: Record<string, unknown>;

  try {
    rawBooking = await readJsonObject(request);
  } catch (error) {
    return validationResponse(error);
  }

  const booking: BookingPayload = {
    clientId: cleanText(rawBooking.clientId, 80),
    businessPhone: cleanText(rawBooking.businessPhone, 40),
    name: cleanText(rawBooking.name, 120),
    phone: cleanText(rawBooking.phone, 40),
    address: cleanText(rawBooking.address, 220),
    service: cleanText(rawBooking.service, 120),
    urgency: cleanText(rawBooking.urgency, 80),
    start: cleanText(rawBooking.start, 80),
    notes: cleanText(rawBooking.notes, 1000)
  };

  const required = ["name", "phone", "address", "service", "start"].filter(
    (field) => !booking[field as keyof BookingPayload]
  );

  if (required.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Missing booking fields: ${required.join(", ")}` },
      { status: 400 }
    );
  }

  if (!isValidPhone(booking.phone || "")) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
  }

  const client = await getClientForPayload(rawBooking);
  const eventPayload = {
    ...booking,
    tenantId: booking.clientId || client?.id || "demo",
    clientId: booking.clientId || client?.id || "demo",
    clientBusinessName: client?.businessName || "NexCall Demo",
    businessPhone: booking.businessPhone || client?.assignedTwilioNumber,
    calendarProvider: client?.calendarProvider || "Unassigned",
    createdAt: new Date().toISOString(),
    source: "ai-receptionist-voice-agent"
  };

  let queued = false;

  try {
    await inngest.send({
      name: "booking/calendar.requested",
      data: eventPayload
    });
    queued = true;
  } catch (error) {
    console.error("Calendar booking queue failed", {
      clientId: eventPayload.clientId,
      message: error instanceof Error ? error.message : "Unknown Inngest error"
    });
  }

  const startDate = new Date(booking.start || "");
  const icsContent = Number.isNaN(startDate.getTime())
    ? null
    : createIcsEvent({
        start: startDate,
        summary: "NexCall Booking Request",
        description: [
          `Name: ${booking.name}`,
          `Phone: ${booking.phone}`,
          `Address: ${booking.address}`,
          `Service: ${booking.service}`,
          `Urgency: ${booking.urgency || "Not provided"}`,
          `Notes: ${booking.notes || "No notes provided"}`
        ].join("\n"),
        uidPrefix: "nexcall-booking"
      });

  const notification = await notifyNexCallLead({
    subject: "New NexCall Demo Request",
    source: "calendar-booking",
    name: booking.name,
    phone: booking.phone,
    businessName: eventPayload.clientBusinessName,
    inquiryType: "calendar booking",
    appointmentType: booking.service,
    requestedTime: booking.start,
    notes: booking.notes,
    icsContent,
    metadata: {
      queued,
      tenantId: eventPayload.tenantId,
      urgency: booking.urgency,
      address: booking.address
    }
  });

  return NextResponse.json({ ok: true, queued, notification });
}
