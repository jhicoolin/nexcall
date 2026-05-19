import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Compliance Notice | Revenue Guard AI",
  description: "Plain-language compliance notice for Revenue Guard AI claims, security, and regulated workflows."
};

export default function ComplianceNoticePage() {
  return (
    <LegalPage
      eyebrow="Compliance"
      title="Compliance Notice"
      summary="This notice explains what the service is designed to support and what should not be claimed without a separate review."
    >
      <h2>Truthful Marketing Standard</h2>
      <p>Revenue Guard AI should market measurable capabilities such as answering calls, capturing details, booking approved appointments, and sending summaries. It should not claim guaranteed revenue, guaranteed compliance, or guaranteed human-level accuracy without evidence.</p>

      <h2>Security Posture</h2>
      <p>The application includes security controls such as server-side secrets, environment variables, rate limiting, webhook signature checks, encrypted tenant webhook storage, input validation, and security headers. These controls support safer operations but do not equal third-party security certification.</p>

      <h2>Regulated Industries</h2>
      <p>Healthcare, legal, financial, insurance, debt, education, children’s data, employment, housing, and other regulated use cases may require additional contracts, consent flows, vendor terms, audit trails, retention settings, and professional review before launch.</p>

      <h2>No Default Certification Claims</h2>
      <p>Unless a signed agreement specifically says otherwise, Revenue Guard AI does not claim HIPAA compliance, SOC 2 certification, ISO certification, PCI compliance, GDPR compliance, CCPA compliance, legal practice compliance, medical practice compliance, or financial services compliance.</p>

      <h2>Client Review Required</h2>
      <p>Each client is responsible for approving business-specific scripts, prompts, knowledge base content, escalation rules, recording notices, appointment rules, and customer-facing claims before the AI receptionist goes live.</p>

      <h2>Human-in-the-Loop</h2>
      <p>For sensitive or high-risk conversations, the recommended operating model is AI-first intake with human fallback. The AI should capture context and route the conversation rather than pretending to be a licensed professional.</p>
    </LegalPage>
  );
}

