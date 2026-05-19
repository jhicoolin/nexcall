import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
};

export const legalLastUpdated = "May 13, 2026";

export const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/ai-disclosure", label: "AI Disclosure" },
  { href: "/compliance", label: "Compliance Notice" },
  { href: "/cookie-notice", label: "Cookie Notice" },
  { href: "/accessibility", label: "Accessibility" }
];

/**
 * Shared layout for public legal and transparency pages.
 *
 * Business value: keeps all policy pages visually consistent, readable, and
 * easy for buyers, partners, and reviewers to inspect before a sales call.
 */
export function LegalPage({ eyebrow, title, summary, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f6f2ea] text-[#172033]">
      <header className="border-b border-stone-200 bg-white/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-black text-[#172033]">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#244f8f] text-white">
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            REVENUE GUARD
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-black text-[#172033] shadow-sm transition hover:bg-stone-50"
          >
            Back to Website
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-6 inline-flex rounded-full border border-[#c8d7ef] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#244f8f] shadow-sm">
          {eyebrow}
        </div>
        <h1 className="text-4xl font-black leading-tight text-[#172033] sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">{summary}</p>
        <p className="mt-4 text-sm font-bold text-stone-500">Last updated: {legalLastUpdated}</p>

        <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          These pages are transparency notices for Revenue Guard AI. They are not legal advice and should be reviewed
          by qualified counsel before processing regulated data or launching in a jurisdiction with specific notice
          requirements.
        </div>

        <article className="legal-copy mt-8 rounded-lg border border-stone-200 bg-white p-6 shadow-xl shadow-stone-300/20 sm:p-8">
          {children}
        </article>

        <nav className="mt-8 grid gap-2 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-2">
          {legalLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-black text-[#244f8f] transition hover:bg-[#e8f0fc]">
              {item.label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

