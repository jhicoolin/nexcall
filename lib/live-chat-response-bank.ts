import { cleanText } from "@/lib/security";

export type LiveChatIntent =
  | "greeting"
  | "what_is_nexcall"
  | "how_it_works"
  | "pricing"
  | "starter_plan"
  | "appointment_plan"
  | "growth_plan"
  | "demo_call"
  | "appointment_requests"
  | "lead_capture"
  | "after_hours"
  | "human_backup"
  | "call_routing"
  | "industries"
  | "setup_time"
  | "integrations_high_level"
  | "reliability"
  | "ai_disclosure"
  | "privacy"
  | "compliance"
  | "cancellation_refund"
  | "checkout_help"
  | "talk_to_human"
  | "contact_info"
  | "objection_too_expensive"
  | "objection_already_have_staff"
  | "objection_need_to_think"
  | "objection_is_this_real"
  | "not_sure"
  | "fallback_unknown"
  | "lead_capture_prompt"
  | "lead_capture_success"
  | "lead_capture_failure"
  | "emergency_boundary"
  | "technical_stack_refusal";

type ChatTopic = {
  intent: LiveChatIntent;
  keywords: string[];
  title: string;
  answer: string;
  needsHuman?: boolean;
  terminated?: boolean;
};

export type LiveChatAnswer = {
  answer: string;
  topic: string;
  intent: LiveChatIntent;
  keywords: string[];
  variants: number;
  needsHuman: boolean;
  terminated: boolean;
};

export const NEXCALL_CHAT_EMAIL = "nexcall@proton.me";
export const NEXCALL_CHAT_PHONE = "(202) 200-6578";

