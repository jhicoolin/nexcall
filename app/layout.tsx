import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexCall | AI Receptionist for Growing Businesses",
  description:
    "Premium AI phone answering, lead qualification, calendar booking, SMS follow-up, and human fallback for businesses that cannot afford missed calls.",
  openGraph: {
    title: "NexCall | AI Receptionist for Growing Businesses",
    description:
      "NexCall answers calls, captures leads, books appointments, and hands complex conversations to your team with clean context.",
    siteName: "NexCall",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NexCall | AI Receptionist for Growing Businesses",
    description:
      "AI receptionist coverage for missed calls, booking, lead intake, and customer follow-up."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
