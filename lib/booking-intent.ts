import type { ClientConfig } from "@/lib/client-directory";
import { inngest } from "@/inngest/client";
import { cleanText } from "@/lib/security";

export type BookingIntent = {
  detected: boolean;
  name?: string;
  phone?: string;
  service?: string;
  requestedTime?: string;
  notes?: string;
};

const bookingWords = /\b(book|schedule|appointment|reserve|available|opening|reschedule|cancel|come in|meet|consultation)\b/i;
const timePattern =
  /\b((mon|tues|wednes|thurs|fri|satur|sun)day|today|tomorrow|tonight|this week|next week)?\s*(at\s*)?(\d{1,2})(:\d{2})?\s*(am|pm)?\b/i;

/**
 * Fast deterministic booking extraction.
 *
 * This intentionally avoids another LLM call in the live phone path. The
 * receptionist prompt should make the model restate booking confirmations in a
 * predictable way; this middleware watches that text and triggers the client's
 * calendar automation only when booking language and a time-like phrase appear.
 */
export function extractBookingIntent({
  userText,
  assistantText,
  callerPhone
}: {
  userText: string;
  assistantText: string;
  callerPhone?: string;
}): BookingIntent {
  const combined = cleanText(`${userText} ${assistantText}`, 2200);
  const timeMatch = combined.match(timePattern);
  const hasBookingLanguage = bookingWords.test(combined);

  if (!hasBookingLanguage || !timeMatch) {
    return { detected: false };
  }

  return {
    detected: true,
    phone: cleanText(callerPhone, 40),
    requestedTime: cleanText(timeMatch[0], 80),
    notes: combined,
    service: cleanText(extractService(combined), 120)
  };
}

function extractService(text: string) {
  const serviceMatch =
    text.match(/\b(for|about|regarding|need|needs|with)\s+([a-zA-Z0-9 ,.'-]{3,80})/i)?.[2] ||
    text.match(/\b(ac|hvac|dental|cleaning|consultation|repair|inspection|appointment|service)\b/i)?.[0] ||
    "General appointment";

  return serviceMatch.replace(/[.?!].*$/, "");
}

export async function maybeFireBookingWebhook({
  client,
  intent,
  callSid
}: {
  client: ClientConfig;
  intent: BookingIntent;
  callSid?: string;
}) {
  if (!intent.detected) {
    return { fired: false };
  }

  await inngest.send({
    name: "booking/calendar.requested",
    data: {
      clientId: client.id,
      tenantId: client.id,
      clientBusinessName: client.businessName,
      businessPhone: client.twilioPhoneNumber,
      calendarProvider: client.calendarProvider,
      callSid,
      phone: intent.phone,
      service: intent.service || "General appointment",
      start: intent.requestedTime,
      notes: intent.notes,
      source: "ai-receptionist-live-call",
      createdAt: new Date().toISOString()
    }
  });

  return { fired: true, status: 202 };
}
