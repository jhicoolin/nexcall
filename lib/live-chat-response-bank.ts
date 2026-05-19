import { cleanText } from "@/lib/security";

type ChatTopic = {
  keywords: [string, string] | [string, string, string];
  title: string;
  answer: string;
  needsHuman?: boolean;
};

const openings = [
  "Absolutely.",
  "Yes, and the setup is handled for you.",
  "Good question.",
  "Short version: yes.",
  "That is one of the main things Revenue Guard is built for.",
  "You do not have to figure that out alone.",
  "For most businesses, the answer is yes.",
  "That is exactly the kind of front-desk work this handles.",
  "Yes. The goal is to make this feel done-for-you.",
  "Totally fair question.",
  "Here is the practical answer.",
  "That comes up a lot with local businesses.",
  "Yes, that is part of the operating model.",
  "You are thinking about the right thing.",
  "The clean way to handle that is simple.",
  "That is handled during onboarding.",
  "In plain English, yes.",
  "That is one of the places this saves time.",
  "The buyer-friendly version is this.",
  "From a front-office standpoint, yes."
];

const closers = [
  "If your setup has special rules, a person can map those during onboarding.",
  "For exact pricing or a custom workflow, the human follow-up tab is the fastest path.",
  "The cleanest next step is a short setup call so we can map your phones, calendar, and handoff rules.",
  "We keep it practical: answer the call, capture the details, book what can be booked, and hand off the rest.",
  "The system is designed to help your team, not trap callers in automation.",
  "The first version can go live lean, then improve from real call data.",
  "We can start simple and add deeper CRM or calendar logic once the core calls are working.",
  "That keeps the business in control while the receptionist handles the repetitive work.",
  "A human can always review the exact setup before anything goes live.",
  "The point is fewer missed calls, cleaner notes, and less front-desk pressure.",
  "That gives the business a safer launch without asking staff to learn new software overnight.",
  "We would tune that after the first real calls instead of guessing forever up front.",
  "This keeps the customer experience warm while still making the office more efficient.",
  "If the call gets sensitive or unusual, it should move to a person.",
  "That is how you avoid the awkward chatbot feeling.",
  "For a new client, we usually start with the highest-volume repeat calls first.",
  "The goal is to make the first version useful, measurable, and easy to improve.",
  "That is also how we keep costs predictable.",
  "Every client can have slightly different rules, voice, hours, and handoff logic.",
  "A good launch is boring in the best way: calls answered, details captured, no drama.",
  "The business owner should feel more in control, not less.",
  "That is what turns the AI from a gimmick into front-office infrastructure.",
  "We would rather route a hard call to a human than pretend automation should handle everything.",
  "That is the difference between a real receptionist system and a generic bot.",
  "Once connected, the team can see what happened without digging through voicemail.",
  "That is why the phone-number setup is handled from the agency side instead of pushed onto the client."
];

