import { ArrowLeft, MessageSquareText } from "lucide-react";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[#f6f2ea] px-4 py-16 text-[#172033] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-300/30">
        <MessageSquareText className="mx-auto text-[#244f8f]" size={52} aria-hidden="true" />
        <h1 className="mt-6 text-4xl font-black sm:text-5xl">Checkout paused.</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          No charge was made. You can return to pricing, ask for a setup call, or
          finish checkout later.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#pricing"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-6 py-3 font-black text-[#172033] shadow-sm transition hover:bg-stone-50"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Pricing
          </Link>
          <Link
            href="/#lead"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#244f8f] px-6 py-3 font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73]"
          >
            Ask for Help
          </Link>
        </div>
      </section>
    </main>
  );
}
