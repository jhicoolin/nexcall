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
          className="system-button-primary inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="system-button-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
        >
          Back to Website
        </Link>
      </div>
    </PublicPageShell>
  );
}
