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

const campuses = [
  { name: "OOU", fullName: "Olabisi Onabanjo University", image: "/images/oou_logo.jpg" },
  { name: "UNILAG", fullName: "University of Lagos", image: "/images/unilag_logo.jpg" },
  { name: "UI", fullName: "University of Ibadan", image: "/images/ui_logo.jpg" },
  { name: "LASU", fullName: "Lagos State University", image: "/images/lasu_logo.png" },
];

const categoryShortcuts = [
  {
    id: "All",
    label: "All",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    id: "Entertainment",
    label: "Music",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: "Party",
    label: "Nightlife",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 11-4-7-4 7" />
        <path d="M15 4v16" />
        <path d="M7 13h10" />
        <path d="M5 20h14" />
      </svg>
    ),
  },
  {
    id: "Tech",
    label: "Tech",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
  },
  {
    id: "Dinner",
    label: "Food & Drink",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2v20" />
        <path d="M6 2v20" />
        <path d="M4 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" />
        <path d="M18 7a3 3 0 0 1-3-3V2h6v2a3 3 0 0 1-3 3z" />
      </svg>
    ),
  },
  {
    id: "Conference",
    label: "Conferences",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "Sports",
    label: "Sports",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M4.93 4.93 19.07 19.07" />
        <path d="m14 2 2 4-4 2 2 4-4 2 2 4" />
      </svg>
    ),
  },
  {
    id: "Workshop",
    label: "Workshops",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 0-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 0 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

const tabs = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This weekend" },
  { id: "free", label: "Free" },
  { id: "Entertainment", label: "Music" },
  { id: "Dinner", label: "Food & Drink" },
];

