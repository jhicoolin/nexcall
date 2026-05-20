import { CalendarCheck, CheckCircle2, MessageSquareText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function CheckoutSuccessPage() {
  return (
    <PublicPageShell
      eyebrow="Checkout complete"
      title="Your plan is ready."
      summary="Thanks — your checkout was completed. The NexCall team will follow up with next steps."
      maxWidthClassName="max-w-3xl"
      contentClassName="mt-8"
    >
      <section className="rounded-[1.35rem] border border-white/10 bg-white/7 p-6 text-center shadow-2xl shadow-black/25 backdrop-blur sm:p-8">
        <CheckCircle2 className="mx-auto text-emerald-300" size={54} aria-hidden="true" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Step icon={CalendarCheck} text="We will confirm the highest-priority call flow first." />
          <Step icon={MessageSquareText} text="Send your business hours, FAQs, and handoff rules when ready." />
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/6 px-6 py-3 font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
          >
            Back to Plans
          </Link>
          <Link
            href="/#lead"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
          >
            Send Setup Details
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
function Step({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-4 text-left">
      <Icon className="text-[#8dbdff]" size={22} aria-hidden="true" />
      <p className="mt-3 font-bold leading-6 text-slate-100">{text}</p>
    </div>
  );
}
