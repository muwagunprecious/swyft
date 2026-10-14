"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import EventCard from "@/components/events/EventCard";

interface ApiEvent {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  location: string;
  category: string;
  university?: string;
  isVotingEnabled?: boolean;
  Ticket?: {
    name: string;
    price: number;
    discountPrice?: number | null;
    discountEndsAt?: string | null;
    quantity: number;
    sold: number;
  }[];
}

const featuredCampuses = [
  { code: "UNILAG", name: "University of Lagos", state: "Lagos" },
  { code: "OOU", name: "Olabisi Onabanjo University", state: "Ogun" },
  { code: "UI", name: "University of Ibadan", state: "Oyo" },
  { code: "LASU", name: "Lagos State University", state: "Lagos" },
  { code: "UNIBEN", name: "University of Benin", state: "Edo" },
  { code: "OAU", name: "Obafemi Awolowo University", state: "Osun" },
  { code: "FUTA", name: "Federal Univ. of Technology", state: "Ondo" },
  { code: "FUNAAB", name: "Federal Univ. of Agriculture", state: "Ogun" },
  { code: "UNN", name: "University of Nigeria", state: "Enugu" },
  { code: "ABU", name: "Ahmadu Bello University", state: "Kaduna" },
  { code: "CU", name: "Covenant University", state: "Ogun" },
  { code: "UNILORIN", name: "University of Ilorin", state: "Kwara" },
];

const faqs = [
  {
    q: "What is Swyft Ticket?",
    a: "Swyft Ticket (swyft-ticket.name.ng) is Nigeria's leading campus ticketing and university event platform. We empower student event organizers, departmental associations, and campus creators to distribute scannable QR tickets, collect ticket payments securely via Paystack, track sales in real-time, collect faculty dues, and execute transparent online student elections.",
  },
  {
    q: "How do I buy a campus ticket on Swyft?",
    a: "Browse upcoming events or filter by your university (e.g. UNILAG, OOU, UI, LASU). Select your desired ticket tier (e.g. Student, Regular, VIP), provide your name and email address, and pay securely via Paystack using a debit card, bank transfer, or USSD. Your official scannable QR code pass is generated immediately and emailed to you.",
  },
  {
    q: "How do university event organizers receive ticket payouts?",
    a: "Ticket earnings credit directly to your organizer wallet in real time. Swyft deducts a low transparent platform fee (4% service fee and 1.5% payment processor fee). You can request withdrawals to your linked Nigerian bank account at any time with instant automated processing.",
  },
  {
    q: "Can student associations use Swyft for departmental dues and SUG voting?",
    a: "Yes. Swyft supports digital departmental dues collection with verifiable student payment receipts, as well as digital student voting for SUG elections, faculty beauty pageants, and campus awards with real-time fraud-proof tallying and candidate vote counts.",
  },
  {
    q: "How are tickets verified at university gates and party entrances?",
    a: "Every Swyft ticket includes an encrypted, single-use QR code. Event organizers and bouncers can open the Swyft Gate Verification tool on any smartphone camera to scan passes and confirm attendee admission in milliseconds with zero chance of duplicate entry.",
  },
];

