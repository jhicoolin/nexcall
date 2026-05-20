import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, legalLinks } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Legal Center | NexCall",
  description: "Legal, privacy, AI transparency, refund, cookie, compliance, and accessibility notices for NexCall."
};

export default function LegalCenterPage() {
  return (
    <LegalPage
      eyebrow="Legal Center"
      title="Legal and Transparency Center"
      summary="A central place for the policies and notices buyers can review before using NexCall."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {legalLinks.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl border border-white/10 bg-white/7 p-4 font-black text-[#8dbdff] transition hover:border-[#8dbdff]/40 hover:bg-white/10 hover:text-white">
            {item.label}
          </Link>
        ))}
      </div>
    </LegalPage>
  );
}
