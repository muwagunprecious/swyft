import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  title: "Organizer Pricing & Platform Fees | Swyft Tickets",
  description:
    "Transparent pricing for campus event organizers and student associations. Free events are 100% free with unlimited tickets. Flat 4% platform fee and 1.5% payment fee on paid tickets with instant payouts.",
  keywords: [
    "event organizer pricing",
    "campus ticketing fees",
    "swyft ticket pricing",
    "sell tickets online fees nigeria",
    "paystack event ticketing fees",
    "student event ticketing free",
  ],
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: `${siteUrl}/pricing`,
    siteName: "Swyft Ticket",
    title: "Simple, Transparent Organizer Pricing | Swyft",
    description: "Free events are always free. Flat low fees on paid tickets with same-day wallet withdrawals.",
    images: [{ url: "/images/party.png", width: 1200, height: 630, alt: "Swyft Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simple, Transparent Organizer Pricing | Swyft",
    description: "Free events are always free. Flat low fees on paid tickets with same-day wallet withdrawals.",
    creator: "@swyftapp",
    images: ["/images/party.png"],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