export default function HomePage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedCampus, setSelectedCampus] = useState("All Campuses");

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await api.get("/events");
        const data = Array.isArray(res.data) ? res.data : (res.data?.events || []);
        setEvents(data);
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Filter events based on Category, Tab, and Campus
  const filteredEvents = events.filter((ev) => {
    // Campus filter
    if (selectedCampus !== "All Campuses") {
      const matchLoc = ev.location?.toLowerCase().includes(selectedCampus.toLowerCase());
      const matchUniv = ev.university?.toLowerCase().includes(selectedCampus.toLowerCase());
      if (!matchLoc && !matchUniv) return false;
    }

    // Category shortcut filter
    if (selectedCategory !== "All") {
      if (ev.category !== selectedCategory) return false;
    }

    // Secondary tab filter
    if (selectedTab === "free") {
      const tickets = ev.Ticket || [];
      const isFree = tickets.length === 0 || tickets.every(t => t.price === 0);
      if (!isFree) return false;
    } else if (selectedTab === "today") {
      const today = new Date().toDateString();
      if (new Date(ev.date).toDateString() !== today) return false;
    } else if (selectedTab === "weekend") {
      const day = new Date(ev.date).getDay();
      if (day !== 5 && day !== 6 && day !== 0) return false; // Fri, Sat, Sun
    } else if (selectedTab !== "all" && selectedTab !== "free" && selectedTab !== "today" && selectedTab !== "weekend") {
      if (ev.category !== selectedTab) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-white text-[#39364f]">
      
      {/* 1. HERO SECTION (Eventbrite Editorial Commerce Banner) */}
      <section className="eb-container pt-8 pb-10">
        <div className="relative overflow-hidden rounded-2xl bg-[#f8f7fa] border border-[#e5e7eb] p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl z-10">
            <span className="inline-block text-[13px] font-semibold uppercase tracking-wider text-[#d1410c] mb-3">
              Campus Events & Ticketing
            </span>
            <h1 className="text-[32px] md:text-[44px] font-semibold leading-[1.15] text-[#39364f] tracking-tight mb-4">
              Don&apos;t miss the best moments on your campus.
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#6f7287] mb-8 font-normal">
              Find parties, hackathons, academic conferences, student dues, and live award voting all in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/events" className="btn-primary">
                Find your next event
              </Link>
              <Link href="/organizer/events/new" className="btn-secondary">
                Create an event
              </Link>
            </div>
          </div>

          <div className="w-full md:w-[48%] relative aspect-[16/10] overflow-hidden rounded-xl shadow-sm border border-[#e5e7eb]">
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
              alt="Live campus event"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. CATEGORY SHORTCUTS (Round Outline Icons) */}
      <section className="eb-container py-6 border-b border-[#e5e7eb]">
        <div className="flex items-center justify-between gap-6 overflow-x-auto hide-scrollbar pb-2">
          {categoryShortcuts.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="eb-category-circle shrink-0 bg-transparent border-none p-0"
              >
                <div 
                  className={`eb-category-orb ${isActive ? "!border-[#d1410c] !bg-[#fff9f6] !text-[#d1410c]" : ""}`}
                >
                  {cat.icon}
                </div>
                <span className={`eb-category-label ${isActive ? "!text-[#d1410c]" : ""}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. EVENT DISCOVERY SECTION (Location Header, Tabs & Card Grid) */}
      <section className="eb-container py-10">
        
        {/* Location & Title Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] font-semibold text-[#39364f]">
              Events in
            </h2>
            <div className="relative inline-block">
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="appearance-none bg-transparent text-[24px] font-semibold text-[#d1410c] border-b-2 border-[#d1410c] pb-0.5 pr-6 cursor-pointer outline-none focus:border-[#b53809]"
              >
                <option value="All Campuses">All Campuses</option>
                <option value="OOU">OOU (Ogun)</option>
                <option value="UNILAG">UNILAG (Akoka)</option>
                <option value="UI">UI (Ibadan)</option>
                <option value="LASU">LASU (Ojo)</option>
              </select>
              <span className="pointer-events-none absolute right-0 top-2 text-[#d1410c] text-xs">▼</span>
            </div>
          </div>

          <Link href="/events" className="text-[14px] font-semibold text-[#d1410c] hover:underline">
            See all events &rarr;
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-[#e5e7eb] mb-8">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`eb-tab ${isActive ? "eb-tab-active" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Event Card Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="eb-card h-[320px] animate-pulse bg-[#f8f7fa]">
                <div className="aspect-[16/9] w-full bg-[#e5e7eb]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 bg-[#e5e7eb] rounded" />
                  <div className="h-5 w-3/4 bg-[#e5e7eb] rounded" />
                  <div className="h-3 w-1/2 bg-[#e5e7eb] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="text-center py-16 px-4 rounded-xl border border-[#e5e7eb] bg-[#f8f7fa]">
            <p className="text-[18px] font-semibold text-[#39364f] mb-2">No events found matching your criteria</p>
            <p className="text-[14px] text-[#6f7287] mb-6">Try selecting a different campus or category filter.</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedTab("all");
                setSelectedCampus("All Campuses");
              }}
              className="btn-secondary"
            >
              Reset filters
            </button>
          </div>
        )}

      </section>

      {/* 4. CAMPUS HUBS (Clean Card Units) */}
      <section className="eb-container py-12 border-t border-[#e5e7eb]">
        <div className="mb-6">
          <h2 className="text-[24px] font-semibold text-[#39364f]">
            Browse by Campus
          </h2>
          <p className="text-[14px] text-[#6f7287]">
            Direct access to student events, faculty dues, and hall elections.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {campuses.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCampus(c.name)}
              className="eb-card p-4 flex flex-col items-center justify-center text-center gap-3 hover:border-[#d1410c] transition-all bg-white cursor-pointer"
            >
              <div className="h-14 w-14 rounded-full overflow-hidden border border-[#e5e7eb] flex items-center justify-center bg-[#f8f7fa]">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold text-[#39364f]">{c.name}</h4>
                <p className="text-[12px] text-[#6f7287] truncate max-w-[140px]">{c.fullName}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. ORGANIZER CTA BANNER */}
      <section className="eb-container py-12">
        <div className="rounded-2xl border border-[#e5e7eb] bg-[#fff9f6] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[13px] font-semibold text-[#d1410c] uppercase tracking-wider">
              Host on Swyft
            </span>
            <h3 className="text-[24px] md:text-[28px] font-semibold text-[#39364f] mt-1 mb-2">
              Empowering student organizers and clubs.
            </h3>
            <p className="text-[15px] text-[#6f7287] max-w-xl">
              Sell tickets, manage guest check-ins with QR scanners, and run real-time paid or free elections securely.
            </p>
          </div>
          <Link href="/organizer/events/new" className="btn-primary shrink-0">
            Create an event
          </Link>
        </div>
      </section>

    </div>
  );
}
