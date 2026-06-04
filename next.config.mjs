const isDevelopment = process.env.NODE_ENV !== "production";

// The landing page still uses React inline style props for a few decorative
// gradients and motion states, so style-src must allow inline styles until
// those components are refactored to class-based CSS.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.elevenlabs.io https://api.cal.com https://api.vapi.ai https://*.upstash.io https://*.inngest.com https://api.inngest.com wss://*.livekit.cloud wss://*.twilio.com",
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
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none"
  }
];

const sensitiveHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, max-age=0"
  },
  {
    key: "Pragma",
    value: "no-cache"
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
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
      },
      {
        source: "/admin",
        headers: sensitiveHeaders
      },
      {
        source: "/admin/:path*",
        headers: sensitiveHeaders
      },
      {
        source: "/command",
        headers: sensitiveHeaders
      },
      {
        source: "/api/admin/:path*",
        headers: sensitiveHeaders
      }
    ];
  }
};

export default nextConfig;
