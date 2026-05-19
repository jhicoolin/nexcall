import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | NexCall",
  description: "How NexCall describes data collection, use, retention, and privacy choices."
};

export default function PrivacyPolicyPage() {
  const supportContact = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "the contact form on this website";

  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      summary="This policy explains what information may be collected through the website, lead forms, checkout, chat, and AI receptionist workflows."
    >
      <h2>Information We Collect</h2>
      <p>We may collect business contact information such as name, email, phone number, company name, industry, service needs, and messages submitted through forms or chat.</p>
      <p>When a client uses the AI receptionist service, call-related records may include caller phone numbers, call time, routing details, transcripts, summaries, appointment details, and follow-up status.</p>

      <h2>How We Use Information</h2>
      <ul>
        <li>To respond to demo, audit, sales, and support requests.</li>
        <li>To route calls, qualify leads, book appointments, send confirmations, and create summaries.</li>
        <li>To operate payments, subscriptions, onboarding, security, analytics, and customer support.</li>
        <li>To improve prompts, workflows, call handling quality, and client-specific receptionist settings.</li>
      </ul>

      <h2>Service Providers</h2>
      <p>The service may rely on providers such as hosting, database, telephony, payment, voice AI, email, SMS, analytics, calendar, CRM, and workflow automation platforms. These providers should be configured with appropriate account settings, access controls, and data-processing terms before production use.</p>

      <h2>Payment Data</h2>
      <p>Payments are handled through Stripe Checkout or another configured payment provider. We do not intentionally store full card numbers in this application.</p>

      <h2>Client Data and Call Data</h2>
      <p>Each client is configured as a tenant with its own phone routing, prompts, calendar destinations, and approved business rules. Client webhook URLs and sensitive integration values should be stored server-side or encrypted in the tenant database, not hardcoded into public code.</p>

      <h2>Retention</h2>
      <p>Retention periods should be configured according to client needs, legal requirements, and provider settings. Call transcripts and summaries should be retained only as long as they are useful for service, support, billing, compliance, or legitimate business needs.</p>

      <h2>Your Choices</h2>
      <p>You may request access, correction, or deletion of personal information by contacting us through {supportContact}. Some records may need to be retained for security, billing, dispute resolution, or legal reasons.</p>

      <h2>Important Regulated Data Notice</h2>
      <p>Do not submit health, legal, financial, payment-card, government ID, or other sensitive regulated information unless a signed agreement and the required compliance setup are in place. NexCall does not claim HIPAA, PCI, SOC 2, GDPR, CCPA, legal, medical, or financial compliance by default.</p>

      <h2>Security</h2>
      <p>We use practical safeguards such as server-side secrets, webhook validation, rate limiting, input validation, and encrypted storage for sensitive tenant webhooks where configured. No internet service can guarantee absolute security.</p>

      <h2>Contact</h2>
      <p>For privacy questions, use {supportContact}.</p>
    </LegalPage>
  );
}

