import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  title: "Campus Tickets, University Parties & Concerts | Swyft",
  description:
    "Explore upcoming campus events, university festivals, faculty dinners, hall weeks, and tech hackathons across Nigeria. Filter by school including UNILAG, OOU, UI, LASU, and book instant QR tickets.",
  keywords: [
    "campus ticket",
    "campus tickets",
    "campus tickets nigeria",
    "swyft ticket",
    "university party tickets",
    "unilag tickets",
    "oou tickets",
    "ui tickets",
    "lasu tickets",
    "uniben tickets",
    "oau tickets",
    "futa tickets",
    "hall week tickets",
    "faculty dinner tickets",
    "student concert tickets",
    "buy campus tickets online",
  ],
  alternates: {
    canonical: `${siteUrl}/events`,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: `${siteUrl}/events`,
    siteName: "Swyft Ticket",
    title: "Campus Tickets & Upcoming University Events | Swyft",
    description:
      "Explore upcoming campus events, university festivals, faculty dinners, hall weeks, and tech hackathons across Nigeria. Instant scannable tickets.",
    images: [
      {
        url: "/images/party.png",
        width: 1200,
        height: 630,
        alt: "Swyft Campus Events & Tickets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Tickets & Upcoming University Events | Swyft",
    description:
      "Discover and buy tickets for the biggest university parties, concerts, and faculty dinners in Nigeria.",
    creator: "@swyftapp",
    images: ["/images/party.png"],
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Events",
        "item": `${siteUrl}/events`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
