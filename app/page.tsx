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
  UserRound,
  Users,
  Workflow,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
// CountUpStat used below via HeroCountUp (time-delay version for above-fold stats)

/* ── constants ─────────────────────────────────────────────────────────────── */
const NEXCALL_PUBLIC_EMAIL = "nexcall@proton.me";
const NEXCALL_PUBLIC_PHONE_DISPLAY = "(202) 200-6578";
const NEXCALL_PUBLIC_PHONE_TEL = "+12022006578";
const PUBLIC_STRIPE_CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED === "true";
const CALL_DEMO_FAILURE_MESSAGE =
  "We could not start the demo call right now. Please try again or contact NexCall.";

const brandAssets = { mark: "/brand/nexcall-mark-transparent.png" } as const;

/* ── types ──────────────────────────────────────────────────────────────────── */
type LeadForm = {
  name: string;
  trucks: string;
  service: string;
  email: string;
  phone: string;
};
type ChatMessage = { role: "visitor" | "assistant"; text: string };
type ChatMode = "ai" | "human";
type OutboundStatus = "idle" | "calling" | "success" | "error";
type OutboundCallResponse = { success?: boolean; message?: string; error?: string };
type DemoScenario = {
  id: "appointment" | "lead" | "question";
  title: string;
  category: string;
  businessType: string;
  callerNeed: string;
  nexcallAction: string;
  captures: string[];
  handoff: string;
  result: string;
};
type PortraitConfig = {
  skinTone: string;
  hairColor: string;
  shirtColor: string;
  hairStyle: "afro" | "short" | "medium" | "long";
  hasGlasses?: boolean;
};

/* ── data ───────────────────────────────────────────────────────────────────── */
const voiceDemos: DemoScenario[] = [
  {
    id: "appointment",
    title: "Appointment Request",
    category: "Scheduling flow",
    businessType: "Healthcare, salons, dental offices, repair shops",
    callerNeed: "Move an appointment to Thursday afternoon.",
    nexcallAction: "Captures preferred time, caller details, reason, and urgency.",
    captures: ["Name", "Phone", "Preferred time", "Reason", "Urgency"],
    handoff: "Appointment request noted. Team follow-up ready.",
    result: "Next step clear"
  },
  {
    id: "lead",
    title: "New Lead",
    category: "Lead intake",
    businessType: "Contractors, agencies, legal offices, home services",
    callerNeed: "Caller wants a quote and asks how soon someone can follow up.",
    nexcallAction: "Captures job type, location, contact details, timing, and urgency.",
    captures: ["Name", "Phone", "Job type", "Location", "Urgency"],
    handoff: "Lead summary ready with the right follow-up context.",
    result: "Lead details recorded"
  },
  {
    id: "question",
    title: "Customer Question",
    category: "Front desk support",
    businessType: "Restaurants, local shops, support-heavy teams",
    callerNeed: "Caller asks about availability, hours, or service details.",
    nexcallAction: "Answers approved questions or captures the request for follow-up.",
    captures: ["Question", "Contact detail", "Preference", "Next step"],
    handoff: "Customer question handled or routed with context.",
    result: "Request handled"
  }
];

const industryData = [
  {
    name: "Dental offices", icon: "🦷",
    callerNeed: "Appointment requests, cancellations, insurance questions",
    nexcallAction: "Captures preferred time, insurance info, urgency. Routes to scheduling team.",
    handoff: "Appointment request with caller details and next step ready.",
    tag: "📅 Scheduling"
  },
  {
    name: "Salons", icon: "✂️",
    callerNeed: "Booking slots, cancellations, stylist availability",
    nexcallAction: "Captures service type, preferred stylist, time window, and contact details.",
    handoff: "Booking request with service details and preferred time.",
    tag: "📞 Booking"
  },
  {
    name: "Clinics", icon: "🏥",
    callerNeed: "Referrals, prescription queries, test results, urgent concerns",
    nexcallAction: "Captures urgency, patient details, and routes time-sensitive calls.",
    handoff: "Patient call log with urgency flag and next-step guidance.",
    tag: "⚡ Urgent routing"
  },
  {
    name: "Auto repair", icon: "🔧",
    callerNeed: "Quotes, drop-off scheduling, status updates on vehicles",
    nexcallAction: "Captures vehicle info, service needed, preferred drop-off time.",
    handoff: "Service request with vehicle details and timing.",
    tag: "🧾 Lead request noted"
  },
  {
    name: "Legal offices", icon: "⚖️",
    callerNeed: "Consultations, case status, urgent legal matters",
    nexcallAction: "Captures matter type, contact details, urgency, and routes to right attorney.",
    handoff: "New matter intake with caller context and urgency level.",
    tag: "👤 Human handoff"
  },
  {
    name: "Restaurants", icon: "🍽️",
    callerNeed: "Reservations, catering inquiries, hours and menu questions",
    nexcallAction: "Handles reservation requests, captures party size, time, and special needs.",
    handoff: "Reservation request with party details and contact.",
    tag: "📅 Reservation"
  },
  {
    name: "Contractors", icon: "🏗️",
    callerNeed: "Project quotes, availability, follow-up on submitted inquiries",
    nexcallAction: "Captures project type, location, timeline, contact, and budget range.",
    handoff: "Lead summary with project scope and contact info.",
    tag: "🧾 Lead request noted"
  },
  {
    name: "Local shops", icon: "🏪",
    callerNeed: "Product availability, hours, special orders, pricing",
    nexcallAction: "Answers standard questions or captures the specific request for callback.",
    handoff: "Customer request with contact and follow-up note.",
    tag: "✅ Request logged"
  }
];

const sectionMotion = {
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.44, ease: "easeOut" }
} as const;

/* ── phone utilities ─────────────────────────────────────────────────────────── */
function getBrowserTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"; }
  catch { return "America/New_York"; }
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
  if (raw.startsWith("+") && !(digits.length === 11 && digits.startsWith("1"))) return raw.slice(0, 18);
  const limited = nationalDigits.slice(0, 10);
  if (limited.length === 0) return "";
  if (limited.length < 4) return limited;
  if (limited.length < 7) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}
