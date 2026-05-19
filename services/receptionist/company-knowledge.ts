import type { ClientConfig } from "@/lib/client-directory";
import { cleanText } from "@/lib/security";

type IndustryProfile = {
  id: string;
  label: string;
  keywords: string[];
  callerNeeds: string[];
  intakeFields: string[];
  actions: string[];
  escalationRules: string[];
  vocabulary: string[];
};

export type CompanyKnowledgeCapsule = {
  industry: string;
  callerNeeds: string[];
  intakeFields: string[];
  actions: string[];
  escalationRules: string[];
  vocabulary: string[];
  detectedKeywords: string[];
};

const industryProfiles: IndustryProfile[] = [
  {
    id: "cleaning",
    label: "Cleaning and Janitorial",
    keywords: ["cleaning", "maid", "janitor", "housekeeping", "deep clean", "move out"],
    callerNeeds: ["quote requests", "recurring service", "one-time deep cleaning", "move-in or move-out cleaning"],
    intakeFields: ["property type", "square footage", "rooms", "frequency", "address", "preferred day"],
    actions: ["qualify the job", "book an estimate", "send a confirmation", "route urgent same-day work"],
    escalationRules: ["biohazard cleanup", "damage claims", "commercial contract negotiation"],
    vocabulary: ["deep clean", "standard clean", "recurring visit", "walkthrough", "supplies", "access instructions"]
  },
  {
    id: "home-services",
    label: "Home Services",
    keywords: ["plumber", "hvac", "electrician", "roof", "pest", "landscaping", "contractor"],
    callerNeeds: ["emergency repair", "diagnostic visit", "quote request", "reschedule", "warranty question"],
    intakeFields: ["service address", "problem type", "urgency", "photos available", "preferred time", "access notes"],
    actions: ["triage urgency", "book dispatch", "send technician details", "route emergencies"],
    escalationRules: ["gas smell", "sparking electrical", "flooding", "safety hazards"],
    vocabulary: ["dispatch", "diagnostic", "estimate", "service window", "technician", "after-hours emergency"]
  },
  {
    id: "legal",
    label: "Legal and Professional Intake",
    keywords: ["lawyer", "attorney", "legal", "case", "injury", "divorce", "contract"],
    callerNeeds: ["new matter intake", "consultation scheduling", "document follow-up", "case status"],
    intakeFields: ["full name", "phone", "email", "matter type", "county", "deadline", "conflict details"],
    actions: ["screen basic fit", "book consultation", "route urgent deadlines", "collect contact details"],
    escalationRules: ["legal advice requests", "court deadlines", "threats", "active emergencies"],
    vocabulary: ["consultation", "intake", "matter", "retainer", "case type", "conflict check"]
  },
  {
    id: "healthcare",
    label: "Healthcare and Wellness",
    keywords: ["clinic", "doctor", "patient", "dental", "therapy", "med spa", "appointment"],
    callerNeeds: ["appointment scheduling", "reschedule", "insurance basics", "new patient intake", "directions"],
    intakeFields: ["patient name", "date of birth when appropriate", "callback number", "appointment type", "preferred provider"],
    actions: ["schedule approved appointment types", "send reminders", "route clinical questions to staff"],
    escalationRules: ["medical advice", "symptoms that sound urgent", "privacy-sensitive details", "billing disputes"],
    vocabulary: ["new patient", "provider", "visit type", "intake form", "insurance", "follow-up appointment"]
  },
  {
    id: "restaurant",
    label: "Restaurant and Hospitality",
    keywords: ["restaurant", "reservation", "hotel", "catering", "menu", "table"],
    callerNeeds: ["reservation", "hours", "menu questions", "catering inquiry", "guest request"],
    intakeFields: ["party size", "date", "time", "occasion", "dietary notes", "phone number"],
    actions: ["book reservation", "answer FAQ", "route events", "send confirmation"],
    escalationRules: ["large private events", "complaints", "refunds", "food allergy concerns"],
    vocabulary: ["reservation", "party size", "availability", "catering", "private dining", "confirmation"]
  },
  {
    id: "auto",
    label: "Automotive and Repair",
    keywords: ["auto", "mechanic", "dealership", "repair", "oil change", "vehicle"],
    callerNeeds: ["service booking", "repair estimate", "status update", "parts question", "inspection"],
    intakeFields: ["vehicle year", "make", "model", "issue", "mileage", "preferred time"],
    actions: ["book service", "collect vehicle details", "route status updates", "send reminder"],
    escalationRules: ["safety recalls", "angry complaints", "payment disputes", "tow requests"],
    vocabulary: ["VIN", "mileage", "service bay", "diagnostic", "inspection", "repair order"]
  },
  {
    id: "retail",
    label: "Retail and Ecommerce",
    keywords: ["retail", "store", "ecommerce", "order", "shipping", "return", "product"],
    callerNeeds: ["order status", "return policy", "product availability", "store hours", "pickup"],
    intakeFields: ["order number", "email", "product name", "issue", "preferred resolution"],
    actions: ["answer policy questions", "create ticket", "route high-value orders", "send status link"],
    escalationRules: ["fraud claims", "chargebacks", "angry refund disputes", "damaged expensive items"],
    vocabulary: ["order status", "return window", "pickup", "inventory", "tracking", "exchange"]
  },
  {
    id: "real-estate",
    label: "Real Estate and Property",
    keywords: ["real estate", "property", "apartment", "tenant", "landlord", "showing", "listing"],
    callerNeeds: ["showing request", "tenant maintenance", "buyer qualification", "seller inquiry", "availability"],
    intakeFields: ["property address", "budget", "timeline", "preferred area", "issue type", "callback number"],
    actions: ["qualify lead", "book showing", "route maintenance", "send listing details"],
    escalationRules: ["lockouts", "flooding", "safety issues", "legal disputes"],
    vocabulary: ["showing", "listing", "lease", "maintenance request", "budget", "move-in date"]
  },
  {
    id: "finance",
    label: "Financial and Insurance Services",
    keywords: ["insurance", "finance", "loan", "claim", "policy", "accounting", "tax"],
    callerNeeds: ["appointment", "policy question", "claim intake", "document request", "tax consultation"],
    intakeFields: ["full name", "contact information", "policy or account reference when safe", "request type"],
    actions: ["collect non-sensitive details", "book consultation", "route urgent claims", "create follow-up task"],
    escalationRules: ["financial advice", "sensitive account data", "fraud reports", "legal deadlines"],
    vocabulary: ["policy", "claim", "consultation", "renewal", "deductible", "document upload"]
  },
  {
    id: "general",
    label: "General Business",
    keywords: ["business", "company", "office", "service", "customer", "client"],
    callerNeeds: ["answer common questions", "capture leads", "schedule appointments", "route calls"],
    intakeFields: ["name", "phone", "email", "reason for calling", "urgency", "preferred next step"],
    actions: ["answer approved FAQs", "book approved slots", "send a summary", "transfer complex calls"],
    escalationRules: ["safety issues", "complaints", "refunds", "advice requests", "anything outside approved rules"],
    vocabulary: ["appointment", "lead", "handoff", "summary", "follow-up", "availability"]
  }
];

