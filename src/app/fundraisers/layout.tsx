import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  title: "Campus Crowdfunding & Student Fundraisers | Swyft",
  description:
    "Transparent crowdfunding for university student projects, medical emergencies, faculty library renewals, and campus innovation labs with instant public donor walls and receipts on Swyft.",
  keywords: [
    "campus crowdfunding nigeria",
    "student fundraisers",
    "university crowdfunding",
    "swyft fundraisers",
    "student emergency fund",
  ],
  alternates: {
    canonical: `${siteUrl}/fundraisers`,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: `${siteUrl}/fundraisers`,
    siteName: "Swyft Ticket",
    title: "Campus Crowdfunding & Student Fundraisers | Swyft",
    description: "Support student innovation and campus community causes with trusted crowdfunding.",
    images: [{ url: "/images/party.png", width: 1200, height: 630, alt: "Swyft Fundraisers" }],
  },
};

export default function FundraisersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
