import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NODE_ENV === "production"
    ? "https://nexcall.one"
    : process.env.NEXT_PUBLIC_SITE_URL || "https://nexcall.one";

function absolute(path: string) {
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absolute("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absolute("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6
    }
  ];
}
