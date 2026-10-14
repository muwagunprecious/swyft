import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/events",
          "/events/*",
          "/tickets",
          "/voting",
          "/voting/*",
          "/dues",
          "/fundraisers",
          "/pricing",
          "/marketing",
          "/help",
          "/terms",
          "/privacy",
          "/verify-ticket",
          "/verify-ticket/*",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/organizer",
          "/organizer/*",
          "/api/*",
          "/checkout/*",
          "/cart",
          "/dashboard",
          "/forgot-password",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/events",
          "/events/*",
          "/tickets",
          "/voting",
          "/voting/*",
          "/dues",
          "/fundraisers",
          "/pricing",
          "/marketing",
          "/help",
          "/terms",
          "/privacy",
          "/verify-ticket",
        ],
        disallow: [
          "/admin/",
          "/organizer/",
          "/api/",
          "/checkout/",
          "/dashboard",
          "/cart",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
