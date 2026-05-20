import Link from "next/link";
import type { ReactNode } from "react";
import { PublicPageShell } from "@/components/PublicPageShell";

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
    <PublicPageShell eyebrow={eyebrow} title={title} summary={summary} contentClassName="mt-8">
      <p className="text-sm font-bold text-slate-400">Last updated: {legalLastUpdated}</p>

      <div className="mt-8 rounded-2xl border border-[#d9a42f]/35 bg-[#d9a42f]/10 p-4 text-sm font-bold leading-6 text-amber-100">
          These pages are transparency notices for NexCall. They are not legal advice and should be reviewed
          by qualified counsel before processing regulated data or launching in a jurisdiction with specific notice
          requirements.
      </div>

      <article className="legal-copy mt-8 rounded-2xl border border-white/10 bg-white/7 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
        {children}
      </article>

      <nav className="mt-8 grid gap-2 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur sm:grid-cols-2">
        {legalLinks.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-black text-[#8dbdff] transition hover:bg-white/8 hover:text-white">
            {item.label}
          </Link>
        ))}
      </nav>
    </PublicPageShell>
  );
}
