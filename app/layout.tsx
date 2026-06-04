import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const siteUrl =
  process.env.NODE_ENV === "production"
    ? "https://nexcall.one"
    : process.env.NEXT_PUBLIC_SITE_URL || "https://nexcall.one";
const title = "NexCall - AI Receptionist for Local Businesses";
const description =
  "NexCall helps businesses answer calls, capture lead details, support appointment requests, and send clean next steps to the team 24/7.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "NexCall",
  title,
  description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "NexCall",
    type: "website",
    images: [
      {
        url: "/brand/nexcall-og.png",
        width: 1200,
        height: 630,
        alt: "NexCall - AI receptionist service for local businesses"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/brand/nexcall-og.png"]
  },
  appleWebApp: {
    title: "NexCall",
    capable: true,
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020403"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorBoundary>{children}</ErrorBoundary>
        <Script src="/runtime-fallback.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
