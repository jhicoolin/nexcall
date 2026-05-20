"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  HelpCircle,
  Menu,
  MessageSquareText,
  Minus,
  Phone,
  Send,
  Sparkles,
  UserRound,
  Users,
  Workflow,
  X,
  type LucideIcon
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { type NexCallScenarioId } from "@/lib/nexcall-voice-demos";

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

type VoiceProfileKey = "warmFemale" | "confidentMale" | "brightFemale" | "calmMale" | "steadyMale" | "empatheticFemale";

type VoiceProfile = {
  label: string;
  tone: string;
  rate: number;
  pitch: number;
  preferredNames: string[];
};

type DemoScenario = {
  id: NexCallScenarioId;
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

const voiceProfiles: Record<VoiceProfileKey, VoiceProfile> = {
  warmFemale: {
    label: "Warm female",
    tone: "calm, helpful, front-desk friendly",
    rate: 0.92,
    pitch: 1.04,
    preferredNames: ["Samantha", "Ava", "Victoria", "Tessa", "Karen", "Moira"]
  },
  confidentMale: {
    label: "Confident male",
    tone: "clear, consultative, never salesy",
    rate: 0.91,
    pitch: 0.96,
    preferredNames: ["Alex", "Daniel", "Mark", "David"]
  },
  brightFemale: {
    label: "Bright female",
    tone: "welcoming, polished, concierge-style",
    rate: 0.96,
    pitch: 1.08,
    preferredNames: ["Samantha", "Serena", "Ava", "Victoria", "Moira"]
  },
  calmMale: {
    label: "Calm male",
    tone: "patient, steady, support-focused",
    rate: 0.9,
    pitch: 0.94,
    preferredNames: ["Alex", "Daniel", "Mark", "David"]
  },
  steadyMale: {
    label: "Steady male",
    tone: "precise, trustworthy, routing-oriented",
    rate: 0.88,
    pitch: 0.92,
    preferredNames: ["Daniel", "Alex", "Mark", "David"]
  },
  empatheticFemale: {
    label: "Empathetic female",
    tone: "gentle, reassuring, sensitive-intake ready",
    rate: 0.88,
    pitch: 1.02,
    preferredNames: ["Samantha", "Serena", "Ava", "Victoria"]
  }
};

const voiceDemos: DemoScenario[] = [
  {
    id: "appointment",
    title: "Appointment Request",
    category: "Healthcare Receptionist",
    tags: ["Appointment request", "Reschedule", "Follow-up"],
    summary:
      "A patient needs to move an appointment and get confirmation without waiting on hold.",
    result: "Appointment request captured",
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
        text: "I captured that request and made sure your team has the details.",
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
    result: "Reservation request captured",
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
        text: "I captured the patio request for four at 8 PM and made sure the team has the details.",
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

const elevenLabsTtsEnabled = process.env.NEXT_PUBLIC_ENABLE_ELEVENLABS_TTS_DEMOS === "true";

const brandAssets = {
  mark: "/brand/nexcall-mark-transparent.png"
} as const;

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  durationMs?: number;
};

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  durationMs = 1400
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || started.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      started.current = true;
      setCurrent(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();

        const tick = (time: number) => {
          const progress = Math.min((time - start) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCurrent(value * eased);

          if (progress < 1) {
            rafRef.current = window.requestAnimationFrame(tick);
          }
        };

        rafRef.current = window.requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs, value]);

  const formatted = current.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

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
    <main className="min-h-screen w-full overflow-hidden bg-[#05070d] text-slate-50">
      <Header onCallDemo={() => setIsOutboundModalOpen(true)} />
      <Hero onCallDemo={() => setIsOutboundModalOpen(true)} />
      <TrustSignalBar />
      <HowItWorks />
      <JobsDone />
      <VoiceAgentDemos onCallDemo={() => setIsOutboundModalOpen(true)} />
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { href: "#demos", label: "Demos" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#services", label: "Services" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
    { href: "/about", label: "About" }
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#05070d]/82 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="NexCall home">
          <span className="brand-mark-shell relative h-12 w-12">
            <Image
              src={brandAssets.mark}
              alt=""
              fill
              sizes="48px"
              className="brand-mark-img object-contain"
              priority
            />
          </span>
          <span className="text-lg font-black tracking-wide text-white sm:text-xl">
            NEXCALL
          </span>
        </a>
        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
          {navItems.map((item) => (
            <a key={item.href} className="transition hover:text-white" href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCallDemo}
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30 sm:inline-flex"
          >
            <Phone size={17} aria-hidden="true" />
            Call Demo
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/20 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 md:hidden">
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 shadow-2xl shadow-black/40">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onCallDemo();
              }}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#05070d]"
            >
              <Phone size={17} aria-hidden="true" />
              Call Demo
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Hero({ onCallDemo }: { onCallDemo: () => void }) {
  return (
    <section id="top" className="relative overflow-hidden pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(141,189,255,0.2),transparent_34rem),radial-gradient(circle_at_86%_20%,rgba(217,164,47,0.12),transparent_26rem)]" />
      <div className="metal-grid absolute inset-0 opacity-45" />
      <div className="absolute inset-x-0 bottom-0 h-px glass-line" />
      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-10 overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:items-center lg:px-8 lg:pb-24 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.9fr)]">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex w-full min-w-0 max-w-[34rem] flex-col justify-center overflow-hidden sm:max-w-[42rem] lg:max-w-[40rem]"
        >
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold text-slate-200 shadow-2xl shadow-black/20 backdrop-blur">
            <Sparkles size={16} aria-hidden="true" />
            Make your next call a NexCall
          </div>
          <h1 className="max-w-full break-words text-5xl font-black leading-[0.98] text-white sm:max-w-4xl sm:text-6xl lg:text-6xl xl:text-7xl">
            Never miss your next call.
          </h1>
          <p className="mt-6 max-w-full text-lg leading-8 text-slate-300 sm:max-w-xl sm:text-xl">
            NexCall answers when your team cannot, captures the details, helps
            with appointment requests, and sends your team a clean next step.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCallDemo}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-black text-[#05070d] shadow-xl shadow-blue-500/10 transition hover:-translate-y-0.5 hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
            >
              <Phone size={19} aria-hidden="true" />
              Try a Demo Call
            </button>
            <a
              href="#pricing"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/6 px-6 py-3 text-base font-bold text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
            >
              View Plans
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 text-sm font-bold text-slate-400">
            No card required. Try the receptionist on your own phone.
          </p>
        </motion.div>
        <HeroCallJourney />
      </div>
    </section>
  );
}

function HeroCallJourney() {
  const callSteps = [
    {
      icon: Phone,
      label: "Incoming call",
      detail: "NexCall answers before voicemail."
    },
    {
      icon: MessageSquareText,
      label: "Intent detected",
      detail: "Caller need, urgency, and contact details are captured."
    },
    {
      icon: CalendarCheck,
      label: "Next step found",
      detail: "Appointment request or routing path is selected."
    },
    {
      icon: ClipboardList,
      label: "Summary sent",
      detail: "Your team receives a clean note with context."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative mx-auto w-full min-w-0 max-w-[23rem] overflow-hidden rounded-[1.75rem] sm:max-w-[36rem] lg:max-w-[34rem] xl:max-w-[36rem]"
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_10%,rgba(141,189,255,0.22),transparent_34rem)] blur-2xl" />
      <div className="absolute inset-0 rotate-[-1.2deg] rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/40" />
      <div className="absolute inset-4 rotate-[1deg] rounded-[1.5rem] border border-blue-200/15 bg-[#0b1220]/80 backdrop-blur" />

      <div className="relative grid gap-3 p-3 sm:p-4">
        <div className="metal-panel overflow-hidden rounded-[1.25rem] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="brand-mark-shell relative h-10 w-10 shrink-0 sm:h-11 sm:w-11">
                <Image src={brandAssets.mark} alt="" fill sizes="44px" className="brand-mark-img object-contain" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#8dbdff]">
                  Live call journey
                </p>
                <p className="mt-1 text-lg font-black leading-tight text-white sm:text-xl">Next call, handled by NexCall.</p>
              </div>
            </div>
            <div className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 live-pulse" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d9a42f]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#8dbdff]" />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="flex min-w-0 flex-col rounded-[1.25rem] border border-white/10 bg-white/7 p-3 shadow-2xl shadow-black/25 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-300">
                Active call
              </p>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-200">
                live
              </span>
            </div>
            <div className="mt-4 rounded-2xl bg-white/10 p-3 text-sm font-bold leading-6 text-slate-100">
              &quot;Can someone see me today? I need to change my appointment.&quot;
            </div>
            <div className="mt-3 rounded-2xl border border-blue-200/15 bg-blue-300/10 p-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#8dbdff]">
                Outcome
              </p>
              <p className="mt-1 text-sm font-black text-white">Next step captured. Team brief ready.</p>
            </div>
          </div>

          <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-[#05070d] p-3 text-white shadow-2xl shadow-black/35 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-blue-200">
                Call Path
              </p>
            </div>
            <div className="relative mt-4 space-y-2.5">
              <div className="absolute bottom-5 left-[13px] top-5 w-px bg-white/20" />
              {callSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="relative flex items-center gap-2.5"
                >
                  <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9cc5ff] text-xs font-black text-[#172033]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2.5">
                    <p className="text-sm font-black text-white">{step.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-3 text-white shadow-2xl shadow-black/35 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <MessageSquareText size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black">Team summary sent</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Caller need, phone, preferred time, urgency, and handoff note in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type OutboundStatus = "idle" | "calling" | "success" | "error";

const NEXCALL_PUBLIC_EMAIL = "nexcall@proton.me";
const NEXCALL_PUBLIC_PHONE_DISPLAY = "(202) 200-6578";
const NEXCALL_PUBLIC_PHONE_TEL = "+12022006578";
const CALL_DEMO_FAILURE_MESSAGE = "We could not start the demo call right now. Please try again or contact NexCall.";

type OutboundCallResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function normalizeOutboundPhoneInput(value: string) {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`;

  return raw;
}

function isValidOutboundPhoneInput(value: string) {
  return /^\+[1-9]\d{1,14}$/.test(normalizeOutboundPhoneInput(value));
}

function formatPhoneDisplay(value: string) {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  const nationalDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (raw.startsWith("+") && !(digits.length === 11 && digits.startsWith("1"))) {
    return raw.slice(0, 18);
  }

  const limited = nationalDigits.slice(0, 10);

  if (limited.length === 0) return "";
  if (limited.length < 4) return limited;
  if (limited.length < 7) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;

  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

function formatPhoneForBlur(value: string) {
  const normalized = normalizeOutboundPhoneInput(value);
  const digits = normalized.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${formatPhoneDisplay(digits.slice(1))}`;
  }

  return formatPhoneDisplay(value) || value.trim();
}

function cursorPositionForDigits(formattedValue: string, digitCount: number) {
  if (digitCount <= 0) return 0;

  let seenDigits = 0;

  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      seenDigits += 1;
    }

    if (seenDigits >= digitCount) {
      return index + 1;
    }
  }

  return formattedValue.length;
}

function handlePhoneInputFormatting(
  event: ChangeEvent<HTMLInputElement>,
  setFormattedValue: (value: string) => void
) {
  const input = event.currentTarget;
  const cursor = input.selectionStart || input.value.length;
  const digitsBeforeCursor = input.value.slice(0, cursor).replace(/\D/g, "").length;
  const formatted = formatPhoneDisplay(input.value);

  setFormattedValue(formatted);

  window.requestAnimationFrame(() => {
    const nextPosition = cursorPositionForDigits(formatted, digitsBeforeCursor);
    input.setSelectionRange(nextPosition, nextPosition);
  });
}

function CallDemoFallbackNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
      <p>{message}</p>
      <p className="mt-2 text-red-800">
        You can also reach NexCall at{" "}
        <a className="underline underline-offset-2" href={`mailto:${NEXCALL_PUBLIC_EMAIL}`}>
          {NEXCALL_PUBLIC_EMAIL}
        </a>{" "}
        or{" "}
        <a className="underline underline-offset-2" href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`}>
          {NEXCALL_PUBLIC_PHONE_DISPLAY}
        </a>
        .
      </p>
    </div>
  );
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
    const normalizedPhone = normalizeOutboundPhoneInput(phone);

    if (!isValidOutboundPhoneInput(phone)) {
      setPhone(formatPhoneDisplay(phone));
      setError("Enter a valid phone number with country code. US numbers can be typed as 10 digits.");
      setStatus("error");
      return;
    }

    setPhone(formatPhoneForBlur(phone));

    try {
      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: normalizedPhone, user_timezone: getBrowserTimeZone() })
      });
      const result = (await response.json().catch(() => null)) as OutboundCallResponse | null;

      if (!response.ok || result?.success !== true) {
        setError(result?.message || result?.error || CALL_DEMO_FAILURE_MESSAGE);
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="presentation">
      <div className="absolute inset-0" onClick={status === "calling" ? undefined : onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outbound-call-title"
        className="relative w-full max-w-lg rounded-[1.35rem] border border-white/10 bg-[#0b1220] p-5 text-white shadow-2xl shadow-black/55 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Live demo call
            </p>
            <h2 id="outbound-call-title" className="mt-2 text-3xl font-black text-white">
              Let Nexa ring your phone.
            </h2>
            <p className="mt-3 leading-7 text-slate-300">
              Enter your number and the NexCall Receptionist will call you with the front-desk demo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "calling"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close call demo modal"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-xl border border-emerald-300/40 bg-emerald-300/10 p-5">
            <p className="text-xl font-black text-white">Your demo call is starting now.</p>
            <p className="mt-2 leading-7 text-slate-200">
              Nexa is ringing your phone. Pick up and ask about appointment requests, rescheduling, or missed calls.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-12 rounded-xl bg-white px-5 py-3 font-black text-[#05070d] transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submitOutboundCall} className="mt-6 grid gap-4">
            <label className="text-sm font-black text-slate-100">
              Phone number
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="(###) ###-####"
                value={phone}
                onChange={(event) => handlePhoneInputFormatting(event, setPhone)}
                onBlur={(event) => setPhone(formatPhoneForBlur(event.target.value))}
                className="mt-2 min-h-14 w-full rounded-xl border border-white/10 bg-white px-4 text-lg font-bold text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#8dbdff] focus:ring-4 focus:ring-blue-300/20"
              />
            </label>
            <p className="-mt-2 text-xs font-bold leading-5 text-slate-400">
              US numbers can be entered as 10 digits; we format them automatically before calling.
            </p>
            <label className="text-sm font-black text-slate-100">
              Name <span className="font-semibold text-slate-400">(optional)</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#8dbdff] focus:ring-4 focus:ring-blue-300/20"
              />
            </label>
            {error ? (
              <CallDemoFallbackNotice message={error} />
            ) : null}
            <button
              type="submit"
              disabled={status === "calling"}
              className="min-h-14 rounded-xl bg-white px-5 py-3 text-base font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/20 disabled:cursor-wait disabled:opacity-75"
            >
              {status === "calling" ? "Calling Now..." : "Call Me Now"}
            </button>
            <p className="text-xs font-bold leading-5 text-slate-400">
              By submitting, you are asking for an automated demo call. Standard carrier rates may apply.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function TrustSignalBar() {
  const stats = [
    { value: 500, suffix: "+", label: "Receptionist workflows" },
    { value: 10, suffix: "+", label: "Years of ops thinking" },
    { value: 50, suffix: "M+", label: "Calls represented" },
    { value: 99.9, suffix: "%", decimals: 1, label: "Uptime target" }
  ];

  return (
    <section className="border-y border-white/10 bg-[#05070d]">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8dbdff]">
            Proof, not noise
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Built for businesses that cannot afford missed calls.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            A tight operating layer for answered calls, captured details, appointment
            requests, urgent routing, and clean team notes.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:content-center">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/7 p-4 text-center shadow-xl shadow-black/15">
              <p className="text-3xl font-black tracking-tight text-white">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  durationMs={1200}
                />
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VoiceAgentDemos({ onCallDemo }: { onCallDemo: () => void }) {
  const [selected, setSelected] = useState(0);
  const [activeLine, setActiveLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");
  const [generatedScenarioId, setGeneratedScenarioId] = useState<NexCallScenarioId | "">("");
  const [ttsStatus, setTtsStatus] = useState("");
  const [ttsError, setTtsError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const featuredVoiceDemos = voiceDemos.slice(0, 3);
  const scenario = featuredVoiceDemos[selected] || featuredVoiceDemos[0];
  const voiceProfile = voiceProfiles[scenario.voiceProfile];
  const playbackAudioUrl = scenario.audioUrl || (generatedScenarioId === scenario.id ? generatedAudioUrl : "");
  const callerPreview = scenario.lines.find((line) => line.speaker === "Caller") || scenario.lines[0];
  const receptionistPreview =
    scenario.lines.find((line) => line.speaker === "Receptionist") || scenario.lines[1] || scenario.lines[0];

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

  async function buildNexCallAudio(target: DemoScenario) {
    const response = await fetch("/api/tts/elevenlabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: target.id })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Audio preview is not available yet.");
    }

    return URL.createObjectURL(await response.blob());
  }

  async function playDemo(index = selected) {
    const target = featuredVoiceDemos[index] || featuredVoiceDemos[0];

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

    if (!target.audioUrl && elevenLabsTtsEnabled && generatedScenarioId !== target.id) {
      setTtsStatus("Preparing demo preview...");
      try {
        const nextAudioUrl = await buildNexCallAudio(target);
        setGeneratedScenarioId(target.id);
        setGeneratedAudioUrl((currentAudioUrl) => {
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl);
          }
          return nextAudioUrl;
        });
        setTtsStatus("Demo preview ready");
      } catch (error) {
        setTtsStatus("Preview ready");
        setTtsError(error instanceof Error ? error.message : "Audio preview is not available right now.");
      }
    } else if (target.audioUrl) {
      setTtsStatus("Demo preview ready");
    } else if (generatedScenarioId === target.id && generatedAudioUrl) {
      setTtsStatus("Demo preview ready");
    } else {
      setTtsStatus("Preview ready");
    }

    window.setTimeout(() => setIsPlaying(true), 60);
  }

  const progress = ((activeLine + (isPlaying ? 1 : 0)) / scenario.lines.length) * 100;

  return (
    <section id="demos" className="border-b border-white/10 bg-[#05070d] py-14">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8dbdff]">
              Experience NexCall
            </p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Hear how NexCall handles real call scenarios.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Choose a scenario and watch how NexCall captures the details, moves the
              next step forward, and keeps the handoff clear. For the strongest test,
              use the real phone-call demo.
            </p>
            <button
              type="button"
              onClick={onCallDemo}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
            >
              <Phone size={18} aria-hidden="true" />
              Try a Real Demo Call
            </button>
            <div className="mt-7 grid gap-2">
              {featuredVoiceDemos.map((demo, index) => (
                <button
                  key={demo.title}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-pressed={selected === index}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected === index
                      ? "border-[#8dbdff]/60 bg-white/10 shadow-lg shadow-black/25"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <p className="text-sm font-black text-white">{demo.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{demo.category}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white/10 bg-white p-5 text-[#172033] shadow-2xl shadow-black/30">
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
                <p className="mt-4 text-sm font-bold text-[#244f8f]">
                  Tone: natural, calm, front-desk friendly.
                </p>
                {ttsStatus ? <p className="mt-2 text-xs font-bold text-stone-500">{ttsStatus}</p> : null}
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
                {isPlaying ? "Playing..." : "Play Scenario"}
              </button>
            </div>

            <div className="mt-6 rounded-lg bg-[#172033] p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                    Incoming call preview
                  </p>
                  <p className="mt-1 text-sm text-white/70">Caller ID verified - just now</p>
                </div>
                <p className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
                  {scenario.result}
                </p>
              </div>
              <div className="mt-5 flex h-12 items-end gap-1">
                {Array.from({ length: 18 }).map((_, index) => (
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
              <div className="mt-5 grid gap-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-black uppercase text-white/60">Caller</p>
                  <p className="mt-1 text-sm font-semibold leading-6">{callerPreview.text}</p>
                </div>
                <div className="rounded-xl bg-[#9cc5ff] p-4 text-[#05070d]">
                  <p className="text-xs font-black uppercase opacity-70">NexCall</p>
                  <p className="mt-1 text-sm font-black leading-6">{receptionistPreview.text}</p>
                </div>
              </div>
              <p className="mt-4 rounded-xl border border-white/10 bg-white/8 p-4 text-sm font-black text-blue-100">
                Outcome: {scenario.result}
              </p>
            </div>
            <p className="mt-5 rounded-xl border border-stone-200 bg-[#f6f2ea] p-3 text-xs font-bold leading-5 text-stone-600">
              This preview is illustrative. For the clearest test, place a real demo
              call and hear the receptionist handle the flow live.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function JobsDone() {
  const cards = [
    {
      title: "AI Call Answering",
      icon: Phone,
      copy: "NexCall answers missed and overflow calls with a polished first response."
    },
    {
      title: "Appointment Requests",
      icon: CalendarCheck,
      copy: "Captures timing, caller details, and intent so scheduling can move forward."
    },
    {
      title: "Lead Capture",
      icon: ClipboardList,
      copy: "Collects names, numbers, urgency, and needs so your team can follow up cleanly."
    },
    {
      title: "After-Hours Coverage",
      icon: Clock3,
      copy: "Nights, weekends, and busy hours still get a professional answer."
    },
    {
      title: "Call Routing",
      icon: Workflow,
      copy: "Urgent or high-value calls can be directed to the right person with context."
    },
    {
      title: "Human Backup Handoff",
      icon: Users,
      copy: "When judgment is needed, NexCall helps move the call to a real person."
    }
  ];

  return (
    <section id="services" className="bg-[#08111f] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8dbdff]">
          Services
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">
          The work of a strong front desk, available when your team is busy.
        </h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          NexCall is not legacy phone support outsourcing. It is the first response layer
          for calls, appointment requests, intake, routing, and clean handoffs.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {industries.map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-black text-slate-300">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      label: "Answer",
      title: "NexCall picks up",
      copy: "NexCall picks up before callers hit voicemail."
    },
    {
      label: "Understand",
      title: "The need is identified",
      copy: "It captures the caller's need, contact details, and urgency."
    },
    {
      label: "Act",
      title: "The workflow moves",
      copy: "It supports appointment requests, routes callers, answers approved FAQs, or captures the lead."
    },
    {
      label: "Report",
      title: "Your team gets context",
      copy: "Your team gets a clean note with the next step."
    }
  ];

  return (
    <section id="how-it-works" className="border-y border-white/10 bg-[#05070d] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">
              How It Works
            </p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              How NexCall handles a call.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              The workflow mirrors what a strong receptionist already does: answer,
              listen, act, and brief the team.
            </p>
            <a
              href="#lead"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200"
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
                className="rounded-[1.25rem] border border-white/10 bg-white/7 p-6 shadow-2xl shadow-black/20 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#05070d]">
                    {step.label}
                  </span>
                  <span className="text-3xl font-black text-white/20">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-2xl font-black text-white">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{step.copy}</p>
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
      className="rounded-[1.25rem] border border-white/10 bg-white/7 p-6 shadow-2xl shadow-black/20 backdrop-blur transition-shadow hover:border-[#8dbdff]/40"
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#05070d]">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mt-3 leading-7 text-slate-300">{copy}</p>
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
      features: ["24/7 answering", "Lead qualification", "Clean call summaries", "Basic FAQs", "Simple call routing"]
    },
    {
      id: "appointment",
      name: "Appointment",
      monthly: 199,
      featured: true,
      limit: "Up to 250 calls/mo",
      features: ["Everything in Starter", "Appointment request support", "Reschedule and cancellation intake", "Follow-up messaging", "Human fallback rules"]
    },
    {
      id: "growth",
      name: "Growth",
      monthly: 349,
      plus: true,
      limit: "Higher call volume",
      features: ["Everything in Appointment", "Business system handoff", "Multiple appointment types", "Custom call scripts", "Monthly performance review"]
    }
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
    <motion.section {...sectionMotion} id="pricing" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8dbdff]">
            Predictable Pricing
          </p>
          <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            Clear plans for teams ready to stop missing calls.
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Three choices keep the decision simple: start with answering, add
            appointment request support, or connect deeper handoffs once the phone
            flow is proven.
          </p>
          <p className="mt-4 text-sm font-bold text-slate-400">
            No card required for demo requests. Secure checkout opens when you choose a plan.
          </p>
        </div>
        <div className="flex w-full max-w-xs rounded-xl border border-white/10 bg-white/6 p-1 shadow-sm">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-black capitalize transition ${billing === option ? "bg-white text-[#05070d]" : "text-slate-300 hover:text-white"}`}
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
            <div key={plan.name} className={`relative rounded-[1.35rem] border p-6 shadow-2xl shadow-black/20 ${plan.featured ? "border-[#8dbdff]/60 bg-[#111c2f]" : "border-white/10 bg-white/7"}`}>
              {plan.featured ? (
                <p className="absolute right-5 top-5 rounded-full bg-[#8dbdff] px-3 py-1 text-xs font-black uppercase text-[#05070d]">
                  Best fit
                </p>
              ) : null}
              <h3 className="text-3xl font-black text-white">{plan.name}</h3>
              <p className="mt-2 text-sm font-bold text-slate-400">{plan.limit}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-5xl font-black text-white">${price.toLocaleString()}</span>
                <span className="pb-2 text-slate-400">/mo{plan.plus ? "+" : ""}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {billing === "yearly" ? "Billed yearly. Save 15%." : "Month-to-month after launch."}
              </p>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <Check className="mt-0.5 shrink-0 text-emerald-300" size={18} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => startCheckout(plan.id)}
                disabled={checkoutLoading !== null}
                className={`mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-base font-black transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${plan.featured ? "bg-white text-[#05070d] hover:bg-slate-200 focus:ring-blue-300/30" : "border border-white/15 bg-white/6 text-white hover:bg-white/10 focus:ring-blue-300/20"}`}
              >
                {checkoutLoading === plan.id ? "Opening Checkout..." : `Start With ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {checkoutError ? (
        <p className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
          {checkoutError}
        </p>
      ) : null}
    </motion.section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "What does NexCall do?",
      answer:
        "NexCall answers calls, captures lead details, helps with appointment requests, routes urgent callers, and sends your team clean notes."
    },
    {
      question: "Does NexCall answer real phone calls?",
      answer:
        "Yes. NexCall is designed for real business call handling, not just website chat. It gives callers a professional first response when your team is busy or offline."
    },
    {
      question: "Can I try a demo call?",
      answer:
        "Yes. Use the Call Demo button, enter your phone number, and NexCall can show you the receptionist experience from the caller side."
    },
    {
      question: "Can NexCall help with appointment requests?",
      answer:
        "Yes. NexCall can collect appointment details, preferred times, and caller context so your team can confirm the next step."
    },
    {
      question: "What happens if the AI is unsure?",
      answer:
        "It should stay helpful without guessing. NexCall can capture the context and route the situation to a person when judgment is needed."
    },
    {
      question: "Does NexCall work after hours?",
      answer:
        "Yes. NexCall is built to cover nights, weekends, lunch rushes, and busy moments so callers do not hit a dead end."
    },
    {
      question: "What types of businesses is NexCall for?",
      answer:
        "The strongest fit is any business with repeat call patterns: dental offices, salons, clinics, restaurants, auto repair, legal offices, agencies, contractors, and local shops."
    },
    {
      question: "What happens if a caller needs a human?",
      answer:
        "NexCall can collect the important details and pass the conversation to your team with the context needed for follow-up."
    },
    {
      question: "How do I get started?",
      answer:
        "Start with a demo call or choose a plan. From there, the first setup focuses on your highest-value call types and the information your team needs."
    }
  ];

  return (
    <section id="faq" className="border-t border-white/10 bg-[#08111f] py-16">
      <motion.div {...sectionMotion} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-black uppercase tracking-[0.16em] text-emerald-300">
          FAQ
        </p>
        <h2 className="mt-3 text-center text-4xl font-black text-white sm:text-5xl">
          Everything a practical buyer asks before going live.
        </h2>
        <div className="mt-10 grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/7 p-5 shadow-xl shadow-black/15">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-white">
                <span className="flex items-center gap-3">
                  <HelpCircle className="shrink-0 text-[#8dbdff]" size={21} aria-hidden="true" />
                  {faq.question}
                </span>
                <ChevronRight className="shrink-0 transition group-open:rotate-90" size={20} aria-hidden="true" />
              </summary>
              <p className="mt-4 leading-7 text-slate-300">{faq.answer}</p>
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
    setValue,
    watch,
    formState: { errors, isSubmitSuccessful, isSubmitting }
  } = useForm<LeadForm>({
    mode: "onBlur",
    defaultValues: { name: "", trucks: "", service: "", email: "", phone: "" }
  });
  const [outboundState, setOutboundState] = useState<"idle" | "saving" | "calling" | "success" | "error">("idle");
  const leadPhoneValue = watch("phone");
  const leadPhoneRegistration = register("phone", {
    required: "Enter the best phone number.",
    validate: (value) => isValidOutboundPhoneInput(value) || "Enter a valid phone number. US numbers can be typed as 10 digits."
  });

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
      label: "Where should Nexa call you?",
      field: "email" as const,
      input: (
        <div className="mt-3 grid gap-3">
          <input type="text" placeholder="Name (optional)" className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]" {...register("name")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="email" placeholder="Work email" className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]" {...register("email", { required: "Enter your work email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(###) ###-####"
              className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#244f8f]"
              {...leadPhoneRegistration}
              value={leadPhoneValue}
              onChange={(event) => {
                leadPhoneRegistration.onChange(event);
                handlePhoneInputFormatting(event, (value) => {
                  setValue("phone", value, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                });
              }}
              onBlur={(event) => {
                leadPhoneRegistration.onBlur(event);
                setValue("phone", formatPhoneForBlur(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true
                });
              }}
            />
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
        body: JSON.stringify({ ...data, phone: normalizeOutboundPhoneInput(data.phone) })
      }).catch(() => null);

      setOutboundState("calling");
      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name || data.email.split("@")[0] || "Valued Lead",
          phone: normalizeOutboundPhoneInput(data.phone),
          user_timezone: getBrowserTimeZone()
        })
      });
      const result = (await response.json().catch(() => null)) as OutboundCallResponse | null;

      if (!response.ok || result?.success !== true) {
        setLeadError(result?.message || result?.error || CALL_DEMO_FAILURE_MESSAGE);
        setOutboundState("error");
        return;
      }

      setOutboundState("success");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Network error. Please check your connection and try again.";
      setLeadError(message);
      setOutboundState("error");
    }
  }

  const currentError = errors[steps[step].field]?.message || (step === 2 ? errors.phone?.message : undefined);

  return (
    <section id="lead" className="border-t border-white/10 bg-[#05070d] py-16">
      <motion.div {...sectionMotion} className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-300">
            Get Started
          </p>
          <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            Ready to stop missing calls?
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Try NexCall in a real demo call or choose a plan built around your call
            flow. The first step is simple: tell us your business type and where Nexa
            should call.
          </p>
          <p className="mt-4 rounded-2xl border border-[#8dbdff]/30 bg-[#8dbdff]/10 p-4 text-sm font-bold leading-6 text-blue-100">
            Takes about 60 seconds. No card required for the demo request.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Badge icon={Users} text="Built for many industries" />
            <Badge icon={MessageSquareText} text="Calls, notes, and follow-up" />
          </div>
        </div>
        <form onSubmit={handleSubmit(submitLead)} className="rounded-[1.35rem] border border-white/10 bg-white p-5 text-[#172033] shadow-2xl shadow-black/30 sm:p-6">
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
                Nexa is ringing your phone with the live front-desk demo.
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
                <div className="mt-3">
                  <CallDemoFallbackNotice message={leadError} />
                </div>
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
                    {outboundState === "calling" || outboundState === "saving" ? "Calling Now..." : "Call Me Now"}
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
      const response = await fetch("/api/chat/nexcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion })
      });
      const result = (await response.json()) as {
        answer?: string;
        mode?: string;
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
        phone: normalizeOutboundPhoneInput(humanForm.phone),
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
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/45"
          aria-label="NexCall live chat"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/6 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#05070d]">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-white">Front desk assistant</p>
                <p className="text-xs font-bold text-slate-400">Warm answers or human follow-up</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/6 text-slate-100 transition hover:bg-white/10"
              aria-label="Collapse live chat"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 border-b border-white/10 bg-[#05070d] p-2">
            {[
              { key: "ai" as const, label: "Quick answer", icon: Bot },
              { key: "human" as const, label: "Human follow-up", icon: UserRound }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${
                  mode === tab.key ? "bg-white text-[#05070d]" : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <tab.icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            <div className="bg-[#0b1220]">
              <div className="max-h-72 space-y-3 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 ${
                        message.role === "visitor" ? "bg-[#8dbdff] text-[#05070d]" : "bg-white/8 text-slate-100"
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
              <form onSubmit={askQuestion} className="border-t border-white/10 p-3">
                <label className="sr-only" htmlFor="live-chat-question">
                  Ask NexCall a question
                </label>
                <div className="flex gap-2">
                  <input
                    id="live-chat-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={chatTerminated ? "Conversation ended" : "Ask about numbers, setup, appointments..."}
                    disabled={chatTerminated}
                    className="min-h-11 flex-1 rounded-lg border border-white/10 bg-white px-3 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#8dbdff]"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || chatTerminated}
                    className="flex min-h-11 w-12 items-center justify-center rounded-lg bg-white text-[#05070d] transition hover:bg-slate-200 disabled:opacity-60"
                    aria-label="Send chat question"
                  >
                    <Send size={17} aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-bold leading-4 text-slate-400">
                  Guided by approved business details, polite responses, and human follow-up when needed.
                </p>
              </form>
            </div>
          ) : (
            <form onSubmit={requestHuman} className="space-y-3 bg-[#0b1220] p-4">
              <p className="text-sm leading-6 text-slate-300">
                Send a quiet handoff to a person. No floating sales spam, just enough context to reply well.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={humanForm.name}
                  onChange={(event) => setHumanForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Name"
                  className="min-h-11 rounded-lg border border-white/10 bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#8dbdff]"
                />
                <input
                  value={humanForm.business}
                  onChange={(event) => setHumanForm((current) => ({ ...current, business: event.target.value }))}
                  placeholder="Business type"
                  className="min-h-11 rounded-lg border border-white/10 bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#8dbdff]"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="email"
                  required
                  value={humanForm.email}
                  onChange={(event) => setHumanForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  className="min-h-11 rounded-lg border border-white/10 bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#8dbdff]"
                />
                <input
                  type="tel"
                  required
                  value={humanForm.phone}
                  onChange={(event) =>
                    handlePhoneInputFormatting(event, (value) =>
                      setHumanForm((current) => ({ ...current, phone: value }))
                    )
                  }
                  onBlur={(event) => setHumanForm((current) => ({ ...current, phone: formatPhoneForBlur(event.target.value) }))}
                  placeholder="(###) ###-####"
                  className="min-h-11 rounded-lg border border-white/10 bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#8dbdff]"
                />
              </div>
              <textarea
                required
                value={humanForm.message}
                onChange={(event) => setHumanForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="What should the person know?"
                className="min-h-24 w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#8dbdff]"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-black text-[#05070d] transition hover:bg-slate-200"
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
          className="ml-auto flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-left shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:bg-[#111c2f]"
          aria-label="Open NexCall live chat"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#05070d]">
            <MessageSquareText size={18} aria-hidden="true" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-black text-white">Ask the front desk</span>
            <span className="block text-xs font-bold text-slate-400">AI or human follow-up</span>
          </span>
        </button>
      )}
    </div>
  );
}

function Footer() {
  const quickLinks = [
    { href: "#demos", label: "Demos" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#services", label: "Services" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" }
  ];
  const serviceLinks = [
    "AI Call Answering",
    "Appointment Requests",
    "Lead Capture",
    "After-Hours Coverage",
    "Human Backup Handoff"
  ];
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
    <footer className="border-t border-white/10 bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 text-sm text-slate-400 md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <span className="brand-mark-shell relative h-12 w-12">
              <Image
                src={brandAssets.mark}
                alt=""
                fill
                sizes="48px"
                className="brand-mark-img object-contain"
              />
            </span>
            <div>
              <p className="font-black text-white">NexCall</p>
              <p className="mt-1">AI receptionist coverage with clear handoffs to real people.</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm leading-7">
            NexCall answers when your team cannot, captures the details, helps move
            the next step forward, and sends clean notes.
          </p>
        </div>
        <nav aria-label="Quick links">
          <p className="font-black text-white">Quick links</p>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((item) => (
              <a key={item.href} href={item.href} className="font-bold transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>
        </nav>
        <div>
          <p className="font-black text-white">Services</p>
          <div className="mt-4 grid gap-3">
            {serviceLinks.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-black text-white">Contact</p>
          <a href={`mailto:${NEXCALL_PUBLIC_EMAIL}`} className="mt-4 block font-bold text-slate-200 transition hover:text-white">
            {NEXCALL_PUBLIC_EMAIL}
          </a>
          <a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="mt-3 block font-bold text-slate-200 transition hover:text-white">
            {NEXCALL_PUBLIC_PHONE_DISPLAY}
          </a>
          <p className="mt-3 leading-6">Demo calls and setup requests are captured through the site forms.</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 NexCall. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal links">
          {legalLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
