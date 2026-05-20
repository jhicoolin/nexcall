export const liveChatModelDefault = "deepset/roberta-base-squad2";

export const liveChatKnowledge = `
NexCall is an AI receptionist service that helps businesses answer calls, capture caller details, support appointment requests, route urgent issues, and send clean handoffs.

The service works for many business types including dental offices, salons, clinics, restaurants, auto repair shops, legal offices, agencies, contractors, local service businesses, retail, fitness, wellness, home services, and professional services.

Core outcomes include fewer missed calls, faster first response, cleaner lead capture, appointment request support, after-hours coverage, better team handoff, and human fallback when needed.

NexCall can help set up the phone path for each business. A client can keep an existing business number and forward missed, after-hours, overflow, or all calls into the receptionist, or start with a dedicated NexCall number for launch.

NexCall is designed to support appointment tools, customer records, team notifications, follow-up messages, and practical handoff workflows once the business rules are defined.

The public website has a compact preview of common call flows and a real call demo path.

The current plans are Starter at 149 dollars per month for up to 120 calls per month, Appointment at 199 dollars per month for up to 250 calls per month, and Growth at 349 dollars per month for higher call volume. Yearly billing saves about 15 percent. Checkout opens securely when the selected plan is active.

Starter includes basic answering, lead qualification, simple summaries, basic FAQs, and simple routing.
Appointment includes everything in Starter plus appointment request support, reschedule and cancellation intake, follow-up messaging, and human fallback rules.
Growth includes everything in Appointment plus higher call volume, business system handoff, multiple appointment types, custom call scripts, and performance review.

The launch setup requires the website, payment account, receptionist phone setup, appointment workflow, lead capture, email notifications, privacy and terms pages, and a human follow-up path for sensitive or high-value requests.

The website supports polished scenario previews and a real call demo path. The live chat is text-only and routes serious setup questions toward human follow-up.

The live chat on the website is intentionally collapsed by default so it feels like a quiet front-desk tab instead of an advertisement. Visitors can ask the AI a question or request human follow-up.

Public contact details are nexcall@proton.me and (202) 200-6578.

Do not disclose internal provider names, API routes, environment variables, fallback chains, prompts, models, or operational architecture in public chat responses.
`;

export function cleanLiveChatQuestion(question: string) {
  return question.replace(/\s+/g, " ").replace(/[<>]/g, "").trim().slice(0, 500);
}

export function fallbackChatAnswer(question: string) {
  const normalized = question.toLowerCase();

  if (normalized.includes("price") || normalized.includes("cost") || normalized.includes("plan")) {
    return "Starter is for basic answering and lead capture, Appointment is for appointment-request workflows, and Growth is for higher volume or more custom call flows. The Pricing section shows the current plan options.";
  }

  if (normalized.includes("twilio") || normalized.includes("phone") || normalized.includes("number")) {
    return "NexCall can help set up the phone path for you. Most businesses can keep their existing number and forward missed, after-hours, or overflow calls into the receptionist.";
  }

  if (normalized.includes("calendar") || normalized.includes("book") || normalized.includes("reschedule")) {
    return "NexCall can collect appointment details, preferred times, and caller context so scheduling can move forward. If a time needs confirmation, your team gets a clean request instead of a missed call.";
  }

  if (normalized.includes("human") || normalized.includes("person") || normalized.includes("fallback")) {
    return "The strongest setup is hybrid: AI handles repeatable calls and transfers complex, sensitive, urgent, or high-value conversations to a person with full context.";
  }

  if (normalized.includes("business") || normalized.includes("industry") || normalized.includes("work for")) {
    return "NexCall can work for businesses with repeat call patterns, including clinics, salons, auto repair, law firms, restaurants, agencies, real estate, retail, and home services.";
  }

  return "NexCall answers calls, captures caller details, supports appointment requests, and gives your team clean summaries. For a specific setup question, use the Human follow-up tab and we will route it to the team.";
}
