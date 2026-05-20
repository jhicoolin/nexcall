import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { nexcallPublicContact } from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "Refund Policy | NexCall",
  description: "Refund, cancellation, setup fee, and subscription policy for NexCall."
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refunds"
      title="Refund Policy"
      summary="This policy explains how subscription cancellations, setup work, and refund requests are handled unless a signed agreement says otherwise."
    >
      <h2>Subscriptions</h2>
      <p>Subscriptions are billed according to the plan selected at checkout or in a signed agreement. A cancellation stops future renewal charges, but does not automatically refund past periods that have already been delivered.</p>

      <h2>Setup Fees</h2>
      <p>Setup, onboarding, custom receptionist scripting, call-flow planning, and client-specific configuration may be non-refundable once work begins because the labor is performed for the specific client.</p>

      <h2>Good-Faith Review Window</h2>
      <p>If a plan includes a written money-back or pilot guarantee, that promise must appear in the signed order form, checkout terms, or written agreement. Do not rely on verbal refund promises that are not written into the client agreement.</p>

      <h2>Usage Costs</h2>
      <p>Usage-based costs, communication charges, payment processing fees, or special setup expenses may be non-refundable if those costs have already been incurred.</p>

      <h2>How to Request a Refund</h2>
      <p>Send the business name, billing email, plan, purchase date, and reason for the request through the website contact form or {nexcallPublicContact.email}. We review refund requests in good faith and may ask for call logs, issue details, or account information to evaluate the request.</p>

      <h2>No False Guarantees</h2>
      <p>NexCall does not guarantee a specific revenue increase, close rate, appointment volume, or ROI unless a written agreement states a specific measurable promise.</p>
    </LegalPage>
  );
}
