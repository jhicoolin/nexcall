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
  title: "About NexCall | Local Business Call Follow-Up Support",
  description:
    "Learn how NexCall helps local teams stay organized around missed calls, appointment requests, and follow-up."
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
      title="Make every customer call easier to follow up on."
      summary="NexCall is built for service businesses that care about how callers are treated and need a steadier way to capture next steps when the team is busy."
      maxWidthClassName="max-w-7xl"
      contentClassName="mt-12"
    >
      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#baff39]/15 bg-[#baff39]/10 px-4 py-2 text-sm font-bold text-[#baff39]">
            <Sparkles size={16} aria-hidden="true" />
            Guided setup for real local-business teams
          </div>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            NexCall is designed around useful service, not spectacle: answer,
            clarify, document, and hand off. The goal is a front desk experience
            that feels calm for callers and practical for the team behind it.
          </p>
        </div>

        <AboutCommandCenter />
      </section>

      <section className="system-card mt-14 rounded-[1.5rem] p-6 sm:p-8">
        <p className="system-label">
          What We Believe
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">
          Good call coverage works when the experience is focused, tested, and honest.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {values.map((value) => (
            <article key={value.title} className="system-card system-card-hover rounded-2xl p-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#baff39]/20 bg-[#baff39]/10 text-[#baff39]">
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
          <p className="system-label">
            Our Build Philosophy
          </p>
          <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
            Start with the calls that matter most.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            A strong rollout begins with the repeatable calls that create revenue
            or relieve pressure: appointment requests, rescheduling, lead intake,
            FAQs, routing, and after-hours coverage.
          </p>
        </div>
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step} className="system-card flex gap-4 rounded-2xl p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#baff39] font-black text-[#020403]">
                {index + 1}
              </span>
              <p className="pt-2 font-bold leading-7 text-slate-100">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-[1.5rem] border border-[#baff39]/25 bg-[#baff39]/10 px-5 py-12 text-center shadow-2xl shadow-black/20 sm:px-8">
        <MessageSquareText className="mx-auto text-[#baff39]" size={42} aria-hidden="true" />
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black text-white">
          Build a front desk experience your team can stand behind.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Start with a practical setup review, then launch the smallest receptionist
          flow that fits your call patterns and follow-up process.
        </p>
        <Link
          href="/#lead"
          className="system-button-primary mt-8 inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
        >
          Request Setup Guidance
        </Link>
      </section>
    </PublicPageShell>
  );
}
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="system-card rounded-2xl p-4 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

function AboutCommandCenter() {
  const rows: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Headphones, label: "Caller asks for help", value: "Answered quickly" },
    { icon: CalendarCheck, label: "Appointment request noted", value: "Next step clear" },
    { icon: Users, label: "Judgment call detected", value: "Human fallback ready" }
  ];

  return (
    <div className="system-card rounded-[1.35rem] p-6">
      <div className="rounded-[1.15rem] border border-[#baff39]/12 bg-black/35 p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="system-label">
              NexCall Command Center
            </p>
            <h2 className="mt-2 text-2xl font-black">Each caller gets a clear next step.</h2>
          </div>
          <span className="rounded-full border border-[#baff39]/20 bg-[#baff39]/10 px-3 py-1 text-xs font-black text-[#eaffb8]">
            real-world flow
          </span>
        </div>
        <div className="mt-6 grid gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#baff39]/10 bg-white/[0.045] p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#baff39] text-[#020403]">
                  <row.icon size={19} aria-hidden="true" />
                </span>
                <p className="font-bold">{row.label}</p>
              </div>
              <p className="text-sm font-black text-[#baff39]">{row.value}</p>
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
