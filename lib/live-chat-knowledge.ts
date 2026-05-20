export const liveChatModelDefault = "deepset/roberta-base-squad2";

export const liveChatKnowledge = `
NexCall is an AI receptionist and live front-office system for businesses that take customer calls.
It answers calls, qualifies leads, books or reschedules appointments, sends SMS confirmations, routes complex calls to a human, and sends clean summaries to the team.

The service works for many business types including dental offices, medical clinics, salons, auto repair, legal offices, agencies, contractors, local shops, restaurants, real estate, insurance, retail, fitness, wellness, home services, and professional services.

The safest setup is hybrid. AI handles repeatable calls and a human receives complex, sensitive, emotional, urgent, high-value, or policy-sensitive calls.

NexCall can help set up the phone path for each business. A client can keep an existing business number and forward missed, after-hours, overflow, or all calls into the receptionist, or start with a dedicated NexCall number for launch.

NexCall is designed to support appointment tools, customer records, team notifications, follow-up messages, and practical handoff workflows once the business rules are defined.

The public website has scenario demos for appointment scheduling, lead qualification, restaurant concierge calls, customer support, AI IVR routing, and legal intake.

The current plans are Starter at 149 dollars per month for up to 120 calls per month, Appointment at 199 dollars per month for up to 250 calls per month, and Growth at 349 dollars per month for higher call volume. Yearly billing saves about 15 percent. Checkout opens securely when the selected plan is active.

Starter includes 24/7 answering, lead qualification, SMS summaries, basic FAQs, and simple call routing.
Appointment includes everything in Starter plus calendar booking, reschedules, cancellations, 2-way text follow-up, and human fallback rules.
Growth includes everything in Appointment plus CRM or sheet integration, multiple appointment types, custom voice scripting, and monthly performance review.

The launch setup requires the website, payment account, receptionist phone setup, appointment workflow, lead capture, email notifications, privacy and terms pages, and a human follow-up path for sensitive or high-value requests.

The website supports polished scenario demos and a real call demo path. The live chat is text-only and routes serious setup questions toward human follow-up.

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
    return "NexCall can help set up the phone path for you. Most businesses can keep their existing number and forward missed, after-hours, or overflow calls into the receptionist.";
  }

  if (normalized.includes("calendar") || normalized.includes("book") || normalized.includes("reschedule")) {
    return "Yes. The receptionist can book, reschedule, and cancel appointments once your calendar workflow includes appointment types, durations, buffers, and business hours.";
  }

  if (normalized.includes("human") || normalized.includes("person") || normalized.includes("fallback")) {
    return "The strongest setup is hybrid: AI handles repeatable calls and transfers complex, sensitive, urgent, or high-value conversations to a person with full context.";
  }

  if (normalized.includes("business") || normalized.includes("industry") || normalized.includes("work for")) {
    return "NexCall can work for businesses with repeat call patterns, including clinics, salons, auto repair, law firms, restaurants, agencies, real estate, retail, and home services.";
  }

  return "NexCall answers calls, qualifies leads, books appointments, sends SMS confirmations, and gives your team clean summaries. For a specific setup question, use the Human follow-up tab and we will route it to the team.";
}
