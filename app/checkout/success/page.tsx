import { CalendarCheck, CheckCircle2, MessageSquareText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function CheckoutSuccessPage() {
  return (
    <PublicPageShell
      eyebrow="Checkout complete"
      title="Your plan is ready."
      summary="Thanks - your checkout was completed. The NexCall team will follow up with next steps."
      maxWidthClassName="max-w-3xl"
      contentClassName="mt-8"
    >
      <section className="system-card rounded-[1.35rem] p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto text-[#baff39]" size={54} aria-hidden="true" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Step icon={CalendarCheck} text="We will confirm the highest-priority call flow first." />
          <Step icon={MessageSquareText} text="Send your business hours, FAQs, and handoff rules when ready." />
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="system-button-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
          >
            Back to Plans
          </Link>
          <Link
            href="/#lead"
            className="system-button-primary inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
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
    <div className="system-card rounded-2xl p-4 text-left">
      <Icon className="text-[#baff39]" size={22} aria-hidden="true" />
      <p className="mt-3 font-bold leading-6 text-slate-100">{text}</p>
    </div>
  );
}