const topics: ChatTopic[] = [
  {
    keywords: ["twilio", "number", "phone"],
    title: "Assigned AI number",
    answer:
      "Revenue Guard can manage the Twilio setup from our side. We assign your business an AI receptionist number, connect it to your tenant profile, and route calls to your voice agent. If you already have a business number, you can forward calls to the AI number or port that number later. You do not need to open your own Twilio account unless you specifically want to own the carrier account directly."
  },
  {
    keywords: ["existing", "number", "forward"],
    title: "Use current number",
    answer:
      "You can keep your current business number. The usual launch path is call forwarding: unanswered calls, after-hours calls, or overflow calls forward into the AI receptionist number we assign. Later, if you want the AI number to become the main number, we can discuss porting."
  },
  {
    keywords: ["price", "cost", "plan"],
    title: "Pricing",
    answer:
      "The public packages are designed as predictable monthly plans, not scary per-minute billing. Starter is for answering and summaries, Appointment adds booking and reschedules, and Growth adds deeper CRM/workflow support. Real pricing can be adjusted around call volume and the complexity of the client setup."
  },
  {
    keywords: ["calendar", "book", "schedule"],
    title: "Calendar booking",
    answer:
      "Yes. The receptionist can book, reschedule, and cancel appointments when the business calendar rules are connected. During onboarding we define appointment types, business hours, buffers, cancellation rules, and what should be escalated to a person."
  },
  {
    keywords: ["human", "fallback", "transfer"],
    title: "Human backup",
    answer:
      "The safest setup is hybrid. The AI handles repeatable calls and transfers urgent, emotional, complex, high-value, or policy-sensitive calls to a person with the caller details and summary already captured."
  },
  {
    keywords: ["crm", "hubspot", "salesforce"],
    title: "CRM handoff",
    answer:
      "Revenue Guard can send caller details into a CRM, spreadsheet, or workflow tool. The common first version is HubSpot, Google Sheets, Airtable, Make, Zapier, or n8n. Larger teams can connect deeper CRMs once the core call flow is proven."
  },
  {
    keywords: ["sms", "text", "confirmation"],
    title: "SMS follow-up",
    answer:
      "Yes. After a call, the system can text the customer a confirmation, booking link, reminder, or next step. It can also text the team a clean summary with the caller name, number, reason, urgency, and appointment details."
  },
  {
    keywords: ["industry", "business", "work"],
    title: "Industries",
    answer:
      "The best fit is any business with repeatable inbound calls: clinics, dental offices, salons, auto repair, home services, legal intake, real estate, agencies, restaurants, retail, wellness, and professional services."
  },
  {
    keywords: ["security", "safe", "data"],
    title: "Security",
    answer:
      "The production architecture uses server-side secrets, rate limiting, signed provider webhooks, database-backed tenant records, and encrypted webhook storage. For regulated industries, compliance claims need a separate legal and infrastructure review before marketing."
  },
  {
    keywords: ["voice", "sound", "robot"],
    title: "Voice quality",
    answer:
      "The goal is a calm, natural phone voice, not a robotic menu. For live calls, the production path uses a dedicated voice provider such as Vapi or LiveKit-style infrastructure. Website demos can use polished audio clips, but phone quality is always tested on real calls."
  },
  {
    keywords: ["setup", "onboarding", "launch"],
    title: "Setup",
    answer:
      "Onboarding means collecting the business hours, services, FAQs, call rules, calendar rules, escalation phone, and preferred follow-up workflow. Then we assign the AI number, connect the voice agent, test calls, and tune the script before sending traffic."
  },
  {
    keywords: ["after", "hours", "weekend"],
    title: "After-hours",
    answer:
      "Yes. After-hours coverage is one of the clearest use cases. The receptionist can answer, qualify the request, book if allowed, send a confirmation, or route urgent calls to the right person."
  },
  {
    keywords: ["cancel", "reschedule", "change"],
    title: "Reschedules",
    answer:
      "Yes. Reschedules and cancellations can be handled when the calendar workflow is connected. The AI verifies the caller, checks the allowed rules, moves the appointment if possible, and sends a confirmation."
  },
  {
    keywords: ["spanish", "accent", "language"],
    title: "Language and accents",
    answer:
      "The system should be tested with real callers, accents, noise, and interruptions before launch. Multilingual routing is possible, but it should be configured deliberately instead of promised casually."
  },
  {
    keywords: ["dashboard", "admin", "manage"],
    title: "Admin dashboard",
    answer:
      "There is now an admin dashboard for managing tenants, phone numbers, prompts, voice provider settings, and basic analytics. That means you can update a client without editing code."
  },
  {
    keywords: ["stripe", "checkout", "payment"],
    title: "Checkout",
    answer:
      "Stripe Checkout is wired for subscriptions. Once real Stripe price IDs are added, pricing buttons can open a secure checkout flow and trigger onboarding after payment."
  },
  {
    keywords: ["demo", "try", "call"],
    title: "Live demo",
    answer:
      "The live demo should use a dedicated AI number. Visitors can call it, hear the receptionist, and see how the system captures details. For a client launch, we assign that client their own AI number and rules."
  },
  {
    keywords: ["legal", "medical", "hipaa"],
    title: "Regulated calls",
    answer:
      "For legal, healthcare, or financial use cases, the safest setup is conservative: answer, collect basic intake, route appropriately, and avoid giving advice. Compliance claims should only be made after the right policies, agreements, and infrastructure are in place."
  },
  {
    keywords: ["missed", "calls", "leads"],
    title: "Missed calls",
    answer:
      "The product is built around missed-call recovery. It answers when the team is busy, captures the caller details, moves qualified requests toward booking, and gives the business a clean summary instead of a voicemail."
  },
  {
    keywords: ["owner", "team", "summary"],
    title: "Team summaries",
    answer:
      "After each useful call, the team can receive a clean handoff: caller name, phone, need, urgency, appointment time, and next step. That keeps staff from replaying calls or chasing vague voicemails."
  }
];

function scoreTopic(question: string, topic: ChatTopic) {
  return topic.keywords.reduce((score, keyword) => {
    return question.includes(keyword) ? score + 1 : score;
  }, 0);
}

export const liveChatResponseVariantCount = openings.length * closers.length * topics.length;

export function getHumanizedChatAnswer(question: string) {
  const normalized = cleanText(question, 500).toLowerCase();
  const ranked = topics
    .map((topic) => ({ topic, score: scoreTopic(normalized, topic) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const topic = best?.score ? best.topic : topics.find((item) => item.title === "Setup") || topics[0];
  const seed = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const opening = openings[seed % openings.length];
  const closer = closers[(seed + topic.title.length) % closers.length];

  return {
    answer: `${opening} ${topic.answer} ${closer}`,
    topic: topic.title,
    keywords: topic.keywords,
    variants: liveChatResponseVariantCount,
    needsHuman: topic.needsHuman || best?.score === 0
  };
}
