import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Swyft | Campus Tickets, University Events & Student Voting Nigeria",
    template: "%s | Swyft - Campus Tickets",
  },
  description:
    "Swyft Ticket is Nigeria's leading campus ticketing and event platform. Buy & sell campus tickets, university concert passes, hall week tickets, departmental dues, and vote in SUG elections across UNILAG, OOU, UI, LASU, UNIBEN, OAU, FUTA, and all Nigerian universities with instant QR code delivery.",
  applicationName: "Swyft Ticket",
  authors: [{ name: "Swyft Technologies", url: siteUrl }],
  generator: "Next.js",
  keywords: [
    // Core brand & category keywords
    "swyft",
    "swyft ticket",
    "swyft tickets",
    "swyft ticketing",
    "swyft-ticket",
    "campus ticket",
    "campus tickets",
    "campus-ticket",
    "campus ticketing platform",
    "campus tickets nigeria",
    "nigerian campus tickets",
    "buy campus tickets",
    "sell campus tickets",
    "student tickets nigeria",
    "university event tickets",
    // Major Nigerian Campuses
    "unilag tickets",
    "oou tickets",
    "ui tickets",
    "lasu tickets",
    "uniben tickets",
    "oau tickets",
    "futa tickets",
    "funaab tickets",
    "abu tickets",
    "unn tickets",
    "unilorin tickets",
    "covenant university tickets",
    "babcock tickets",
    "bowen tickets",
    // Event Types
    "campus party tickets",
    "hall week tickets",
    "hall week passes nigeria",
    "faculty dinner tickets",
    "departmental dinner tickets",
    "campus concert tickets",
    "campus music festival lagos",
    "student freshers party tickets",
    "university rave tickets",
    "campus hackathon passes",
    // Payments & Dues
    "departmental dues payment online",
    "faculty dues payment nigeria",
    "pay university dues online",
    "student association levy payment",
    // Voting & Elections
    "campus election voting",
    "sug election voting platform",
    "university online voting nigeria",
    "miss faculty pageant voting",
    "student choice awards voting",
    // Ticketing & Tech Features
    "qr code event ticket generator",
    "event gate pass verification",
    "paystack event ticketing nigeria",
    "instant ticket pdf download",
    "event organizer dashboard nigeria",
    "sell tickets online nigeria",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Swyft Technologies",
  publisher: "Swyft Technologies",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    siteName: "Swyft Ticket",
    title: "Swyft | Campus Tickets, University Events & Student Voting Nigeria",
    description:
      "Buy campus tickets, attend top university parties, pay departmental dues, and vote in student elections on Swyft Ticket.",
    images: [
      {
        url: "/images/party.png",
        width: 1200,
        height: 630,
        alt: "Swyft Ticket - Campus Events & Ticketing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swyft | Campus Tickets & University Events",
    description:
      "Buy campus tickets, attend top university parties, pay departmental dues, and vote in student elections on Swyft Ticket.",
    creator: "@swyftapp",
    images: ["/images/party.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Ticketing & University Events",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Global Structured Data: Organization, WebSite with SearchAction, and SoftwareApplication
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Swyft Ticket",
    alternateName: ["Swyft", "Campus Ticket", "Swyft Ticketing", "Swyft Nigeria"],
    url: siteUrl,
    logo: `${siteUrl}/images/party.png`,
    description:
      "Nigeria's #1 campus ticketing, university event management, and student voting platform.",
    sameAs: ["https://twitter.com/swyftapp", "https://instagram.com/swyftapp"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@swyft-ticket.name.ng",
      contactType: "customer support",
      areaServed: "NG",
      availableLanguage: "English",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Swyft Ticket",
    alternateName: ["Swyft Campus Tickets", "Campus Ticket"],
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/events?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const applicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Swyft Ticket Platform",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }}
        />
      </head>
      <body className={`min-h-screen bg-[#0a0a0a] text-[#fafafa] antialiased ${geistSans.variable} font-sans`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
