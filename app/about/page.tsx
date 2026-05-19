import {
  ArrowLeft,
  CalendarCheck,
  Headphones,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About NexCall | AI Receptionist Built for Real Businesses",
  description:
    "Learn how NexCall builds AI receptionist workflows around fast answering, clear booking, human fallback, and trustworthy caller experiences."
};

const values = [
  {
    icon: Headphones,
    title: "Answer quickly, hand off gracefully",
    copy: "Automation should never trap a caller. NexCall is built around clear routing, human fallback, and useful summaries."
  },
  {
    icon: CalendarCheck,
    title: "Make booking the center",
    copy: "The best receptionist flow ends with a clean next step: a booked appointment, a routed request, or a documented follow-up."
  },
  {
    icon: ShieldCheck,
    title: "Stay inside approved answers",
    copy: "Agents should use your calendar, FAQs, policies, and knowledge base instead of inventing pricing, availability, or promises."
  }
];

const steps = [
  "Map your current call flow and missed-lead points.",
  "Build the first receptionist around one or two high-value call types.",
  "Connect phone, calendar, CRM, SMS, and human fallback.",
  "Test with simulated calls before real customers reach it.",
  "Review transcripts and improve the playbook every week."
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f6f2ea] text-[#1d2733]">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-black text-[#172033]">
            <span className="relative h-10 w-10 overflow-hidden rounded-lg bg-black shadow-sm">
              <Image
                src="/brand/nexcall-icon.png"
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
            NEXCALL
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-black text-[#172033] shadow-sm transition hover:bg-stone-50"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Back Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
        <div>
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#c8d7ef] bg-white px-4 py-2 text-sm font-bold text-[#244f8f] shadow-sm">
            <Sparkles size={16} aria-hidden="true" />
            Privately owned implementation studio
          </div>
          <h1 className="text-5xl font-black leading-[1.02] text-[#172033] sm:text-6xl">
            Our mission is to make every good customer conversation reachable.
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-600">
            NexCall exists for the businesses that are busy enough to miss calls
            but personal enough to care how every caller is treated. We build AI phone
            reception around useful service, not spectacle: answer, understand, book,
            route, summarize, and improve.
          </p>
        </div>

        <AboutCommandCenter />
      </section>

      <section className="border-y border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">
            What We Believe
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black text-[#172033] sm:text-5xl">
            AI reception works when the experience is narrow, tested, and honest.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {values.map((value) => (
              <article key={value.title} className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-6">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f0fc] text-[#244f8f]">
                  <value.icon size={24} aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black text-[#172033]">{value.title}</h3>
                <p className="mt-3 leading-7 text-stone-600">{value.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#244f8f]">
            Our Build Philosophy
          </p>
          <h2 className="mt-3 text-4xl font-black text-[#172033] sm:text-5xl">
            Start with the calls that matter most.
          </h2>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            A strong rollout does not begin with every possible feature. It begins with
            the repeatable call types that create revenue or relieve staff: booking,
            rescheduling, lead intake, FAQs, routing, and after-hours coverage.
          </p>
        </div>
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#244f8f] font-black text-white">
                {index + 1}
              </span>
              <p className="pt-2 font-bold leading-7 text-[#172033]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-stone-200 bg-white px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <MessageSquareText className="mx-auto text-[#244f8f]" size={42} aria-hidden="true" />
          <h2 className="mt-5 text-4xl font-black text-[#172033]">
            Build a front desk that callers can actually trust.
          </h2>
          <p className="mt-4 text-lg leading-8 text-stone-600">
            Start with a practical call audit, then launch the smallest receptionist
            flow that can prove value.
          </p>
          <Link
            href="/#lead"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#244f8f] px-6 py-3 font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73]"
          >
            Get a Free AI Audit
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-[#f6f2ea] p-4 text-center">
      <p className="text-2xl font-black text-[#172033]">{value}</p>
      <p className="mt-1 text-sm font-bold text-stone-500">{label}</p>
    </div>
  );
}

function AboutCommandCenter() {
  const rows = [
    { icon: Headphones, label: "Caller asks for help", value: "Answered instantly" },
    { icon: CalendarCheck, label: "Booking rules checked", value: "Approved slots only" },
    { icon: Users, label: "Judgment call detected", value: "Human fallback ready" }
  ];

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-xl shadow-stone-300/30">
      <div className="rounded-lg border border-[#d7c08a] bg-[#111827] p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d9a536]">
              NexCall Command Center
            </p>
            <h2 className="mt-2 text-2xl font-black">Every call gets a clear next step.</h2>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
            live-ready
          </span>
        </div>
        <div className="mt-6 grid gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col items-start justify-between gap-3 rounded-lg bg-white/10 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d9a536] text-[#111827]">
                  <row.icon size={19} aria-hidden="true" />
                </span>
                <p className="font-bold">{row.label}</p>
              </div>
              <p className="text-sm font-black text-[#f7d984]">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat value="24/7" label="Coverage path" />
        <Stat value="Human" label="Fallback first" />
        <Stat value="Weekly" label="Quality review" />
      </div>
    </div>
  );
}
