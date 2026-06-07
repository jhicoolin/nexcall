import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nexcall.one";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about"],
        disallow: [
          "/admin",
          "/admin/",
          "/command",
          "/checkout",
          "/health",
          "/api/",
          "/misato",
          "/misato/",
          "/approvals",
          "/tasks",
          "/settings",
          "/tools",
          "/watchtower",
          "/memory",
          "/projects",
          "/login",
          "/unauthorized",
          "/secrets"
        ]
      }
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`
  };
}
