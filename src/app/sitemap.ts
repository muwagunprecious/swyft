import type { MetadataRoute } from "next";
import { events as mockEvents, votingCampaigns } from "@/lib/swyft-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";
  const now = new Date();

  // Core static routes with high SEO priorities and appropriate update frequencies
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/tickets`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/voting`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/dues`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/fundraisers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/verify-ticket`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/marketing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${siteUrl}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Dynamic Event and Voting routes
  const dynamicRoutes: MetadataRoute.Sitemap = [];
  const eventIdsSeen = new Set<string>();

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://swyft-backend-five.vercel.app/api"
        : "http://localhost:5000/api");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiUrl}/events`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item?.id && !eventIdsSeen.has(item.id)) {
            eventIdsSeen.add(item.id);
            dynamicRoutes.push({
              url: `${siteUrl}/events/${item.id}`,
              lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
              changeFrequency: "daily",
              priority: 0.85,
            });

            if (item.isVotingEnabled) {
              dynamicRoutes.push({
                url: `${siteUrl}/voting/${item.id}`,
                lastModified: item.updatedAt ? new Date(item.updatedAt) : now,
                changeFrequency: "daily",
                priority: 0.8,
              });
            }
          }
        }
      }
    }
  } catch {
    // Fail-safe during static builds or disconnected environments
  }

  // Include static/mock events if not already present
  for (const ev of mockEvents) {
    if (!eventIdsSeen.has(ev.id)) {
      eventIdsSeen.add(ev.id);
      dynamicRoutes.push({
        url: `${siteUrl}/events/${ev.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Include voting campaigns
  for (const campaign of votingCampaigns) {
    dynamicRoutes.push({
      url: `${siteUrl}/voting/${campaign.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}