function formatPhoneForBlur(value: string) {
  const normalized = normalizeOutboundPhoneInput(value);
  const digits = normalized.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+1 ${formatPhoneDisplay(digits.slice(1))}`;
  return formatPhoneDisplay(value) || value.trim();
}
function cursorPositionForDigits(formattedValue: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seenDigits = 0;
  for (let i = 0; i < formattedValue.length; i++) {
    if (/\d/.test(formattedValue[i])) seenDigits++;
    if (seenDigits >= digitCount) return i + 1;
  }
  return formattedValue.length;
}
function handlePhoneInputFormatting(e: ChangeEvent<HTMLInputElement>, setVal: (v: string) => void) {
  const input = e.currentTarget;
  const cursor = input.selectionStart || input.value.length;
  const digitsBeforeCursor = input.value.slice(0, cursor).replace(/\D/g, "").length;
  const formatted = formatPhoneDisplay(input.value);
  setVal(formatted);
  window.requestAnimationFrame(() => {
    const pos = cursorPositionForDigits(formatted, digitsBeforeCursor);
    input.setSelectionRange(pos, pos);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const openDemo = () => setIsOutboundModalOpen(true);
  const closeDemo = () => setIsOutboundModalOpen(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      setIsOutboundModalOpen(true);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
    }
    const handler = () => setIsOutboundModalOpen(true);
    window.addEventListener("nexcall:open-demo", handler);
    return () => window.removeEventListener("nexcall:open-demo", handler);
  }, []);

  return (
    <main className="system-shell min-h-screen w-full overflow-hidden text-slate-50">
      <Header onCallDemo={openDemo} />
      <CinematicHero onCallDemo={openDemo} />
      <OutcomeRail />
      <TransformSection />
      <ProcessCommandCenter onCallDemo={openDemo} />
      <IndustrySelector />
      <DemoPreviewSection onCallDemo={openDemo} />
      <Pricing onCallDemo={openDemo} />
      <FAQSection />
      <ClosingLeadCapture onCallDemo={openDemo} />
      <Footer />
      <LiveChatDock onCallDemo={openDemo} />
      <OutboundCallModal open={isOutboundModalOpen} onClose={closeDemo} />
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════════════════════════════ */
function Header({ onCallDemo }: { onCallDemo: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#industries", label: "Industries" },
    { href: "#demos", label: "Demo" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
    { href: "/about", label: "About" }
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#baff39]/10 bg-[#020403]/76 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="NexCall home">
          <span className="brand-mark-shell relative h-12 w-12">
            <Image src={brandAssets.mark} alt="" fill sizes="48px" className="brand-mark-img object-contain" priority />
          </span>
          <span className="text-lg font-black tracking-wide text-white sm:text-xl">NEXCALL</span>
        </a>
        <div className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center transition hover:text-[#baff39]">{item.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={onCallDemo} data-fallback-href="/?demo=1"
            className="system-button-primary hidden min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25 sm:inline-flex"
          >
            <Phone size={17} aria-hidden="true" /> Call Demo
          </button>
          <button
            type="button" onClick={() => setMobileOpen((c) => !c)}
            className="system-button-primary flex h-11 w-11 items-center justify-center rounded-xl transition focus:outline-none focus:ring-4 focus:ring-[#baff39]/25 md:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 md:hidden">
          <div className="system-card rounded-2xl p-3 shadow-2xl shadow-black/50">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-[#baff39]/8 hover:text-[#baff39]">
                {item.label}
              </a>
            ))}
            <button type="button" onClick={() => { setMobileOpen(false); onCallDemo(); }} data-fallback-href="/?demo=1"
              className="system-button-primary mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black">
              <Phone size={17} aria-hidden="true" /> Call Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── HeroCountUp ──────────────────────────────────────────────────────────
   Above-fold stats need a time-delay start, not IntersectionObserver.
   IntersectionObserver fires while the hero is still fading in (opacity 0),
   the count finishes before the element is visible, so users see the final
   value instantly. Instead we wait 950ms — after the hero-stagger-1 settle
   (0.22s delay + 0.65s duration + a small buffer) — then count up.
── ──────────────────────────────────────────────────────────────────────── */
function HeroCountUp({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(decimals > 0 ? value.toFixed(decimals) : String(value));
      return;
    }

    const delay = setTimeout(() => {
      const duration = 1400;
      const start = performance.now();
      function tick(now: number) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        const current = eased * value;
        setDisplay(decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString());
        if (progress < 1) requestAnimationFrame(tick);
        else setDisplay(decimals > 0 ? value.toFixed(decimals) : String(value));
      }
      requestAnimationFrame(tick);
    }, 950); // hero-stagger-1 settles at ~870ms; 950ms gives a clean start

    return () => clearTimeout(delay);
  }, [value, decimals]);

  return <span>{display}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CINEMATIC HERO — new composition: stacked headline + 3-stage call visual
═══════════════════════════════════════════════════════════════════════════ */
function CinematicHero({ onCallDemo }: { onCallDemo: () => void }) {
  return (
    <section id="top" className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-20 sm:pt-24">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 80% 5%, rgba(168,255,0,0.08), transparent)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 55% at -5% 65%, rgba(141,217,232,0.06), transparent)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 50% 100%, rgba(168,255,0,0.04), transparent)" }} />
      </div>
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.24]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px glass-line" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {/* Live badge */}
        <p className="mb-7 inline-flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#A8FF00]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A8FF00]" aria-hidden="true" />
          AI Receptionist · Available 24/7
        </p>

        {/* FULL-WIDTH headline spanning both sides */}
        <h1 className="hero-fade-up mb-12 text-[3rem] font-black leading-[0.88] tracking-[-0.028em] text-white sm:mb-14 sm:text-[5.5rem] lg:text-[7.5rem] xl:text-[9rem]">
          Turn missed calls into{" "}
          <span className="text-[#A8FF00]">next steps.</span>
        </h1>

        {/* TWO-COLUMN below headline: copy + CTAs left — call visual right */}
        <div className="hero-stagger-1 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* LEFT */}
          <div>
            <p className="max-w-lg text-xl leading-[1.7] text-[#93a09f]">
              <span className="font-semibold text-[#A8FF00]">NexCall</span> helps local businesses answer when the team is busy, capture appointment requests, and keep follow-up organized.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#lead"
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#A8FF00] px-8 text-sm font-black tracking-wide text-black transition hover:scale-[1.02] hover:bg-[#bfff33] focus:outline-none focus:ring-4 focus:ring-[#A8FF00]/30 sm:w-auto">
                Request Setup <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a href="#how-it-works"
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[8px] border border-white/12 px-8 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.04] sm:w-auto">
                See How It Works <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-4 text-xs text-[#4B5563]">No card required. Setup takes about 60 seconds.</p>

            {/* Stat strip — honest, qualitative proof points */}
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-2">
              {[
                { value: "Always on", label: "Call coverage" },
                { value: "Live", label: "Front desk" },
                { value: "Fast handoff", label: "Team summary" },
                { value: "After hours", label: "Overflow ready" }
              ].map((s) => (
                <div key={s.label} className="border-l-2 border-[#A8FF00]/30 pl-4">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4B5563]">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-[#93a09f]">Built for clinics, salons, contractors, and appointment-based local teams.</p>
          </div>

          {/* RIGHT — cinematic 3-stage call flow visual */}
          <CallInterceptionVisual />
        </div>
      </div>
    </section>
  );
}

/* Three-stage call visual: RINGING → PROCESSING → TEAM BRIEF */
function CallInterceptionVisual() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-3xl opacity-25 blur-3xl"
        aria-hidden="true"
        style={{ background: "radial-gradient(ellipse, rgba(168,255,0,0.22), transparent 70%)" }}
      />
      <div className="relative space-y-2">
        {/* Stage 1: CALL COMING IN */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 animate-pulse items-center justify-center rounded-full border border-[#A8FF00]/35 bg-[#A8FF00]/10">
              <Phone size={18} className="text-[#A8FF00]" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-500">Incoming</p>
              <p className="text-sm font-black text-white">Call received · Ringing</p>
            </div>
            <span className="shrink-0 text-[0.58rem] font-black font-mono tracking-wider text-[#A8FF00]">LIVE</span>
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center gap-3 px-5">
          <div className="ml-4 h-7 w-px bg-gradient-to-b from-[#A8FF00]/40 to-[#A8FF00]/10" />
          <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-[#A8FF00]/55">NexCall intercepts</p>
        </div>

        {/* Stage 2: NEXCALL PROCESSING */}
        <div className="rounded-2xl border border-[#A8FF00]/28 bg-[#A8FF00]/[0.055] px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#A8FF00]/40 bg-[#A8FF00]/15">
              <Image src={brandAssets.mark} alt="" width={26} height={26} className="brand-mark-img object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.15em] text-[#A8FF00]/75">NexCall at work</p>
              <p className="text-sm font-black text-white">Capturing caller details</p>
            </div>
            <span className="live-pulse h-2 w-2 shrink-0 rounded-full bg-[#A8FF00]" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            {(["Name + contact", "Caller need", "Urgency level"] as const).map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <Check size={13} className="shrink-0 text-[#A8FF00]" aria-hidden="true" />
                <span className="flex-1 text-xs font-bold text-slate-300">{item}</span>
                <span className="text-[0.55rem] font-black font-mono tracking-wider text-[#A8FF00]">LOGGED</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center gap-3 px-5">
          <div className="ml-4 h-7 w-px bg-gradient-to-b from-[#A8FF00]/40 to-[#A8FF00]/10" />
          <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-[#A8FF00]/55">Team brief sent</p>
        </div>

        {/* Stage 3: TEAM BRIEF */}
        <div className="rounded-2xl border border-white/[0.07] bg-black/45 px-5 py-4">
          <p className="mb-3 text-[0.58rem] font-black uppercase tracking-[0.15em] text-[#A8FF00]">Team Brief Ready</p>
          <div className="space-y-1.5 text-xs">
            <p className="text-slate-400"><span className="font-bold text-slate-200">Caller:</span> Incoming caller · number on file</p>
            <p className="text-slate-400"><span className="font-bold text-slate-200">Need:</span> Appointment this Thursday</p>
            <p className="text-slate-400"><span className="font-bold text-slate-200">Urgency:</span> Moderate</p>
            <p className="text-slate-400"><span className="font-bold text-slate-200">Next step:</span> Confirm available slot</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#A8FF00]/22 bg-[#A8FF00]/[0.08] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A8FF00]" aria-hidden="true" />
            <span className="text-[0.58rem] font-black text-[#A8FF00]">Ready for follow-up</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OUTCOME RAIL — horizontal marquee of diverse portrait outcome cards
═══════════════════════════════════════════════════════════════════════════ */
function OutcomeRail() {
  const cards = [
    {
      portrait: { skinTone: "#7B4F2E", hairColor: "#1a0a00", shirtColor: "#1d4ed8", hairStyle: "afro" as const, hasGlasses: false },
      role: "Local service team", outcome: "Fewer missed calls.",
      detail: "Calls are answered while the team is busy with jobs.", tag: "📞 Calls answered"
    },
    {
      portrait: { skinTone: "#F5CBA7", hairColor: "#3d1c02", shirtColor: "#065f46", hairStyle: "short" as const, hasGlasses: true },
      role: "Clinic front desk", outcome: "Cleaner handoffs.",
      detail: "Caller details arrive with a clear next step.", tag: "✅ Details recorded"
    },
    {
      portrait: { skinTone: "#A0522D", hairColor: "#1a0a00", shirtColor: "#7c3aed", hairStyle: "medium" as const, hasGlasses: false },
      role: "Office coordinator", outcome: "Faster follow-up.",
      detail: "The team gets the summary instead of chasing voicemail.", tag: "🧾 Team brief ready"
    },
    {
      portrait: { skinTone: "#C68642", hairColor: "#1a0a00", shirtColor: "#9d174d", hairStyle: "long" as const, hasGlasses: false },
      role: "Owner-led business", outcome: "Human backup ready.",
      detail: "Urgent callers can be routed with context.", tag: "👤 Human handoff"
    },
    {
      portrait: { skinTone: "#5C3317", hairColor: "#2a1400", shirtColor: "#0c4a6e", hairStyle: "short" as const, hasGlasses: false },
      role: "Appointment-heavy practice", outcome: "Appointment requests noted.",
      detail: "After-hours calls get a professional response.", tag: "📅 Request noted"
    },
    {
      portrait: { skinTone: "#D2A679", hairColor: "#1a0a00", shirtColor: "#4a1942", hairStyle: "long" as const, hasGlasses: false },
      role: "Legal front desk", outcome: "No dead-end calls.",
      detail: "Callers get a clear next step instead of hitting voicemail.", tag: "⚡ Faster follow-up"
    }
  ];
  const doubled = [...cards, ...cards];

  return (
    <section className="overflow-hidden border-b border-[#baff39]/10 bg-[#050807] py-10 sm:py-12" aria-labelledby="marquee-label">
      <p id="marquee-label" className="system-label mx-auto mb-8 w-fit px-4">Common outcomes teams look for</p>
      <div className="marquee-container overflow-hidden" aria-label="Common outcomes businesses look for">
        <div className="marquee-strip flex w-max">
          {doubled.map((card, i) => (
            <div key={i} className="w-[300px] shrink-0 pr-4" aria-hidden={i >= cards.length ? true : undefined}>
              <div className="system-card flex h-full flex-col gap-3 rounded-[1.15rem] p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#baff39]/18" role="img" aria-label={`Illustrated portrait of a ${card.role}`}>
                    <PortraitSVG {...card.portrait} />
                  </div>
                  <p className="text-[0.55rem] font-black uppercase leading-tight tracking-[0.12em] text-slate-500">{card.role}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black leading-tight text-white">&ldquo;{card.outcome}&rdquo;</p>
                  <p className="mt-1 text-[0.7rem] leading-[1.5] text-slate-400">{card.detail}</p>
                </div>
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-[#baff39]/18 bg-[#baff39]/[0.06] px-2.5 py-1">
                  <span className="text-[0.58rem] font-black text-[#baff39]">{card.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSFORM SECTION — "Missed call → clear next step"
   Genuine before/after contrast
═══════════════════════════════════════════════════════════════════════════ */
function TransformSection() {
  const before = [
    { emoji: "📵", title: "Caller hits voicemail", sub: "Hangs up. Moves on to the next option." },
    { emoji: "❓", title: "No context for your team", sub: "A missed number with zero details to act on." },
    { emoji: "⏳", title: "Delayed callback attempt", sub: "The lead has already found someone else." }
  ];
  const after = [
    { emoji: "📞", title: "Call answered professionally", sub: "NexCall answers when your team is busy or unavailable." },
    { emoji: "✅", title: "Details recorded clearly", sub: "Name, need, and urgency — all logged for your team." },
    { emoji: "⚡", title: "Team brief ready to act", sub: "Follow-up starts in seconds, not hours." }
  ];

  return (
    <section className="border-b border-[#baff39]/10 bg-[#020403] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="system-label mx-auto mb-4 w-fit">The difference</p>
          <h2 className="text-4xl font-black leading-[0.93] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Missed call →{" "}
            <span className="accent-text">clear next step.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Every unanswered call is a real cost. NexCall turns the missed moment into a clean next step.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_56px_1fr] lg:items-center">
          {/* BEFORE */}
          <div>
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-red-400">Without NexCall</p>
            </div>
            <div className="space-y-3">
              {before.map((item) => (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-red-900/30 bg-red-950/[0.22] p-5 transition hover:border-red-800/40">
                  <span className="mt-0.5 text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-black text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER ARROW */}
          <div className="flex justify-center lg:flex-col lg:items-center">
            <div className="hidden h-20 w-px bg-gradient-to-b from-transparent via-[#baff39]/30 to-transparent lg:block" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#baff39]/30 bg-[#baff39]/10 text-[#baff39]">
              <ArrowRight size={20} className="rotate-90 lg:rotate-0" aria-hidden="true" />
            </div>
            <div className="hidden h-20 w-px bg-gradient-to-b from-transparent via-[#baff39]/30 to-transparent lg:block" />
          </div>

          {/* AFTER */}
          <div>
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#baff39]" />
              <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#baff39]">With NexCall</p>
            </div>
            <div className="space-y-3">
              {after.map((item) => (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-[#baff39]/22 bg-[#baff39]/[0.06] p-5 transition hover:border-[#baff39]/35">
                  <span className="mt-0.5 text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-black text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROCESS COMMAND CENTER — full-width, 4-zone horizontal flow
   Genuinely different from the old 2-column layout
═══════════════════════════════════════════════════════════════════════════ */
function ProcessCommandCenter({ onCallDemo }: { onCallDemo: () => void }) {
  const steps = [
    {
      label: "Answer", icon: Phone, emoji: "📞", title: "Answers when needed",
      copy: "NexCall answers before callers hit voicemail or a dead end.",
      status: "LIVE", statusColor: "#A8FF00"
    },
    {
      label: "Understand", icon: MessageSquareText, emoji: "✅", title: "Captures need and context",
      copy: "It identifies the need, collects contact details, and notes urgency.",
      status: "LOGGED", statusColor: "#A8FF00"
    },
    {
      label: "Route", icon: Workflow, emoji: "📅", title: "Moves to the right next step",
      copy: "Appointment requests, lead capture, FAQs, or human handoff — with context.",
      status: "DIRECTED", statusColor: "#60a5fa"
    },
    {
      label: "Report", icon: ClipboardList, emoji: "🧾", title: "Team gets a clean brief",
      copy: "Your team receives a summary with the next action already clear.",
      status: "READY", statusColor: "#A8FF00"
    }
  ];

  const journeySteps = [
    { emoji: "📞", label: "Incoming caller", text: '"Can I get an appointment this week?"', accent: false },
    { emoji: "✅", label: "Recorded", text: "Name · Phone · Preferred time · Reason · Urgency", accent: false },
    { emoji: "🧾", label: "Team handoff", text: "Appointment request + clean next step", accent: false },
    { emoji: "⚡", label: "Outcome", text: "Ready for follow-up", accent: true }
  ];

  return (
    <section id="how-it-works" className="border-y border-[#baff39]/10 bg-[#020403] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered header */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="system-label mx-auto mb-5 w-fit">How it works</p>
          <h2 className="text-4xl font-black leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-6xl">
            From ring to{" "}
            <span className="accent-text">clear next step</span>{" "}
            in one seamless flow.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Every call becomes a clear next step. No chasing voicemail. No missed leads.
          </p>
        </div>

        {/* Large command panel */}
        <div className="metal-panel overflow-hidden rounded-[1.75rem]">
          {/* Panel header bar */}
          <div className="flex items-center gap-3 border-b border-[#baff39]/10 bg-[#baff39]/[0.03] px-6 py-4">
            <span className="live-pulse h-2 w-2 rounded-full bg-[#A8FF00]" aria-hidden="true" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#baff39]">How NexCall handles your calls · always available</p>
          </div>

          {/* 4 step zones — 2×2 on tablet, 1×4 on desktop */}
          <div className="grid divide-y divide-[#baff39]/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col gap-5 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#baff39]/22 bg-[#baff39]/[0.07] text-[#baff39]">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <span className="text-[2.5rem] font-black leading-none text-white/[0.05]">0{i + 1}</span>
                  </div>
                  <div>
                    <span className="rounded-full border border-[#baff39]/18 bg-[#baff39]/[0.07] px-2.5 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#baff39]">
                      {step.label}
                    </span>
                    <p className="mt-3 text-lg font-black leading-tight text-white">{step.title}</p>
                    <p className="mt-2 text-sm leading-[1.6] text-slate-400">{step.copy}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: step.statusColor }} aria-hidden="true" />
                    <span className="text-[0.56rem] font-black font-mono uppercase tracking-wider" style={{ color: step.statusColor }}>{step.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sample call journey — full width at bottom */}
          <div className="border-t border-[#baff39]/10 bg-black/35 px-6 py-6 sm:px-8">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-[#baff39]">Illustrative call journey</p>
              <div className="hidden flex-1 sm:block h-px bg-[#baff39]/10" />
              <button type="button" onClick={onCallDemo} data-fallback-href="/?demo=1"
                className="system-button-primary inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25">
                Ask About Setup <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {journeySteps.map((item) => (
                <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.accent ? "border-[#baff39]/22 bg-[#baff39]/[0.07]" : "border-white/[0.05] bg-white/[0.025]"}`}>
                  <span className="text-base">{item.emoji}</span>
                  <p className={`mt-1.5 text-[0.55rem] font-black uppercase tracking-[0.1em] ${item.accent ? "text-[#baff39]" : "text-slate-500"}`}>{item.label}</p>
                  <p className={`mt-1 text-xs font-bold leading-5 ${item.accent ? "text-[#baff39]" : "text-slate-300"}`}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INDUSTRY SELECTOR — new interactive section
