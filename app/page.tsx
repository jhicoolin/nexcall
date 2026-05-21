"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
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
  Zap,
  X,
  type LucideIcon
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { StatusStrip } from "@/components/ui/StatusStrip";
import { DecryptText as DecryptTextNew } from "@/components/ui/DecryptText";
import { CountUpStat } from "@/components/ui/CountUpStat";

const sectionMotion = {
  initial: { opacity: 0.98, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.44, ease: "easeOut" }
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

const voiceDemos: DemoScenario[] = [
  {
    id: "appointment",
    title: "Appointment Request",
    category: "Scheduling flow",
    businessType: "Healthcare, salons, dental offices, repair shops",
    callerNeed: "Move an appointment to Thursday afternoon.",
    nexcallAction: "Captures preferred time, caller details, reason, and urgency.",
    captures: ["Name", "Phone", "Preferred time", "Reason", "Urgency"],
    handoff: "Appointment request captured. Team follow-up ready.",
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
    result: "Lead captured"
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

const brandAssets = {
  mark: "/brand/nexcall-mark-transparent.png"
} as const;



export default function Home() {
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);

  const openDemo = () => setIsOutboundModalOpen(true);
  const closeDemo = () => setIsOutboundModalOpen(false);

  useEffect(() => {
    // ?demo=1 URL param support
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      setIsOutboundModalOpen(true);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
    }

    // Custom event support for live chat and other components
    const handler = () => setIsOutboundModalOpen(true);
    window.addEventListener("nexcall:open-demo", handler);
    return () => window.removeEventListener("nexcall:open-demo", handler);
  }, []);

  return (
    <main className="system-shell min-h-screen w-full overflow-hidden text-slate-50">
      <Header onCallDemo={openDemo} />
      <Hero onCallDemo={openDemo} />
      <TrustStrip />
      <StatusStrip />
      <HumanTrustStrip />
      <TrustSignalBar />
      <HowItWorks />
      <JobsDone />
      <VoiceAgentDemos onCallDemo={openDemo} />
      <Pricing />
      <FAQSection />
      <ClosingLeadCapture onCallDemo={openDemo} />
      <Footer />
      <LiveChatDock onCallDemo={openDemo} />
      <OutboundCallModal open={isOutboundModalOpen} onClose={closeDemo} />
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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#baff39]/10 bg-[#020403]/76 backdrop-blur-2xl">
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
        <div className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400 md:flex">
          {navItems.map((item) => (
            <a key={item.href} className="transition hover:text-[#baff39]" href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCallDemo}
            className="system-button-primary hidden min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25 sm:inline-flex"
          >
            <Phone size={17} aria-hidden="true" />
            Call Demo
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="system-button-primary flex h-11 w-11 items-center justify-center rounded-xl transition focus:outline-none focus:ring-4 focus:ring-[#baff39]/25 md:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {mobileOpen ? (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 md:hidden">
          <div className="system-card rounded-2xl p-3 shadow-2xl shadow-black/50">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-[#baff39]/8 hover:text-[#baff39]"
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
              className="system-button-primary mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black"
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
    <section id="top" className="relative overflow-hidden pt-24 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(168,255,0,0.10),transparent_26rem),radial-gradient(circle_at_18%_22%,rgba(141,217,232,0.06),transparent_28rem)]" aria-hidden="true" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px glass-line" aria-hidden="true" />
      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-8 px-4 pb-14 pt-8 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:items-center lg:px-8 lg:pb-24 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.9fr)]">
        <div className="flex w-full min-w-0 max-w-full flex-col justify-center sm:max-w-[42rem] lg:max-w-[40rem]">
          <p className="inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#A8FF00] uppercase mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8FF00] animate-pulse" aria-hidden="true" />
            AI Receptionist · Available 24/7
          </p>
          {/*
            ONE DecryptText for the FULL phrase — no dual animation, no layout shift.
            accentSuffix applies lime colour to "next call." only after animation settles.
            The container has min-h so scramble chars don't cause reflow.
          */}
          <h1 className="min-h-[1em] text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-white mb-5 sm:mb-6 sm:leading-[0.92]">
            <DecryptTextNew
              text="Never miss your next call."
              duration={1200}
              delay={80}
              accentSuffix="next call."
              accentClassName="text-[#A8FF00]"
            />
          </h1>
          <p className="text-base sm:text-lg text-[#9CA3AF] max-w-lg mb-7 sm:mb-8 leading-relaxed">
            NexCall answers calls, captures lead details, supports appointment requests, and sends your team clean notes — 24/7.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row mb-4">
            <button
              type="button"
              onClick={onCallDemo}
              className="inline-flex min-h-[52px] w-full items-center justify-center sm:w-auto sm:min-h-[46px] px-7 bg-[#A8FF00] text-black font-bold text-sm tracking-wide rounded-[6px] hover:bg-[#bfff33] transition-colors"
            >
              Try a Demo Call
            </button>
            <a
              href="#pricing"
              className="inline-flex min-h-[52px] w-full items-center justify-center sm:w-auto sm:min-h-[46px] px-7 border border-white/15 text-white font-semibold text-sm rounded-[6px] hover:bg-white/5 transition-colors"
            >
              View Plans
            </a>
          </div>
          <p className="text-xs text-[#4B5563]">No card required. Keep your phone nearby.</p>
        </div>
        <HeroCallJourney />
      </div>
    </section>
  );
}

function HeroCallJourney() {
  const commandRows = [
    { icon: '📞', label: 'Incoming call', status: 'CONNECTED', color: '#A8FF00' },
    { icon: '✅', label: 'Caller need detected', status: 'CAPTURED', color: '#A8FF00' },
    { icon: '📅', label: 'Appointment request', status: 'NOTED', color: '#60a5fa' },
    { icon: '🧾', label: 'Team summary', status: 'READY', color: '#A8FF00' },
    { icon: '👤', label: 'Human handoff', status: 'AVAILABLE', color: '#9CA3AF' },
  ];

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-xs sm:max-w-sm lg:max-w-sm">
      <div className="bg-[#0E1117] border border-white/[0.08] rounded-[10px] p-4 sm:p-5 space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
          <span className="brand-mark-shell relative h-7 w-7 sm:h-8 sm:w-8 shrink-0">
            <Image src={brandAssets.mark} alt="" fill sizes="32px" className="brand-mark-img object-contain" />
          </span>
          <div>
            <p className="text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#A8FF00]">NexCall Response Layer</p>
            <p className="text-xs text-[#9CA3AF]">Active · 24/7</p>
          </div>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#A8FF00] animate-pulse" aria-hidden="true" />
        </div>
        {commandRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base" role="img" aria-hidden="true">{row.icon}</span>
              <span className="text-xs sm:text-sm text-[#9CA3AF]">{row.label}</span>
            </div>
            <span className="text-[0.65rem] sm:text-xs font-mono font-semibold tracking-wider shrink-0" style={{ color: row.color }}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
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
    <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-3 text-sm font-bold text-red-100">
      <p>{message}</p>
      <p className="mt-2 text-red-50">
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
        body: JSON.stringify({
          name,
          phone: normalizedPhone,
          source: "call_demo",
          page: "homepage",
          user_timezone: getBrowserTimeZone()
        })
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
        className="metal-panel relative w-full max-w-lg overflow-hidden rounded-[1.35rem] p-5 text-white shadow-2xl shadow-black/55 sm:p-6"
      >
        <div className="scanline pointer-events-none absolute left-0 top-0 h-px w-full" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="system-label">Live demo call</p>
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#baff39]/12 bg-white/[0.04] text-slate-200 transition hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close call demo modal"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6 rounded-xl border border-[#baff39]/30 bg-[#baff39]/10 p-5">
            <p className="text-xl font-black text-white">Your demo call is starting now.</p>
            <p className="mt-2 leading-7 text-slate-200">
              Nexa is ringing your phone. Pick up and ask about appointment requests, rescheduling, or missed calls.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="system-button-primary mt-5 min-h-12 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
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
                className="mt-2 min-h-14 w-full rounded-xl border border-[#baff39]/15 bg-[#f8fbff] px-4 text-lg font-bold text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15"
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
                className="mt-2 min-h-12 w-full rounded-xl border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15"
              />
            </label>
            {error ? (
              <CallDemoFallbackNotice message={error} />
            ) : null}
            <button
              type="submit"
              disabled={status === "calling"}
              className="system-button-primary inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25 disabled:cursor-wait disabled:opacity-75"
            >
              {status === "calling" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Calling Now…
                </>
              ) : "Call Me Now"}
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
    { value: 500, suffix: "+", label: "Calls handled", decimals: 0 },
    { value: 10, suffix: "+", label: "Business categories", decimals: 0 },
    { value: 50, suffix: "M+", label: "Minutes covered", decimals: 0 },
    { value: 99.9, suffix: "%", label: "Uptime reliability", decimals: 1 }
  ];

  return (
    <section className="border-y border-[#baff39]/10 bg-[#020403]/80">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <div>
          <p className="system-label">
            Proof, not noise
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
            Built for businesses that cannot afford <span className="accent-text">missed calls.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            A tight operating layer for answered calls, captured details,
            appointment requests, urgent routing, and clean team notes.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:content-center">
          {stats.map((stat) => (
            <div key={stat.label} className="system-card system-card-hover rounded-2xl p-4 text-center">
              <p className="text-3xl font-black tracking-tight text-[#A8FF00]">
                <CountUpStat
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={1400}
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

type HumanAvatarOutcome = {
  initials: string;
  color: string;
  skin: string;
  shirt: string;
  role: string;
  quote: string;
};

function HumanAvatar({
  outcome,
  compact = false,
  active = false
}: {
  outcome: HumanAvatarOutcome;
  compact?: boolean;
  active?: boolean;
}) {
  const size = compact ? "h-9 w-9" : "h-12 w-12";
  const text = compact ? "text-xs" : "text-sm";
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-black text-white shrink-0 border-2 transition ${
        active ? "border-[#baff39] scale-110" : "border-transparent opacity-70"
      } ${outcome.skin}`}
      aria-label={outcome.role}
      title={outcome.role}
    >
      <span className={`${text} font-black`}>{outcome.initials}</span>
    </div>
  );
}

function HumanTrustStrip() {
  const outcomes = [
    {
      quote: "Fewer missed calls. Faster follow-up.",
      role: "Local service team",
      initials: "LS",
      color: "from-[#baff39] via-[#7fdc75] to-[#476e7a]",
      skin: "bg-[#8f5a3b]",
      shirt: "bg-[#d9ff8b]"
    },
    {
      quote: "Calls get answered even when we are busy.",
      role: "Clinic front desk",
      initials: "CF",
      color: "from-[#e7f7ff] via-[#8bc6c8] to-[#263848]",
      skin: "bg-[#d2a172]",
      shirt: "bg-[#6db7c8]"
    },
    {
      quote: "Cleaner handoffs. Less chaos.",
      role: "Appointment-heavy office",
      initials: "AO",
      color: "from-[#d7ff70] via-[#5f8c79] to-[#141a20]",
      skin: "bg-[#5f3a2f]",
      shirt: "bg-[#f2f7ef]"
    },
    {
      quote: "Our front desk finally has backup.",
      role: "Owner-led business",
      initials: "OB",
      color: "from-[#f4f7ea] via-[#9db871] to-[#1f2b20]",
      skin: "bg-[#b67b56]",
      shirt: "bg-[#99c46a]"
    }
  ];
  const [active, setActive] = useState(0);
  const activeOutcome = outcomes[active] || outcomes[0];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % outcomes.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [outcomes.length]);

  const move = (direction: -1 | 1) => {
    setActive((current) => (current + direction + outcomes.length) % outcomes.length);
  };

  return (
    <section className="border-b border-[#baff39]/10 bg-[#050807] py-8 sm:py-10" aria-labelledby="human-trust-title">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[1.35rem] border border-[#baff39]/12 bg-[#07100d]/80 p-4 shadow-2xl shadow-black/25 sm:p-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="system-label">Common outcomes businesses look for</p>
            <h2 id="human-trust-title" className="mt-3 max-w-lg text-3xl font-black text-white sm:text-4xl">
              Real teams need calls handled with <span className="accent-text">context.</span>
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">
              NexCall is built around practical reception outcomes: answered calls,
              captured details, clear handoffs, and fewer follow-up gaps.
            </p>
            <div className="mt-5 flex items-center gap-2" aria-label="Representative business team avatars">
              {outcomes.map((outcome, index) => (
                <HumanAvatar key={outcome.role} outcome={outcome} compact active={active === index} />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="system-card rounded-2xl p-4 sm:p-5" aria-live="polite">
              <div key={active} className="trust-card-fade flex items-center gap-4">
                <HumanAvatar outcome={activeOutcome} active />
                <div>
                  <p className="text-lg font-black leading-6 text-white">&ldquo;{activeOutcome.quote}&rdquo;</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    {activeOutcome.role}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                {outcomes.map((outcome, index) => (
                  <button
                    key={outcome.role}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show outcome: ${outcome.quote}`}
                    aria-pressed={active === index}
                    className={`h-2 rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#baff39]/20 ${
                      active === index ? "bg-[#baff39]" : "bg-white/14 hover:bg-white/28"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 sm:flex-col">
              <button
                type="button"
                onClick={() => move(-1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#baff39]/18 bg-black/30 text-slate-100 transition hover:-translate-y-0.5 hover:border-[#baff39]/45 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/20"
                aria-label="Previous outcome"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#baff39]/18 bg-black/30 text-slate-100 transition hover:-translate-y-0.5 hover:border-[#baff39]/45 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/20"
                aria-label="Next outcome"
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function VoiceAgentDemos({ onCallDemo }: { onCallDemo: () => void }) {
  const [selected, setSelected] = useState(0);
  const scenario = voiceDemos[selected] || voiceDemos[0];

  return (
    <section id="demos" className="border-b border-[#baff39]/10 bg-[#020403] py-14 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="system-label">Experience NexCall</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-6xl">
              See how NexCall moves a caller to the <span className="accent-text">next step.</span>
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Preview the flow, then try the real call. NexCall turns one caller need into a clean, team-ready next step.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCallDemo}
                className="system-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
              >
                <Phone size={18} aria-hidden="true" />
                Try a Real Demo Call
              </button>
              <a
                href="#pricing"
                className="system-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
              >
                View Plans
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-400">No card required. Keep your phone nearby.</p>
            <div className="mt-7 grid gap-2">
              {voiceDemos.map((demo, index) => {
                const ScenarioIcon =
                  demo.id === "appointment" ? CalendarCheck : demo.id === "lead" ? Zap : Check;

                return (
                  <button
                    key={demo.title}
                    type="button"
                    onClick={() => setSelected(index)}
                    aria-pressed={selected === index}
                    className={`group rounded-2xl border p-4 text-left transition ${
                      selected === index
                        ? "border-[#baff39]/55 bg-[#baff39]/10 shadow-lg shadow-[#baff39]/5"
                        : "border-white/10 bg-white/[0.035] hover:border-[#baff39]/25 hover:bg-white/[0.055]"
                    }`}
                  >
                    <p className="flex items-center gap-3 text-sm font-black text-white">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          selected === index
                            ? "border-[#baff39]/35 bg-[#baff39]/15 text-[#baff39]"
                            : "border-white/10 bg-black/25 text-slate-300 group-hover:text-[#baff39]"
                        }`}
                      >
                        <ScenarioIcon size={16} aria-hidden="true" />
                      </span>
                      {demo.title}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-400">{demo.businessType}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="metal-panel relative overflow-hidden rounded-[1.35rem] p-5 text-white shadow-2xl shadow-black/40">
            <div className="scanline pointer-events-none absolute left-0 top-0 h-px w-full" />
            <div className="flex flex-col gap-4 border-b border-[#baff39]/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#baff39]">{scenario.category}</p>
                <h3 className="mt-2 text-3xl font-black text-white">{scenario.title}</h3>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-400">{scenario.businessType}</p>
              </div>
              <p className="w-fit rounded-full border border-[#baff39]/25 bg-[#baff39]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#dfff91]">
                {scenario.result}
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              {[
                { label: "Caller need", text: scenario.callerNeed, icon: Phone },
                { label: "NexCall action", text: scenario.nexcallAction, icon: Workflow },
                { label: "Team handoff", text: scenario.handoff, icon: ClipboardList }
              ].map((item) => {
                const ItemIcon = item.icon;

                return (
                  <div key={item.label} className="system-card grid gap-3 rounded-2xl p-4 sm:grid-cols-[8.5rem_1fr]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#baff39]/20 bg-[#baff39]/10 text-[#baff39]">
                        <ItemIcon size={15} aria-hidden="true" />
                      </span>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                    </div>
                    <p className="text-sm font-bold leading-6 text-slate-100">{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[#baff39]/12 bg-black/35 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#baff39]">Captured details</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {scenario.captures.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <Check size={16} className="text-[#baff39]" aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#baff39]/20 bg-[#baff39]/[0.08] p-4">
              <p className="text-sm font-black text-white">The preview shows the handoff logic.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The real demo call lets you hear the receptionist experience from the caller side on your own phone.
              </p>
            </div>
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
    <section id="services" className="border-b border-[#baff39]/10 bg-[#050807] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="system-label">Core capabilities</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">
          The front desk layer for <span className="accent-text">calls that matter.</span>
        </h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          NexCall focuses on the moments that become revenue, bookings, and customer trust: answering,
          capturing, routing, and handing off without making your team guess.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {industries.map((item) => (
            <span key={item} className="rounded-full border border-[#baff39]/12 bg-[#baff39]/[0.045] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-slate-300">
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
      copy: "NexCall picks up before callers hit a dead end."
    },
    {
      label: "Understand",
      title: "The need is identified",
      copy: "It captures the caller's need, contact details, and urgency."
    },
    {
      label: "Route",
      title: "The next step is routed",
      copy: "It supports appointment requests, lead capture, FAQs, or human handoff."
    },
    {
      label: "Report",
      title: "Your team gets context",
      copy: "Your team receives a clean summary with the next step."
    }
  ];

  return (
    <section id="how-it-works" className="border-y border-[#baff39]/10 bg-[#020403] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="system-label">How it works</p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Answer. Understand. Route. <span className="accent-text">Report.</span>
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              The workflow mirrors what a strong receptionist already does: answer,
              listen, route, and brief the team.
            </p>
            <a
              href="#lead"
              className="system-button-primary mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
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
                className="system-card system-card-hover rounded-[1.25rem] p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-[#baff39]/20 bg-[#baff39]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#baff39]">
                    {step.label}
                  </span>
                  <span className="text-3xl font-black text-[#baff39]/25">0{index + 1}</span>
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
      className="system-card system-card-hover rounded-[1.25rem] p-6"
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#baff39]/20 bg-[#baff39]/10 text-[#baff39]">
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
        throw new Error("This plan is being finalized. Request a demo and we will help you activate it.");
      }

      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "This plan is being finalized. Request a demo and we will help you activate it."
      );
      setCheckoutLoading(null);
    }
  }

  return (
    <motion.section {...sectionMotion} id="pricing" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="system-label">Predictable pricing</p>
          <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            Clear plans for teams ready to <span className="accent-text">stop missing calls.</span>
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
        <div className="flex w-full max-w-xs rounded-xl border border-[#baff39]/12 bg-black/30 p-1 shadow-sm">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              className={`min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-black capitalize transition ${
                billing === option ? "bg-[#baff39] text-[#020403]" : "text-slate-300 hover:text-white"
              }`}
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
            <div
              key={plan.name}
              className={`system-card system-card-hover relative rounded-[1.35rem] p-6 ${
                plan.featured ? "system-card-featured" : ""
              }`}
            >
              {plan.featured ? (
                <p className="absolute right-5 top-5 rounded-full bg-[#baff39] px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#020403]">
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
                    <Check className="mt-0.5 shrink-0 text-[#baff39]" size={18} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => startCheckout(plan.id)}
                disabled={checkoutLoading !== null}
                className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${
                  plan.featured
                    ? "system-button-primary focus:ring-[#baff39]/25"
                    : "system-button-secondary hover:border-[#baff39]/30 hover:text-[#baff39] focus:ring-[#baff39]/15"
                }`}
              >
                {checkoutLoading === plan.id ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opening Checkout…
                  </>
                ) : `Start With ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {checkoutError ? (
        <div className="mt-6 rounded-xl border border-amber-400/50 bg-amber-400/10 p-5 text-sm font-bold text-amber-100">
          <p className="text-base font-black text-amber-50">{checkoutError}</p>
          <p className="mt-2 text-amber-200/80">
            Want to get started now?{" "}
            <a href="mailto:nexcall@proton.me" className="underline underline-offset-2 hover:text-amber-100">
              Email nexcall@proton.me
            </a>{" "}
            or call{" "}
            <a href="tel:+12022006578" className="underline underline-offset-2 hover:text-amber-100">
              (202) 200-6578
            </a>
            .
          </p>
        </div>
      ) : null}
    </motion.section>
  );
}

function FAQSection() {
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});
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
    <section id="faq" className="border-t border-[#baff39]/10 bg-[#050807] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="system-label text-center">FAQ</p>
        <h2 className="mt-3 text-center text-4xl font-black text-white sm:text-5xl">
          Everything a practical buyer asks <span className="accent-text">before going live.</span>
        </h2>
        <div className="mt-10 grid gap-3">
          {faqs.map((faq, index) => {
            const isOpen = Boolean(openFaqs[faq.question]);
            const panelId = `faq-panel-${index}`;

            return (
              <div key={faq.question} className="system-card group rounded-2xl p-5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    setOpenFaqs((current) => ({
                      ...current,
                      [faq.question]: !isOpen
                    }));
                  }}
                  className="flex w-full cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-black text-white focus:outline-none focus:ring-4 focus:ring-[#baff39]/20"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="shrink-0 text-[#baff39]" size={21} aria-hidden="true" />
                    {faq.question}
                  </span>
                  <ChevronRight
                    className={`shrink-0 transition ${isOpen ? "rotate-90" : ""}`}
                    size={20}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? (
                  <p id={panelId} className="mt-4 leading-7 text-slate-300">
                    {faq.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

function ClosingLeadCapture({ onCallDemo }: { onCallDemo: () => void }) {
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
      label: "What type of business do you run?",
      field: "service" as const,
      input: (
        <input type="text" placeholder="Example: dental office, salon, auto repair, law firm" className="mt-3 min-h-12 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("service", { required: "Tell us your business type." })} />
      )
    },
    {
      label: "Where should Nexa call you?",
      field: "email" as const,
      input: (
        <div className="mt-3 grid gap-3">
          <input type="text" placeholder="Name (optional)" className="min-h-12 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("name")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="email" placeholder="Work email" className="min-h-12 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15" {...register("email", { required: "Enter your work email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(###) ###-####"
              className="min-h-12 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-4 text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39] focus:ring-4 focus:ring-[#baff39]/15"
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
          source: "call_demo",
          page: "homepage",
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
    <section id="lead" className="border-t border-[#baff39]/10 bg-[#020403] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
        <div>
          <p className="system-label">Get started</p>
          <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            Ready to stop missing <span className="accent-text">calls?</span>
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Try a real demo call or choose the plan that fits your call flow. The
            first step is simple: tell us your business type and where Nexa should call.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCallDemo}
              className="system-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
            >
              <Phone size={18} aria-hidden="true" />
              Try Demo Call
            </button>
            <a
              href="#pricing"
              className="system-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
            >
              View Plans
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 rounded-2xl border border-[#baff39]/20 bg-[#baff39]/10 p-4 text-sm font-bold leading-6 text-[#eaffb8]">
            Takes about 60 seconds. No card required for the demo request.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Badge icon={Users} text="Built for many industries" />
            <Badge icon={MessageSquareText} text="Calls, notes, and follow-up" />
          </div>
        </div>
        <form onSubmit={handleSubmit(submitLead)} className="system-card rounded-[1.35rem] p-5 text-white sm:p-6">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[#baff39]">
            Step {step + 1} of {steps.length}
          </p>
          <div className="mb-6 flex gap-2">
            {steps.map((item, index) => (
              <span key={item.label} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-[#baff39]" : "bg-white/10"}`} />
            ))}
          </div>
          {isSubmitSuccessful ? (
            <div className="rounded-lg border border-[#baff39]/20 bg-[#baff39]/10 p-5">
              <p className="text-2xl font-black text-white">Calling now.</p>
              <p className="mt-2 leading-7 text-slate-300">
                Nexa is ringing your phone with the live front-desk demo.
              </p>
            </div>
          ) : (
            <>
              <label className="block text-2xl font-black text-white">
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
                  <button type="button" onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))} className="system-button-secondary min-h-12 rounded-lg px-5 py-3 font-black transition hover:border-[#baff39]/30 hover:text-[#baff39]">
                    Back
                  </button>
                ) : null}
                {step < steps.length - 1 ? (
                  <button type="button" onClick={nextStep} className="system-button-primary min-h-12 flex-1 rounded-lg px-5 py-3 font-black transition hover:-translate-y-0.5">
                    Continue
                  </button>
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

function Badge({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="system-card flex min-h-14 items-center gap-3 rounded-lg px-4 text-sm font-black text-white">
      <Icon className="text-[#baff39]" size={20} aria-hidden="true" />
      {text}
    </div>
  );
}

function LiveChatDock({ onCallDemo }: { onCallDemo: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("ai");
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatTerminated, setChatTerminated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi - I am Nexa, NexCall's front desk assistant. I can help you try a demo call, compare plans, or get your info to the team. What would you like to handle better: missed calls, appointment requests, or lead capture?"
    }
  ]);
  const [humanForm, setHumanForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "",
    message: ""
  });
  const [humanStatus, setHumanStatus] = useState("");

  function askQuickQuestion(nextQuestion: string) {
    setMode("ai");
    if (!chatTerminated) {
      void submitChatQuestion(nextQuestion);
    }
  }

  function openDemoFromChat() {
    setOpen(false);
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: "Use the Call Demo and keep your phone nearby. No card is required for the demo request."
      }
    ]);
    onCallDemo();
  }

  async function submitChatQuestion(cleanQuestion: string) {
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

      const answer = result.answer;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: answer
        }
      ]);
      if (result.terminated) {
        setChatTerminated(true);
      }
    } catch (error) {
      setChatError("I could not confirm an answer from here.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `You can still reach the NexCall team at ${NEXCALL_PUBLIC_EMAIL} or ${NEXCALL_PUBLIC_PHONE_DISPLAY}.`
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitChatQuestion(question.trim());
  }

  async function requestHuman(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        message: [
          humanForm.message,
          humanForm.businessName ? `Business: ${humanForm.businessName}` : "",
          humanForm.businessType ? `Business type: ${humanForm.businessType}` : ""
        ]
          .filter(Boolean)
          .join("\n"),
        source: "live_chat"
      })
    });

    if (!response.ok) {
      setHumanStatus(
        `I could not confirm delivery from here. You can reach the team directly at ${NEXCALL_PUBLIC_EMAIL} or ${NEXCALL_PUBLIC_PHONE_DISPLAY}.`
      );
      return;
    }

    setHumanStatus("Thanks - I will make sure the NexCall team has that.");
    setHumanForm({ name: "", email: "", phone: "", businessName: "", businessType: "", message: "" });
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[390px] sm:bottom-6 sm:right-6">
      {open ? (
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="pointer-events-auto metal-panel max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl shadow-2xl shadow-black/45"
          aria-label="NexCall live chat"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#baff39]/10 bg-white/[0.035] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#baff39]/20 bg-[#baff39]/10 text-[#baff39]">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-white">Nexa</p>
                <p className="text-xs font-bold text-slate-400">NexCall front desk assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#baff39]/12 bg-white/[0.04] text-slate-100 transition hover:border-[#baff39]/30 hover:text-[#baff39]"
              aria-label="Collapse live chat"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 border-b border-[#baff39]/10 bg-black/30 p-2">
            {[
              { key: "ai" as const, label: "Quick answer", icon: Bot },
              { key: "human" as const, label: "Human follow-up", icon: UserRound }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${
                  mode === tab.key ? "bg-[#baff39] text-[#020403]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <tab.icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            <div className="bg-transparent">
              <div className="border-b border-[#baff39]/10 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={openDemoFromChat}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]"
                  >
                    Try demo call
                  </button>
                  <a
                    href="#pricing"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]"
                  >
                    View pricing
                  </a>
                  <button
                    type="button"
                    onClick={() => askQuickQuestion("Which plan fits my business?")}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]"
                  >
                    Which plan fits?
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("human")}
                    className="rounded-lg border border-[#baff39]/12 bg-white/[0.045] px-3 py-2 text-left text-xs font-black text-white transition hover:border-[#baff39]/30 hover:text-[#baff39]"
                  >
                    Talk to team
                  </button>
                </div>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 ${
                        message.role === "visitor" ? "bg-[#baff39] text-[#020403]" : "bg-white/[0.07] text-slate-100"
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
              <form onSubmit={askQuestion} className="border-t border-[#baff39]/10 p-3">
                <label className="sr-only" htmlFor="live-chat-question">
                  Ask NexCall a question
                </label>
                <div className="flex gap-2">
                  <input
                    id="live-chat-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={chatTerminated ? "Conversation ended" : "Ask about pricing, demos, appointments..."}
                    disabled={chatTerminated}
                    className="min-h-11 flex-1 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39]"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || chatTerminated}
                    className="flex min-h-11 w-12 items-center justify-center rounded-lg bg-[#baff39] text-[#020403] transition hover:brightness-110 disabled:opacity-60"
                    aria-label="Send chat question"
                  >
                    <Send size={17} aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-bold leading-4 text-slate-400">
                  I am NexCall&apos;s website assistant. I can help now or route you to the team.
                </p>
              </form>
            </div>
          ) : (
            <form onSubmit={requestHuman} className="space-y-3 bg-transparent p-4">
              <p className="text-sm leading-6 text-slate-300">
                Send your details to the NexCall team for human follow-up.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  required
                  value={humanForm.name}
                  onChange={(event) => setHumanForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Name"
                  className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]"
                />
                <input
                  value={humanForm.businessName}
                  onChange={(event) => setHumanForm((current) => ({ ...current, businessName: event.target.value }))}
                  placeholder="Business name"
                  className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]"
                />
              </div>
              <input
                  value={humanForm.businessType}
                  onChange={(event) => setHumanForm((current) => ({ ...current, businessType: event.target.value }))}
                  placeholder="Business type"
                  className="min-h-11 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="email"
                  required
                  value={humanForm.email}
                  onChange={(event) => setHumanForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]"
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
                  className="min-h-11 rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 text-sm text-[#172033] outline-none focus:border-[#baff39]"
                />
              </div>
              <textarea
                required
                value={humanForm.message}
                onChange={(event) => setHumanForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="What do you want NexCall to handle?"
                className="min-h-24 w-full rounded-lg border border-[#baff39]/15 bg-[#f8fbff] px-3 py-2 text-sm text-[#172033] outline-none placeholder:text-stone-400 focus:border-[#baff39]"
              />
              <button
                type="submit"
                className="system-button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition hover:-translate-y-0.5"
              >
                <UserRound size={17} aria-hidden="true" />
                Send to the team
              </button>
              {humanStatus ? (
                <p className="rounded-lg border border-[#baff39]/20 bg-[#baff39]/10 p-3 text-xs font-bold text-[#eaffb8]">
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
          className="pointer-events-auto ml-auto flex min-h-12 items-center gap-3 rounded-2xl border border-[#baff39]/18 bg-[#050807]/92 px-4 py-3 text-left shadow-xl shadow-black/30 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#baff39]/40"
          aria-label="Open NexCall live chat"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#baff39] text-[#020403]">
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
    <footer className="border-t border-[#baff39]/10 bg-[#020403] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 text-sm text-slate-400 md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
        <div>
          <a href="#top" className="flex w-fit items-center gap-4 transition hover:text-[#baff39]" aria-label="NexCall home">
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
          </a>
          <p className="mt-5 max-w-sm leading-7">
            NexCall answers when your team cannot, captures the details, helps move
            the next step forward, and sends clean notes.
          </p>
        </div>
        <nav aria-label="Quick links">
          <p className="font-black text-white">Quick links</p>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((item) => (
              <a key={item.href} href={item.href} className="font-bold transition hover:text-[#baff39]">
                {item.label}
              </a>
            ))}
          </div>
        </nav>
        <div>
          <p className="font-black text-white">Services</p>
          <div className="mt-4 grid gap-3">
            {serviceLinks.map((item) => (
              <a key={item} href="#services" className="transition hover:text-[#baff39]">
                {item}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="font-black text-white">Contact</p>
          <a href={`mailto:${NEXCALL_PUBLIC_EMAIL}`} className="mt-4 block font-bold text-slate-200 transition hover:text-[#baff39]">
            {NEXCALL_PUBLIC_EMAIL}
          </a>
          <a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="mt-3 block font-bold text-slate-200 transition hover:text-[#baff39]">
            {NEXCALL_PUBLIC_PHONE_DISPLAY}
          </a>
          <p className="mt-3 leading-6">Demo calls and setup requests are captured through the site forms.</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-[#baff39]/10 pt-6 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 NexCall. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal links">
          {legalLinks.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#baff39]">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
