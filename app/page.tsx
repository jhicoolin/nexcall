"use client";

import { motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  Headphones,
  HeartPulse,
  HelpCircle,
  HomeIcon,
  Landmark,
  MessageSquareText,
  Minus,
  Phone,
  Scissors,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
  UserRound,
  Users,
  Workflow,
  X,
  type LucideIcon
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { huggingFaceVoiceOptions, type HuggingFaceScenarioId } from "@/lib/huggingface-voice-lab";

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: "easeOut" }
} as const;

type LeadForm = {
  name: string;
  trucks: string;
  service: string;
  email: string;
  phone: string;
};

type ChatMessage = {
  role: "visitor" | "assistant";
  text: string;
};

type ChatMode = "ai" | "human";

type Review = {
  name: string;
  role: string;
  image: string;
  quote: string;
  stat: string;
  industry: string;
};

type VoiceProfileKey = "warmFemale" | "confidentMale" | "brightFemale" | "calmMale" | "steadyMale" | "empatheticFemale";

type VoiceProfile = {
  label: string;
  tone: string;
  rate: number;
  pitch: number;
  preferredNames: string[];
};

type DemoScenario = {
  id: HuggingFaceScenarioId;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  result: string;
  duration: string;
  voiceProfile: VoiceProfileKey;
  audioUrl?: string;
  lines: Array<{
    speaker: "Caller" | "Receptionist";
    text: string;
    duration: number;
  }>;
};

const industries = [
  "Dental offices",
  "Salons",
  "Auto repair",
  "Clinics",
  "Legal offices",
  "Agencies",
  "Contractors",
  "Local shops"
];

const reviews: Review[] = [
  {
    name: "Maya R.",
    role: "Clinic manager",
    industry: "Healthcare",
    image:
      "https://images.pexels.com/photos/36819476/pexels-photo-36819476.jpeg?auto=compress&cs=tinysrgb&w=520",
    quote:
      "Our phones used to decide our day for us. Now the simple calls get booked, the messy calls get routed, and the team starts with clean notes.",
    stat: "31% more consults booked"
  },
  {
    name: "Linh C.",
    role: "Studio owner",
    industry: "Wellness",
    image:
      "https://images.pexels.com/photos/26728100/pexels-photo-26728100.jpeg?auto=compress&cs=tinysrgb&w=520",
    quote:
      "People call between sessions, after work, and on weekends. The AI helps them book without making my staff choose between the client in front of them and the phone.",
    stat: "18 hours saved monthly"
  },
  {
    name: "Arjun P.",
    role: "Operations lead",
    industry: "Professional services",
    image:
      "https://images.pexels.com/photos/19746166/pexels-photo-19746166.jpeg?auto=compress&cs=tinysrgb&w=520",
    quote:
      "The handoff notes are what sold us. When a person takes over, they already know who called, what they need, and why it matters.",
    stat: "2.4x faster follow-up"
  },
  {
    name: "Elena V.",
    role: "Operations lead",
    industry: "Professional services",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=520&q=80&crop=faces",
    quote:
      "We did not want a robot pretending to be human. We wanted a calm first step that could book, collect details, and hand off when needed.",
    stat: "2.4x faster follow-up"
  },
  {
    name: "Carolyn M.",
    role: "Office manager",
    industry: "Local services",
    image:
      "https://images.pexels.com/photos/8560308/pexels-photo-8560308.jpeg?auto=compress&cs=tinysrgb&w=520",
    quote:
      "Our customers are not trying to talk to software. They want someone steady to answer, collect the right details, and get them to the next step.",
    stat: "29% fewer missed inquiries"
  },
  {
    name: "Robert C.",
    role: "Practice administrator",
    industry: "Dental",
    image:
      "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=360&q=80",
    quote:
      "The calendar connection mattered most. Once appointment types and buffers were right, our front desk actually trusted it.",
    stat: "41% fewer voicemail callbacks"
  }
];

const demoLines = [
  {
    speaker: "Caller",
    side: "left",
    text: "Hi, I need to move my appointment. I am free Thursday afternoon."
  },
  {
    speaker: "Receptionist",
    side: "right",
    text: "I can help with that. I see a 2:30 PM and a 4:15 PM opening. Which works better?"
  },
  {
    speaker: "Caller",
    side: "left",
    text: "4:15 please. Can you text it to me?"
  },
  {
    speaker: "Receptionist",
    side: "right",
    text: "Done. Your Thursday appointment is confirmed for 4:15 PM, and I just sent the details."
  }
];

const voiceProfiles: Record<VoiceProfileKey, VoiceProfile> = {
  warmFemale: {
    label: "Warm female",
    tone: "calm, helpful, front-desk friendly",
    rate: 0.92,
    pitch: 1.04,
    preferredNames: [
      "Microsoft Jenny",
      "Microsoft Aria",
      "Samantha",
      "Ava",
      "Victoria",
      "Google US English",
      "Zira",
      "Tessa",
      "Karen",
      "Moira"
    ]
  },
  confidentMale: {
    label: "Confident male",
    tone: "clear, consultative, never salesy",
    rate: 0.91,
    pitch: 0.96,
    preferredNames: [
      "Microsoft Guy",
      "Microsoft Ryan",
      "Alex",
      "Daniel",
      "Google UK English Male",
      "Google US English",
      "Mark",
      "David"
    ]
  },
  brightFemale: {
    label: "Bright female",
    tone: "welcoming, polished, concierge-style",
    rate: 0.96,
    pitch: 1.08,
    preferredNames: [
      "Microsoft Aria",
      "Samantha",
      "Serena",
      "Ava",
      "Google US English",
      "Victoria",
      "Zira",
      "Moira"
    ]
  },
  calmMale: {
    label: "Calm male",
    tone: "patient, steady, support-focused",
    rate: 0.9,
    pitch: 0.94,
    preferredNames: [
      "Microsoft Guy",
      "Microsoft Davis",
      "Alex",
      "Daniel",
      "Google UK English Male",
      "Google US English",
      "Mark",
      "David"
    ]
  },
  steadyMale: {
    label: "Steady male",
    tone: "precise, trustworthy, routing-oriented",
    rate: 0.88,
    pitch: 0.92,
    preferredNames: [
      "Microsoft Guy",
      "Microsoft Ryan",
      "Daniel",
      "Alex",
      "Google UK English Male",
      "Google US English",
      "Mark",
      "David"
    ]
  },
  empatheticFemale: {
    label: "Empathetic female",
    tone: "gentle, reassuring, sensitive-intake ready",
    rate: 0.88,
    pitch: 1.02,
    preferredNames: [
      "Microsoft Jenny",
      "Microsoft Aria",
      "Samantha",
      "Serena",
      "Ava",
      "Victoria",
      "Google US English",
      "Zira"
    ]
  }
};

