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
  Ticket?: { name: string; price: number; quantity: number; sold: number }[];
}

export default function HomePage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">
      
      {/* 1. HERO SECTION (Oversized Editorial Display Typography & Centered Pill CTA) */}
      <section className="grix-container pt-20 md:pt-32 pb-24 md:pb-36 flex flex-col items-center text-center">
        
        {/* Top Tagline / Category Label */}
        <span className="text-[14px] font-medium tracking-widest uppercase text-[#9ca3af] mb-6">
          Editorial Event Marketplace
        </span>

        {/* Display Headline with mixed weights: Satoshi display 72px */}
        <h1 className="headline-display max-w-4xl text-[#fafafa] mb-6">
          Discover Exceptional <span className="font-bold">Events</span> with Total <span className="font-bold">Ease</span>.
        </h1>

        {/* Supporting paragraph: body-lg */}
        <p className="body-lg max-w-2xl text-[#9ca3af] mb-12">
          Curated campus festivals, concerts, conferences, and exclusive gatherings. Experience seamless ticketing designed with pure minimalism.
        </p>

        {/* Primary Pill CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/events" className="btn-primary">
            Explore All Events
          </Link>
          <Link href="/organizer/events/new" className="btn-secondary">
            Host an Event
          </Link>
        </div>

      </section>

      {/* 2. FEATURED EVENTS SECTION (3-Column Desktop Grid with Wide Margins) */}
      <section className="grix-container pb-28">
        
        {/* Section Heading & Category Filter Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#374151] mb-10">
          <div>
            <span className="text-[13px] font-medium tracking-wider uppercase text-[#9ca3af]">
              Curated Selection
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
              const minPrice = tickets.length > 0 ? Math.min(...tickets.map((t) => t.price)) : null;
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
            View all upcoming events &rarr;
          </Link>
        </div>

      </section>

      {/* 3. EDITORIAL MINIMAL ORGANIZER BANNER */}
      <section className="grix-container pb-28">
        <div className="rounded-lg border border-[#374151] bg-[#0a0a0a] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-[13px] font-medium tracking-widest uppercase text-[#9ca3af]">
              Host With Confidence
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

    </div>
  );
}