function scoreProfile(profile: IndustryProfile, text: string) {
  return profile.keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0);
}

/**
 * Selects the best industry operating model for the active tenant or chat input.
 *
 * Business value: the receptionist can sound specific to a cleaning company,
 * lawyer, clinic, restaurant, or any other repeatable business without hardcoding
 * a million scripts. Unknown industries fall back to a general intake model.
 */
export function getCompanyKnowledgeCapsule(client: Partial<ClientConfig> | null, input: unknown): CompanyKnowledgeCapsule {
  const text = [
    cleanText(input, 1000),
    cleanText(client?.businessName, 160),
    cleanText((client as { industry?: string } | null)?.industry, 120),
    cleanText(client?.systemPrompt, 1500)
  ]
    .join(" ")
    .toLowerCase();
  const ranked = industryProfiles
    .map((profile) => ({ profile, score: scoreProfile(profile, text) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ? ranked[0].profile : industryProfiles.find((profile) => profile.id === "general")!;
  const detectedKeywords = best.keywords.filter((keyword) => text.includes(keyword));

  return {
    industry: best.label,
    callerNeeds: best.callerNeeds,
    intakeFields: best.intakeFields,
    actions: best.actions,
    escalationRules: best.escalationRules,
    vocabulary: best.vocabulary,
    detectedKeywords
  };
}

/**
 * Turns an industry capsule into short prompt text for LLM context injection.
 *
 * Business value: keeps tenant-specific vocabulary close to the model turn, which
 * is the lightweight RAG layer for the voice agent until a vector store is added.
 */
export function formatKnowledgeCapsule(capsule: CompanyKnowledgeCapsule) {
  return [
    `Detected operating model: ${capsule.industry}`,
    `Common caller needs: ${capsule.callerNeeds.join("; ")}`,
    `Collect only the details needed for this business: ${capsule.intakeFields.join("; ")}`,
    `Allowed actions: ${capsule.actions.join("; ")}`,
    `Escalate when: ${capsule.escalationRules.join("; ")}`,
    `Use natural business vocabulary when relevant: ${capsule.vocabulary.join("; ")}`
  ].join("\n");
}

