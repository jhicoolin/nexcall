import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Notice | Revenue Guard AI",
  description: "Cookie and similar technology notice for Revenue Guard AI."
};

export default function CookieNoticePage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Cookie Notice"
      summary="This notice explains how cookies or similar technologies may be used by the site and connected providers."
    >
      <h2>Current Use</h2>
      <p>The website may use essential cookies or local browser storage for basic functionality such as checkout routing, security, session handling, and admin access. The app does not need advertising cookies to function.</p>

      <h2>Third-Party Providers</h2>
      <p>Providers such as Stripe, hosting, analytics, chat, telephony, or workflow tools may set their own cookies or collect technical data when their services are loaded or used. Their policies apply to their systems.</p>

      <h2>Analytics and Marketing</h2>
      <p>If analytics, retargeting, heatmaps, ad pixels, or marketing cookies are added later, the site should add the appropriate consent banner, preference controls, and jurisdiction-specific disclosures before those tools are activated.</p>

      <h2>Your Controls</h2>
      <p>You can usually block or delete cookies through your browser settings. Blocking essential cookies may affect checkout, login, admin sessions, or other site features.</p>
    </LegalPage>
  );
}