export default function HomePage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data || []);
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const categories = ["All", "Entertainment", "Party", "Tech", "Dinner", "Conference"];

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory !== "All" && ev.category !== selectedCategory) return false;
    return true;
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      
      {/* FAQ Schema for Search Engine Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* 1. HERO SECTION (Oversized Editorial Display Typography & Centered Pill CTA) */}
      <section className="grix-container pt-20 md:pt-32 pb-20 md:pb-32 flex flex-col items-center text-center">
        
        {/* Top Tagline / Category Label */}
        <span className="text-[13px] md:text-[14px] font-medium tracking-widest uppercase text-[#9ca3af] mb-6">
          Nigeria&apos;s #1 Campus Ticketing & Event Marketplace
        </span>

        {/* Display Headline with mixed weights: Satoshi display 72px */}
        <h1 className="headline-display max-w-4xl text-[#fafafa] mb-6">
          Buy & Sell <span className="font-bold">Campus Tickets</span> with Pure <span className="font-bold">Speed</span>.
        </h1>

        {/* Supporting paragraph: body-lg */}
        <p className="body-lg max-w-2xl text-[#9ca3af] mb-10 leading-relaxed">
          From UNILAG rave parties to OOU tech summits, hall weeks, and SUG elections. Experience seamless digital passes with instant QR delivery on Swyft Ticket.
        </p>

        {/* Primary Pill CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/events" className="btn-primary">
            Explore Campus Events
          </Link>
          <Link href="/organizer/events/new" className="btn-secondary">
            Host an Event
          </Link>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-14 pt-8 border-t border-[#262626] w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-[20px] font-bold text-[#fafafa]">Instant QR</div>
            <div className="text-[12px] text-[#9ca3af] font-light">Direct to Phone & Email</div>
          </div>
          <div>
            <div className="text-[20px] font-bold text-[#fafafa]">Paystack</div>
            <div className="text-[12px] text-[#9ca3af] font-light">Cards, Transfers & USSD</div>
          </div>
          <div>
            <div className="text-[20px] font-bold text-[#fafafa]">50+ Campuses</div>
            <div className="text-[12px] text-[#9ca3af] font-light">UNILAG, OOU, UI, LASU</div>
          </div>
          <div>
            <div className="text-[20px] font-bold text-[#fafafa]">Real-Time</div>
            <div className="text-[12px] text-[#9ca3af] font-light">Instant Wallet Payouts</div>
          </div>
        </div>

      </section>

      {/* 2. FEATURED EVENTS SECTION (3-Column Desktop Grid with Wide Margins) */}
      <section className="grix-container pb-24">
        
        {/* Section Heading & Category Filter Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#374151] mb-10">
          <div>
            <span className="text-[13px] font-medium tracking-wider uppercase text-[#9ca3af]">
              Live Campus Listings
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extralight tracking-tight text-[#fafafa] mt-1">
              Featured Events
            </h2>
          </div>

          {/* Minimalist Text Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all cursor-pointer border ${
                    active
                      ? "bg-[#fafafa] text-[#171717] border-[#fafafa]"
                      : "bg-transparent text-[#9ca3af] border-[#374151] hover:text-[#fafafa] hover:border-[#fafafa]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Cards 3-Column Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="grix-card h-[400px] animate-pulse bg-[#171717]/50 border-[#374151]">
                <div className="aspect-[4/3] w-full bg-[#262626] rounded-md mb-4" />
                <div className="space-y-3">
                  <div className="h-3 w-1/3 bg-[#262626] rounded" />
                  <div className="h-5 w-3/4 bg-[#262626] rounded" />
                  <div className="h-3 w-1/2 bg-[#262626] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const tickets = event.Ticket || [];

              // Calculate active discount on lowest priced tier
              let minPrice: number | null = null;
              let originalPriceStr: string | undefined = undefined;

              if (tickets.length > 0) {
                const pricedTickets = tickets.map((t) => {
                  const hasDiscount =
                    t.discountPrice !== null &&
                    t.discountPrice !== undefined &&
                    t.discountEndsAt &&
                    new Date(t.discountEndsAt) > new Date();

                  const effective = hasDiscount ? Number(t.discountPrice) : Number(t.price);
                  return {
                    effective,
                    original: Number(t.price),
                    hasDiscount,
                  };
                });

                pricedTickets.sort((a, b) => a.effective - b.effective);
                const best = pricedTickets[0];
                minPrice = best.effective;
                if (best.hasDiscount && best.original > best.effective) {
                  originalPriceStr = `₦${best.original.toLocaleString()}`;
                }
              }

              const priceLabel = minPrice === null || minPrice === 0 ? "Free" : `₦${minPrice.toLocaleString()}`;

              return (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={event.date}
                  location={event.location}
                  category={event.category}
                  bannerImage={event.bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"}
                  university={event.university}
                  priceLabel={priceLabel}
                  originalPrice={originalPriceStr}
                  isVotingEnabled={event.isVotingEnabled}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-6 rounded-lg border border-[#374151] bg-[#0a0a0a]">
            <p className="text-[20px] font-light text-[#fafafa] mb-2">No events found in this category</p>
            <p className="text-[14px] text-[#9ca3af] mb-6">Switch category or view all active listings.</p>
            <button
              onClick={() => setSelectedCategory("All")}
              className="btn-secondary !min-h-[44px] !min-w-[160px] !text-[14px] !py-2 !px-6"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* View all events link below grid */}
        <div className="mt-14 text-center">
          <Link href="/events" className="btn-link text-[16px]">
            View all upcoming campus events &rarr;
          </Link>
        </div>

      </section>

      {/* 3. CAMPUS TICKETING DIRECTORY (Targeting Campus Ticket SEO Keywords) */}
      <section className="grix-container pb-24">
        <div className="rounded-xl border border-[#262626] bg-[#121212] p-8 md:p-12">
          <div className="max-w-2xl mb-8">
            <span className="text-[12px] font-medium tracking-widest uppercase text-[#9ca3af]">
              Campus Ticket Network
            </span>
            <h2 className="text-[26px] md:text-[34px] font-light text-[#fafafa] mt-1 mb-3">
              Ticketing for Universities Across Nigeria
            </h2>
            <p className="text-[14px] text-[#9ca3af] font-light leading-relaxed">
              Find tickets for campus concerts, fresher welcome parties, hall week pageants, and departmental dinners at top Nigerian universities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredCampuses.map((campus) => (
              <Link
                key={campus.code}
                href={`/events?university=${campus.code}`}
                className="group rounded-lg border border-[#262626] bg-[#0a0a0a] p-4 transition-all hover:border-[#fafafa] no-underline"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[16px] font-bold text-[#fafafa] group-hover:text-white transition-colors">
                    {campus.code}
                  </span>
                  <span className="text-[11px] font-mono text-[#9ca3af] px-2 py-0.5 rounded bg-[#171717] border border-[#262626]">
                    {campus.state}
                  </span>
                </div>
                <div className="text-[12px] text-[#9ca3af] group-hover:text-[#fafafa] transition-colors line-clamp-1 font-light">
                  {campus.name}
                </div>
                <div className="text-[11px] text-[#6b7280] mt-2 group-hover:text-[#9ca3af] flex items-center gap-1 font-medium">
                  View campus tickets &rarr;
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. EDITORIAL ORGANIZER BANNER */}
      <section className="grix-container pb-24">
        <div className="rounded-lg border border-[#374151] bg-[#0a0a0a] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-[13px] font-medium tracking-widest uppercase text-[#9ca3af]">
              Host With Swyft Ticket
            </span>
            <h3 className="text-[32px] md:text-[40px] font-extralight text-[#fafafa] mt-2 mb-4 leading-tight">
              A refined experience for visionary organizers.
            </h3>
            <p className="text-[16px] text-[#9ca3af] font-light leading-relaxed">
              Ticket distribution, encrypted QR access verification, on-demand payouts, and real-time candidate voting—engineered with high-contrast precision.
            </p>
          </div>
          <Link href="/organizer/events/new" className="btn-primary shrink-0">
            Publish an Event
          </Link>
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS (SEO Rich Snippets) */}
      <section className="grix-container pb-28">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[13px] font-medium tracking-widest uppercase text-[#9ca3af]">
              Common Questions
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extralight text-[#fafafa] mt-2">
              Everything About Swyft Ticket
            </h2>
            <p className="text-[14px] text-[#9ca3af] font-light mt-2">
              Instant answers about buying campus tickets, fees, gate check-in, and organizer withdrawals.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-lg border border-[#262626] bg-[#121212] transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer bg-transparent border-none text-[#fafafa]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[16px] font-medium tracking-tight">
                      {faq.q}
                    </span>
                    <span className="text-[20px] text-[#9ca3af] font-light transition-transform duration-200">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 border-t border-[#1e1e1e] mt-2">
                      <p className="text-[14px] text-[#9ca3af] font-light leading-relaxed pt-4">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-[13px] text-[#9ca3af] font-light">
              Need assistance with an existing ticket?{" "}
              <Link href="/tickets" className="text-[#fafafa] underline hover:text-white">
                Find your ticket
              </Link>{" "}
              or visit our{" "}
              <Link href="/help" className="text-[#fafafa] underline hover:text-white">
                Help Center
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