═══════════════════════════════════════════════════════════════════════════ */
function IndustrySelector() {
  const [active, setActive] = useState(0);
  const current = industryData[active] || industryData[0];

  return (
    <section id="industries" className="border-b border-[#baff39]/10 bg-[#050807] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="system-label">Who it&apos;s built for</p>
        <h2 className="mt-3 text-4xl font-black leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-6xl">
          See how <span className="accent-text">your industry</span> uses NexCall.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
          Pick your business type. See the exact call flow NexCall handles for you.
        </p>

        {/* Industry tab strip */}
        <div className="mt-8 flex flex-wrap gap-2">
          {industryData.map((ind, i) => (
            <button
              key={ind.name}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${
                active === i
                  ? "border-[#baff39]/55 bg-[#baff39]/10 text-[#baff39]"
                  : "border-white/10 text-slate-400 hover:border-[#baff39]/25 hover:text-white"
              }`}
            >
              <span>{ind.icon}</span>
              {ind.name}
            </button>
          ))}
        </div>

        {/* Selected industry detail panel */}
        <div className="metal-panel mt-8 overflow-hidden rounded-[1.5rem]">
          {/* Panel label bar */}
          <div className="flex items-center gap-3 border-b border-[#baff39]/10 bg-[#baff39]/[0.03] px-6 py-3">
            <span className="text-lg">{current.icon}</span>
            <p className="text-sm font-black text-white">{current.name}</p>
            <span className="ml-auto rounded-full border border-[#baff39]/22 bg-[#baff39]/[0.08] px-3 py-0.5 text-xs font-black text-[#baff39]">
              {current.tag}
            </span>
          </div>

          {/* 3-column content */}
          <div className="grid gap-0 divide-y divide-[#baff39]/10 sm:divide-x sm:divide-y-0 sm:grid-cols-3 p-0">
            <div className="p-6 sm:p-7">
              <p className="mb-3 text-[0.58rem] font-black uppercase tracking-[0.16em] text-slate-500">Common caller need</p>
              <p className="text-base font-bold leading-7 text-white">{current.callerNeed}</p>
            </div>
            <div className="p-6 sm:p-7">
              <p className="mb-3 text-[0.58rem] font-black uppercase tracking-[0.16em] text-[#baff39]">NexCall handles it</p>
              <p className="text-base font-bold leading-7 text-white">{current.nexcallAction}</p>
            </div>
            <div className="p-6 sm:p-7">
              <p className="mb-3 text-[0.58rem] font-black uppercase tracking-[0.16em] text-slate-500">Your team receives</p>
              <p className="text-base font-bold leading-7 text-white">{current.handoff}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO PREVIEW SECTION — reimagined layout (not old side-by-side)
   Scenario cards across top, full-width preview panel below
═══════════════════════════════════════════════════════════════════════════ */
function DemoPreviewSection({ onCallDemo }: { onCallDemo: () => void }) {
  const [selected, setSelected] = useState(0);
  const scenario = voiceDemos[selected] || voiceDemos[0];

  return (
    <section id="demos" className="border-b border-[#baff39]/10 bg-[#020403] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="system-label">Live preview</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pick a scenario.<br />
              <span className="accent-text">See it play out.</span>
            </h2>
          </div>
          <button type="button" onClick={onCallDemo} data-fallback-href="/?demo=1"
            className="system-button-primary inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-6 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25">
            <Phone size={17} aria-hidden="true" /> Start With a Demo
          </button>
        </div>

        {/* Scenario selector — compact horizontal cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {voiceDemos.map((demo, i) => {
            const Icon = demo.id === "appointment" ? CalendarCheck : demo.id === "lead" ? Zap : Check;
            return (
              <button
                key={demo.id}
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected === i
                    ? "border-[#baff39]/55 bg-[#baff39]/10"
                    : "border-white/10 bg-white/[0.03] hover:border-[#baff39]/25 hover:bg-white/[0.055]"
                }`}
              >
                <Icon size={20} className={selected === i ? "text-[#baff39]" : "text-slate-400"} aria-hidden="true" />
                <p className="mt-2 text-sm font-black text-white">{demo.title}</p>
                <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">{demo.category}</p>
              </button>
            );
          })}
        </div>

        {/* Full-width preview panel */}
        <div className="metal-panel overflow-hidden rounded-[1.5rem]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#baff39]/10 bg-[#baff39]/[0.03] px-6 py-4">
            <div>
              <span className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#baff39]">{scenario.category}</span>
              <h3 className="mt-1 text-lg font-black text-white">{scenario.title}</h3>
            </div>
            <span className="rounded-full border border-[#baff39]/25 bg-[#baff39]/10 px-3 py-1 text-xs font-black text-[#dfff91]">
              {scenario.result}
            </span>
          </div>

          {/* 3-column scenario cards */}
          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            {[
              { label: "Caller need", text: scenario.callerNeed, icon: Phone },
              { label: "NexCall action", text: scenario.nexcallAction, icon: Workflow },
              { label: "Team handoff", text: scenario.handoff, icon: ClipboardList }
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="system-card rounded-2xl p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#baff39]/20 bg-[#baff39]/10 text-[#baff39]">
                      <ItemIcon size={13} aria-hidden="true" />
                    </span>
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                  </div>
                  <p className="text-sm font-bold leading-6 text-slate-100">{item.text}</p>
                </div>
              );
            })}
          </div>

          {/* Information collected strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#baff39]/10 bg-black/30 px-6 py-4">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-500">Information collected:</p>
            {scenario.captures.map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Check size={12} className="text-[#baff39]" aria-hidden="true" /> {item}
              </span>
            ))}
          </div>

          {/* Bottom note */}
          <div className="border-t border-[#baff39]/10 px-6 py-4">
            <p className="text-sm text-slate-400">
              The preview shows the handoff logic.{" "}
              <button type="button" onClick={onCallDemo} data-fallback-href="/?demo=1"
                className="inline-flex min-h-11 items-center font-bold text-[#baff39] underline-offset-2 hover:underline">
                Start a demo call
              </button>{" "}
              to hear the receptionist experience from the caller side.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRICING — same logic, cleaner visual
