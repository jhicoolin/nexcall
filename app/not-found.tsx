import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";

export default function NotFoundPage() {
  return (
    <PublicPageShell
      eyebrow="Page not found"
      title="That page is not available."
      summary="The link may have moved, but the NexCall website is still ready to help you explore plans or request a demo."
      maxWidthClassName="max-w-3xl"
      contentClassName="mt-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="system-button-primary inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#baff39]/25"
        >
          Back to Website
        </Link>
        <Link
          href="/#pricing"
          className="system-button-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-black transition hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
        >
          View Plans
        </Link>
      </div>
    </PublicPageShell>
  );
}
