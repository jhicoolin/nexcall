import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "AI Disclosure | Revenue Guard AI",
  description: "Transparent explanation of how AI is used in Revenue Guard AI receptionist workflows."
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
        <li>Answering inbound calls or demo calls.</li>
        <li>Transcribing caller speech.</li>
        <li>Generating short receptionist responses from approved client rules.</li>
        <li>Summarizing calls, qualifying leads, and identifying booking intent.</li>
        <li>Triggering calendar, CRM, SMS, or human handoff workflows when configured.</li>
      </ul>

      <h2>Disclosure to Callers</h2>
      <p>Clients should decide, with counsel where appropriate, whether the AI receptionist must identify itself as AI or disclose call recording/transcription. Some jurisdictions and industries require specific notices or consent.</p>

      <h2>Human Escalation</h2>
      <p>The system is designed to escalate sensitive, unusual, emotional, high-value, urgent, regulated, or uncertain conversations to a person. Automation should not trap callers when judgment is required.</p>

      <h2>Known Limitations</h2>
      <p>AI can misunderstand accents, noise, interruptions, names, addresses, appointment times, policies, or caller intent. AI can also produce incomplete or incorrect summaries. Clients should test and review workflows before relying on the system for production calls.</p>

      <h2>No Fake Testimonials or Claims</h2>
      <p>Marketing content should not use fake reviews, fake customer results, or unverified earnings claims. Any testimonials or results shown publicly should be real, authorized, and representative or clearly qualified.</p>

      <h2>No Regulated Advice</h2>
      <p>The AI receptionist should not provide legal, medical, financial, tax, insurance, emergency, or professional advice. It should collect basic intake, answer approved administrative questions, and route the caller to the right person.</p>

      <h2>Safety Shutoff</h2>
      <p>The chat and voice architecture includes a professional safety policy. If a caller or visitor uses abusive, threatening, sexual, or inappropriate language, the assistant may politely end the interaction.</p>
    </LegalPage>
  );
}

