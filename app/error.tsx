"use client";

import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PublicPageShell
      eyebrow="Something went wrong"
      title="The page had trouble loading."
      summary="You can try again, return to the NexCall website, or reach out if you need help."
      maxWidthClassName="max-w-3xl"
      contentClassName="mt-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/6 px-6 py-3 font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
        >
          Back to Website
        </Link>
      </div>
    </PublicPageShell>
  );
}

