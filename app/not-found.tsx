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
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-black text-[#05070d] shadow-lg shadow-blue-500/10 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-300/30"
        >
          Back to Website
        </Link>
        <Link
          href="/#pricing"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/6 px-6 py-3 font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
        >
          View Plans
        </Link>
      </div>
    </PublicPageShell>
  );
}

