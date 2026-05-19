import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "AI Disclosure | NexCall",
  description: "High-level explanation of how AI may assist NexCall receptionist experiences."
};

export default function AiDisclosurePage() {
  return (
    <LegalPage
      eyebrow="AI Transparency"
      title="AI Disclosure"
      summary="This page explains where AI may be used, what it can do, and where humans should remain involved."
    >
      <h2>Where AI May Be Used</h2>
      <ul>
        <li>Answering or assisting with customer calls.</li>
        <li>Collecting contact details, appointment preferences, and business inquiry information.</li>
        <li>Helping summarize the conversation so a team member can follow up.</li>
        <li>Identifying when a caller may need a person instead of an automated response.</li>
      </ul>

      <h2>Disclosure to Callers</h2>
      <p>Clients should decide, with counsel where appropriate, whether the receptionist must identify itself as automated or disclose call recording or transcription. Some jurisdictions and industries require specific notices or consent.</p>

      <h2>Human Escalation</h2>
      <p>The system is designed to support human follow-up where appropriate. Sensitive, unusual, urgent, regulated, or uncertain conversations should be routed to a person instead of forcing automation to guess.</p>

      <h2>Known Limitations</h2>
      <p>AI can misunderstand accents, noise, interruptions, names, addresses, appointment times, policies, or caller intent. It can also produce incomplete or incorrect summaries. Clients should test and review the experience before relying on it for production calls.</p>

      <h2>No Fake Testimonials or Claims</h2>
      <p>Marketing content should not use fake reviews, fake customer results, or unverified earnings claims. Any testimonials or results shown publicly should be real, authorized, and representative or clearly qualified.</p>

      <h2>No Regulated Advice</h2>
      <p>The AI receptionist should not provide legal, medical, financial, tax, insurance, emergency, or professional advice. It should collect basic intake, answer approved administrative questions, and route callers to the right person.</p>

      <h2>Respectful Use</h2>
      <p>If a caller or visitor uses abusive, threatening, sexual, or inappropriate language, the assistant may keep the response brief, stay polite, or end the interaction.</p>
    </LegalPage>
  );
}