const topics: ChatTopic[] = [
  {
    intent: "greeting",
    keywords: ["hi", "hello", "hey", "start"],
    title: "Greeting",
    answer:
      "Hi - I am Nexa, NexCall's front desk assistant. I can help you try a demo call, compare plans, or see whether NexCall fits your business. What are you looking to handle better: missed calls, appointment requests, or lead capture?"
  },
  {
    intent: "what_is_nexcall",
    keywords: ["what is this", "what do you do", "what is nexcall", "explain"],
    title: "What NexCall Does",
    answer:
      "NexCall is an AI receptionist service for businesses that cannot afford to miss calls. It can answer callers, capture key details, support appointment requests, and send your team a clean next-step summary."
  },
  {
    intent: "how_it_works",
    keywords: ["how does this work", "how it works", "process", "workflow"],
    title: "How It Works",
    answer:
      "When a call comes in, NexCall gives the caller a professional first response, captures what they need, and helps move the next step forward. That could mean taking a message, capturing a lead, supporting an appointment request, or routing the situation to a person."
  },
  {
    intent: "pricing",
    keywords: ["price", "pricing", "cost", "plans", "how much"],
    title: "Pricing",
    answer:
      "NexCall has three plan paths: Starter for basic answering and lead capture, Appointment for teams that need appointment-request support, and Growth for higher-volume workflows with more customization. The Pricing section shows the current plan options."
  },
  {
    intent: "starter_plan",
    keywords: ["starter", "basic"],
    title: "Starter Plan",
    answer:
      "Starter is best if you mainly need reliable call answering, simple lead capture, basic FAQs, and clean summaries when your team is busy."
  },
  {
    intent: "appointment_plan",
    keywords: ["appointment plan", "appointment tier", "booking plan"],
    title: "Appointment Plan",
    answer:
      "Appointment is usually the best fit for service businesses that need help collecting appointment details, preferred times, reschedule requests, and follow-up context."
  },
  {
    intent: "growth_plan",
    keywords: ["growth", "higher volume", "custom"],
    title: "Growth Plan",
    answer:
      "Growth is for higher call volume or more advanced workflows, like multiple appointment types, custom scripts, and deeper handoff rules."
  },
  {
    intent: "demo_call",
    keywords: ["demo", "call me", "try", "test", "hear it", "sample call"],
    title: "Call Demo",
    answer:
      "The best way to test it is the Call Demo. Enter your number, keep your phone nearby, and NexCall will place a demo call so you can hear the caller experience for yourself. No card is required."
  },
  {
    intent: "appointment_requests",
    keywords: ["booking", "schedule", "reschedule", "calendar", "appointments"],
    title: "Appointment Requests",
    answer:
      "NexCall can help collect appointment details, preferred timing, caller context, and urgency so scheduling can move forward cleanly. If a time needs human confirmation, your team gets the details to follow up."
  },
  {
    intent: "lead_capture",
    keywords: ["leads", "capture", "missed calls", "new customers", "inquiries"],
    title: "Lead Capture",
    answer:
      "NexCall can capture the caller's name, phone number, need, urgency, and notes so your team can follow up without guessing what the caller wanted."
  },
  {
    intent: "after_hours",
    keywords: ["after hours", "night", "weekend", "closed", "busy"],
    title: "After Hours",
    answer:
      "Yes. NexCall is designed for missed calls, busy moments, nights, weekends, lunch rushes, and overflow coverage."
  },
  {
    intent: "human_backup",
    keywords: ["human", "person", "transfer", "representative", "real person"],
    title: "Human Backup",
    answer:
      "When a call needs judgment or personal attention, NexCall can capture the context and help move the situation to a real person instead of forcing a guess.",
    needsHuman: true
  },
  {
    intent: "call_routing",
    keywords: ["route", "routing", "urgent", "high value", "escalate"],
    title: "Call Routing",
    answer:
      "NexCall can help identify why someone is calling and route urgent or high-value situations with useful context attached."
  },
  {
    intent: "industries",
    keywords: ["industry", "business", "work for", "salon", "clinic", "dental", "contractor", "restaurant", "legal"],
    title: "Industries",
    answer:
      "NexCall is strongest for businesses with repeat call patterns: clinics, salons, dental offices, auto repair shops, contractors, legal offices, agencies, restaurants, and local service businesses."
  },
  {
    intent: "setup_time",
    keywords: ["setup", "onboarding", "launch", "start"],
    title: "Setup",
    answer:
      "Most teams can start by mapping the common calls they receive: new leads, appointment requests, FAQs, urgent issues, and handoffs. The NexCall team can help shape the first flow.",
    needsHuman: true
  },
  {
    intent: "integrations_high_level",
    keywords: ["crm", "integrate", "connect", "software", "system", "apps"],
    title: "Integrations",
    answer:
      "NexCall can support workflows around calls, lead capture, appointment requests, and team handoffs. For specific systems, the NexCall team can confirm what is supported for your setup.",
    needsHuman: true
  },
  {
    intent: "reliability",
    keywords: ["reliable", "accuracy", "trust", "wrong", "doesn't know", "does not know"],
    title: "Reliability",
    answer:
      "NexCall is designed to stay helpful without guessing. If a call needs judgment, the workflow can capture the details and route the next step to a person."
  },
  {
    intent: "ai_disclosure",
    keywords: ["ai", "automated", "robot", "disclosure"],
    title: "AI Disclosure",
    answer:
      "NexCall may use AI to assist with call handling and information capture. It is built to support business communication, not replace professional judgment for sensitive, legal, medical, financial, or emergency situations."
  },
  {
    intent: "privacy",
    keywords: ["privacy", "secure", "data", "record", "recording"],
    title: "Privacy",
    answer:
      "NexCall focuses on collecting the information needed to handle the inquiry, such as contact details, caller needs, appointment preferences, and notes. For formal privacy terms, check the Privacy page."
  },
  {
    intent: "compliance",
    keywords: ["compliance", "hipaa", "legal", "medical", "financial"],
    title: "Compliance",
    answer:
      "Compliance needs can vary by industry and location. NexCall can support front-desk workflows, but businesses should confirm their consent, recording, privacy, and industry-specific requirements.",
    needsHuman: true
  },
  {
    intent: "cancellation_refund",
    keywords: ["refund", "cancel", "cancellation"],
    title: "Refunds",
    answer:
      "Refund and cancellation terms depend on the selected plan or agreement. The Refund Policy page explains the general approach, and the team can answer account-specific questions.",
    needsHuman: true
  },
  {
    intent: "checkout_help",
    keywords: ["checkout", "payment", "card", "buy", "subscribe"],
    title: "Checkout Help",
    answer:
      "If checkout does not complete, you can return to plans, try a demo call, or contact the team. I can also help capture your info for follow-up.",
    needsHuman: true
  },
  {
    intent: "talk_to_human",
    keywords: ["contact", "email", "phone", "support", "talk to someone", "call me", "walkthrough"],
    title: "Talk To Human",
    answer:
      "I can help here, or I can get your details to the NexCall team for human follow-up. What is your name, business name, phone number, and the best email to reach you?",
    needsHuman: true
  },
  {
    intent: "contact_info",
    keywords: ["nexcall@proton.me", "202", "200", "6578", "contact info"],
    title: "Contact Info",
    answer: `You can reach NexCall at ${NEXCALL_CHAT_EMAIL} or ${NEXCALL_CHAT_PHONE}.`,
    needsHuman: true
  },
  {
    intent: "objection_too_expensive",
    keywords: ["too expensive", "expensive", "cost too much", "pricey"],
    title: "Too Expensive",
    answer:
      "That makes sense. A good way to think about NexCall is missed-call recovery: if even a few unanswered calls become booked jobs, consults, or customers, the service can pay for itself quickly. The demo call is a low-friction way to test the experience first."
  },
  {
    intent: "objection_already_have_staff",
    keywords: ["already have staff", "already have receptionist", "have a receptionist"],
    title: "Already Have Staff",
    answer:
      "That can still be a great fit. Many teams use NexCall for overflow, after-hours calls, weekends, lunch breaks, or missed calls when staff are busy."
  },
  {
    intent: "objection_need_to_think",
    keywords: ["need to think", "not sure", "maybe later", "just browsing"],
    title: "Need To Think",
    answer:
      "No problem. I would suggest trying the demo call first so you can hear the experience. If it feels useful, you can compare plans or ask the team for a walkthrough."
  },
  {
    intent: "objection_is_this_real",
    keywords: ["is this real", "real call", "real phone", "does this actually"],
    title: "Is This Real",
    answer:
      "Yes - the demo call lets you experience the call flow from the caller side. NexCall is built to answer calls, capture context, and help your team follow up cleanly."
  },
  {
    intent: "not_sure",
    keywords: ["which plan", "best fit", "recommend", "what should i choose"],
    title: "Plan Fit",
    answer:
      "No problem. What kind of business are you running, and what usually happens when you miss a call?"
  },
  {
    intent: "lead_capture_prompt",
    keywords: ["someone call me", "follow up", "reach out", "walk me through"],
    title: "Lead Prompt",
    answer:
      "I can get that to the team. What is your name, business name, phone number, email, and what you want NexCall to handle?",
    needsHuman: true
  },
  {
    intent: "lead_capture_success",
    keywords: ["my name is", "my email", "my number", "here is my"],
    title: "Lead Details",
    answer:
      "Thanks - I can help get those details to the NexCall team. The safest path is the Human follow-up tab so your name, business, phone, email, and notes are captured cleanly.",
    needsHuman: true
  },
  {
    intent: "lead_capture_failure",
    keywords: ["did not send", "failed to send", "not delivered"],
    title: "Lead Failure",
    answer: `I could not confirm delivery from here. You can reach the team directly at ${NEXCALL_CHAT_EMAIL} or ${NEXCALL_CHAT_PHONE}.`,
    needsHuman: true
  },
  {
    intent: "emergency_boundary",
    keywords: ["emergency", "911", "urgent medical", "danger", "safety"],
    title: "Emergency Boundary",
    answer:
      "NexCall is not for emergencies. If this is urgent or involves safety, contact emergency services or the appropriate local responder.",
    terminated: true
  },
  {
    intent: "technical_stack_refusal",
    keywords: [
      "twilio",
      "elevenlabs",
      "cal.com",
      "api",
      "webhook",
      "model",
      "prompt",
      "provider",
      "voice id",
      "stripe id",
      "redis",
      "kv"
    ],
    title: "Technical Details",
    answer:
      "I can explain what NexCall does for your business, but I do not share internal provider or system details here. The important part is that callers get a professional response and your team gets the next step."
  }
];