═══════════════════════════════════════════════════════════════════════════ */
function Pricing({ onCallDemo }: { onCallDemo: () => void }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const checkoutEnabled = PUBLIC_STRIPE_CHECKOUT_ENABLED;
  const plans = [
    {
      id: "starter", name: "Starter", monthly: 349, limit: "Up to 120 calls/mo",
      features: ["24/7 answering", "Lead qualification", "Clean call summaries", "Basic FAQs", "Simple call routing"]
    },
    {
      id: "appointment", name: "Appointment", monthly: 549, featured: true, limit: "Up to 250 calls/mo",
      features: ["Everything in Starter", "Appointment request support", "Reschedule and cancellation intake", "Follow-up messaging", "Human fallback rules"]
    },
    {
      id: "growth", name: "Growth", monthly: 849, plus: true, limit: "Higher call volume",
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
      if (!response.ok || !data.url) throw new Error("This plan is being finalized. Request a demo and we will help you activate it.");
      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "This plan is being finalized. Request a demo and we will help you activate it.");
      setCheckoutLoading(null);
    }
  }

  function handlePlanAction(planId: string) {
    if (!checkoutEnabled) {
      document.getElementById("lead")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    void startCheckout(planId);
  }

  return (
    <motion.section {...sectionMotion} id="pricing" className="relative border-b border-[#baff39]/10 bg-[#050807] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="system-label">Predictable pricing</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Clear plans for teams ready to{" "}
              <span className="accent-text">stop missing calls.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Three choices, simple decision. Request a demo and we’ll help you choose the right plan.
            </p>
            {!checkoutEnabled ? (
              <p className="mt-3 max-w-2xl text-sm font-semibold text-[#baff39]">
                Checkout is still being finalized. Choose a plan to request setup and we will confirm the right fit with you directly.
              </p>
            ) : null}
          </div>
          <div className="flex w-full max-w-xs shrink-0 rounded-xl border border-[#baff39]/12 bg-black/30 p-1">
            {(["monthly", "yearly"] as const).map((opt) => (
              <button
                key={opt} type="button" onClick={() => setBilling(opt)}
                className={`min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-black capitalize transition ${billing === opt ? "bg-[#baff39] text-[#020403]" : "text-slate-300 hover:text-white"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : Math.round(plan.monthly * 0.85);
            return (
              <div key={plan.name} className={`system-card system-card-hover relative rounded-[1.35rem] p-6 ${plan.featured ? "system-card-featured" : ""}`}>
                {plan.featured && (
                  <p className="absolute right-5 top-5 rounded-full bg-[#baff39] px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#020403]">Best fit</p>
                )}
                <h3 className="text-4xl font-black tracking-tight text-white">{plan.name}</h3>
                <p className="mt-2 text-sm font-bold text-slate-400">{plan.limit}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-6xl font-black tracking-tight text-white">${price.toLocaleString()}</span>
                  <span className="pb-2 text-slate-400">/mo{plan.plus ? "+" : ""}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{billing === "yearly" ? "Billed yearly. Save 15%." : "Month-to-month after launch."}</p>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <Check className="mt-0.5 shrink-0 text-[#baff39]" size={18} aria-hidden="true" /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button" onClick={() => onCallDemo()}
                  data-fallback-href="/?demo=1"
                  className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${plan.featured ? "system-button-primary focus:ring-[#baff39]/25" : "system-button-secondary hover:border-[#baff39]/30 hover:text-[#baff39] focus:ring-[#baff39]/15"}`}
                >
                  {checkoutLoading === plan.id ? (
                    "Requesting Demo…"
                  ) : `Request Demo for ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {checkoutError && (
          <div className="mt-6 rounded-xl border border-amber-400/50 bg-amber-400/10 p-5 text-sm font-bold text-amber-100">
            <p className="text-base font-black text-amber-50">{checkoutError}</p>
            <p className="mt-2 text-amber-200/80">
              Want to get started?{" "}
              <a href="mailto:nexcall@proton.me" className="underline underline-offset-2 hover:text-amber-100">Email nexcall@proton.me</a>{" "}
              or call{" "}
              <a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="underline underline-offset-2 hover:text-amber-100">{NEXCALL_PUBLIC_PHONE_DISPLAY}</a>.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════════════════════════ */
function FAQSection() {
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});
  const faqs = [
    { question: "Does NexCall replace my staff?", answer: "No. NexCall handles the first response when your team is busy or unavailable — it captures the details and keeps things moving. Your team still owns the follow-up and final decisions." },
    { question: "Does NexCall answer real phone calls?", answer: "Yes. NexCall is designed for real business call handling. It gives callers a professional first response when your team is busy or offline." },
    { question: "Can I try a demo call?", answer: "Yes. Use the demo button, enter your phone number, and NexCall will call you to show you the receptionist experience from the caller side." },
    { question: "Can NexCall help with appointment requests?", answer: "Yes. NexCall can collect appointment details, preferred times, and caller context so your team can confirm the next step." },
    { question: "Who confirms appointments?", answer: "Your team does. NexCall captures the request and all the relevant details, then hands it off cleanly. The confirmation and scheduling happen on your end." },
    { question: "What happens if the AI is unsure?", answer: "It stays helpful without guessing. NexCall can capture the context and route the situation to a person when judgment is needed." },
    { question: "What if a caller needs a human?", answer: "NexCall can collect the important details and pass the conversation to your team with the context needed for follow-up." },
    { question: "Does NexCall work after hours?", answer: "Yes. NexCall covers nights, weekends, lunch rushes, and busy moments so callers do not hit a dead end." },
    { question: "What types of businesses is NexCall for?", answer: "The strongest fit is any business with repeat call patterns: dental offices, salons, clinics, restaurants, auto repair, legal offices, contractors, and local shops." },
    { question: "Can I customize the intake flow?", answer: "Yes. The questions NexCall asks and the information it collects can be tailored to your business type and the calls that matter most to your team." },
    { question: "Is checkout live?", answer: "Checkout is still being finalized. Choose a plan and request setup — we’ll confirm the right fit with you directly and get things started." },
    { question: "How does pricing work?", answer: "Three flat-rate plans: Starter ($349/mo), Appointment ($549/mo), and Growth ($849/mo+). Yearly billing saves 15%. Request setup and we’ll help you choose the right fit." },
    { question: "How do I get started?", answer: "Fill out the setup request form and we’ll help you choose the right next step. From there, the first setup focuses on your highest-value call types and the information your team needs." }
  ];

  return (
    <section id="faq" className="border-t border-[#baff39]/10 bg-[#020403] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="system-label text-center mx-auto w-fit">FAQ</p>
        <h2 className="mt-3 text-center text-4xl font-black leading-[0.93] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Every question a practical buyer asks{" "}
          <span className="accent-text">before going live.</span>
        </h2>
        <div className="mt-10 grid gap-3">
          {faqs.map((faq, index) => {
            const isOpen = Boolean(openFaqs[faq.question]);
            const panelId = `faq-panel-${index}`;
            return (
              <div key={faq.question} className="system-card group rounded-2xl p-5">
                <button
                  type="button" aria-expanded={isOpen} aria-controls={panelId}
                  onClick={() => setOpenFaqs((c) => ({ ...c, [faq.question]: !isOpen }))}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-2 text-left text-lg font-black text-white focus:outline-none focus:ring-4 focus:ring-[#baff39]/20"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="shrink-0 text-[#baff39]" size={21} aria-hidden="true" />
                    {faq.question}
                  </span>
                  <ChevronRight className={`shrink-0 transition ${isOpen ? "rotate-90" : ""}`} size={20} aria-hidden="true" />
                </button>
                {isOpen && <p id={panelId} className="mt-4 leading-7 text-slate-300">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLOSING LEAD CAPTURE — multi-step form, unchanged functionality
═══════════════════════════════════════════════════════════════════════════ */
function ClosingLeadCapture({ onCallDemo }: { onCallDemo: () => void }) {
  const [step, setStep] = useState(0);
  const [leadError, setLeadError] = useState("");
  const { register, handleSubmit, trigger, setValue, watch, formState: { errors, isSubmitSuccessful, isSubmitting } } = useForm<LeadForm>({
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
      label: "How big is your team?", field: "trucks" as const,
      input: (
        <select className="mt-3 min-h-12 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("trucks", { required: "Tell us the size of your team." })}>
          <option value="">Select team size</option>
          <option value="Solo">Solo owner/operator</option>
          <option value="2-5">2-5 people</option>
          <option value="6-20">6-20 people</option>
          <option value="21+">21+ people</option>
        </select>
      )
    },
    {
      label: "What type of business do you run?", field: "service" as const,
      input: <input type="text" placeholder="Example: dental office, salon, auto repair, law firm" className="mt-3 min-h-12 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("service", { required: "Tell us your business type." })} />
    },
    {
      label: "Where should Nexa call you?", field: "email" as const,
      input: (
        <div className="mt-3 grid gap-3">
          <input type="text" placeholder="Name (optional)" className="min-h-12 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("name")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="email" placeholder="Work email" className="min-h-12 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("email", { required: "Enter your work email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
            <input
              type="tel" inputMode="tel" autoComplete="tel" placeholder="(###) ###-####"
              className="min-h-12 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15"
              {...leadPhoneRegistration} value={leadPhoneValue}
              onChange={(e) => { leadPhoneRegistration.onChange(e); handlePhoneInputFormatting(e, (v) => setValue("phone", v, { shouldDirty: true, shouldValidate: true })); }}
              onBlur={(e) => { leadPhoneRegistration.onBlur(e); setValue("phone", formatPhoneForBlur(e.target.value), { shouldDirty: true, shouldValidate: true }); }}
            />
          </div>
        </div>
      )
    }
  ];

  async function nextStep() {
    if (await trigger(steps[step].field)) setStep((c) => Math.min(c + 1, steps.length - 1));
  }

  async function submitLead(data: LeadForm) {
    setLeadError("");
    setOutboundState("saving");
    try {
      await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, phone: normalizeOutboundPhoneInput(data.phone) }) }).catch(() => null);
      setOutboundState("calling");
      const response = await fetch("/api/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name || data.email.split("@")[0] || "Valued Lead", phone: normalizeOutboundPhoneInput(data.phone), source: "call_demo", page: "homepage", user_timezone: getBrowserTimeZone() })
      });
      const result = (await response.json().catch(() => null)) as OutboundCallResponse | null;
      if (!response.ok || result?.success !== true) { setLeadError(result?.message || result?.error || CALL_DEMO_FAILURE_MESSAGE); setOutboundState("error"); return; }
      setOutboundState("success");
    } catch (error) {
      setLeadError(error instanceof Error && error.message ? error.message : "Network error. Please check your connection and try again.");
      setOutboundState("error");
    }
  }

  const currentError = errors[steps[step].field]?.message || (step === 2 ? errors.phone?.message : undefined);

  return (
    <section id="lead" className="border-t border-[#baff39]/10 bg-[#050807] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div>
          <p className="system-label">Get started</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.93] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ready to stop missing <span className="accent-text">calls?</span>
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Try a real demo call or choose the plan that fits your call flow.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onCallDemo} data-fallback-href="/?demo=1"
              className="system-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25">
              <Phone size={18} aria-hidden="true" /> Start With a Demo
            </button>
            <a href="#pricing" className="system-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15">
              See Plans <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 rounded-2xl border border-[#baff39]/20 bg-[#baff39]/10 p-4 text-sm font-bold leading-6 text-[#eaffb8]">
            Takes about 60 seconds. No card required for the demo request.
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-400">
            <p><a href={`mailto:${NEXCALL_PUBLIC_EMAIL}`} className="font-bold text-slate-200 hover:text-[#baff39] transition">{NEXCALL_PUBLIC_EMAIL}</a></p>
            <p><a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="font-bold text-slate-200 hover:text-[#baff39] transition">{NEXCALL_PUBLIC_PHONE_DISPLAY}</a></p>
          </div>
        </div>

        <form onSubmit={handleSubmit(submitLead)} className="system-card rounded-[1.35rem] p-5 text-white sm:p-6">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[#baff39]">Step {step + 1} of {steps.length}</p>
          <div className="mb-6 flex gap-2">
            {steps.map((item, index) => (
              <span key={item.label} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-[#baff39]" : "bg-white/10"}`} />
            ))}
          </div>
          {isSubmitSuccessful ? (
            <div className="rounded-lg border border-[#baff39]/20 bg-[#baff39]/10 p-5">
              <p className="text-2xl font-black text-white">Calling now.</p>
              <p className="mt-2 leading-7 text-slate-300">Nexa is ringing your phone with the live front-desk demo.</p>
            </div>
          ) : (
            <>
              <label className="block text-2xl font-black text-white">{steps[step].label}{steps[step].input}</label>
              {currentError && <p className="mt-3 text-sm font-bold text-red-600">{currentError}</p>}
              {leadError && <div className="mt-3"><CallDemoFallbackNotice message={leadError} /></div>}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {step > 0 && (
                  <button type="button" onClick={() => setStep((c) => Math.max(c - 1, 0))} className="system-button-secondary min-h-12 rounded-lg px-5 py-3 font-black transition hover:border-[#baff39]/30 hover:text-[#baff39]">Back</button>
                )}
                {step < steps.length - 1 ? (
                  <button type="button" onClick={nextStep} className="system-button-primary min-h-12 flex-1 rounded-lg px-5 py-3 font-black transition hover:-translate-y-0.5">Continue</button>
                ) : (
                  <button type="submit" disabled={isSubmitting} className="system-button-primary min-h-12 flex-1 rounded-lg px-5 py-3 font-black transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70">
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

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  const quickLinks = [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#industries", label: "Industries" },
    { href: "#demos", label: "Demo" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" }
  ];
  const serviceLinks = ["AI Call Answering", "Appointment Requests", "Lead Capture", "After-Hours Coverage", "Human Backup Handoff"];
  const legalLinks = [
    { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" },
    { href: "/refund-policy", label: "Refunds" }, { href: "/ai-disclosure", label: "AI Disclosure" },
    { href: "/compliance", label: "Compliance" }, { href: "/cookie-notice", label: "Cookies" },
    { href: "/accessibility", label: "Accessibility" }
  ];

  return (
    <footer className="border-t border-[#baff39]/10 bg-[#020403] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 text-sm text-slate-400 md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
        <div>
          <a href="#top" className="flex w-fit items-center gap-4 transition hover:text-[#baff39]" aria-label="NexCall home">
            <span className="brand-mark-shell relative h-12 w-12">
              <Image src={brandAssets.mark} alt="" fill sizes="48px" className="brand-mark-img object-contain" />
            </span>
            <div>
              <p className="font-black text-white">NexCall</p>
              <p className="mt-1">AI receptionist coverage with clear handoffs.</p>
            </div>
          </a>
          <p className="mt-5 max-w-sm leading-7">NexCall answers when your team cannot, captures the details, helps move the next step forward, and sends clean notes.</p>
        </div>
        <nav aria-label="Quick links">
          <p className="font-black text-white">Quick links</p>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((item) => <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center font-bold transition hover:text-[#baff39]">{item.label}</a>)}
          </div>
        </nav>
        <div>
          <p className="font-black text-white">Services</p>
          <div className="mt-4 grid gap-3">
            {serviceLinks.map((item) => <a key={item} href="#how-it-works" className="inline-flex min-h-11 items-center transition hover:text-[#baff39]">{item}</a>)}
          </div>
        </div>
        <div>
          <p className="font-black text-white">Contact</p>
          <a href={`mailto:${NEXCALL_PUBLIC_EMAIL}`} className="mt-4 inline-flex min-h-11 items-center font-bold text-slate-200 transition hover:text-[#baff39]">{NEXCALL_PUBLIC_EMAIL}</a>
          <a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-slate-200 transition hover:text-[#baff39]">{NEXCALL_PUBLIC_PHONE_DISPLAY}</a>
          <p className="mt-3 leading-6">Demo calls and setup requests are sent through the site forms.</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-[#baff39]/10 pt-6 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 NexCall. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal links">
          {legalLinks.map((item) => <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center transition hover:text-[#baff39]">{item.label}</a>)}
        </nav>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE CHAT DOCK — AI-powered with history, typing indicator, action buttons
═══════════════════════════════════════════════════════════════════════════ */
type NexaAction = { label: string; type: string };

function LiveChatDock({ onCallDemo }: { onCallDemo: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("ai");
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatTerminated, setChatTerminated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    text: "Hi — I'm Nexa, NexCall's front desk assistant. I can help you understand what NexCall does, find the right plan, or try a demo call. What are you looking to handle better?"
  }]);
  const [pendingActions, setPendingActions] = useState<NexaAction[]>([]);
  const [humanForm, setHumanForm] = useState({ name: "", email: "", phone: "", businessName: "", businessType: "", message: "" });
  const [humanStatus, setHumanStatus] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  // Build history array for AI context (last 10 exchanges)
  function buildHistory(): Array<{ role: "user" | "assistant"; content: string }> {
    return messages
      .filter((m) => m.role === "visitor" || m.role === "assistant")
      .slice(-20)
      .map((m) => ({
        role: m.role === "visitor" ? ("user" as const) : ("assistant" as const),
        content: m.text
      }));
  }

  function handleAction(action: NexaAction) {
    setPendingActions([]);
    if (action.type === "open_demo") { setOpen(false); onCallDemo(); }
    else if (action.type === "scroll_pricing") { setOpen(false); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }
    else if (action.type === "start_lead_capture") { setMode("human"); }
    else if (action.type === "show_contact") {
      setMessages((c) => [...c, { role: "assistant", text: `You can reach NexCall at ${NEXCALL_PUBLIC_EMAIL} or ${NEXCALL_PUBLIC_PHONE_DISPLAY}.` }]);
    }
  }

  async function submitChatQuestion(q: string) {
    if (!q.trim() || chatTerminated || isAsking) return;
    const userMsg = q.trim();
    setChatTerminated(false);
    setIsAsking(true);
    setQuestion("");
    setPendingActions([]);
    setMessages((c) => [...c, { role: "visitor", text: userMsg }]);

    try {
      const response = await fetch("/api/chat/nexcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: buildHistory(),
          source: "live_chat",
          page: "homepage"
        })
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        answer?: string;
        actions?: NexaAction[];
        needsHuman?: boolean;
        terminated?: boolean;
      };

      const answer = result.message || result.answer || `You can reach NexCall at ${NEXCALL_PUBLIC_EMAIL} or ${NEXCALL_PUBLIC_PHONE_DISPLAY}.`;
      setMessages((c) => [...c, { role: "assistant", text: answer }]);
      if (result.actions?.length) setPendingActions(result.actions);
      if (result.terminated) setChatTerminated(true);
      if (result.needsHuman && !result.actions?.length) {
        setPendingActions([{ label: "Talk to the team", type: "start_lead_capture" }]);
      }
    } catch {
      setMessages((c) => [...c, {
        role: "assistant",
        text: `I wasn't able to reach the server. You can contact NexCall directly at ${NEXCALL_PUBLIC_EMAIL} or ${NEXCALL_PUBLIC_PHONE_DISPLAY}.`
      }]);
    } finally {
      setIsAsking(false);
    }
  }

  async function askQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitChatQuestion(question);
  }

  async function requestHuman(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHumanStatus("Sending...");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: humanForm.name,
        trucks: humanForm.name || "Chat visitor",
        service: humanForm.businessName || humanForm.businessType || "Live chat handoff",
        email: humanForm.email,
        phone: normalizeOutboundPhoneInput(humanForm.phone),
        message: [humanForm.message, humanForm.businessName ? `Business: ${humanForm.businessName}` : "", humanForm.businessType ? `Type: ${humanForm.businessType}` : ""].filter(Boolean).join("\n"),
        source: "live_chat"
      })
    });
    if (!response.ok) {
      setHumanStatus(`Could not confirm delivery. Reach us at ${NEXCALL_PUBLIC_EMAIL} or ${NEXCALL_PUBLIC_PHONE_DISPLAY}.`);
      return;
    }
    setHumanStatus("Done — the NexCall team will be in touch.");
    setHumanForm({ name: "", email: "", phone: "", businessName: "", businessType: "", message: "" });
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[390px] sm:bottom-6 sm:right-6">
      {open ? (
        <section
          className="modal-enter pointer-events-auto metal-panel flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/45"
          aria-label="NexCall live chat"
        >
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#baff39]/10 bg-white/[0.035] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#baff39]/20 bg-[#baff39]/10 text-[#baff39]">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-white">Nexa <span className="ml-1 rounded-full bg-[#baff39]/15 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wider text-[#baff39]">AI</span></p>
                <p className="text-xs font-bold text-slate-400">NexCall front desk assistant</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#baff39]/12 bg-white/[0.04] text-slate-100 transition hover:border-[#baff39]/30 hover:text-[#baff39]"
              aria-label="Collapse live chat">
              <Minus size={18} aria-hidden="true" />
            </button>
          </div>

          {/* ── Mode tabs ── */}
          <div className="grid shrink-0 grid-cols-2 border-b border-[#baff39]/10 bg-black/30 p-2">
            {[{ key: "ai" as const, label: "Ask Nexa", icon: Bot }, { key: "human" as const, label: "Talk to team", icon: UserRound }].map((tab) => (
              <button key={tab.key} type="button" onClick={() => setMode(tab.key)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${mode === tab.key ? "bg-[#baff39] text-[#020403]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}>
                <tab.icon size={16} aria-hidden="true" /> {tab.label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            <>
              {/* ── Quick actions strip ── */}
              <div className="shrink-0 border-b border-[#baff39]/10 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setOpen(false); onCallDemo(); }}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]">
                    Try demo call
                  </button>
                  <a href="#pricing" onClick={() => setOpen(false)}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]">
                    See plans
                  </a>
                  <button type="button" onClick={() => submitChatQuestion("Which plan fits my business?")}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]">
                    Which plan fits?
                  </button>
                  <button type="button" onClick={() => setMode("human")}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]">
                    Talk to team
                  </button>
                </div>
              </div>

              {/* ── Message thread ── */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 0 }}>
                {messages.map((msg, i) => (
                  <div key={`${msg.role}-${i}`} className={`flex ${msg.role === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-[1.55] ${
                      msg.role === "visitor"
                        ? "rounded-br-sm bg-[#baff39] font-semibold text-[#020403]"
                        : "rounded-bl-sm bg-white/[0.08] text-slate-100"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/[0.08] px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400"
                          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                          aria-hidden="true" />
                      ))}
                    </div>
                  </div>
                )}

                {/* AI-suggested action buttons */}
                {pendingActions.length > 0 && !isAsking && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pendingActions.map((action) => (
                      <button key={action.type} type="button" onClick={() => handleAction(action)}
                        className="rounded-full border border-[#baff39]/30 bg-[#baff39]/10 px-3 py-1.5 text-xs font-black text-[#baff39] transition hover:bg-[#baff39]/20">
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* ── Input bar ── */}
              <form onSubmit={askQuestion} className="shrink-0 border-t border-[#baff39]/10 p-3">
                <label className="sr-only" htmlFor="live-chat-question">Ask Nexa a question</label>
                <div className="flex gap-2">
                  <input
                    id="live-chat-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submitChatQuestion(question); } }}
                    placeholder={chatTerminated ? "Conversation ended" : "Ask about pricing, demos, appointments…"}
                    disabled={chatTerminated || isAsking}
                    maxLength={2000}
                    className="min-h-11 flex-1 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] disabled:opacity-60"
                  />
                  <button type="submit" disabled={isAsking || chatTerminated || !question.trim()}
                    className="flex min-h-11 w-12 shrink-0 items-center justify-center rounded-lg bg-[#baff39] text-[#020403] transition hover:brightness-110 disabled:opacity-50"
                    aria-label="Send message">
                    {isAsking
                      ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      : <Send size={16} aria-hidden="true" />}
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-bold leading-4 text-slate-500">
                  AI assistant · I can answer questions or connect you to the team.
                </p>
              </form>
            </>
          ) : (
            /* ── Human follow-up form ── */
            <form onSubmit={requestHuman} className="flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-sm leading-6 text-slate-300">Send your details and the NexCall team will follow up directly.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input required value={humanForm.name} onChange={(e) => setHumanForm((c) => ({ ...c, name: e.target.value }))} placeholder="Name" className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]" />
                <input value={humanForm.businessName} onChange={(e) => setHumanForm((c) => ({ ...c, businessName: e.target.value }))} placeholder="Business name" className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]" />
              </div>
              <input value={humanForm.businessType} onChange={(e) => setHumanForm((c) => ({ ...c, businessType: e.target.value }))} placeholder="Business type (e.g. dental, salon, legal)" className="min-h-11 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input type="email" required value={humanForm.email} onChange={(e) => setHumanForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email" className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]" />
                <input type="tel" required value={humanForm.phone}
                  onChange={(e) => handlePhoneInputFormatting(e, (v) => setHumanForm((c) => ({ ...c, phone: v })))}
                  onBlur={(e) => setHumanForm((c) => ({ ...c, phone: formatPhoneForBlur(e.target.value) }))}
                  placeholder="(###) ###-####" className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]" />
              </div>
              <textarea required value={humanForm.message} onChange={(e) => setHumanForm((c) => ({ ...c, message: e.target.value }))} placeholder="What do you want NexCall to handle?" className="min-h-24 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 py-2 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39]" />
              <button type="submit" className="system-button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition hover:-translate-y-0.5">
                <UserRound size={17} aria-hidden="true" /> Send to the team
              </button>
              {humanStatus && (
                <p className="rounded-lg border border-[#baff39]/20 bg-[#baff39]/10 p-3 text-xs font-bold text-[#eaffb8]">{humanStatus}</p>
              )}
            </form>
          )}
        </section>
      ) : (
        /* ── Collapsed toggle button ── */
        <button type="button" onClick={() => setOpen(true)}
          className="pointer-events-auto ml-auto flex min-h-12 items-center gap-3 rounded-2xl border border-[#baff39]/18 bg-[#050807]/92 px-4 py-3 text-left shadow-xl shadow-black/30 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#baff39]/40"
          aria-label="Open NexCall live chat">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#baff39] text-[#020403]">
            <MessageSquareText size={18} aria-hidden="true" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-black text-white">Ask Nexa</span>
            <span className="block text-xs font-bold text-slate-400">AI front desk assistant</span>
          </span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OUTBOUND CALL MODAL — unchanged functionality
═══════════════════════════════════════════════════════════════════════════ */
function CallDemoFallbackNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-3 text-sm font-bold text-red-100">
      <p>{message}</p>
      <p className="mt-2 text-red-50">
        You can also reach NexCall at{" "}
        <a className="underline underline-offset-2" href={`mailto:${NEXCALL_PUBLIC_EMAIL}`}>{NEXCALL_PUBLIC_EMAIL}</a>{" "}
        or{" "}
        <a className="underline underline-offset-2" href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`}>{NEXCALL_PUBLIC_PHONE_DISPLAY}</a>.
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
    setStatus("idle"); setError("");
    const t = window.setTimeout(() => phoneInputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape" && status !== "calling") onClose(); }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose, status]);

  if (!open) return null;

  async function submitOutboundCall(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setStatus("calling");
    const normalizedPhone = normalizeOutboundPhoneInput(phone);
    if (!isValidOutboundPhoneInput(phone)) {
      setPhone(formatPhoneDisplay(phone));
      setError("Enter a valid phone number with country code. US numbers can be typed as 10 digits.");
      setStatus("error"); return;
    }
    setPhone(formatPhoneForBlur(phone));
    try {
      const response = await fetch("/api/outbound-call", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: normalizedPhone, source: "call_demo", page: "homepage", user_timezone: getBrowserTimeZone() })
      });
      const result = (await response.json().catch(() => null)) as OutboundCallResponse | null;
      if (!response.ok || result?.success !== true) { setError(result?.message || result?.error || CALL_DEMO_FAILURE_MESSAGE); setStatus("error"); return; }
      setStatus("success");
    } catch { setError("Network error. Please check your connection and try again."); setStatus("error"); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="presentation">
      <div className="absolute inset-0" onClick={status === "calling" ? undefined : onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="outbound-call-title"
        className="modal-enter metal-panel relative w-full max-w-lg overflow-hidden rounded-[1.35rem] p-5 text-white shadow-2xl shadow-black/55 sm:p-6">
        <div className="scanline pointer-events-none absolute left-0 top-0 h-px w-full" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="system-label">Live demo call</p>
            <h2 id="outbound-call-title" className="mt-2 text-3xl font-black text-white">Let Nexa ring your phone.</h2>
            <p className="mt-3 leading-7 text-slate-300">Enter your number and the NexCall Receptionist will call you with the front-desk demo.</p>
          </div>
          <button type="button" onClick={onClose} disabled={status === "calling"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#baff39]/12 bg-white/[0.04] text-slate-200 transition hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close call demo modal">
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        {status === "success" ? (
          <div className="mt-6 rounded-xl border border-[#baff39]/30 bg-[#baff39]/10 p-5">
            <p className="text-xl font-black text-white">Your demo call is starting now.</p>
            <p className="mt-2 leading-7 text-slate-200">Nexa is ringing your phone. Pick up and ask about appointment requests, rescheduling, or missed calls.</p>
            <button type="button" onClick={onClose} className="system-button-primary mt-5 min-h-12 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25">Done</button>
          </div>
        ) : (
          <form onSubmit={submitOutboundCall} className="mt-6 grid gap-4">
            <label className="text-sm font-black text-slate-100">
              Phone number
              <input ref={phoneInputRef} type="tel" inputMode="tel" autoComplete="tel" required placeholder="(###) ###-####" value={phone}
                onChange={(e) => handlePhoneInputFormatting(e, setPhone)}
                onBlur={(e) => setPhone(formatPhoneForBlur(e.target.value))}
                className="mt-2 min-h-14 w-full rounded-xl border border-[#baff39]/15 bg-[#f8fbff] px-4 text-lg font-bold text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" />
            </label>
            <p className="-mt-2 text-xs font-bold leading-5 text-slate-400">US numbers can be entered as 10 digits; we format them automatically before calling.</p>
            <label className="text-sm font-black text-slate-100">
              Name <span className="font-semibold text-slate-400">(optional)</span>
              <input type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" />
            </label>
            {error && <CallDemoFallbackNotice message={error} />}
            <button type="submit" disabled={status === "calling"}
              className="system-button-primary inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25 disabled:cursor-wait disabled:opacity-75">
              {status === "calling" ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Calling Now…</>
              ) : "Call Me Now"}
            </button>
            <p className="text-xs font-bold leading-5 text-slate-400">By submitting, you are asking for an automated demo call. Standard carrier rates may apply.</p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PORTRAIT SVG — illustrated diverse faces for outcome cards
═══════════════════════════════════════════════════════════════════════════ */
function PortraitSVG({ skinTone, hairColor, shirtColor, hairStyle, hasGlasses = false }: PortraitConfig) {
  return (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
      <circle cx="30" cy="30" r="30" fill="#0b1218" />
      {hairStyle === "afro" && (<><ellipse cx="30" cy="18" rx="17" ry="15" fill={hairColor} /><circle cx="13" cy="27" r="9" fill={hairColor} /><circle cx="47" cy="27" r="9" fill={hairColor} /></>)}
      {hairStyle === "short" && (<><ellipse cx="30" cy="17" rx="14" ry="8" fill={hairColor} /><rect x="16" y="17" width="28" height="7" fill={hairColor} /></>)}
      {hairStyle === "medium" && (<><ellipse cx="30" cy="16" rx="15" ry="10" fill={hairColor} /><rect x="14" y="19" width="6" height="18" rx="3" fill={hairColor} /><rect x="40" y="19" width="6" height="18" rx="3" fill={hairColor} /></>)}
      {hairStyle === "long" && (<><ellipse cx="30" cy="16" rx="15" ry="10" fill={hairColor} /><rect x="13" y="19" width="7" height="26" rx="3.5" fill={hairColor} /><rect x="40" y="19" width="7" height="26" rx="3.5" fill={hairColor} /></>)}
      <ellipse cx="30" cy="30" rx="13" ry="15" fill={skinTone} />
      <ellipse cx="24.5" cy="27" rx="3.2" ry="3.5" fill="white" />
      <ellipse cx="35.5" cy="27" rx="3.2" ry="3.5" fill="white" />
      <circle cx="24.5" cy="27.5" r="2" fill="#0f0f0f" />
      <circle cx="35.5" cy="27.5" r="2" fill="#0f0f0f" />
      <circle cx="25.2" cy="26.8" r="0.7" fill="white" />
      <circle cx="36.2" cy="26.8" r="0.7" fill="white" />
      <path d="M21 23 Q24.5 21.5 28 23" stroke={hairColor} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M32 23 Q35.5 21.5 39 23" stroke={hairColor} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {hasGlasses && (<g opacity="0.72"><rect x="20" y="24.5" width="9" height="6" rx="2" stroke="#888" strokeWidth="1.2" fill="none" /><rect x="31" y="24.5" width="9" height="6" rx="2" stroke="#888" strokeWidth="1.2" fill="none" /><line x1="29" y1="27.5" x2="31" y2="27.5" stroke="#888" strokeWidth="1.2" /><line x1="13" y1="27.5" x2="20" y2="27.5" stroke="#888" strokeWidth="0.9" /><line x1="40" y1="27.5" x2="47" y2="27.5" stroke="#888" strokeWidth="0.9" /></g>)}
      <circle cx="27.5" cy="33" r="1.2" fill={skinTone === "#F5CBA7" ? "#c9956a" : "#4a2a0a"} opacity="0.4" />
      <circle cx="32.5" cy="33" r="1.2" fill={skinTone === "#F5CBA7" ? "#c9956a" : "#4a2a0a"} opacity="0.4" />
      <path d="M25 37.5 Q30 41.5 35 37.5" stroke="#7a3e18" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" />
      <rect x="24.5" y="42" width="11" height="9" rx="2" fill={skinTone} />
      <path d="M0 60 L10 52 Q20 48 30 47 Q40 48 50 52 L60 60 Z" fill={shirtColor} />
      <path d="M25 47 L28 55 L30 52 L32 55 L35 47" fill={shirtColor} stroke={shirtColor} strokeWidth="0.5" />
    </svg>
  );
}

/* unused but kept for type safety */
function Badge({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="system-card flex min-h-14 items-center gap-3 rounded-lg px-4 text-sm font-black text-white">
      <Icon className="text-[#baff39]" size={20} aria-hidden="true" /> {text}
    </div>
  );
}

// Badge kept for future use
