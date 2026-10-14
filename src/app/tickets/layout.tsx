import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  title: "Find My Ticket & Instant QR Passes | Swyft",
  description:
    "Track your campus ticket orders, retrieve scannable QR passes, and download admission receipts instantly with your phone number, email, or order reference on Swyft Ticket.",
  keywords: [
    "find my ticket",
    "track campus ticket",
    "swyft ticket lookup",
    "download event pass",
    "qr ticket scanner pass",
    "swyft tickets",
    "campus tickets nigeria",
  ],
  alternates: {
    canonical: `${siteUrl}/tickets`,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: `${siteUrl}/tickets`,
    siteName: "Swyft Ticket",
    title: "Find My Campus Ticket | Swyft",
    description: "Instant QR ticket retrieval and admission passes for university events.",
    images: [{ url: "/images/party.png", width: 1200, height: 630, alt: "Swyft Ticket Lookup" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find My Campus Ticket | Swyft",
    description: "Instant QR ticket retrieval and admission passes for university events.",
    creator: "@swyftapp",
    images: ["/images/party.png"],
  },
};

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
