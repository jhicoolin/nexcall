import { NextResponse } from "next/server";
import { getClientForPayload } from "@/lib/client-directory";
import { inngest } from "@/inngest/client";
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
    clientBusinessName: client?.businessName || "Revenue Guard Demo",
    businessPhone: booking.businessPhone || client?.assignedTwilioNumber,
    calendarProvider: client?.calendarProvider || "Unassigned",
    createdAt: new Date().toISOString(),
    source: "ai-receptionist-voice-agent"
  };

  await inngest.send({
    name: "booking/calendar.requested",
    data: eventPayload
  });

  return NextResponse.json({ ok: true, queued: true });
}
