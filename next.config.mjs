import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' http://127.0.0.1:3010 http://localhost:3010 https://api.stripe.com https://checkout.stripe.com https://api.elevenlabs.io https://api.cal.com https://api.vapi.ai https://*.upstash.io https://*.inngest.com https://api.inngest.com wss://*.livekit.cloud wss://*.twilio.com",
  "media-src 'self' blob: data:",
  "frame-src 'self' https://checkout.stripe.com",
  "upgrade-insecure-requests"
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin"
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@tanstack/react-table"]
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || "development",
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "development"
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default withBundleAnalyzer(nextConfig);
