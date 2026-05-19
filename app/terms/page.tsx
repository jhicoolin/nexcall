import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Revenue Guard AI",
  description: "Terms governing use of the Revenue Guard AI website and services."
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      summary="These terms describe the baseline rules for using the Revenue Guard AI website, demos, checkout, and AI receptionist services."
    >
      <h2>Acceptance</h2>
      <p>By using the website, submitting a form, calling a demo number, purchasing a plan, or using the service, you agree to these terms. If you do not agree, do not use the service.</p>

      <h2>Service Description</h2>
      <p>Revenue Guard AI provides AI receptionist workflows that may answer calls, capture lead details, qualify requests, book appointments, send summaries, trigger SMS or calendar workflows, and route calls to humans when configured.</p>

      <h2>No Professional Advice</h2>
      <p>The service is not a law firm, medical provider, financial adviser, emergency service, or licensed professional service. AI responses should not be treated as legal, medical, financial, tax, safety, or emergency advice.</p>

      <h2>Client Responsibilities</h2>
      <ul>
        <li>Provide accurate business hours, services, prices, policies, routing rules, and escalation contacts.</li>
        <li>Review and approve prompts, scripts, workflows, and AI disclosures before launch.</li>
        <li>Confirm whether call recording, consent, privacy, industry, and jurisdiction-specific rules apply.</li>
        <li>Maintain access to connected tools such as calendars, CRMs, phone systems, and payment providers.</li>
      </ul>

      <h2>Acceptable Use</h2>
      <p>You may not use the service for unlawful activity, harassment, discrimination, deceptive claims, spam, unauthorized recording, credential theft, security abuse, or collection of sensitive data without the required agreements and safeguards.</p>

      <h2>AI Limitations</h2>
      <p>AI systems can misunderstand callers, make transcription mistakes, fail to recognize context, or require human review. The system is designed to use approved business rules and escalate uncertain issues, but it should be tested and monitored.</p>

      <h2>Billing</h2>
      <p>Paid plans, billing cycles, included usage, setup fees, overages, cancellation, and refund terms are shown at checkout, in the signed order form, or in the Refund Policy. Third-party provider fees may apply.</p>

      <h2>Availability</h2>
      <p>We aim to provide reliable service but do not guarantee uninterrupted access. Telephony, AI, calendar, payment, hosting, and network providers can experience downtime or degraded service.</p>

      <h2>Limitation of Liability</h2>
      <p>To the maximum extent allowed by law, Revenue Guard AI is not liable for indirect, incidental, consequential, special, punitive, lost-profit, lost-revenue, lost-data, or lost-business damages arising from use or inability to use the service.</p>

      <h2>Changes</h2>
      <p>We may update these terms as the product, laws, or providers change. Continued use after updates means you accept the revised terms.</p>
    </LegalPage>
  );
}

