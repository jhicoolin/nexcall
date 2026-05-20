import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { nexcallPublicContact } from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "Accessibility Statement | NexCall",
  description: "Accessibility statement and feedback process for NexCall."
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="Accessibility Statement"
      summary="NexCall aims to provide a website that is usable by as many people as possible."
    >
      <h2>Our Goal</h2>
      <p>We aim to keep the website readable, keyboard-friendly, responsive, and understandable across common devices, browsers, and assistive technologies.</p>

      <h2>Design Practices</h2>
      <ul>
        <li>Large touch targets for important actions.</li>
        <li>Semantic headings and labels where practical.</li>
        <li>Text alternatives for meaningful images.</li>
        <li>Reduced-motion support for visitors who prefer less animation.</li>
        <li>Readable contrast and responsive layouts.</li>
      </ul>

      <h2>Feedback</h2>
      <p>If you have trouble using any part of the website, please contact us at {nexcallPublicContact.email} with the page, device, browser, and issue. We will use that feedback to improve the experience.</p>

      <h2>No Absolute Claim</h2>
      <p>This statement is an accessibility commitment, not a claim that every page or outside service is perfectly conformant in every setting.</p>
    </LegalPage>
  );
}
