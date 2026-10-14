import type { Metadata } from "next";
import { events as mockEvents } from "@/lib/swyft-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://swyft-ticket.name.ng";

async function getEventData(id: string) {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://swyft-backend-five.vercel.app/api"
        : "http://localhost:5000/api");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${apiUrl}/events/${id}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to static mock inventory
  }

  return mockEvents.find((e) => e.id === id) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventData(id);

  if (!event) {
    return {
      title: "Event Details | Swyft Campus Tickets",
      description: "Discover and purchase tickets for campus events across Nigerian universities on Swyft Ticket.",
    };
  }

  const title = `${event.title} - Campus Ticket | Swyft`;
  const description =
    event.description?.slice(0, 160) ||
    `Get tickets for ${event.title} on Swyft Ticket. Instant QR delivery, secure Paystack checkout, and verified admission.`;
  const bannerImage = event.bannerImage || `${siteUrl}/images/party.png`;

  return {
    title,
    description,
    keywords: [
      event.title,
      `${event.title} tickets`,
      event.category,
      event.location,
      "campus ticket",
      "swyft ticket",
      "buy campus tickets",
      "nigerian university tickets",
      event.university || "Nigeria",
    ],
    alternates: {
      canonical: `${siteUrl}/events/${id}`,
    },
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: `${siteUrl}/events/${id}`,
      siteName: "Swyft Ticket",
      title,
      description,
      images: [
        {
          url: bannerImage,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@swyftapp",
      images: [bannerImage],
    },
  };
}

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventData(id);

  let eventJsonLd = null;
  let breadcrumbJsonLd = null;

  if (event) {
    const organizerName =
      typeof event.organizer === "object"
        ? event.organizer?.name || "Event Organizer"
        : event.organizer || "Event Organizer";

    const tickets = event.Ticket || event.tickets || [];
    const offers = tickets.map((t: any) => ({
      "@type": "Offer",
      name: t.name,
      price: t.discountPrice && new Date(t.discountEndsAt) > new Date() ? t.discountPrice : t.price,
      priceCurrency: "NGN",
      availability:
        t.sold >= t.quantity
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url: `${siteUrl}/events/${id}`,
      validFrom: event.createdAt || new Date().toISOString(),
    }));

    eventJsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description,
      image: [event.bannerImage || `${siteUrl}/images/party.png`],
      startDate: event.date,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: event.location,
        address: {
          "@type": "PostalAddress",
          addressCountry: "NG",
        },
      },
      organizer: {
        "@type": "Organization",
        name: organizerName,
        url: siteUrl,
      },
      offers: offers.length > 0 ? offers : undefined,
    };

    breadcrumbJsonLd = {
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
        {
          "@type": "ListItem",
          "position": 3,
          "name": event.title,
          "item": `${siteUrl}/events/${id}`,
        },
      ],
    };
  }

  return (
    <>
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      {children}
    </>
  );
}
