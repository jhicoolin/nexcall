export const liveChatModelDefault = "deepset/roberta-base-squad2";

export const liveChatKnowledge = `
Revenue Guard is an AI receptionist and live front-office system for businesses that take customer calls.
It answers calls, qualifies leads, books or reschedules appointments, sends SMS confirmations, routes complex calls to a human, and sends clean summaries to the team.

The service works for many business types including dental offices, medical clinics, salons, auto repair, legal offices, agencies, contractors, local shops, restaurants, real estate, insurance, retail, fitness, wellness, home services, and professional services.

The safest setup is hybrid. AI handles repeatable calls and a human receives complex, sensitive, emotional, urgent, high-value, or policy-sensitive calls.

Revenue Guard uses Twilio behind the scenes for phone numbers and call routing. The agency can assign each client an AI receptionist number from its managed number pool. A client can keep their existing business number by forwarding missed, after-hours, overflow, or all calls into the assigned AI number. A client only needs their own Twilio account if they specifically want to own and manage the carrier account directly.

Revenue Guard is designed to connect with Google Calendar, Microsoft Calendar, Cal.com, Calendly, Stripe, Zapier, Make, n8n, Airtable, Google Sheets, HubSpot, Salesforce, Zoho, Pipedrive, GoHighLevel, Zendesk, Freshdesk, Housecall Pro, Jobber, ServiceTitan, Dentrix, Follow Up Boss, SMS, WhatsApp workflows, email follow-up, and team alerts.

The public website has scenario demos for appointment scheduling, lead qualification, restaurant concierge calls, customer support, AI IVR routing, and legal intake.

The current plans are Starter at 149 dollars per month for up to 120 calls per month, Appointment at 199 dollars per month for up to 250 calls per month, and Growth at 349 dollars per month for higher call volume. Yearly billing saves about 15 percent. Checkout opens in Stripe after real Stripe price IDs are configured.

Starter includes 24/7 answering, lead qualification, SMS summaries, basic FAQs, and simple call routing.
Appointment includes everything in Starter plus calendar booking, reschedules, cancellations, 2-way text follow-up, and human fallback rules.
Growth includes everything in Appointment plus CRM or sheet integration, multiple appointment types, custom voice scripting, and monthly performance review.

The launch setup requires a domain, hosting such as Vercel, Stripe, Twilio, a voice agent platform, a calendar system, an automation layer, lead storage, and optionally professional email, privacy policy, terms, business entity, bank account, and live human fallback provider.

The website supports uploaded MP3 demo clips, optional Hugging Face TTS generation for approved scenario demos only, and browser speech fallback. Hugging Face voice model options documented for testing include Kokoro, Chatterbox, Qwen3-TTS CustomVoice, and VibeVoice Realtime. The live chat is text question-answering only and does not use humanized TTS.

The live chat on the website is intentionally collapsed by default so it feels like a quiet front-desk tab instead of an advertisement. Visitors can ask the AI a question or request human follow-up.
`;

export function cleanLiveChatQuestion(question: string) {
  return question.replace(/\s+/g, " ").replace(/[<>]/g, "").trim().slice(0, 500);
}

export function fallbackChatAnswer(question: string) {
  const normalized = question.toLowerCase();

  if (normalized.includes("price") || normalized.includes("cost") || normalized.includes("plan")) {
    return "Starter is $149/mo, Appointment is $199/mo, and Growth starts at $349/mo. Appointment is usually the best first fit if you want real calendar booking.";
  }

  if (normalized.includes("twilio") || normalized.includes("phone") || normalized.includes("number")) {
    return "Revenue Guard can manage Twilio for you. We assign the business an AI receptionist number, connect it to that client's voice agent, and optionally forward or port the client's existing number later.";
  }

  if (normalized.includes("calendar") || normalized.includes("book") || normalized.includes("reschedule")) {
    return "Yes. The receptionist can book, reschedule, and cancel appointments once your calendar workflow includes appointment types, durations, buffers, and business hours.";
  }

  if (normalized.includes("human") || normalized.includes("person") || normalized.includes("fallback")) {
    return "The strongest setup is hybrid: AI handles repeatable calls and transfers complex, sensitive, urgent, or high-value conversations to a person with full context.";
  }

  if (normalized.includes("business") || normalized.includes("industry") || normalized.includes("work for")) {
    return "Revenue Guard can work for businesses with repeat call patterns, including clinics, salons, auto repair, law firms, restaurants, agencies, real estate, retail, and home services.";
  }

  return "Revenue Guard answers calls, qualifies leads, books appointments, sends SMS confirmations, and gives your team clean summaries. For a specific setup question, use the Human follow-up tab and we will route it to the team.";
}
