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
      <section className="rounded-[1.35rem] border border-white/10 bg-white/7 p-6 text-center shadow-2xl shadow-black/25 backdrop-blur sm:p-8">
        <MessageSquareText className="mx-auto text-[#8dbdff]" size={54} aria-hidden="true" />
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
          Your card was not charged. Pick up where you left off whenever you are ready,
          or use the demo request flow if you want help choosing a plan.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/6 px-6 py-3 font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Plans
          </Link>
          <Link
            href="/#lead"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
          >
            <Phone size={18} aria-hidden="true" />
            Try Demo Call
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