const fallbackTopic: ChatTopic = {
  intent: "fallback_unknown",
  keywords: ["fallback"],
  title: "Unknown",
  answer: `I may not have the exact answer here, but I can help get your question to the NexCall team. You can also reach them at ${NEXCALL_CHAT_EMAIL} or ${NEXCALL_CHAT_PHONE}.`,
  needsHuman: true
};

function scoreTopic(question: string, topic: ChatTopic) {
  return topic.keywords.reduce((score, keyword) => {
    return question.includes(keyword) ? score + 1 : score;
  }, 0);
}

function chooseTopic(question: string) {
  const normalized = cleanText(question, 700).toLowerCase();
  const stackTopic = topics.find((topic) => topic.intent === "technical_stack_refusal");
  const emergencyTopic = topics.find((topic) => topic.intent === "emergency_boundary");

  if (emergencyTopic && scoreTopic(normalized, emergencyTopic) > 0) return emergencyTopic;
  if (stackTopic && scoreTopic(normalized, stackTopic) > 0) return stackTopic;

  const ranked = topics
    .filter((topic) => topic.intent !== "technical_stack_refusal" && topic.intent !== "emergency_boundary")
    .map((topic) => ({ topic, score: scoreTopic(normalized, topic) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score ? ranked[0].topic : fallbackTopic;
}

export const liveChatResponseVariantCount = topics.length;

export function getHumanizedChatAnswer(question: string): LiveChatAnswer {
  const topic = chooseTopic(question);

  return {
    answer: topic.answer,
    topic: topic.title,
    intent: topic.intent,
    keywords: topic.keywords.slice(0, 4),
    variants: liveChatResponseVariantCount,
    needsHuman: Boolean(topic.needsHuman),
    terminated: Boolean(topic.terminated)
  };
}
