import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  title: "Pay Faculty & Departmental Dues Online | Swyft",
  description:
    "Pay department levies, faculty association dues, and hall dues securely online. Instant verified digital receipts across UNILAG, OOU, UI, LASU, UNIBEN, and all Nigerian universities.",
  keywords: [
    "departmental dues payment online",
    "faculty dues payment nigeria",
    "pay university dues online",
    "student association dues receipt",
    "swyft dues",
    "campus dues payment",
  ],
  alternates: {
    canonical: `${siteUrl}/dues`,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: `${siteUrl}/dues`,
    siteName: "Swyft Ticket",
    title: "Pay University & Departmental Dues Online | Swyft",
    description: "Instant online dues payment with verified receipts for Nigerian university students.",
    images: [{ url: "/images/party.png", width: 1200, height: 630, alt: "Swyft Dues Payment" }],
  },
};

export default function DuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
