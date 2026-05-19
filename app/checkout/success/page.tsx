import { CheckCircle2, CalendarCheck, MessageSquareText, type LucideIcon } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f6f2ea] px-4 py-16 text-[#172033] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-300/30">
        <CheckCircle2 className="mx-auto text-[#0f766e]" size={52} aria-hidden="true" />
        <h1 className="mt-6 text-4xl font-black sm:text-5xl">You&apos;re in.</h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          Payment was received. The next step is connecting your phone number,
          calendar, lead routing, and demo call flow.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Step icon={CalendarCheck} text="Create or connect the booking calendar." />
          <Step icon={MessageSquareText} text="Send your business FAQs, hours, and routing rules." />
        </div>
        <Link
          href="/#lead"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#244f8f] px-6 py-3 font-black text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#1c3f73]"
        >
          Send Setup Details
        </Link>
      </section>
    </main>
  );
}

function Step({
  icon: Icon,
  text
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-4 text-left">
      <Icon className="text-[#244f8f]" size={22} aria-hidden="true" />
      <p className="mt-3 font-bold leading-6">{text}</p>
    </div>
  );
}
