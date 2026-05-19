import { cleanText } from "@/lib/security";
import { getCompanyKnowledgeCapsule } from "@/services/receptionist/company-knowledge";
import { evaluateConversationSafety } from "@/services/receptionist/safety-policy";

type WebChatAnswer = {
  answer: string;
  topic: string;
  keywords: string[];
  variants: number;
  needsHuman: boolean;
  terminated: boolean;
  safetyReason?: string;
  responseId?: string;
};

type ChatTopic = {
  keywords: [string, string] | [string, string, string];
  title: string;
  answer: string;
  needsHuman?: boolean;
};

type SelectedAnswer = {
  title: string;
  keywords: string[];
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
  "For most businesses, yes.",
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

const empathyLines = [
  "I get why you would ask that.",
  "That is a real operator question, not just a tech question.",
  "A business owner should not have to guess on that.",
  "That is exactly the kind of thing we clarify before launch.",
  "The honest answer depends on the workflow, but the pattern is clear.",
  "That is a fair concern, especially when calls affect revenue.",
  "The safest version is to keep the customer experience simple and useful.",
  "That is where the system needs good rules, not just a nice voice.",
  "The goal is to remove friction without making callers feel boxed in.",
  "That matters because the caller only cares whether they got helped.",
  "That is a place where a warm handoff beats over-automation.",
  "The practical move is to treat it like front-office operations.",
  "That is something we would document in the client playbook.",
  "A strong setup handles that without making your team chase details.",
  "That is where customer service discipline matters more than hype.",
  "The right answer is the one your staff would be comfortable standing behind."
];

const businessBridges = [
  "From a customer-service angle,",
  "From a sales-operations angle,",
  "For a local business,",
  "If we look at it like an owner,",
  "In a real front office,",
  "For a team that lives on inbound calls,",
  "When the goal is fewer dropped leads,",
  "When the caller needs a clear next step,",
  "In a polished launch,",
  "For a business that cares about reputation,",
  "When this is set up correctly,",
  "For day-one reliability,",
  "In the customer journey,",
  "For a team that wants less admin work,"
];

const operatingAngles = [
  "the receptionist should answer quickly, ask one useful question at a time, and avoid pretending it knows something it does not know.",
  "the system should collect the right details, confirm what it heard, and route anything sensitive to a person.",
  "the workflow should turn messy calls into clean notes, booked appointments, or a clear follow-up task.",
  "the AI should use the business profile as the source of truth and keep the tone calm, direct, and helpful.",
  "the best outcome is not sounding futuristic; it is making the caller feel handled.",
  "the process should reduce staff interruptions while keeping the owner in control of the rules.",
  "the call should end with either a booking, a qualified lead, a transfer, or a clean summary.",
  "the experience should feel like a trained coordinator, not a rigid phone menu.",
  "the system should support the team by handling repeatable questions and escalating judgment calls.",
  "the setup should be measured by answered calls, clean handoffs, booked work, and fewer missed opportunities.",
  "the AI should stay polite under pressure and never argue with the caller.",
  "the strongest version combines automation for speed with human backup for nuance.",
  "the receptionist should protect the brand voice and keep the conversation moving toward a practical next step.",
  "the handoff should be clean enough that the team knows who called, why they called, and what should happen next."
];

const nextStepLines = [
  "The next step is mapping the business hours, services, calendar rules, and escalation path.",
  "For selling this to a client, the clearest demo is a real call that ends in a useful summary.",
  "For launch, we would test this with noisy calls, interruptions, reschedules, and after-hours requests.",
  "If the client has special rules, those should live in the tenant profile instead of hardcoded copy.",
  "That keeps the system flexible across industries without turning it into a guessing machine.",
  "That is also how we keep the setup explainable to a business owner.",
  "Once the core flow is proven, deeper CRM and payment actions can be added safely.",
  "If the question gets too specific for the site chat, the human follow-up path should take over.",
  "The important thing is to make every reply useful, brief, and easy to act on.",
  "That gives the caller confidence while giving the team a reliable record.",
  "The safest rollout is to launch the simple, high-volume calls first, then expand from evidence.",
  "That makes the service easier to sell because the value is visible within the first week.",
  "That is the kind of detail that belongs in onboarding before the number goes live.",
  "For most clients, the first win is after-hours coverage plus clean team notifications.",
  "That is how the system earns trust before handling more complex tasks.",
  "The business should always know when the AI answered, what it captured, and when a person needs to step in."
];

const conversationalPolish = [
  "No pressure, no overpromising.",
  "Simple, useful, and accountable.",
  "That is the version I would be comfortable putting in front of a real client.",
  "It should feel calm, not flashy.",
  "That is how you keep the service human even when the first touch is automated.",
  "The customer should leave feeling answered, not processed.",
  "The owner should see the result without digging through voicemail.",
  "The team should get context, not another loose message.",
  "The whole point is fewer gaps between the phone ringing and the work getting booked.",
  "That keeps the buyer conversation grounded in ROI.",
  "That is a better sales story than saying 'AI' over and over.",
  "That is what makes it feel like front-office help instead of a widget."
];

const topics: ChatTopic[] = [
  {
    keywords: ["twilio", "number", "phone"],
    title: "Assigned AI number",
    answer:
      "Revenue Guard manages the phone-number setup from the agency side. We assign the client an AI receptionist number from the managed Twilio pool, connect it to that tenant, and route calls to the right voice agent. Existing business numbers can forward missed, overflow, after-hours, or all calls into the assigned AI number. A client only needs their own Twilio account if they want carrier ownership."
  },
  {
    keywords: ["existing", "number", "forward"],
    title: "Use current number",
    answer:
      "The client can keep their current business number. The usual launch path is call forwarding into the assigned AI receptionist number. Later, if they want one carrier setup, the number can be ported after the workflow is proven."
  },
  {
    keywords: ["price", "cost", "plan"],
    title: "Pricing",
    answer:
      "The buyer-friendly pricing model is a predictable monthly plan, not surprise per-minute billing. Plans should map to business outcomes: answered calls, booked appointments, clean summaries, SMS follow-up, and deeper integrations as volume grows."
  },
  {
    keywords: ["calendar", "book", "schedule"],
    title: "Calendar booking",
    answer:
      "The receptionist can book, reschedule, and cancel appointments when the business calendar rules are connected. We define appointment types, hours, buffers, cancellation rules, and the exact moments that should move to a person."
  },
  {
    keywords: ["human", "fallback", "transfer"],
    title: "Human backup",
    answer:
      "The strongest model is AI-first with human backup. The AI handles repeatable calls and transfers urgent, emotional, complex, high-value, or policy-sensitive calls with the caller details already captured."
  },
  {
    keywords: ["crm", "hubspot", "salesforce"],
    title: "CRM handoff",
    answer:
      "Caller details can go into a CRM, spreadsheet, or workflow tool. A lean first launch can use Google Sheets, Airtable, Make, Zapier, or n8n, then move deeper into HubSpot, Salesforce, ServiceTitan, or a vertical CRM."
  },
  {
    keywords: ["sms", "text", "confirmation"],
    title: "SMS follow-up",
    answer:
      "After a call, the system can text the customer a confirmation, booking link, reminder, or next step. It can also text the team a clean summary with the caller name, number, need, urgency, and appointment details."
  },
  {
    keywords: ["industry", "business", "work"],
    title: "Every-company routing",
    answer:
      "The architecture is not based on hardcoding a million scripts. It uses a master receptionist prompt plus a dynamic business profile for the active tenant, so a cleaning company, law firm, clinic, restaurant, and repair shop each get different vocabulary, intake fields, and escalation rules."
  },
  {
    keywords: ["security", "safe", "data"],
    title: "Security",
    answer:
      "The production architecture uses server-side secrets, rate limiting, signed provider webhooks, tenant records, encrypted webhook storage, and polite safety shutoff rules. Regulated industries still need the proper legal, compliance, and vendor review before making compliance claims."
  },
  {
    keywords: ["voice", "sound", "robot"],
    title: "Voice quality",
    answer:
      "The goal is a calm, natural phone voice that sounds like a helpful front desk, not a rigid phone tree. Live calls should be tested with real phone audio, accents, interruptions, noise, and handoff cases before paid traffic."
  },
  {
    keywords: ["setup", "onboarding", "launch"],
    title: "Setup",
    answer:
      "Onboarding collects the business hours, services, FAQs, calendar rules, escalation phone, CRM destination, and approved language. Then we assign the AI number, connect the voice agent, run test calls, and tune the script before sending traffic."
  },
  {
    keywords: ["after", "hours", "weekend"],
    title: "After-hours",
    answer:
      "After-hours coverage is one of the clearest use cases. The receptionist can answer, qualify the request, book if allowed, send a confirmation, or route urgent calls to the right person."
  },
  {
    keywords: ["cancel", "reschedule", "change"],
    title: "Reschedules",
    answer:
      "Reschedules and cancellations can be handled when the calendar workflow is connected. The AI verifies the caller, checks the allowed rules, moves the appointment if possible, and sends a confirmation."
  },
  {
    keywords: ["spanish", "accent", "language"],
    title: "Language and accents",
    answer:
      "Multilingual and accent handling are possible, but they should be tested with real callers and real phone conditions. The honest rollout is test, measure, tune, and add languages deliberately."
  },
  {
    keywords: ["dashboard", "admin", "manage"],
    title: "Admin dashboard",
    answer:
      "The admin side is designed so each client can have its own number, prompt, calendar, voice provider, and routing rules without editing code."
  },
  {
    keywords: ["stripe", "checkout", "payment"],
    title: "Checkout",
    answer:
      "Stripe Checkout is wired for subscriptions. Once live Stripe price IDs are added, the pricing buttons open secure checkout and the webhook can trigger onboarding."
  },
  {
    keywords: ["demo", "try", "call"],
    title: "Live demo",
    answer:
      "The live demo should use a dedicated AI number. Visitors can call it, hear the receptionist, and understand the capture-to-summary flow before booking a setup conversation."
  },
  {
    keywords: ["legal", "medical", "hipaa"],
    title: "Regulated calls",
    answer:
      "For legal, healthcare, or financial use cases, the safe setup is conservative: answer, collect basic intake, route appropriately, and avoid advice. Compliance claims should only be made after the right agreements and infrastructure are in place."
  },
  {
    keywords: ["missed", "calls", "leads"],
    title: "Missed calls",
    answer:
      "The product is built around missed-call recovery. It answers when the team is busy, captures caller details, moves qualified requests toward booking, and gives the business a clean summary instead of a vague voicemail."
  },
  {
    keywords: ["owner", "team", "summary"],
    title: "Team summaries",
    answer:
      "After each useful call, the team can receive a clean handoff: caller name, phone, need, urgency, appointment time, and next step. That keeps staff from replaying calls or chasing vague notes."
  }
];

function scoreTopic(question: string, topic: ChatTopic) {
  return topic.keywords.reduce((score, keyword) => (question.includes(keyword) ? score + 1 : score), 0);
}

function randomChoice<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function buildResponseId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildIndustryAnswer(question: string) {
  const capsule = getCompanyKnowledgeCapsule(null, question);

  if (capsule.industry === "General Business") return null;

  return {
    title: capsule.industry,
    keywords: capsule.detectedKeywords.slice(0, 3).length
      ? capsule.detectedKeywords.slice(0, 3)
      : capsule.vocabulary.slice(0, 3),
    answer: `For a ${capsule.industry.toLowerCase()} business, the AI receptionist should use the right intake words instead of a generic script. It can handle ${capsule.callerNeeds.slice(0, 3).join(", ")}. It should collect ${capsule.intakeFields.slice(0, 4).join(", ")} and escalate cases like ${capsule.escalationRules.slice(0, 2).join(" or ")}.`
  };
}

function buildGeneralBusinessLens(question: string) {
  const hasComparison = /\b(compare|better|best|versus|vs|competitor|alternative|choose)\b/.test(question);
  const hasProcess = /\b(how|process|workflow|steps|setup|operate|manage|run)\b/.test(question);
  const hasTrust = /\b(trust|safe|risk|privacy|secure|legal|honest|claim)\b/.test(question);
  const hasMoney = /\b(money|revenue|price|cost|roi|profit|sell|sales|lead)\b/.test(question);

  if (hasTrust) {
    return "the useful answer is to be transparent, stay inside approved business facts, and route anything sensitive to a person.";
  }

  if (hasMoney) {
    return "the useful answer is to connect the conversation to revenue: calls answered, leads captured, appointments booked, and staff time saved.";
  }

  if (hasComparison) {
    return "the useful answer is to compare the outcome, not the buzzwords: speed to answer, quality of intake, reliability, cost control, and human backup.";
  }

  if (hasProcess) {
    return "the useful answer is to break it into a clean operating flow: answer, understand intent, collect details, act when allowed, and summarize for the team.";
  }

  return "the useful answer is to bring it back to the customer experience: make the caller feel heard, capture the right context, and move them to the next step.";
}

export const webChatResponseVariantCount =
  openings.length *
  closers.length *
  topics.length *
  empathyLines.length *
  businessBridges.length *
  operatingAngles.length *
  nextStepLines.length *
  conversationalPolish.length;

/**
 * Answers website chat questions with a controlled but humanized sales/support brain.
 *
 * Business value: this gives visitors useful answers across industries while
 * keeping the brand safe. It uses industry routing, approved response variants,
 * and a hard safety termination signal instead of free-form hallucination.
 */
export function answerFrontDeskChat(question: string): WebChatAnswer {
  const safety = evaluateConversationSafety(question);

  if (!safety.allowed) {
    return {
      answer: safety.signOff || "I apologize, but I have to end this conversation. Have a good day.",
      topic: "Safety sign-off",
      keywords: ["safety", "policy", "handoff"],
      variants: webChatResponseVariantCount,
      needsHuman: false,
      terminated: true,
      safetyReason: safety.reason,
      responseId: buildResponseId()
    };
  }

  const normalized = cleanText(question, 700).toLowerCase();
  const ranked = topics
    .map((topic) => ({ topic, score: scoreTopic(normalized, topic) }))
    .sort((a, b) => b.score - a.score);
  const industryAnswer = buildIndustryAnswer(normalized);
  const best = ranked[0];
  const shouldPreferIndustry = Boolean(industryAnswer && (!best?.score || best.topic.title === "Every-company routing"));
  const selected: SelectedAnswer = shouldPreferIndustry
    ? industryAnswer!
    : best?.score
    ? { title: best.topic.title, keywords: best.topic.keywords, answer: best.topic.answer, needsHuman: best.topic.needsHuman }
    : {
        title: "General front-office fit",
        keywords: ["business", "calls", "intake"],
        answer: `I can talk about that in a business-focused way. ${buildGeneralBusinessLens(normalized)} Revenue Guard adapts through the client profile: business type, services, FAQs, booking rules, escalation rules, and approved language. If a caller asks something outside that profile, the AI collects details and routes it to a person instead of guessing.`,
        needsHuman: true
      };
  const opening = randomChoice(openings);
  const empathy = randomChoice(empathyLines);
  const bridge = randomChoice(businessBridges);
  const angle = randomChoice(operatingAngles);
  const nextStep = randomChoice(nextStepLines);
  const polish = randomChoice(conversationalPolish);
  const closer = randomChoice(closers);

  return {
    answer: `${opening} ${empathy} ${selected.answer} ${bridge} ${angle} ${nextStep} ${polish} ${closer}`,
    topic: selected.title,
    keywords: [...selected.keywords].slice(0, 3),
    variants: webChatResponseVariantCount,
    needsHuman: Boolean(selected.needsHuman) || !best?.score,
    terminated: false,
    responseId: buildResponseId()
  };
}
