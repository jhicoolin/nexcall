import {
  CalendarCheck,
  CheckCircle2,
  Headphones,
  MessageSquareText,
  Sparkles,
  Users,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicPageShell } from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "About NexCall | AI Receptionist Built for Real Businesses",
  description:
    "Learn how NexCall helps businesses answer calls, capture details, support appointment requests, and create clean handoffs."
};

const values = [
  {
    icon: Headphones,
    title: "Answer quickly, hand off gracefully",
    copy: "Automation should never trap a caller. NexCall is built around clear routing, human fallback, and useful summaries."
  },
  {
    icon: CalendarCheck,
    title: "Keep the next step clear",
    copy: "The best receptionist flow ends with a usable outcome: an appointment request, a routed call, or a documented follow-up."
  },
  {
    icon: CheckCircle2,
    title: "Stay inside approved answers",
    copy: "Your receptionist should use approved business information instead of inventing pricing, availability, or promises."
  }
];

const steps = [
  "Map your current call flow and missed-lead points.",
  "Build the first receptionist around one or two high-value call types.",
  "Teach it your hours, policies, intake questions, and handoff rules.",
  "Test with simulated calls before real customers reach it.",
  "Review summaries and improve the playbook every week."
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About NexCall"
      title="Make every good customer conversation reachable."
      summary="NexCall exists for the businesses that are busy enough to miss calls but personal enough to care how every caller is treated."
      maxWidthClassName="max-w-7xl"
      contentClassName="mt-12"
    >
      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/7 px-4 py-2 text-sm font-bold text-[#8dbdff]">
            <Sparkles size={16} aria-hidden="true" />
            Premium AI receptionist implementation
          </div>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            We build AI reception around useful service, not spectacle: answer,
            understand, route, capture, summarize, and improve. The goal is a
            front desk experience that callers can trust and teams can act on.
          </p>
        </div>

        <AboutCommandCenter />
      </section>

      <section className="mt-14 rounded-[1.5rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8dbdff]">
          What We Believe
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">
          AI reception works when the experience is narrow, tested, and honest.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {values.map((value) => (
            <article key={value.title} className="rounded-2xl border border-white/10 bg-white/7 p-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#05070d]">
                <value.icon size={24} aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-black text-white">{value.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8dbdff]">
            Our Build Philosophy
          </p>
          <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            Start with the calls that matter most.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            A strong rollout begins with repeatable call types that create revenue
            or relieve staff: appointment requests, rescheduling, lead intake,
            FAQs, routing, and after-hours coverage.
          </p>
        </div>
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/7 p-5 shadow-xl shadow-black/15">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-black text-[#05070d]">
                {index + 1}
              </span>
              <p className="pt-2 font-bold leading-7 text-slate-100">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-[1.5rem] border border-[#8dbdff]/30 bg-[#8dbdff]/10 px-5 py-12 text-center shadow-2xl shadow-black/20 sm:px-8">
        <MessageSquareText className="mx-auto text-[#8dbdff]" size={42} aria-hidden="true" />
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black text-white">
          Build a front desk that callers can actually trust.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Start with a practical call audit, then launch the smallest receptionist
          flow that can prove value.
        </p>
        <Link
          href="/#lead"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
        >
          Get a Free AI Audit
        </Link>
      </section>
    </PublicPageShell>
  );
}
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-4 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

function AboutCommandCenter() {
  const rows: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Headphones, label: "Caller asks for help", value: "Answered quickly" },
    { icon: CalendarCheck, label: "Appointment request captured", value: "Next step clear" },
    { icon: Users, label: "Judgment call detected", value: "Human fallback ready" }
  ];

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/7 p-6 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="rounded-[1.15rem] border border-white/10 bg-[#0b1220] p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8dbdff]">
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
            <div key={row.label} className="flex flex-col items-start justify-between gap-3 rounded-xl bg-white/8 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#05070d]">
                  <row.icon size={19} aria-hidden="true" />
                </span>
                <p className="font-bold">{row.label}</p>
              </div>
              <p className="text-sm font-black text-[#8dbdff]">{row.value}</p>
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
