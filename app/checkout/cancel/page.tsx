import { ArrowLeft, MessageSquareText, Phone } from "lucide-react";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function CheckoutCancelPage() {
  return (
    <PublicPageShell
      eyebrow="Checkout paused"
      title="Checkout was not completed."
      summary="No problem. You can return to plans, try a demo call, or contact NexCall if you need help."
      maxWidthClassName="max-w-3xl"
      contentClassName="mt-8"
    >
      <section className="system-card rounded-[1.35rem] p-6 text-center sm:p-8">
        <MessageSquareText className="mx-auto text-[#baff39]" size={54} aria-hidden="true" />
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
          Your card was not charged. Pick up where you left off whenever you are ready,
          or use the demo request flow if you want help choosing a plan.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="system-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-black transition hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Plans
          </Link>
          <Link
            href="/?demo=1"
            className="system-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
          >
            <Phone size={18} aria-hidden="true" />
            Try Demo Call
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
