import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revenue Guard AI | AI Receptionist for Growing Businesses",
  description:
    "Warm AI phone answering, lead qualification, calendar booking, SMS follow-up, and human fallback for appointment-based businesses."
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