const voiceDemos: DemoScenario[] = [
  {
    id: "appointment",
    title: "Appointment Scheduling",
    category: "Healthcare Receptionist",
    tags: ["Real-time booking", "Reschedule", "SMS confirmation"],
    summary:
      "A patient needs to move an appointment and get confirmation without waiting on hold.",
    result: "Appointment rescheduled",
    duration: "0:46",
    voiceProfile: "warmFemale",
    audioUrl: process.env.NEXT_PUBLIC_DEMO_AUDIO_APPOINTMENT_URL || "",
    lines: [
      {
        speaker: "Caller",
        text: "Hi, I need to move my appointment. I am free Thursday afternoon.",
        duration: 2100
      },
      {
        speaker: "Receptionist",
        text: "I can help with that. I see 2:30 PM and 4:15 PM on Thursday. Which works better?",
        duration: 2900
      },
      {
        speaker: "Caller",
        text: "4:15 please. Can you text it to me?",
        duration: 1900
      },
      {
        speaker: "Receptionist",
        text: "Done. Your appointment is confirmed for Thursday at 4:15 PM, and I just sent the details.",
        duration: 3200
      }
    ]
  },
  {
    id: "lead",
    title: "Lead Qualification",
    category: "Real Estate Buyer",
    tags: ["Lead capture", "Budget", "Warm transfer"],
    summary:
      "A buyer calls after seeing an ad. The agent qualifies timing, budget, location, and next step.",
    result: "Qualified lead routed",
    duration: "1:03",
    voiceProfile: "confidentMale",
    audioUrl: process.env.NEXT_PUBLIC_DEMO_AUDIO_LEAD_URL || "",
    lines: [
      {
        speaker: "Caller",
        text: "I saw a listing online and wanted to know if someone could show me similar homes.",
        duration: 2500
      },
      {
        speaker: "Receptionist",
        text: "Absolutely. What area are you looking in, and are you hoping to move in the next six months?",
        duration: 3000
      },
      {
        speaker: "Caller",
        text: "North side, ideally under 450. We want to move this summer.",
        duration: 2600
      },
      {
        speaker: "Receptionist",
        text: "Great. I captured that. I can book a buyer consult or transfer you with those details now.",
        duration: 3300
      }
    ]
  },
  {
    id: "restaurant",
    title: "Restaurant Concierge",
    category: "Reservation Support",
    tags: ["Receptionist", "FAQ", "Confirmation"],
    summary:
      "A guest asks about availability, patio seating, and dietary notes during a busy service rush.",
    result: "Reservation confirmed",
    duration: "0:53",
    voiceProfile: "brightFemale",
    audioUrl: process.env.NEXT_PUBLIC_DEMO_AUDIO_RESTAURANT_URL || "",
    lines: [
      {
        speaker: "Caller",
        text: "Do you have a table for four tonight, and can you handle gluten-free options?",
        duration: 2700
      },
      {
        speaker: "Receptionist",
        text: "Yes. I have a 7:15 PM indoor table or an 8 PM patio table. We can note gluten-free for the kitchen.",
        duration: 3600
      },
      {
        speaker: "Caller",
        text: "Let's do the patio at 8.",
        duration: 1500
      },
      {
        speaker: "Receptionist",
        text: "You're confirmed for four on the patio at 8 PM. I sent the confirmation text.",
        duration: 2800
      }
    ]
  },
  {
    id: "support",
    title: "Customer Support",
    category: "E-commerce Order Help",
    tags: ["Order status", "Ticket creation", "Human fallback"],
    summary:
      "A customer wants delivery status. The agent checks the order path and creates a ticket if needed.",
    result: "Status shared",
    duration: "1:02",
    voiceProfile: "calmMale",
    audioUrl: process.env.NEXT_PUBLIC_DEMO_AUDIO_SUPPORT_URL || "",
    lines: [
      {
        speaker: "Caller",
        text: "I placed an order last week and never got a tracking update.",
        duration: 2300
      },
      {
        speaker: "Receptionist",
        text: "I can look that up. Can you confirm the email or phone number on the order?",
        duration: 2800
      },
      {
        speaker: "Caller",
        text: "Sure, it's under my phone number ending in 0187.",
        duration: 2200
      },
      {
        speaker: "Receptionist",
        text: "Thanks. I found the order, created a support ticket, and sent the tracking link by text.",
        duration: 3200
      }
    ]
  },
  {
    id: "ivr",
    title: "AI IVR",
    category: "Financial Services",
    tags: ["Verification", "Routing", "Context"],
    summary:
      "The caller needs the right department without a maze of keypad menus.",
    result: "Verified and routed",
    duration: "0:58",
    voiceProfile: "steadyMale",
    audioUrl: process.env.NEXT_PUBLIC_DEMO_AUDIO_IVR_URL || "",
    lines: [
      {
        speaker: "Caller",
        text: "I need help with a policy question and I am not sure who handles it.",
        duration: 2400
      },
      {
        speaker: "Receptionist",
        text: "I can route you. Is this about billing, claims, or changing coverage?",
        duration: 2800
      },
      {
        speaker: "Caller",
        text: "Changing coverage, but I also have a billing question.",
        duration: 2200
      },
      {
        speaker: "Receptionist",
        text: "I captured both. I'll send you to the coverage team with the billing note attached.",
        duration: 3100
      }
    ]
  },
  {
    id: "legal",
    title: "Legal Intake",
    category: "Professional Services",
    tags: ["Sensitive intake", "Screening", "Human handoff"],
    summary:
      "A potential client needs a calm intake process before speaking with the right person.",
    result: "Consult request captured",
    duration: "1:08",
    voiceProfile: "empatheticFemale",
    audioUrl: process.env.NEXT_PUBLIC_DEMO_AUDIO_LEGAL_URL || "",
    lines: [
      {
        speaker: "Caller",
        text: "I was in an accident and I need to know if someone can help me.",
        duration: 2300
      },
      {
        speaker: "Receptionist",
        text: "I'm sorry that happened. I can gather the basics and make sure the right person follows up.",
        duration: 3300
      },
      {
        speaker: "Caller",
        text: "Okay. It happened yesterday, and I have the police report number.",
        duration: 2600
      },
      {
        speaker: "Receptionist",
        text: "Thank you. I saved the report note and routed this as a priority consultation request.",
        duration: 3200
      }
    ]
  }
];

const integrationGroups = [
  {
    category: "Calendars",
    items: ["Google Calendar", "Microsoft Calendar", "Cal.com", "Calendly"]
  },
  {
    category: "Phone Systems",
    items: ["Twilio", "Telnyx", "Vonage", "OpenPhone", "Contact-center VoIP"]
  },
  {
    category: "CRM",
    items: ["HubSpot", "Salesforce", "Zoho", "Pipedrive", "GoHighLevel"]
  },
  {
    category: "Vertical CRMs",
    items: ["Housecall Pro", "Jobber", "ServiceTitan", "Dentrix", "Follow Up Boss"]
  },
  {
    category: "Automation",
    items: ["Zapier", "Make", "n8n", "Airtable", "Google Sheets"]
  },
  {
    category: "Support",
    items: ["Zendesk", "Freshdesk", "Intercom-style inboxes", "Ticket queues"]
  },
  {
    category: "Payments",
    items: ["Stripe", "Payment links", "Deposit collection", "Invoice workflows"]
  },
  {
    category: "Messaging",
    items: ["SMS", "WhatsApp workflows", "Email follow-up", "Team alerts"]
  }
];

const huggingFaceTtsEnabled = process.env.NEXT_PUBLIC_ENABLE_HF_TTS_DEMOS === "true";

const trustSignals = [
  "Calendar-first setup",
  "Human fallback paths",
  "Twilio-ready phone routing",
  "Stripe checkout wired",
  "Reviewed May 2026"
];

