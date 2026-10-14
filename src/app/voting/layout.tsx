import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  title: "Campus Voting, SUG Elections & Student Awards | Swyft",
  description:
    "Cast secure, verified votes for student union government (SUG) elections, faculty representatives, Miss Campus pageants, and creator contests with real-time transparent results on Swyft.",
  keywords: [
    "campus voting",
    "sug election voting",
    "university online voting nigeria",
    "swyft voting",
    "swyft ticket",
    "campus ticket",
    "miss faculty voting",
    "student choice awards voting",
    "unilag sug election",
    "oou student voting",
  ],
  alternates: {
    canonical: `${siteUrl}/voting`,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: `${siteUrl}/voting`,
    siteName: "Swyft Ticket",
    title: "Campus Voting & SUG Elections | Swyft",
    description:
      "Vote in student union elections, faculty pageants, and student awards with verified fraud prevention on Swyft.",
    images: [
      {
        url: "/images/party.png",
        width: 1200,
        height: 630,
        alt: "Swyft Campus Voting & Contests",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Voting & SUG Elections | Swyft",
    description:
      "Transparent student election voting with real-time tallying and voter fraud prevention.",
    creator: "@swyftapp",
    images: ["/images/party.png"],
  },
};

export default function VotingLayout({
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
        "name": "Voting",
        "item": `${siteUrl}/voting`,
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
