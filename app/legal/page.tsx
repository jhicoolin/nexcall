import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, legalLinks } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Legal Center | Revenue Guard AI",
  description: "Legal, privacy, AI transparency, refund, cookie, compliance, and accessibility notices for Revenue Guard AI."
};

export default function LegalCenterPage() {
  return (
    <LegalPage
      eyebrow="Legal Center"
      title="Legal and Transparency Center"
      summary="A central place for the policies and notices buyers can review before using Revenue Guard AI."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {legalLinks.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-stone-200 bg-[#f6f2ea] p-4 font-black text-[#244f8f] transition hover:bg-[#e8f0fc]">
            {item.label}
          </Link>
        ))}
      </div>
    </LegalPage>
  );
}