function selectHumanVoice(voices: SpeechSynthesisVoice[], profile: VoiceProfile) {
  if (!voices.length) return undefined;

  const scored = voices.map((voice) => {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;

    if (lang.startsWith("en")) score += 20;
    if (lang === "en-us" || lang === "en_us") score += 8;
    if (voice.localService) score += 4;
    if (name.includes("natural")) score += 14;
    if (name.includes("premium")) score += 10;
    if (name.includes("neural")) score += 10;
    if (name.includes("desktop")) score -= 12;
    if (name.includes("robot")) score -= 100;

    profile.preferredNames.forEach((preferredName, index) => {
      if (name.includes(preferredName.toLowerCase())) {
        score += 100 - index * 4;
      }
    });

    return { voice, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 18 ? scored[0].voice : undefined;
}

export default function Home() {
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f2ea] text-[#1d2733]">
      <Header onCallDemo={() => setIsOutboundModalOpen(true)} />
      <Hero onCallDemo={() => setIsOutboundModalOpen(true)} />
      <TrustSignalBar />
      <UseCaseStrip />
      <FrontOfficeSignalMap />
      <ProblemSnapshot />
      <VoiceAgentDemos />
      <HuggingFaceVoiceLab />
      <JobsDone />
      <HowItWorks />
      <HumanProof />
      <IndustryMatrix />
      <IntegrationDirectory />
      <MarketFit />
      <Pricing />
      <FAQSection />
      <ClosingLeadCapture />
      <Footer />
      <LiveChatDock />
      <OutboundCallModal open={isOutboundModalOpen} onClose={() => setIsOutboundModalOpen(false)} />
    </main>
  );
}

function Header({ onCallDemo }: { onCallDemo: () => void }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200/80 bg-[#f6f2ea]/88 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Revenue Guard home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#244f8f] text-white shadow-sm">
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <span className="text-lg font-black tracking-wide text-[#172033] sm:text-xl">
            REVENUE GUARD
          </span>
        </a>
        <div className="hidden items-center gap-7 text-sm font-semibold text-stone-600 md:flex">
          <a className="transition hover:text-[#172033]" href="#demos">
            Demos
          </a>
          <a className="transition hover:text-[#172033]" href="#how-it-works">
            How It Works
          </a>
          <a className="transition hover:text-[#172033]" href="#reviews">
            Stories
          </a>
          <a className="transition hover:text-[#172033]" href="#pricing">
            Pricing
          </a>
          <a className="transition hover:text-[#172033]" href="#faq">
            FAQ
          </a>
          <a className="transition hover:text-[#172033]" href="/about">
            About
          </a>
        </div>
        <button
          type="button"
          onClick={onCallDemo}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#244f8f] px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73] focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <Phone size={17} aria-hidden="true" />
          Call Demo
        </button>
      </nav>
    </header>
  );
}

function Hero({ onCallDemo }: { onCallDemo: () => void }) {
  return (
    <section id="top" className="relative pt-28">
      <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(rgba(36,79,143,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(36,79,143,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20">
        <motion.div {...sectionMotion} className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#c8d7ef] bg-white px-4 py-2 text-sm font-bold text-[#244f8f] shadow-sm">
            <Sparkles size={16} aria-hidden="true" />
            Warm phone coverage for real businesses
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[1.02] text-[#172033] sm:text-6xl lg:text-7xl">
            A receptionist that answers like a person and works like a system.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
            Revenue Guard picks up missed calls, books open slots, handles simple
            reschedules, and sends clean notes to your team with human backup for the
            calls that need judgment.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {industries.map((item) => (
              <span
                key={item}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm font-bold text-stone-600 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCallDemo}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#244f8f] px-6 py-3 text-base font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73] focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <Phone size={19} aria-hidden="true" />
              Call the Live Demo
            </button>
            <a
              href="#demos"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-6 py-3 text-base font-bold text-[#172033] shadow-sm transition hover:border-stone-400 hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-200"
            >
              Hear Scenario Demos
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </motion.div>
        <HeroPortraitGrid />
      </div>
    </section>
  );
}

function HeroPortraitGrid() {
  const portraits = [
    {
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=85&crop=faces",
      alt: "Diverse business professional receiving the first customer call",
      label: "1. Call reaches AI front desk",
      crop: "object-center",
      position: "center 30%"
    },
    {
      src: "https://images.pexels.com/photos/5273651/pexels-photo-5273651.jpeg?auto=compress&cs=tinysrgb&w=900",
      alt: "Black business professional working in an office while reviewing caller details",
      label: "2. Question answered",
      crop: "object-center",
      position: "center 30%"
    },
    {
      src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85&crop=faces",
      alt: "Business professional confirming caller information",
      label: "3. Details verified",
      crop: "object-center",
      position: "center 24%"
    },
    {
      src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=85&crop=faces",
      alt: "Business professional selecting an appointment slot",
      label: "4. Calendar slot held",
      crop: "object-center",
      position: "center 30%"
    },
    {
      src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=900&q=85&crop=faces",
      alt: "Business operator receiving a warm human handoff",
      label: "5. Human backup alerted",
      crop: "object-center",
      position: "center 32%"
    },
    {
      src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85&crop=faces",
      alt: "Office team reviewing the final call summary together",
      label: "6. Team sees clean summary",
      crop: "object-center",
      position: "center 36%"
    }
  ];
  const callSteps = [
    "Call answered",
    "Intent captured",
    "Contact verified",
    "Calendar checked",
    "Human fallback ready",
    "Team summary sent"
  ];

  return (
    <motion.div {...sectionMotion} className="relative min-h-[620px] lg:min-h-[650px]">
      <div className="absolute inset-0 rotate-[-1.5deg] rounded-lg border border-stone-200 bg-white/70 shadow-xl shadow-stone-300/30" />
      <div className="absolute inset-4 rotate-[1.2deg] rounded-lg border border-[#c8d7ef] bg-[#eef4ff]" />

      <div className="relative grid gap-4 p-4 sm:p-5">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-lg shadow-stone-300/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#244f8f]">
                Live Front Office
              </p>
              <p className="mt-1 text-2xl font-black text-[#172033]">One call, handled end-to-end</p>
            </div>
            <div className="flex gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#10b981]" />
              <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="h-3 w-3 rounded-full bg-[#244f8f]" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portraits.map((portrait, index) => (
              <motion.div
                key={portrait.alt}
                animate={{ y: [0, index % 2 === 0 ? -4 : 4, 0] }}
                transition={{ duration: 6 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                className="overflow-hidden rounded-lg border border-stone-200 bg-[#f6f2ea]"
              >
                <div className="relative h-44 w-full bg-stone-100 sm:h-48 lg:h-40 xl:h-44">
                  <Image
                    fill
                    priority
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
                    className={`object-cover ${portrait.crop}`}
                    style={{ objectPosition: portrait.position }}
                    src={portrait.src}
                    alt={portrait.alt}
                  />
                </div>
                <p className="px-3 py-3 text-xs font-black text-[#172033]">{portrait.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-lg shadow-stone-300/25">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f766e]">
              Active Call
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-[#f1ede5] p-3 text-sm font-bold leading-6 text-[#172033]">
                &quot;Can someone see me today? I need to change my appointment.&quot;
              </div>
              <div className="ml-auto rounded-lg bg-[#244f8f] p-3 text-sm font-bold leading-6 text-white">
                &quot;I can help. I found two openings and can move you without a callback.&quot;
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[#c8d7ef] bg-[#e8f0fc] p-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#244f8f]">
                Outcome
              </p>
              <p className="mt-1 text-sm font-black text-[#172033]">Rescheduled, confirmed, logged</p>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-[#172033] p-4 text-white shadow-lg shadow-stone-400/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                Call Path
              </p>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                live
              </span>
            </div>
            <div className="relative mt-5 space-y-3">
              <div className="absolute bottom-6 left-[15px] top-6 w-px bg-white/20" />
              {callSteps.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="relative flex items-center gap-3"
                >
                  <span className="z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-[#9cc5ff] text-xs font-black text-[#172033]">
                    {index + 1}
                  </span>
                  <span className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white/90">
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="ml-auto max-w-md rounded-lg border border-[#c8d7ef] bg-white p-4 shadow-2xl shadow-stone-400/25"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#0f766e]">
              <MessageSquareText size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black text-[#172033]">Team brief ready</p>
              <p className="text-xs leading-5 text-stone-500">
                Caller need, contact details, appointment time, and summary in one clean note.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FrontOfficeSignalMap() {
  const lanes = [
    {
      icon: Phone,
      label: "Call comes in",
      detail: "The number answers instantly, even after hours."
    },
    {
      icon: MessageSquareText,
      label: "Conversation becomes data",
      detail: "Name, need, urgency, and best contact are confirmed."
    },
    {
      icon: CalendarCheck,
      label: "Calendar opens",
      detail: "Only real available slots are offered."
    },
    {
      icon: Workflow,
      label: "Work moves forward",
      detail: "Customer gets a text. Team gets the summary."
    }
  ];

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-[#eef4ff] py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.78),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(191,215,255,0.6),transparent_32%)]" />
      <motion.div {...sectionMotion} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
              Not A Brochure
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
              Show the buyer the moment their phone stops being a bottleneck.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              Instead of asking visitors to imagine automation, this layout shows the
              work changing hands: call, context, booking, confirmation, and team action.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-6 right-6 top-1/2 hidden h-1 -translate-y-1/2 bg-white md:block" />
            <motion.div
              className="absolute left-6 top-1/2 hidden h-1 -translate-y-1/2 bg-[#244f8f] md:block"
              animate={{ width: ["0%", "88%", "0%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="grid gap-4 md:grid-cols-4">
              {lanes.map((lane, index) => (
                <motion.article
                  key={lane.label}
                  whileHover={{ y: -6 }}
                  className="relative rounded-lg border border-white/80 bg-white p-5 shadow-xl shadow-blue-900/10"
                >
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-[#172033] text-white">
                    <lane.icon size={22} aria-hidden="true" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#244f8f]">
                    0{index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-black leading-7 text-[#172033]">{lane.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{lane.detail}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

type OutboundStatus = "idle" | "calling" | "success" | "error";

function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function OutboundCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<OutboundStatus>("idle");
  const [error, setError] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setStatus("idle");
    setError("");
    const focusTimer = window.setTimeout(() => phoneInputRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && status !== "calling") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, status]);

  if (!open) return null;

  async function submitOutboundCall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("calling");

    try {
      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, user_timezone: getBrowserTimeZone() })
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error || "The call could not be started. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#172033]/55 px-4 py-6 backdrop-blur-sm" role="presentation">
      <div className="absolute inset-0" onClick={status === "calling" ? undefined : onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outbound-call-title"
        className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-[#f6f2ea] p-5 shadow-2xl shadow-slate-950/25 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f766e]">
              Live demo call
            </p>
            <h2 id="outbound-call-title" className="mt-2 text-3xl font-black text-[#172033]">
              Let Ms. Lisa ring your phone.
            </h2>
            <p className="mt-3 leading-7 text-stone-600">
              Enter your number and the AI receptionist will call you with the booking-flow demo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "calling"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 focus:outline-none focus:ring-4 focus:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close call demo modal"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xl font-black text-[#172033]">Calling now.</p>
            <p className="mt-2 leading-7 text-stone-700">
              Ms. Lisa is ringing your phone. Pick up and ask about booking, rescheduling, or missed calls.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-12 rounded-lg bg-[#244f8f] px-5 py-3 font-black text-white transition hover:bg-[#1c3f73] focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submitOutboundCall} className="mt-6 grid gap-4">
            <label className="text-sm font-black text-[#172033]">
              Phone number
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 min-h-14 w-full rounded-xl border border-stone-300 bg-white px-4 text-lg font-bold text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-black text-[#172033]">
              Name <span className="font-semibold text-stone-400">(optional)</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === "calling"}
              className="min-h-14 rounded-xl bg-[#244f8f] px-5 py-3 text-base font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-75"
            >
              {status === "calling" ? "Calling Now..." : "Call Me Now"}
            </button>
            <p className="text-xs font-bold leading-5 text-stone-500">
              By submitting, you are asking for an automated demo call. Standard carrier rates may apply.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function TrustSignalBar() {
  return (
    <section className="border-y border-stone-200 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-5 lg:px-8"
      >
        {trustSignals.map((signal) => (
          <div key={signal} className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 bg-[#f6f2ea] px-4 text-sm font-black text-[#172033]">
            <Check className="shrink-0 text-[#0f766e]" size={18} aria-hidden="true" />
            {signal}
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function UseCaseStrip() {
  const useCases = [
    "Customer Service",
    "Receptionist",
    "Answering Service",
    "Concierge",
    "Appointment Setter",
    "AI IVR",
    "WhatsApp + SMS"
  ];

  return (
    <section className="border-y border-stone-200 bg-white py-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8"
      >
        {useCases.map((item) => (
          <a
            key={item}
            href="#demos"
            className="shrink-0 rounded-full border border-stone-200 bg-[#f6f2ea] px-4 py-2 text-sm font-black text-[#172033] shadow-sm transition hover:border-[#244f8f] hover:bg-[#e8f0fc]"
          >
            {item}
          </a>
        ))}
      </motion.div>
    </section>
  );
}

function ProblemSnapshot() {
  const problems = [
    {
      icon: Phone,
      title: "Calls arrive when nobody can answer",
      copy: "A buyer wants help now. If they hit voicemail, they usually keep looking."
    },
    {
      icon: ClipboardList,
      title: "Intake creates extra work",
      copy: "Messages without name, need, urgency, and contact details still require a callback."
    },
    {
      icon: Workflow,
      title: "Systems do not talk",
      copy: "Phone notes, calendars, SMS, and CRMs need to move together or the team loses context."
    },
    {
      icon: Users,
      title: "Some calls need a person",
      copy: "The strongest setup uses AI for repeatable work and human fallback for judgment calls."
    }
  ];

  return (
    <section className="border-b border-stone-200 bg-[#fbfaf7] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
              The Problem
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black text-[#172033] sm:text-5xl">
              Your front office should not depend on one perfect moment.
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-stone-600">
            A clear buying path starts by naming what customers already feel:
            missed calls, incomplete messages, and follow-up work that slows the team down.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem) => (
            <motion.article
              key={problem.title}
              whileHover={{ y: -4 }}
              className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-stone-300/30"
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-[#e8f0fc] text-[#244f8f]">
                <problem.icon size={25} aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black leading-7 text-[#172033]">{problem.title}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">{problem.copy}</p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function VoiceAgentDemos() {
  const [selected, setSelected] = useState(0);
  const [activeLine, setActiveLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");
  const [generatedScenarioId, setGeneratedScenarioId] = useState<HuggingFaceScenarioId | "">("");
  const [ttsStatus, setTtsStatus] = useState("");
  const [ttsError, setTtsError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scenario = voiceDemos[selected];
  const voiceProfile = voiceProfiles[scenario.voiceProfile];
  const selectedBrowserVoice = selectHumanVoice(availableVoices, voiceProfile);
  const playbackAudioUrl = scenario.audioUrl || (generatedScenarioId === scenario.id ? generatedAudioUrl : "");

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    return () => {
      if (generatedAudioUrl) {
        URL.revokeObjectURL(generatedAudioUrl);
      }
    };
  }, [generatedAudioUrl]);

  useEffect(() => {
    setActiveLine(0);
    setIsPlaying(false);
    setTtsError("");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [selected]);

  useEffect(() => {
    if (!isPlaying) return;

    if (playbackAudioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }

    const timers: number[] = [];
    const activeAudio = audioRef.current;
    let delay = 0;

    scenario.lines.forEach((line, index) => {
      timers.push(
        window.setTimeout(() => {
          setActiveLine(index);
          if (line.speaker === "Receptionist" && !playbackAudioUrl && "speechSynthesis" in window) {
            const voice = new SpeechSynthesisUtterance(line.text);
            const bestVoice = selectHumanVoice(window.speechSynthesis.getVoices(), voiceProfile);

            if (bestVoice) {
              voice.voice = bestVoice;
            }

            voice.rate = voiceProfile.rate;
            voice.pitch = voiceProfile.pitch;
            voice.volume = 0.95;
            window.speechSynthesis.speak(voice);
          }
        }, delay)
      );
      delay += line.duration;
    });

    timers.push(window.setTimeout(() => setIsPlaying(false), delay + 350));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      if (activeAudio) {
        activeAudio.pause();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, scenario, voiceProfile, playbackAudioUrl]);

  async function buildHuggingFaceAudio(target: DemoScenario) {
    const response = await fetch("/api/tts/huggingface", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: target.id })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Hugging Face voice generation is not ready yet.");
    }

    return URL.createObjectURL(await response.blob());
  }

  async function playDemo(index = selected) {
    const target = voiceDemos[index];

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setSelected(index);
    setActiveLine(0);
    setIsPlaying(false);
    setTtsError("");

    if (!target.audioUrl && huggingFaceTtsEnabled && generatedScenarioId !== target.id) {
      setTtsStatus("Creating Hugging Face voice clip...");
      try {
        const nextAudioUrl = await buildHuggingFaceAudio(target);
        setGeneratedScenarioId(target.id);
        setGeneratedAudioUrl((currentAudioUrl) => {
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl);
          }
          return nextAudioUrl;
        });
        setTtsStatus("Hugging Face voice clip ready");
      } catch (error) {
        setTtsStatus("Using browser fallback voice");
        setTtsError(error instanceof Error ? error.message : "Hugging Face TTS failed.");
      }
    } else if (target.audioUrl) {
      setTtsStatus("Using uploaded studio clip");
    } else if (generatedScenarioId === target.id && generatedAudioUrl) {
      setTtsStatus("Using generated Hugging Face clip");
    } else {
      setTtsStatus("Using browser fallback voice");
    }

    window.setTimeout(() => setIsPlaying(true), 60);
  }

  const progress = ((activeLine + (isPlaying ? 1 : 0)) / scenario.lines.length) * 100;

  return (
    <section id="demos" className="border-b border-stone-200 bg-[#f6f2ea] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
              Hear It In Action
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
              Pick a scenario and hear how the receptionist handles it.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              These are original demo flows for common call types: scheduling, lead
              qualification, support, routing, and sensitive intake. Press play to animate
              the transcript and hear the AI lines through your browser.
            </p>
            <div className="mt-8 grid gap-3">
              {voiceDemos.map((demo, index) => (
                <div
                  key={demo.title}
                  className={`rounded-lg border p-4 text-left transition ${
                    selected === index
                      ? "border-[#244f8f] bg-white shadow-lg shadow-stone-300/30"
                      : "border-stone-200 bg-white/70 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setSelected(index)}
                      className="min-w-0 flex-1 text-left"
                      aria-pressed={selected === index}
                    >
                      <p className="text-sm font-black text-[#172033]">{demo.title}</p>
                      <p className="mt-1 text-xs font-bold text-stone-500">{demo.category}</p>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-[#e8f0fc] px-3 py-1 text-xs font-black text-[#244f8f]">
                        {demo.duration}
                      </span>
                      <button
                        type="button"
                        onClick={() => void playDemo(index)}
                        className="rounded-full bg-[#244f8f] px-3 py-1 text-xs font-black text-white"
                        aria-label={`Play ${demo.title} demo`}
                      >
                        Play
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-xl shadow-stone-300/30">
            <audio
              ref={audioRef}
              src={playbackAudioUrl || undefined}
              preload="auto"
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
                  {scenario.category}
                </p>
                <h3 className="mt-2 text-3xl font-black text-[#172033]">{scenario.title}</h3>
                <p className="mt-2 max-w-2xl text-stone-600">{scenario.summary}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#244f8f]">
                      Voice profile
                    </p>
                    <p className="mt-1 text-sm font-black text-[#172033]">{voiceProfile.label}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{voiceProfile.tone}</p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f766e]">
                      Playback
                    </p>
                    <p className="mt-1 text-sm font-black text-[#172033]">
                      {playbackAudioUrl ? "Premium AI voice audio" : selectedBrowserVoice?.name || "Best browser voice"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      {playbackAudioUrl
                        ? "Uses an uploaded or generated humanized voice clip."
                        : huggingFaceTtsEnabled
                          ? "Will try Hugging Face TTS, then falls back to browser speech."
                          : "Auto-selects the most natural installed voice."}
                    </p>
                  </div>
                </div>
                {ttsStatus ? (
                  <p className="mt-4 rounded-lg border border-[#c8d7ef] bg-[#eef4ff] px-3 py-2 text-xs font-bold text-[#244f8f]">
                    {ttsStatus}
                  </p>
                ) : null}
                {ttsError ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
                    {ttsError}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void playDemo(selected)}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#244f8f] px-5 py-3 font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73]"
              >
                <Phone size={18} aria-hidden="true" />
                {isPlaying ? "Playing..." : "Press Play"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {scenario.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#f6f2ea] px-3 py-1 text-xs font-black text-stone-600">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-[#172033] p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                    AI Incoming Call
                  </p>
                  <p className="mt-1 text-sm text-white/70">Caller ID verified - just now</p>
                </div>
                <p className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                  {scenario.result}
                </p>
              </div>
              <div className="mt-5 flex h-12 items-end gap-1">
                {Array.from({ length: 28 }).map((_, index) => (
                  <motion.span
                    key={index}
                    animate={{ height: isPlaying ? [12, 36 + ((index * 7) % 18), 14] : 14 + ((index * 9) % 22) }}
                    transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, delay: index * 0.025 }}
                    className="w-1 flex-1 rounded-full bg-[#9cc5ff]"
                  />
                ))}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[#9cc5ff]"
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {scenario.lines.map((line, index) => (
                <motion.div
                  key={`${scenario.title}-${line.text}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: index <= activeLine ? 1 : 0.28,
                    y: index <= activeLine ? 0 : 12
                  }}
                  className={`flex ${line.speaker === "Receptionist" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-lg px-4 py-3 ${
                      line.speaker === "Receptionist"
                        ? "bg-[#244f8f] text-white"
                        : "bg-[#f1ede5] text-[#172033]"
                    }`}
                  >
                    <p className="text-xs font-black uppercase opacity-70">{line.speaker}</p>
                    <p className="mt-1 text-sm font-semibold leading-6">{line.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function HuggingFaceVoiceLab() {
  return (
    <section className="border-b border-stone-200 bg-white py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
              Humanized Voice Lab
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
              Use model-generated voices that feel calm, local, and real.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              The demo layer supports browser speech, uploaded MP3 clips, and optional
              Hugging Face TTS through a server route. For launch, generate one polished
              clip per scenario and keep the live phone agent on the same voice style.
            </p>
            <div className="mt-6 rounded-lg border border-[#c8d7ef] bg-[#eef4ff] p-4">
              <p className="text-sm font-black text-[#172033]">Launch rule</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Never rely on laptop browser voices for paid traffic. Use them only as a
                fallback. Public demo audio should come from approved voice clips or your
                connected phone-agent provider.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {huggingFaceVoiceOptions.map((option, index) => (
              <motion.a
                key={option.model}
                href={option.url}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -5 }}
                className="group rounded-lg border border-stone-200 bg-[#f6f2ea] p-5 shadow-sm transition hover:border-[#244f8f] hover:bg-white hover:shadow-lg hover:shadow-stone-300/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#172033] text-white">
                    <Headphones size={23} aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#244f8f]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-black text-[#172033]">{option.name}</h3>
                <p className="mt-2 text-sm font-bold text-[#244f8f]">{option.bestFor}</p>
                <p className="mt-3 text-sm leading-6 text-stone-600">{option.note}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-stone-600">
                    {option.model}
                  </span>
                  <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-stone-600">
                    {option.license}
                  </span>
                </div>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#172033] group-hover:text-[#244f8f]">
                  View on Hugging Face
                  <ArrowRight size={16} aria-hidden="true" />
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function IntegrationDirectory() {
  return (
    <section id="integrations" className="border-b border-stone-200 bg-white py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
              Integrations
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
              Connect the phone call to the systems that run your business.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              Revenue Guard is designed around your existing stack: calendars, phone
              systems, CRMs, help desks, payment links, and workflow tools. Product
              names below are compatibility examples, not sponsorships.
            </p>
            <a
              href="#lead"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#244f8f] px-5 py-3 font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73]"
            >
              Map My Stack
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {integrationGroups.map((group) => (
              <div key={group.category} className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-4">
                <p className="flex items-center gap-2 text-sm font-black text-[#172033]">
                  <Workflow size={17} className="text-[#244f8f]" aria-hidden="true" />
                  {group.category}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-stone-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function IndustryMatrix() {
  const industriesServed = [
    {
      icon: HomeIcon,
      title: "Home Services",
      copy: "Book jobs, route urgent calls, confirm appointments, and keep crews focused in the field."
    },
    {
      icon: HeartPulse,
      title: "Healthcare & Dental",
      copy: "Schedule visits, manage reminders, capture intake details, and route sensitive calls to staff."
    },
    {
      icon: Landmark,
      title: "Professional Services",
      copy: "Qualify inquiries, screen consults, collect contact details, and book the next conversation."
    },
    {
      icon: Utensils,
      title: "Restaurants & Hospitality",
      copy: "Handle reservations, hours, menu questions, guest notes, and peak-time overflow."
    },
    {
      icon: Scissors,
      title: "Beauty & Wellness",
      copy: "Book sessions, manage reschedules, answer service questions, and reduce no-shows."
    },
    {
      icon: ShoppingBag,
      title: "Retail & E-commerce",
      copy: "Answer product questions, order updates, store hours, returns, and support handoffs."
    },
    {
      icon: Store,
      title: "Local Multi-Location",
      copy: "Route callers by location, team, service type, language preference, and urgency."
    },
    {
      icon: CreditCard,
      title: "Financial & Insurance",
      copy: "Verify basic details, route policy or billing questions, and escalate anything sensitive."
    }
  ];

  return (
    <section className="border-b border-stone-200 bg-[#f6f2ea] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
          Industry Playbooks
        </p>
        <h2 className="mt-3 max-w-4xl text-4xl font-black text-[#172033] sm:text-5xl">
          AI reception that understands your type of business.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {industriesServed.map((item) => (
            <motion.article
              key={item.title}
              whileHover={{ y: -4 }}
              className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-stone-300/30"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-[#172033] text-white">
                <item.icon size={22} aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black text-[#172033]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">{item.copy}</p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function HumanProof() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % reviews.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [paused]);

  function move(direction: number) {
    setActive((current) => (current + direction + reviews.length) % reviews.length);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x < -70) move(1);
    if (info.offset.x > 70) move(-1);
  }

  return (
    <section id="reviews" className="border-b border-stone-200 bg-[#f6f2ea] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
              Human Proof
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
              The best automation still feels like being taken care of.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              Different teams, different customers, different accents and expectations.
              The system should adapt to the business, not force everyone into one script.
            </p>
          </div>

          <div
            className="overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <motion.div
              className="flex cursor-grab active:cursor-grabbing"
              animate={{ x: `-${active * 100}%` }}
              transition={{ type: "spring", stiffness: 210, damping: 26 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
            >
              {reviews.map((item) => (
                <article key={item.name} className="min-w-full px-1">
                  <div className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-xl shadow-stone-300/25 md:grid-cols-[220px_1fr]">
                    <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-full md:min-h-64">
                      <Image
                        fill
                        sizes="(min-width: 768px) 220px, 100vw"
                        className="object-cover"
                        src={item.image}
                        alt={`${item.name}, ${item.role}`}
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="mb-4 flex gap-1 text-[#d97706]" aria-label="Five star review">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} size={17} fill="currentColor" aria-hidden="true" />
                          ))}
                        </div>
                        <p className="text-2xl font-black leading-8 text-[#172033]">
                          &quot;{item.quote}&quot;
                        </p>
                      </div>
                      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="font-black text-[#172033]">{item.name}</p>
                          <p className="text-sm text-stone-500">
                            {item.role} - {item.industry}
                          </p>
                        </div>
                        <p className="w-fit rounded-full bg-[#ecfdf5] px-4 py-2 text-sm font-black text-[#0f766e]">
                          {item.stat}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </motion.div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-2">
                {reviews.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`h-2.5 rounded-full transition-all ${active === index ? "w-8 bg-[#244f8f]" : "w-2.5 bg-stone-300"}`}
                    aria-label={`Show review from ${item.name}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 bg-white text-[#172033] shadow-sm transition hover:bg-stone-50"
                  aria-label="Previous review"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 bg-white text-[#172033] shadow-sm transition hover:bg-stone-50"
                  aria-label="Next review"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DemoSection() {
  const [activeLine, setActiveLine] = useState(0);

  function playDemo() {
    setActiveLine(0);
    demoLines.forEach((_, index) => {
      window.setTimeout(() => setActiveLine(index), index * 850);
    });
  }

  return (
    <motion.section {...sectionMotion} id="demo" className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
      <div className="flex flex-col justify-center">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
          Conversation Demo
        </p>
        <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
          It should sound useful before it sounds impressive.
        </h2>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          The first job is not to show off. It is to understand the caller, verify the
          details, book the right slot, and know when a person should step in.
        </p>
        <button
          type="button"
          onClick={playDemo}
          className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-lg bg-[#244f8f] px-6 py-3 text-base font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73] focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <Phone size={19} aria-hidden="true" />
          Play Conversation
        </button>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-xl shadow-stone-300/30">
        <div className="grid gap-4 md:grid-cols-[0.8fr_1fr]">
          <div className="relative h-72 w-full overflow-hidden rounded-lg md:h-full md:min-h-72">
            <Image
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
              src="https://images.unsplash.com/photo-1560264280-88b68371db39?auto=format&fit=crop&w=900&q=80"
              alt="Older customer speaking with a friendly receptionist"
            />
          </div>
          <div className="space-y-4">
            {demoLines.map((line, index) => (
              <motion.div
                key={line.text}
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: index <= activeLine ? 1 : 0.35,
                  y: index <= activeLine ? 0 : 12
                }}
                className={`flex ${line.side === "right" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[88%] rounded-lg px-4 py-3 ${line.side === "right" ? "bg-[#244f8f] text-white" : "bg-[#f1ede5] text-[#172033]"}`}>
                  <p className="text-xs font-black uppercase opacity-70">{line.speaker}</p>
                  <p className="mt-1 text-sm font-semibold leading-6">{line.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function MarketFit() {
  const points = [
    {
      icon: CalendarCheck,
      title: "Calendar-first setup",
      copy: "Appointment types, buffers, reschedules, cancellations, and real availability are configured before launch."
    },
    {
      icon: Headphones,
      title: "Human fallback",
      copy: "Complex, emotional, high-value, or unclear calls route to a person instead of forcing the AI to guess."
    },
    {
      icon: Users,
      title: "Accent-aware intake",
      copy: "Scripts are tested against names, dialects, noisy lines, and repeat-back confirmation for contact details."
    },
    {
      icon: Clock3,
      title: "Predictable pricing",
      copy: "Flat monthly plans with sensible call limits feel safer than surprise per-minute bills."
    }
  ];

  return (
    <section className="border-y border-stone-200 bg-white py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
          What Actually Works
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black text-[#172033] sm:text-5xl">
          Built around the parts that make AI reception succeed or fail.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {points.map((point) => (
            <FeatureCard key={point.title} icon={point.icon} title={point.title} copy={point.copy} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function JobsDone() {
  const cards = [
    {
      title: "Answers and qualifies",
      icon: ShieldCheck,
      copy: "Collects name, phone, need, urgency, and the best next step without making the caller repeat themselves."
    },
    {
      title: "Books the right slot",
      icon: CalendarCheck,
      copy: "Matches appointment type, location, duration, and team availability before confirming anything."
    },
    {
      title: "Follows up cleanly",
      icon: ClipboardList,
      copy: "Texts the customer, alerts your team, and stores a short summary in your sheet, CRM, or inbox."
    }
  ];

  return (
    <section className="bg-[#f6f2ea] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
          Jobs Done
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black text-[#172033] sm:text-5xl">
          The work of a strong front desk, available when your team is not.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <FeatureCard key={card.title} icon={card.icon} title={card.title} copy={card.copy} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      label: "Train",
      title: "Load the business basics",
      copy: "Website pages, FAQs, services, hours, locations, pricing rules, and approved answers become the receptionist's knowledge base."
    },
    {
      label: "Test",
      title: "Simulate real calls first",
      copy: "We test scheduling, caller corrections, noisy lines, accents, urgent requests, and questions the AI should hand off."
    },
    {
      label: "Connect",
      title: "Wire phone, calendar, SMS, and CRM",
      copy: "Twilio handles the number. Your calendar handles availability. Automations send confirmations and team summaries."
    },
    {
      label: "Improve",
      title: "Review what callers actually ask",
      copy: "Transcripts reveal missing FAQs, unclear routing rules, and opportunities to make the next call easier."
    }
  ];

  return (
    <section id="how-it-works" className="border-y border-stone-200 bg-white py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
              How It Works
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
              A simple launch path beats a maze of features.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              Buyers need to know the next step feels manageable. This rollout keeps
              the first version focused on the calls most likely to create appointments
              or save staff time.
            </p>
            <a
              href="#lead"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#244f8f] px-5 py-3 font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73]"
            >
              Map My First Flow
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <motion.article
                key={step.title}
                whileHover={{ y: -4 }}
                className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#244f8f]">
                    {step.label}
                  </span>
                  <span className="text-3xl font-black text-stone-300">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-2xl font-black text-[#172033]">{step.title}</h3>
                <p className="mt-3 leading-7 text-stone-600">{step.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-stone-300/30"
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f0fc] text-[#244f8f]">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-black text-[#172033]">{title}</h3>
      <p className="mt-3 leading-7 text-stone-600">{copy}</p>
    </motion.div>
  );
}

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const plans = [
    {
      id: "starter",
      name: "Starter",
      monthly: 149,
      limit: "Up to 120 calls/mo",
      features: ["24/7 answering", "Lead qualification", "SMS summaries", "Basic FAQs", "Simple call routing"]
    },
    {
      id: "appointment",
      name: "Appointment",
      monthly: 199,
      featured: true,
      limit: "Up to 250 calls/mo",
      features: ["Everything in Starter", "Calendar booking", "Reschedules and cancellations", "2-way text follow-up", "Human fallback rules"]
    },
    {
      id: "growth",
      name: "Growth",
      monthly: 349,
      plus: true,
      limit: "Higher call volume",
      features: ["Everything in Appointment", "CRM or sheet integration", "Multiple appointment types", "Custom voice scripting", "Monthly performance review"]
    }
  ];
  const pricingCues = [
    "Recommended starting point is Appointment",
    "Checkout opens in Stripe",
    "No account creation before payment"
  ];

  async function startCheckout(planId: string) {
    setCheckoutError("");
    setCheckoutLoading(planId);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing })
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout is not ready yet.");
      }

      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
      setCheckoutLoading(null);
    }
  }

  return (
    <motion.section {...sectionMotion} id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
            Predictable Pricing
          </p>
          <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
            Flat monthly plans, no surprise per-minute anxiety.
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
            Three choices keep the decision simple: start with answering, add live
            calendar booking, or connect deeper systems once the phone flow is proven.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {pricingCues.map((cue) => (
              <span key={cue} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-sm">
                {cue}
              </span>
            ))}
          </div>
        </div>
        <div className="flex w-full max-w-xs rounded-lg border border-stone-200 bg-white p-1 shadow-sm">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-black capitalize transition ${billing === option ? "bg-[#244f8f] text-white" : "text-stone-600 hover:text-[#172033]"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = billing === "monthly" ? plan.monthly : Math.round(plan.monthly * 0.85);
          return (
            <div key={plan.name} className={`relative rounded-lg border p-6 shadow-sm ${plan.featured ? "border-[#244f8f] bg-[#eef4ff]" : "border-stone-200 bg-white"}`}>
              {plan.featured ? (
                <p className="absolute right-5 top-5 rounded-full bg-[#244f8f] px-3 py-1 text-xs font-black uppercase text-white">
                  Best fit
                </p>
              ) : null}
              <h3 className="text-3xl font-black text-[#172033]">{plan.name}</h3>
              <p className="mt-2 text-sm font-bold text-stone-500">{plan.limit}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-5xl font-black text-[#172033]">${price.toLocaleString()}</span>
                <span className="pb-2 text-stone-500">/mo{plan.plus ? "+" : ""}</span>
              </div>
              <p className="mt-2 text-sm text-stone-500">
                {billing === "yearly" ? "Billed yearly. Save 15%." : "Month-to-month after launch."}
              </p>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-stone-700">
                    <Check className="mt-0.5 shrink-0 text-[#0f766e]" size={18} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => startCheckout(plan.id)}
                disabled={checkoutLoading !== null}
                className={`mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg px-5 py-3 text-base font-black transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${plan.featured ? "bg-[#244f8f] text-white hover:bg-[#1c3f73] focus:ring-blue-200" : "border border-stone-300 bg-white text-[#172033] hover:bg-stone-50 focus:ring-stone-200"}`}
              >
                {checkoutLoading === plan.id ? "Opening Checkout..." : `Start With ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {checkoutError ? (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          {checkoutError}
        </p>
      ) : null}
    </motion.section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "Do clients need to create their own Twilio account?",
      answer:
        "No. The done-for-you path is that Revenue Guard manages the Twilio number pool and assigns each client an AI receptionist number. If the client already has a business number, they can forward missed, overflow, after-hours, or all calls to the AI number. A client only needs their own Twilio account if they specifically want to own the carrier account directly."
    },
    {
      question: "Does the demo audio actually work?",
      answer:
        "The website demo uses your browser's built-in speech engine for the receptionist lines and animates the transcript, waveform, tags, and call outcome. Your real phone demo will come from Twilio plus your voice-agent provider."
    },
    {
      question: "What happens if the AI is unsure?",
      answer:
        "The safest setup is hybrid. The agent collects context, summarizes the call, and transfers complex, emotional, high-risk, or policy-sensitive situations to a person."
    },
    {
      question: "Can it book, reschedule, and cancel appointments?",
      answer:
        "Yes, when connected to a calendar workflow. The setup should include appointment types, durations, buffers, business hours, cancellation rules, and confirmation texts."
    },
    {
      question: "Will this work for businesses outside home services?",
      answer:
        "Yes. The strongest fit is any business with repeat call patterns: dental offices, salons, clinics, restaurants, auto repair, law firms, real estate, agencies, and support teams."
    },
    {
      question: "Can it connect with my CRM or help desk?",
      answer:
        "Usually. The fastest route is Zapier, Make, n8n, Airtable, or a direct API webhook. The app already includes /api/leads and /api/calendar-booking endpoints to receive and forward data."
    }
  ];

  return (
    <section id="faq" className="border-t border-stone-200 bg-[#f6f2ea] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
          FAQ
        </p>
        <h2 className="mt-3 text-center text-4xl font-black text-[#172033] sm:text-5xl">
          Everything a practical buyer asks before going live.
        </h2>
        <div className="mt-10 grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-[#172033]">
                <span className="flex items-center gap-3">
                  <HelpCircle className="shrink-0 text-[#244f8f]" size={21} aria-hidden="true" />
                  {faq.question}
                </span>
                <ChevronRight className="shrink-0 transition group-open:rotate-90" size={20} aria-hidden="true" />
              </summary>
              <p className="mt-4 leading-7 text-stone-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function ClosingLeadCapture() {
  const [step, setStep] = useState(0);
  const [leadError, setLeadError] = useState("");
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitSuccessful, isSubmitting }
  } = useForm<LeadForm>({
    mode: "onBlur",
    defaultValues: { name: "", trucks: "", service: "", email: "", phone: "" }
  });
  const [outboundState, setOutboundState] = useState<"idle" | "saving" | "calling" | "success" | "error">("idle");

  const steps = [
    {
      label: "How big is your team?",
      field: "trucks" as const,
      input: (
        <select className="mt-3 min-h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none focus:border-[#244f8f]" {...register("trucks", { required: "Tell us the size of your team." })}>
          <option value="">Select team size</option>
          <option value="Solo">Solo owner/operator</option>
          <option value="2-5">2-5 people</option>
          <option value="6-20">6-20 people</option>
          <option value="21+">21+ people</option>
        </select>
      )
    },
    {
      label: "What type of business do you run?",
      field: "service" as const,
      input: (
        <input type="text" placeholder="Example: dental office, salon, auto repair, law firm" className="mt-3 min-h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]" {...register("service", { required: "Tell us your business type." })} />
      )
    },
    {
      label: "Where should Ms. Lisa call you?",
      field: "email" as const,
      input: (
        <div className="mt-3 grid gap-3">
          <input type="text" placeholder="Name (optional)" className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]" {...register("name")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="email" placeholder="Work email" className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]" {...register("email", { required: "Enter your work email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
            <input type="tel" placeholder="+1 555 123 4567" className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]" {...register("phone", { required: "Enter the best phone number.", minLength: { value: 7, message: "Enter a real phone number." } })} />
          </div>
        </div>
      )
    }
  ];

  async function nextStep() {
    if (await trigger(steps[step].field)) {
      setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1));
    }
  }

  async function submitLead(data: LeadForm) {
    setLeadError("");
    setOutboundState("saving");

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).catch(() => null);

      setOutboundState("calling");
      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name || data.email.split("@")[0] || "Valued Lead",
          phone: data.phone,
          user_timezone: getBrowserTimeZone()
        })
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = result?.error || "The call could not be started. Please try again from the Call Demo button.";
        setLeadError(message);
        setOutboundState("error");
        throw new Error(message);
      }

      setOutboundState("success");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Network error. Please check your connection and try again.";
      setLeadError(message);
      setOutboundState("error");
      throw new Error(message);
    }
  }

  const currentError = errors[steps[step].field]?.message || (step === 2 ? errors.phone?.message : undefined);

  return (
    <section id="lead" className="border-t border-stone-200 bg-white py-16">
      <motion.div {...sectionMotion} className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
            Get Started
          </p>
          <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
            See how your phones could feel next week.
          </h2>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            We will map your current call flow, find where leads go quiet, and send
            a short demo tailored to your business type and appointment flow.
          </p>
          <p className="mt-4 rounded-lg border border-[#c8d7ef] bg-[#e8f0fc] p-4 text-sm font-bold leading-6 text-[#244f8f]">
            Takes about 60 seconds. No card required for the demo request.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Badge icon={Users} text="Built for many industries" />
            <Badge icon={MessageSquareText} text="Calls, booking, and SMS" />
          </div>
        </div>
        <form onSubmit={handleSubmit(submitLead)} className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-5 shadow-xl shadow-stone-300/30 sm:p-6">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[#244f8f]">
            Step {step + 1} of {steps.length}
          </p>
          <div className="mb-6 flex gap-2">
            {steps.map((item, index) => (
              <span key={item.label} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-[#244f8f]" : "bg-stone-200"}`} />
            ))}
          </div>
          {isSubmitSuccessful ? (
            <div className="rounded-lg bg-[#ecfdf5] p-5">
              <p className="text-2xl font-black text-[#172033]">Calling now.</p>
              <p className="mt-2 leading-7 text-stone-600">
                Ms. Lisa is ringing your phone with the live booking-flow demo.
              </p>
            </div>
          ) : (
            <>
              <label className="block text-2xl font-black text-[#172033]">
                {steps[step].label}
                {steps[step].input}
              </label>
              {currentError ? <p className="mt-3 text-sm font-bold text-red-600">{currentError}</p> : null}
              {leadError ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                  {leadError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))} className="min-h-12 rounded-lg border border-stone-300 bg-white px-5 py-3 font-black text-[#172033] transition hover:bg-stone-50">
                    Back
                  </button>
                ) : null}
                {step < steps.length - 1 ? (
                  <button type="button" onClick={nextStep} className="min-h-12 flex-1 rounded-lg bg-[#244f8f] px-5 py-3 font-black text-white transition hover:bg-[#1c3f73]">
                    Continue
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting} className="min-h-12 flex-1 rounded-lg bg-[#244f8f] px-5 py-3 font-black text-white transition hover:bg-[#1c3f73]">
                    {outboundState === "calling" || outboundState === "saving" ? "Calling Now..." : "Send My Demo Recording"}
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </motion.div>
    </section>
  );
}

function Badge({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 text-sm font-black text-[#172033] shadow-sm">
      <Icon className="text-[#244f8f]" size={20} aria-hidden="true" />
      {text}
    </div>
  );
}

function LiveChatDock() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("ai");
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatTerminated, setChatTerminated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi - I can help like a front desk coordinator. Ask about assigned AI numbers, pricing, calendars, setup, industries, cleaning companies, legal offices, clinics, or human handoff."
    }
  ]);
  const [humanForm, setHumanForm] = useState({
    name: "",
    email: "",
    phone: "",
    business: "",
    message: ""
  });
  const [humanStatus, setHumanStatus] = useState("");

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();

    if (!cleanQuestion || chatTerminated) return;

    setChatError("");
    setIsAsking(true);
    setQuestion("");
    setMessages((current) => [...current, { role: "visitor", text: cleanQuestion }]);

    try {
      const response = await fetch("/api/chat/huggingface", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion })
      });
      const result = (await response.json()) as {
        answer?: string;
        mode?: string;
        model?: string;
        needsHuman?: boolean;
        terminated?: boolean;
        error?: string;
      };

      if (!response.ok || !result.answer) {
        throw new Error(result.error || "Chat is not ready yet.");
      }

      const suffix =
        result.needsHuman
          ? " If your setup is unusual, send it through Human follow-up and a person can review it."
          : "";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `${result.answer}${suffix}`
        }
      ]);
      if (result.terminated) {
        setChatTerminated(true);
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Chat failed.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach the AI answer route. Use Human follow-up and the message will go to the team."
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  async function requestHuman(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHumanStatus("Sending...");

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trucks: humanForm.name || "Chat visitor",
        service: humanForm.business || "Live chat handoff",
        email: humanForm.email,
        phone: humanForm.phone,
        message: humanForm.message,
        source: "ai-receptionist-live-chat-human-handoff"
      })
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setHumanStatus(result?.error || "Could not send. Try the demo number instead.");
      return;
    }

    setHumanStatus("Human follow-up request sent.");
    setHumanForm({ name: "", email: "", phone: "", business: "", message: "" });
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[390px] sm:bottom-6 sm:right-6">
      {open ? (
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-2xl shadow-stone-500/25"
          aria-label="Revenue Guard live chat"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-[#f6f2ea] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#244f8f] text-white">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-[#172033]">Front desk assistant</p>
                <p className="text-xs font-bold text-stone-500">Warm answers or human follow-up</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-[#172033] transition hover:bg-stone-50"
              aria-label="Collapse live chat"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 border-b border-stone-200 bg-white p-2">
            {[
              { key: "ai" as const, label: "Quick answer", icon: Bot },
              { key: "human" as const, label: "Human follow-up", icon: UserRound }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${
                  mode === tab.key ? "bg-[#244f8f] text-white" : "text-stone-600 hover:bg-[#f6f2ea] hover:text-[#172033]"
                }`}
              >
                <tab.icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            <div className="bg-white">
              <div className="max-h-72 space-y-3 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 ${
                        message.role === "visitor" ? "bg-[#244f8f] text-white" : "bg-[#f6f2ea] text-[#172033]"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {chatError ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
                    {chatError}
                  </p>
                ) : null}
              </div>
              <form onSubmit={askQuestion} className="border-t border-stone-200 p-3">
                <label className="sr-only" htmlFor="live-chat-question">
                  Ask Revenue Guard a question
                </label>
                <div className="flex gap-2">
                  <input
                    id="live-chat-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={chatTerminated ? "Conversation ended" : "Ask about numbers, setup, booking..."}
                    disabled={chatTerminated}
                    className="min-h-11 flex-1 rounded-lg border border-stone-300 px-3 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || chatTerminated}
                    className="flex min-h-11 w-12 items-center justify-center rounded-lg bg-[#244f8f] text-white transition hover:bg-[#1c3f73] disabled:opacity-60"
                    aria-label="Send chat question"
                  >
                    <Send size={17} aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-bold leading-4 text-stone-500">
                  Uses a tenant-aware business knowledge layer, 1M+ approved reply combinations, and a professional safety shutoff.
                </p>
              </form>
            </div>
          ) : (
            <form onSubmit={requestHuman} className="space-y-3 bg-white p-4">
              <p className="text-sm leading-6 text-stone-600">
                Send a quiet handoff to a person. No floating sales spam, just enough context to reply well.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={humanForm.name}
                  onChange={(event) => setHumanForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Name"
                  className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-[#244f8f]"
                />
                <input
                  value={humanForm.business}
                  onChange={(event) => setHumanForm((current) => ({ ...current, business: event.target.value }))}
                  placeholder="Business type"
                  className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-[#244f8f]"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="email"
                  required
                  value={humanForm.email}
                  onChange={(event) => setHumanForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-[#244f8f]"
                />
                <input
                  type="tel"
                  required
                  value={humanForm.phone}
                  onChange={(event) => setHumanForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Phone"
                  className="min-h-11 rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-[#244f8f]"
                />
              </div>
              <textarea
                required
                value={humanForm.message}
                onChange={(event) => setHumanForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="What should the person know?"
                className="min-h-24 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-[#244f8f]"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#244f8f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1c3f73]"
              >
                <UserRound size={17} aria-hidden="true" />
                Send To A Person
              </button>
              {humanStatus ? (
                <p className="rounded-lg border border-[#c8d7ef] bg-[#eef4ff] p-3 text-xs font-bold text-[#244f8f]">
                  {humanStatus}
                </p>
              ) : null}
            </form>
          )}
        </motion.section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto flex min-h-12 items-center gap-3 rounded-lg border border-[#c8d7ef] bg-white px-4 py-3 text-left shadow-xl shadow-stone-500/20 transition hover:-translate-y-0.5 hover:bg-[#f6f2ea]"
          aria-label="Open Revenue Guard live chat"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#244f8f] text-white">
            <MessageSquareText size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-black text-[#172033]">Ask the front desk</span>
            <span className="block text-xs font-bold text-stone-500">AI or human follow-up</span>
          </span>
        </button>
      )}
    </div>
  );
}

function Footer() {
  const legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/refund-policy", label: "Refunds" },
    { href: "/ai-disclosure", label: "AI Disclosure" },
    { href: "/compliance", label: "Compliance" },
    { href: "/cookie-notice", label: "Cookies" },
    { href: "/accessibility", label: "Accessibility" }
  ];

  return (
    <footer className="border-t border-stone-200 bg-[#f6f2ea] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-stone-500 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-black text-[#172033]">Revenue Guard AI</p>
          <p className="mt-1">Helpful phone automation with clear handoffs to real people.</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal links">
          {legalLinks.map((item) => (
            <a key={item.href} href={item.href} className="font-bold transition hover:text-[#172033]">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
