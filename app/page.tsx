"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Menu,
  MessageSquareText,
  Minus,
  Phone,
  Send,
  UserRound,
  X
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

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
    <main className="system-shell min-h-screen w-full overflow-hidden text-slate-900">
      <WarmHeader />
      <WarmHero onCallDemo={openDemo} />
      <TrustLayer />
      <ServiceFlow />
      <LocalProof onCallDemo={openDemo} />
      <EarlyPartners />
      <WarmPricing />
      <WarmFAQ />
      <ClosingLeadCapture onCallDemo={openDemo} />
      <Footer />
      <LiveChatDock onCallDemo={openDemo} />
      <OutboundCallModal open={isOutboundModalOpen} onClose={closeDemo} />
    </main>
  );
}

function WarmHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { href: "#how-it-feels", label: "How it feels" },
    { href: "#who-its-for", label: "Who it helps" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" }
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#70894e]/12 bg-[#faf5ec]/82 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="NexCall home">
          <span className="brand-mark-shell relative h-11 w-11">
            <Image src={brandAssets.mark} alt="" fill sizes="44px" className="brand-mark-img object-contain" priority />
          </span>
          <span className="text-lg font-black tracking-[0.18em] text-[#172033] sm:text-xl">NEXCALL</span>
        </a>
        <div className="hidden items-center gap-6 text-xs font-black uppercase tracking-[0.16em] text-[#4b5a67] md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center transition hover:text-[#6f8f34]">{item.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#lead"
            className="system-button-primary hidden min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/18 sm:inline-flex"
          >
            Request setup <ArrowRight size={16} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((c) => !c)}
            className="system-button-secondary flex h-11 w-11 items-center justify-center rounded-xl transition focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/18 md:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 md:hidden">
          <div className="system-card rounded-2xl p-3 shadow-2xl shadow-black/10">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold text-[#172033] transition hover:bg-[#6f8f34]/8 hover:text-[#6f8f34]"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#lead"
              onClick={() => setMobileOpen(false)}
              className="system-button-primary mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black"
            >
              Request setup <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function WarmHero({ onCallDemo }: { onCallDemo: () => void }) {
  const proofPoints = [
    { value: "24/7", label: "answers when your team is away" },
    { value: "1 note", label: "for name, need, and urgency" },
    { value: "Human", label: "handoff when a person is needed" },
    { value: "Local fit", label: "for appointment-heavy teams" }
  ];

  const callerFlow = [
    { step: "1", title: "A warm greeting", copy: "Callers hear a calm, helpful first response instead of ringing out." },
    { step: "2", title: "The details get captured", copy: "NexCall notes the reason, contact info, and how urgent it is." },
    { step: "3", title: "Your team gets a clean brief", copy: "The message is short enough to read quickly and act on right away." }
  ];

  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(126,183,191,0.12),transparent_25rem)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(215,178,109,0.16),transparent_22rem)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(111,143,52,0.08),transparent_22rem)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="system-label">Built for local service businesses</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.04em] text-[#172033] sm:text-6xl lg:text-7xl xl:text-[5.9rem]">
              Turn missed calls into next steps.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4b5a67] sm:text-xl">
              NexCall answers, captures the reason for the call, and hands your team a clear next step — so the front desk feels calmer, even on busy days and after hours.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#lead"
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[0.9rem] bg-[#6f8f34] px-8 text-sm font-black tracking-wide text-[#fffdf8] transition hover:translate-y-[-1px] hover:bg-[#5f7c2c] focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/18 sm:w-auto"
              >
                Request setup <ArrowRight size={16} aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={onCallDemo}
                data-fallback-href="/?demo=1"
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[0.9rem] border border-[#172033]/12 bg-white/65 px-8 text-sm font-bold text-[#172033] transition hover:border-[#6f8f34]/25 hover:bg-white sm:w-auto"
              >
                Hear the demo <Phone size={16} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-sm text-[#6b7280]">
              No card required. Designed for dental offices, salons, clinics, auto repair shops, contractors, and other teams that live by the phone.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:max-w-2xl xl:grid-cols-4">
              {proofPoints.map((point) => (
                <div key={point.label} className="system-card rounded-[1.1rem] p-4">
                  <p className="text-2xl font-black tracking-tight text-[#172033]">{point.value}</p>
                  <p className="mt-1 text-sm leading-6 text-[#4b5a67]">{point.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="system-card overflow-hidden rounded-[2rem] p-5 sm:p-7">
            <div className="rounded-[1.4rem] border border-[#70894e]/14 bg-[#fffaf4] p-5 shadow-[0_20px_60px_rgba(90,70,42,0.08)] sm:p-6">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#6f8f34]">What the caller experiences</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-[#172033] sm:text-[2rem]">Friendly, clear, and never abrupt.</h2>
              <div className="mt-5 space-y-3">
                {callerFlow.map((item) => (
                  <div key={item.step} className="rounded-2xl border border-[#70894e]/12 bg-white/75 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6f8f34]/10 text-sm font-black text-[#6f8f34]">{item.step}</span>
                      <div>
                        <p className="font-black text-[#172033]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#4b5a67]">{item.copy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[#6f8f34]/14 bg-[#6f8f34]/8 p-4">
                <p className="text-sm font-semibold text-[#172033]">
                  “It feels like a capable front desk — not a chatbot script.”
                </p>
                <p className="mt-2 text-sm text-[#4b5a67]">That balance is what makes local callers trust the handoff.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustLayer() {
  const cards = [
    {
      title: "For callers",
      copy: "A warm first response, plain language, and a short path to the next step.",
      bullets: ["No dead ends", "No robotic wall of text", "Clear follow-up"]
    },
    {
      title: "For staff",
      copy: "A concise message with the details that matter most: name, reason, and urgency.",
      bullets: ["Less voicemail hunting", "Cleaner handoffs", "Fewer repeat questions"]
    },
    {
      title: "For owners",
      copy: "More calls answered during lunch, after hours, and peak busy windows.",
      bullets: ["Less missed revenue", "More consistent intake", "A calmer front desk"]
    }
  ];

  return (
    <section className="border-t border-[#70894e]/10 bg-[#faf5ec] py-16 sm:py-20" aria-labelledby="trust-layer-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="system-label">Trust first</p>
          <h2 id="trust-layer-heading" className="mt-3 text-3xl font-black leading-[0.95] text-[#172033] sm:text-4xl lg:text-5xl">
            Built to feel human before it feels automated.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#4b5a67]">
            The page and the product both have the same job: reassure practical buyers that the caller will be handled well, and that the team will get a useful summary.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="system-card rounded-[1.35rem] p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f8f34]">{card.title}</p>
              <p className="mt-3 text-base leading-7 text-[#172033]">{card.copy}</p>
              <ul className="mt-5 space-y-2">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-sm font-semibold text-[#4b5a67]">
                    <Check size={15} className="text-[#6f8f34]" aria-hidden="true" /> {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceFlow() {
  const steps = [
    {
      title: "Answer with a calm first response",
      copy: "NexCall picks up when the team is busy, then sets a reassuring tone right away.",
      badge: "Step 1"
    },
    {
      title: "Capture the details that matter",
      copy: "Name, callback number, reason for calling, and how urgent it feels — all in one note.",
      badge: "Step 2"
    },
    {
      title: "Send a short handoff the team can use",
      copy: "The staff summary is concise and practical, so someone can act without digging through a long transcript.",
      badge: "Step 3"
    }
  ];

  return (
    <section id="how-it-feels" className="border-t border-[#70894e]/10 bg-[#f7f2ea] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="system-label">How it feels</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.badge} className="system-card rounded-[1.35rem] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f8f34]">{step.badge}</p>
                <span className="text-3xl font-black leading-none text-[#172033]/10">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-2xl font-black leading-tight text-[#172033]">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-[#4b5a67]">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocalProof({ onCallDemo }: { onCallDemo: () => void }) {
  const industries = [
    {
      title: "Dental offices",
      copy: "Appointment requests, cancellations, and insurance questions get a calm first response.",
      detail: "The team gets a short note with preferred time and contact details."
    },
    {
      title: "Salons",
      copy: "Booking questions, stylist availability, and reschedule calls are handled without the rush.",
      detail: "The summary keeps the appointment request easy to confirm."
    },
    {
      title: "Auto repair",
      copy: "Quotes, drop-off windows, and service updates are captured with the right context.",
      detail: "Less back-and-forth. More useful handoffs."
    },
    {
      title: "Contractors",
      copy: "Job details, location, and timing questions are collected before the caller moves on.",
      detail: "Great for teams that are on-site most of the day."
    },
    {
      title: "Legal offices",
      copy: "Consultation and urgency screening stay clear, polite, and consistent.",
      detail: "The caller is guided to the next step instead of hitting voicemail."
    },
    {
      title: "Clinics",
      copy: "Front-desk interruptions are reduced while callers still feel heard.",
      detail: "The handoff is ready for the person who needs it."
    }
  ];

  return (
    <section id="who-its-for" className="border-t border-[#70894e]/10 bg-[#faf5ec] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="system-label">Who it helps</p>
            <h2 className="mt-3 text-3xl font-black leading-[0.95] text-[#172033] sm:text-4xl lg:text-5xl">
              Made for the businesses that actually answer the phone.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#4b5a67]">
              Local teams do better when the experience matches the way they work: fast, friendly, and practical.
            </p>
          </div>
          <button
            type="button"
            onClick={onCallDemo}
            data-fallback-href="/?demo=1"
            className="system-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition hover:border-[#6f8f34]/28 hover:text-[#172033]"
          >
            See the demo <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {industries.map((industry) => (
            <div key={industry.title} className="system-card rounded-[1.35rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-black text-[#172033]">{industry.title}</h3>
                <span className="rounded-full border border-[#6f8f34]/14 bg-[#6f8f34]/8 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-[#6f8f34]">Local fit</span>
              </div>
              <p className="mt-3 text-base leading-7 text-[#4b5a67]">{industry.copy}</p>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#172033]">{industry.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WarmPricing() {
  const plans = [
    {
      name: "Starter",
      price: "$349",
      note: "For small teams that need reliable coverage.",
      features: ["24/7 answering", "Lead capture", "Clean summaries"]
    },
    {
      name: "Appointment",
      price: "$549",
      note: "For appointment-heavy businesses with steady call volume.",
      featured: true,
      features: ["Everything in Starter", "Appointment request support", "Human fallback rules"]
    },
    {
      name: "Growth",
      price: "$849+",
      note: "For larger teams that want more customization.",
      features: ["Everything in Appointment", "Custom call flows", "Monthly review"]
    }
  ];

  return (
    <section id="pricing" className="border-t border-[#70894e]/10 bg-[#f7f2ea] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="system-label">Pricing</p>
          <h2 className="mt-3 text-3xl font-black leading-[0.95] text-[#172033] sm:text-4xl lg:text-5xl">
            Simple plans for practical buyers.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#4b5a67]">
            Pick the plan that matches your call volume, then request setup and we&apos;ll help you get the right fit. No card required to start.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`system-card flex flex-col rounded-[1.45rem] p-6 ${plan.featured ? "border-[#6f8f34]/25 bg-white" : ""}`}>
              {plan.featured ? (
                <p className="inline-flex w-fit rounded-full border border-[#6f8f34]/15 bg-[#6f8f34]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#6f8f34]">Best fit</p>
              ) : null}
              <h3 className="mt-4 text-2xl font-black text-[#172033]">{plan.name}</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-[#172033]">{plan.price}</span>
                <span className="pb-1 text-[#4b5a67]">/mo</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#4b5a67]">{plan.note}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-[#4b5a67]">
                    <Check className="mt-0.5 shrink-0 text-[#6f8f34]" size={18} aria-hidden="true" /> {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#lead"
                className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${plan.featured ? "system-button-primary focus:ring-[#6f8f34]/18" : "system-button-secondary focus:ring-[#6f8f34]/10"}`}
              >
                Request setup <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-[#6b7280]">
          Prices are monthly. Checkout isn&apos;t open yet — requesting setup starts a quick conversation to confirm the right plan for your call volume.
        </p>
      </div>
    </section>
  );
}

function WarmFAQ() {
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});
  const faqs = [
    { q: "Does NexCall replace my staff?", a: "No. It handles the first response when your team is busy or away, then hands the caller back to your people when a person is needed. It is built to support your front desk, not replace it." },
    { q: "How fast is setup?", a: "Setup starts with a short request, then a quick conversation about your most common calls. Most teams begin with one or two high-value call types, so you can get value early without a long onboarding." },
    { q: "What happens after I request setup?", a: "We call your phone with a live demo so you can hear it, then walk you through the right call flow for your business. Nothing goes live until you have reviewed it." },
    { q: "Is there a live checkout?", a: "Not yet. Right now, choosing a plan starts a setup conversation so we can confirm the right fit for your call volume. You will not be charged through the website today." },
    { q: "What does the caller hear?", a: "A calm, professional greeting followed by a clear next step. The goal is to feel helpful and human, not like an automated script." },
    { q: "Can it help with appointment requests?", a: "Yes. It collects the details your team needs — preferred time, contact info, and reason — so someone can confirm the appointment later." },
    { q: "What if a caller needs a person?", a: "NexCall captures the details and routes the conversation to the right human follow-up, with the context your team needs." },
    { q: "Does it work after hours?", a: "Yes. It is built for lunch rushes, busy windows, evenings, and weekends — the times calls are most likely to slip through." },
    { q: "Which businesses are the best fit?", a: "Any local service business that depends on the phone: dental offices, salons, clinics, contractors, auto repair, legal, and similar teams." }
  ];

  return (
    <section id="faq" className="border-t border-[#70894e]/10 bg-[#faf5ec] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="system-label mx-auto w-fit">FAQ</p>
          <h2 className="mt-3 text-3xl font-black leading-[0.95] text-[#172033] sm:text-4xl lg:text-5xl">
            The practical questions buyers ask before they try it.
          </h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq, index) => {
            const isOpen = Boolean(openFaqs[faq.q]);
            const panelId = `warm-faq-panel-${index}`;
            return (
              <div key={faq.q} className="system-card rounded-2xl p-5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenFaqs((current) => ({ ...current, [faq.q]: !isOpen }))}
                  className="flex min-h-11 w-full items-center justify-between gap-4 text-left focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/12"
                >
                  <span className="text-lg font-black text-[#172033]">{faq.q}</span>
                  <ChevronRight className={`shrink-0 transition ${isOpen ? "rotate-90" : ""}`} size={20} aria-hidden="true" />
                </button>
                {isOpen ? <p id={panelId} className="mt-4 max-w-3xl text-base leading-7 text-[#4b5a67]">{faq.a}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── EarlyPartners ────────────────────────────────────────────────────────────
   Honest social-proof slot. NexCall is pre-launch, so there are no real
   testimonials yet — we do NOT fabricate them. When authorized customer quotes
   exist, add them to `testimonials` and the card grid renders automatically.
   Until then this shows an honest founding-partner invitation.
── ──────────────────────────────────────────────────────────────────────── */
type PartnerTestimonial = { quote: string; name: string; role: string };

function EarlyPartners() {
  const testimonials: PartnerTestimonial[] = [];

  const foundingValue = [
    { title: "Hands-on setup", copy: "We map your most common calls and build the first flow with you — no DIY dashboard to figure out." },
    { title: "A direct line to our team", copy: "Early partners get direct support while we tune the experience around how your front desk really works." },
    { title: "Shape what we build", copy: "Your feedback guides what we add next, so the product fits the way local teams actually run." }
  ];

  return (
    <section id="partners" className="border-t border-[#70894e]/10 bg-[#f7f2ea] py-16 sm:py-20" aria-labelledby="partners-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="system-label">Early access</p>
          <h2 id="partners-heading" className="mt-3 text-3xl font-black leading-[0.95] text-[#172033] sm:text-4xl lg:text-5xl">
            We&apos;re onboarding our first local partners.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#4b5a67]">
            NexCall is new, and we&apos;re working hands-on with early businesses to get their call flow right. Join now and you get direct support — and a say in how it works for teams like yours.
          </p>
        </div>

        {testimonials.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="system-card rounded-[1.35rem] p-6">
                <blockquote className="text-base leading-7 text-[#172033]">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-bold text-[#4b5a67]">
                  <span className="text-[#172033]">{t.name}</span> · {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {foundingValue.map((card) => (
              <div key={card.title} className="system-card rounded-[1.35rem] p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6f8f34]">{card.title}</p>
                <p className="mt-3 text-base leading-7 text-[#4b5a67]">{card.copy}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            href="#lead"
            className="system-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/18"
          >
            Request setup <ArrowRight size={16} aria-hidden="true" />
          </a>
          <p className="text-sm text-[#6b7280]">Customer stories will appear here as our first partners go live.</p>
        </div>
      </div>
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
        <select className="mt-3 min-h-12 w-full rounded-lg border border-[#172033]/12 bg-white px-4 text-[#172033] outline-none focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15" {...register("trucks", { required: "Tell us the size of your team." })}>
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
      input: <input type="text" placeholder="Example: dental office, salon, auto repair, law firm" className="mt-3 min-h-12 w-full rounded-lg border border-[#172033]/12 bg-white px-4 text-[#172033] outline-none placeholder:text-[#9aa3ad] focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15" {...register("service", { required: "Tell us your business type." })} />
    },
    {
      label: "Where should we call you?", field: "email" as const,
      input: (
        <div className="mt-3 grid gap-3">
          <input type="text" placeholder="Name (optional)" className="min-h-12 rounded-lg border border-[#172033]/12 bg-white px-4 text-[#172033] outline-none placeholder:text-[#9aa3ad] focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15" {...register("name")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="email" placeholder="Work email" className="min-h-12 rounded-lg border border-[#172033]/12 bg-white px-4 text-[#172033] outline-none placeholder:text-[#9aa3ad] focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15" {...register("email", { required: "Enter your work email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
            <input
              type="tel" inputMode="tel" autoComplete="tel" placeholder="(###) ###-####"
              className="min-h-12 rounded-lg border border-[#172033]/12 bg-white px-4 text-[#172033] outline-none placeholder:text-[#9aa3ad] focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15"
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
    <section id="lead" className="border-t border-[#172033]/8 bg-[#f2ede4] py-16 sm:py-20">
      <motion.div {...sectionMotion} className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div>
          <p className="system-label">Request setup</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.93] tracking-tight text-[#172033] sm:text-5xl lg:text-6xl">
            Hear it on your <span className="text-[#6f8f34]">own phone.</span>
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#4b5a67]">
            Tell us a little about your business and we&apos;ll call your phone with a live demo, then help you set up the right call flow.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onCallDemo} data-fallback-href="/?demo=1"
              className="system-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/25">
              <Phone size={18} aria-hidden="true" /> Hear the demo now
            </button>
            <a href="#pricing" className="system-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 hover:border-[#6f8f34]/30 hover:text-[#6f8f34] focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/15">
              See plans <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 rounded-2xl border border-[#6f8f34]/20 bg-[#6f8f34]/8 p-4 text-sm font-bold leading-6 text-[#3a5018]">
            Takes about 60 seconds. No card required — this starts a demo call and a setup conversation.
          </p>
          <div className="mt-6 space-y-2 text-sm text-[#4b5a67]">
            <p><a href={`mailto:${NEXCALL_PUBLIC_EMAIL}`} className="font-bold text-[#172033] hover:text-[#6f8f34] transition">{NEXCALL_PUBLIC_EMAIL}</a></p>
            <p><a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="font-bold text-[#172033] hover:text-[#6f8f34] transition">{NEXCALL_PUBLIC_PHONE_DISPLAY}</a></p>
          </div>
        </div>

        <form onSubmit={handleSubmit(submitLead)} className="rounded-[1.35rem] border border-[#172033]/8 bg-white p-5 shadow-sm shadow-[#172033]/5 sm:p-6">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[#6f8f34]">Step {step + 1} of {steps.length}</p>
          <div className="mb-6 flex gap-2">
            {steps.map((item, index) => (
              <span key={item.label} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-[#6f8f34]" : "bg-[#172033]/10"}`} />
            ))}
          </div>
          {isSubmitSuccessful ? (
            <div className="rounded-lg border border-[#6f8f34]/20 bg-[#6f8f34]/8 p-5">
              <p className="text-2xl font-black text-[#172033]">Calling now.</p>
              <p className="mt-2 leading-7 text-[#4b5a67]">Nexa is ringing your phone with the live front-desk demo.</p>
            </div>
          ) : (
            <>
              <label className="block text-2xl font-black text-[#172033]">{steps[step].label}{steps[step].input}</label>
              {currentError && <p className="mt-3 text-sm font-bold text-red-600">{currentError}</p>}
              {leadError && <div className="mt-3"><CallDemoFallbackNotice message={leadError} /></div>}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {step > 0 && (
                  <button type="button" onClick={() => setStep((c) => Math.max(c - 1, 0))} className="system-button-secondary min-h-12 rounded-lg px-5 py-3 font-black transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34]">Back</button>
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
    { href: "#how-it-feels", label: "How it feels" },
    { href: "#who-its-for", label: "Who it helps" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
    { href: "#lead", label: "Request setup" }
  ];
  const serviceLinks = ["AI Call Answering", "Appointment Requests", "Lead Capture", "After-Hours Coverage", "Human Backup Handoff"];
  const legalLinks = [
    { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" },
    { href: "/refund-policy", label: "Refunds" }, { href: "/ai-disclosure", label: "AI Disclosure" },
    { href: "/compliance", label: "Compliance" }, { href: "/cookie-notice", label: "Cookies" },
    { href: "/accessibility", label: "Accessibility" }
  ];

  return (
    <footer className="border-t border-white/10 bg-[#172033] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 text-sm text-slate-400 md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
        <div>
          <a href="#top" className="flex w-fit items-center gap-4 transition hover:text-[#a0c060]" aria-label="NexCall home">
            <span className="brand-mark-shell relative h-12 w-12">
              <Image src={brandAssets.mark} alt="" fill sizes="48px" className="brand-mark-img object-contain" />
            </span>
            <div>
              <p className="font-black text-white">NexCall</p>
              <p className="mt-1">AI receptionist coverage with clear handoffs.</p>
            </div>
          </a>
          <p className="mt-5 max-w-sm leading-7">NexCall answers when your team cannot, captures the details, helps move the next step forward, and sends clean notes.</p>
          <p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">
            NexCall uses automated systems to help with call intake and appointment-request workflows. Your team reviews caller information and confirms appointments.{" "}
            <a href="/ai-disclosure" className="font-semibold text-slate-300 underline-offset-2 hover:text-[#a0c060] hover:underline">Read our AI disclosure</a>.
          </p>
        </div>
        <nav aria-label="Quick links">
          <p className="font-black text-white">Quick links</p>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((item) => <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center font-bold transition hover:text-[#a0c060]">{item.label}</a>)}
          </div>
        </nav>
        <div>
          <p className="font-black text-white">Services</p>
          <div className="mt-4 grid gap-3">
            {serviceLinks.map((item) => <a key={item} href="#how-it-feels" className="inline-flex min-h-11 items-center transition hover:text-[#a0c060]">{item}</a>)}
          </div>
        </div>
        <div>
          <p className="font-black text-white">Contact</p>
          <a href={`mailto:${NEXCALL_PUBLIC_EMAIL}`} className="mt-4 inline-flex min-h-11 items-center font-bold text-slate-200 transition hover:text-[#a0c060]">{NEXCALL_PUBLIC_EMAIL}</a>
          <a href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-slate-200 transition hover:text-[#a0c060]">{NEXCALL_PUBLIC_PHONE_DISPLAY}</a>
          <p className="mt-3 leading-6">Demo calls and setup requests are sent through the site forms.</p>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/8 pt-6 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 NexCall. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal links">
          {legalLinks.map((item) => <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center transition hover:text-[#a0c060]">{item.label}</a>)}
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
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#172033]/8 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#6f8f34]/20 bg-[#6f8f34]/10 text-[#6f8f34]">
                <MessageSquareText size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-[#172033]">Nexa <span className="ml-1 rounded-full bg-[#6f8f34]/12 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wider text-[#6f8f34]">AI</span></p>
                <p className="text-xs font-bold text-[#6b7280]">NexCall front desk assistant</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#172033]/10 text-[#4b5a67] transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34]"
              aria-label="Collapse live chat">
              <Minus size={18} aria-hidden="true" />
            </button>
          </div>

          {/* ── Mode tabs ── */}
          <div className="grid shrink-0 grid-cols-2 border-b border-[#172033]/8 bg-[#f8f3eb] p-2">
            {[{ key: "ai" as const, label: "Ask Nexa", icon: Bot }, { key: "human" as const, label: "Talk to team", icon: UserRound }].map((tab) => (
              <button key={tab.key} type="button" onClick={() => setMode(tab.key)}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${mode === tab.key ? "bg-[#6f8f34] text-white" : "text-[#4b5a67] hover:bg-[#172033]/[0.06] hover:text-[#172033]"}`}>
                <tab.icon size={16} aria-hidden="true" /> {tab.label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            <>
              {/* ── Quick actions strip ── */}
              <div className="shrink-0 border-b border-[#172033]/8 bg-[#faf5ec] p-3">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setOpen(false); onCallDemo(); }}
                    className="rounded-lg border border-[#172033]/10 bg-white px-3 py-2 text-left text-xs font-black text-[#172033] transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34]">
                    Try demo call
                  </button>
                  <a href="#pricing" onClick={() => setOpen(false)}
                    className="rounded-lg border border-[#172033]/10 bg-white px-3 py-2 text-left text-xs font-black text-[#172033] transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34]">
                    See plans
                  </a>
                  <button type="button" onClick={() => submitChatQuestion("Which plan fits my business?")}
                    className="rounded-lg border border-[#172033]/10 bg-white px-3 py-2 text-left text-xs font-black text-[#172033] transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34]">
                    Which plan fits?
                  </button>
                  <button type="button" onClick={() => setMode("human")}
                    className="rounded-lg border border-[#172033]/10 bg-white px-3 py-2 text-left text-xs font-black text-[#172033] transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34]">
                    Talk to team
                  </button>
                </div>
              </div>

              {/* ── Message thread ── */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4" style={{ minHeight: 0 }}>
                {messages.map((msg, i) => (
                  <div key={`${msg.role}-${i}`} className={`flex ${msg.role === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-[1.55] ${
                      msg.role === "visitor"
                        ? "rounded-br-sm bg-[#6f8f34] font-semibold text-white"
                        : "rounded-bl-sm bg-[#f2ede4] text-[#172033]"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#f2ede4] px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#4b5a67]"
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
                        className="rounded-full border border-[#6f8f34]/25 bg-[#6f8f34]/10 px-3 py-1.5 text-xs font-black text-[#6f8f34] transition hover:bg-[#6f8f34]/20">
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* ── Input bar ── */}
              <form onSubmit={askQuestion} className="shrink-0 border-t border-[#172033]/8 p-3">
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
                    className="min-h-11 flex-1 rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 text-sm text-[#172033] outline-none placeholder:text-[#6b7280] focus:border-[#6f8f34] disabled:opacity-60"
                  />
                  <button type="submit" disabled={isAsking || chatTerminated || !question.trim()}
                    className="flex min-h-11 w-12 shrink-0 items-center justify-center rounded-lg bg-[#6f8f34] text-white transition hover:bg-[#5e7a2c] disabled:opacity-50"
                    aria-label="Send message">
                    {isAsking
                      ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      : <Send size={16} aria-hidden="true" />}
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-bold leading-4 text-[#6b7280]">
                  AI assistant · I can answer questions or connect you to the team.
                </p>
              </form>
            </>
          ) : (
            /* ── Human follow-up form ── */
            <form onSubmit={requestHuman} className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
              <p className="text-sm leading-6 text-[#4b5a67]">Send your details and the NexCall team will follow up directly.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input required value={humanForm.name} onChange={(e) => setHumanForm((c) => ({ ...c, name: e.target.value }))} placeholder="Name" className="min-h-11 rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 text-sm text-[#172033] outline-none focus:border-[#6f8f34]" />
                <input value={humanForm.businessName} onChange={(e) => setHumanForm((c) => ({ ...c, businessName: e.target.value }))} placeholder="Business name" className="min-h-11 rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 text-sm text-[#172033] outline-none focus:border-[#6f8f34]" />
              </div>
              <input value={humanForm.businessType} onChange={(e) => setHumanForm((c) => ({ ...c, businessType: e.target.value }))} placeholder="Business type (e.g. dental, salon, legal)" className="min-h-11 w-full rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 text-sm text-[#172033] outline-none focus:border-[#6f8f34]" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input type="email" required value={humanForm.email} onChange={(e) => setHumanForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email" className="min-h-11 rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 text-sm text-[#172033] outline-none focus:border-[#6f8f34]" />
                <input type="tel" required value={humanForm.phone}
                  onChange={(e) => handlePhoneInputFormatting(e, (v) => setHumanForm((c) => ({ ...c, phone: v })))}
                  onBlur={(e) => setHumanForm((c) => ({ ...c, phone: formatPhoneForBlur(e.target.value) }))}
                  placeholder="(###) ###-####" className="min-h-11 rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 text-sm text-[#172033] outline-none focus:border-[#6f8f34]" />
              </div>
              <textarea required value={humanForm.message} onChange={(e) => setHumanForm((c) => ({ ...c, message: e.target.value }))} placeholder="What do you want NexCall to handle?" className="min-h-24 w-full rounded-lg border border-[#172033]/10 bg-[#f8f3eb] px-3 py-2 text-sm text-[#172033] outline-none placeholder:text-[#6b7280] focus:border-[#6f8f34]" />
              <button type="submit" className="system-button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition hover:-translate-y-0.5">
                <UserRound size={17} aria-hidden="true" /> Send to the team
              </button>
              {humanStatus && (
                <p className="rounded-lg border border-[#6f8f34]/20 bg-[#6f8f34]/8 p-3 text-xs font-bold text-[#3a5018]">{humanStatus}</p>
              )}
            </form>
          )}
        </section>
      ) : (
        /* ── Collapsed toggle button ── */
        <button type="button" onClick={() => setOpen(true)}
          className="pointer-events-auto ml-auto flex min-h-12 items-center gap-3 rounded-2xl border border-[#172033]/12 bg-white/95 px-4 py-3 text-left shadow-lg shadow-[#172033]/12 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#6f8f34]/30"
          aria-label="Open NexCall live chat">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6f8f34] text-white">
            <MessageSquareText size={18} aria-hidden="true" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-black text-[#172033]">Ask Nexa</span>
            <span className="block text-xs font-bold text-[#6b7280]">AI front desk assistant</span>
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
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
      <p>{message}</p>
      <p className="mt-2 font-semibold text-red-600">
        You can also reach NexCall at{" "}
        <a className="underline underline-offset-2 hover:text-red-700" href={`mailto:${NEXCALL_PUBLIC_EMAIL}`}>{NEXCALL_PUBLIC_EMAIL}</a>{" "}
        or{" "}
        <a className="underline underline-offset-2 hover:text-red-700" href={`tel:${NEXCALL_PUBLIC_PHONE_TEL}`}>{NEXCALL_PUBLIC_PHONE_DISPLAY}</a>.
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#172033]/55 px-4 py-6 backdrop-blur-sm" role="presentation">
      <div className="absolute inset-0" onClick={status === "calling" ? undefined : onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="outbound-call-title"
        className="modal-enter metal-panel relative w-full max-w-lg overflow-hidden rounded-[1.35rem] p-5 text-[#172033] shadow-2xl shadow-[#172033]/25 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="system-label">Live demo call</p>
            <h2 id="outbound-call-title" className="mt-2 text-3xl font-black text-[#172033]">Let Nexa ring your phone.</h2>
            <p className="mt-3 leading-7 text-[#4b5a67]">Enter your number and the NexCall receptionist will call you with the front-desk demo.</p>
          </div>
          <button type="button" onClick={onClose} disabled={status === "calling"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#172033]/12 bg-white/70 text-[#4b5a67] transition hover:border-[#6f8f34]/30 hover:text-[#6f8f34] focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close call demo modal">
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        {status === "success" ? (
          <div className="mt-6 rounded-xl border border-[#6f8f34]/25 bg-[#6f8f34]/8 p-5">
            <p className="text-xl font-black text-[#172033]">Your demo call is starting now.</p>
            <p className="mt-2 leading-7 text-[#4b5a67]">Nexa is ringing your phone. Pick up and ask about appointment requests, rescheduling, or missed calls.</p>
            <button type="button" onClick={onClose} className="system-button-primary mt-5 min-h-12 rounded-xl px-5 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/25">Done</button>
          </div>
        ) : (
          <form onSubmit={submitOutboundCall} className="mt-6 grid gap-4">
            <label className="text-sm font-black text-[#172033]">
              Phone number
              <input ref={phoneInputRef} type="tel" inputMode="tel" autoComplete="tel" required placeholder="(###) ###-####" value={phone}
                onChange={(e) => handlePhoneInputFormatting(e, setPhone)}
                onBlur={(e) => setPhone(formatPhoneForBlur(e.target.value))}
                className="mt-2 min-h-14 w-full rounded-xl border border-[#172033]/12 bg-white px-4 text-lg font-bold text-[#172033] outline-none placeholder:text-[#9aa3ad] focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15" />
            </label>
            <p className="-mt-2 text-xs font-bold leading-5 text-[#6b7280]">US numbers can be entered as 10 digits; we format them automatically before calling.</p>
            <label className="text-sm font-black text-[#172033]">
              Name <span className="font-semibold text-[#6b7280]">(optional)</span>
              <input type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#172033]/12 bg-white px-4 text-[#172033] outline-none placeholder:text-[#9aa3ad] focus:border-[#6f8f34] focus:ring-4 focus:ring-[#6f8f34]/15" />
            </label>
            {error && <CallDemoFallbackNotice message={error} />}
            <button type="submit" disabled={status === "calling"}
              className="system-button-primary inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6f8f34]/25 disabled:cursor-wait disabled:opacity-75">
              {status === "calling" ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Calling Now…</>
              ) : "Call Me Now"}
            </button>
            <p className="text-xs font-bold leading-5 text-[#6b7280]">By submitting, you are asking for an automated demo call. Standard carrier rates may apply.</p>
          </form>
        )}
      </div>
    </div>
  );
}

