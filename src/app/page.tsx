"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { universities } from "@/lib/swyft-data";

interface ApiEvent {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  location: string;
  category: string;
  isVotingEnabled?: boolean;
  organizer?: { name: string };
  Ticket?: { name: string; price: number; quantity: number; sold: number }[];
}

const campuses = [
  { name: "OOU", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80" },
  { name: "UNILAG", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80" },
  { name: "UI", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80" },
  { name: "LASU", image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80" },
];

const categoriesWithIcons = [
  {
    id: "All",
    label: "All Events",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <path d="M12 12h.01" />
        <path d="M12 16h.01" />
        <path d="M12 8h.01" />
      </svg>
    )
  },
  {
    id: "Entertainment",
    label: "Music & Shows",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    )
  },
  {
    id: "Tech",
    label: "Tech & Coding",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    )
  },
  {
    id: "Sports",
    label: "Sports & Games",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M6 12a6 6 0 0 1 12 0" />
        <path d="M12 6a6 6 0 0 1 0 12" />
      </svg>
    )
  },
  {
    id: "Dinner",
    label: "Food & Drinks",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z" />
        <path d="M18 22V15" />
      </svg>
    )
  },
  {
    id: "Conference",
    label: "Conferences",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="12" x="3" y="3" rx="2" />
        <path d="M9 21h6" />
        <path d="M12 15v6" />
      </svg>
    )
  },
  {
    id: "Religious",
    label: "Religious",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M8 8h8" />
      </svg>
    )
  },
  {
    id: "Workshop",
    label: "Workshops",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 0-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 0 7.94-7.94l-3.76 3.76z" />
      </svg>
    )
  },
  {
    id: "Hackathon",
    label: "Hackathons",
    icon: (color: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
      </svg>
    )
  }
];

function formatEventDate(dateString: string) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    
    // Ordinal suffix
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    // Time
    let hours = d.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const minutes = d.getMinutes();
    const timeStr = minutes > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}${ampm}` : `${hours}${ampm}`;

    return `${weekday}, ${month} ${day}${suffix}, ${timeStr}`;
  } catch (e) {
    return dateString;
  }
}

function EventCard({ event }: { event: ApiEvent }) {
  const tickets = event.Ticket || [];
  const minPrice = tickets.length > 0 ? Math.min(...tickets.map((t) => t.price)) : null;
  const priceLabel = minPrice === null ? "Free" : minPrice === 0 ? "Free" : `₦${minPrice.toLocaleString()}`;
  const isFree = minPrice === null || minPrice === 0;

  const formattedDate = formatEventDate(event.date);

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "rgba(255, 255, 255, 0.42)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: "1.5px solid rgba(255, 255, 255, 0.55)",
          padding: "16px",
          display: "flex",
          gap: "16px",
          alignItems: "stretch",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.03)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
          height: "172px",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 40px 0 rgba(240, 85, 55, 0.08)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(240, 85, 55, 0.25)";
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255, 255, 255, 0.6)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.03)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255, 255, 255, 0.55)";
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255, 255, 255, 0.42)";
        }}
      >
        {/* Left column - Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0, paddingRight: "4px" }}>
          <div>
            {/* Title */}
            <h3 style={{
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.3,
              margin: "0 0 10px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {event.title}
            </h3>

            {/* Date & Time */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontSize: "0.82rem", color: "#4B5563", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formattedDate}
              </span>
            </div>

            {/* Location */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ fontSize: "0.82rem", color: "#6B7280", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {event.location}
              </span>
            </div>
          </div>

          {/* Price & Voting Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "auto" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f05537" }}>
              {priceLabel}
            </div>
            {event.isVotingEnabled ? (
              <span style={{
                background: "rgba(240, 85, 55, 0.1)",
                color: "#f05537",
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(240, 85, 55, 0.25)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f05537] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#f05537]"></span>
                </span>
                Vote Live
              </span>
            ) : (
              <span style={{
                background: "rgba(107, 114, 128, 0.1)",
                color: "#6B7280",
                fontSize: "0.68rem",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(107, 114, 128, 0.25)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                display: "inline-flex",
                alignItems: "center",
              }}>
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Right column - Image */}
        <div style={{ width: "125px", height: "100%", flexShrink: 0, position: "relative", borderRadius: "14px", overflow: "hidden", background: "#F3F4F6" }}>
          <img
            src={event.bannerImage || '/images/party.png'}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.4)",
      borderRadius: "20px",
      border: "1.5px solid rgba(255, 255, 255, 0.5)",
      padding: "16px",
      display: "flex",
      gap: "16px",
      height: "172px",
      boxSizing: "border-box",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ height: "16px", width: "80%", background: "#e5e7eb", borderRadius: "4px", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: "12px", width: "50%", background: "#e5e7eb", borderRadius: "4px", animation: "shimmer 1.4s infinite" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
          <div style={{ height: "12px", width: "12px", background: "#e5e7eb", borderRadius: "2px" }} />
          <div style={{ height: "10px", width: "120px", background: "#e5e7eb", borderRadius: "3px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ height: "12px", width: "12px", background: "#e5e7eb", borderRadius: "2px" }} />
          <div style={{ height: "10px", width: "140px", background: "#e5e7eb", borderRadius: "3px" }} />
        </div>
        
        <div style={{ height: "14px", width: "50px", background: "#e5e7eb", borderRadius: "4px", marginTop: "14px" }} />
      </div>
      <div style={{ width: "125px", height: "100%", background: "#e5e7eb", borderRadius: "14px" }} />
    </div>
  );
}

export default function Home() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data || []);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = activeFilter === "All"
    ? events
    : events.filter((e) => e.category?.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div style={{ background: "#F8F7FA", minHeight: "100vh" }}>

      {/* ── HERO ────────────────────────────────────── */}
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "16px 16px 0" }}>
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#050212] min-h-[380px] md:min-h-[480px] flex items-center">
          <img
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80"
            alt="Campus Events"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", opacity: 0.55 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(5,2,18,0.95) 0%, rgba(5,2,18,0.78) 45%, rgba(5,2,18,0.2) 80%, transparent 100%)" }} />

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 max-w-[720px] flex flex-col gap-3 items-start">
            
            {/* GET INTO IT Badge */}
            <div className="text-xs font-extrabold tracking-widest uppercase px-3 py-1 rounded text-white" style={{ background: "#d958a6" }}>
              GET INTO IT
            </div>

            {/* Heading Highlight Blocks */}
            <h1 className="hero-heading" style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
              <span className="text-2xl sm:text-3xl md:text-5xl font-black uppercase inline-block" style={{ 
                background: "linear-gradient(90deg, #FBCFE8 0%, #C7D2FE 100%)", 
                color: "#1E0A3C", 
                letterSpacing: "-0.02em", 
                padding: "6px 14px",
                lineHeight: "1.15",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}>
                FROM CAMPUS RAVES
              </span>
              
              <span className="text-2xl sm:text-3xl md:text-5xl font-black uppercase inline-block" style={{ 
                background: "linear-gradient(90deg, #FBCFE8 0%, #C7D2FE 100%)", 
                color: "#1E0A3C", 
                letterSpacing: "-0.02em", 
                padding: "6px 14px",
                lineHeight: "1.15",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}>
                TO SUG ELECTIONS
              </span>
            </h1>

            <p className="text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginTop: "12px", marginBottom: "20px", maxWidth: "460px" }}>
              Discover, buy tickets, and vote in events across Nigerian campuses — all in one premium platform.
            </p>

            <div className="flex flex-wrap gap-3" style={{ alignItems: "center" }}>
              <Link href="/events" className="inline-flex items-center h-11 md:h-[52px] px-5 md:px-9 rounded-full font-extrabold text-sm md:text-base text-[#0F0A23] bg-white no-underline" style={{
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "#ffffff";
              }}
              >
                Explore Campus Events
              </Link>

              <Link href="/organizer" className="inline-flex items-center h-11 md:h-[52px] px-5 md:px-7 rounded-full font-bold text-sm md:text-base text-white no-underline" style={{
                background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
                transition: "all 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY ROW (EVENTBRITE STYLE) ──────────────────────── */}
      <div style={{ maxWidth: "1360px", margin: "40px auto 16px", padding: "0 24px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          overflowX: "auto",
          padding: "16px 8px 24px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }} className="no-scrollbar">
          {categoriesWithIcons.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "50%",
                    border: isActive ? "2.5px solid #f05537" : "1.5px solid #E5E7EB",
                    background: isActive ? "#FFF5F2" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 4px 12px rgba(240,85,55,0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#f05537";
                      e.currentTarget.style.background = "#FFF5F2";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#E5E7EB";
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                >
                  {cat.icon(isActive ? "#f05537" : "#4B5563")}
                </div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? "#f05537" : "#4B5563",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "16px 16px 80px" }}>

        {/* ── CAMPUSES CAROUSEL ──────────────────────── */}
        <section style={{ marginBottom: "48px" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900" style={{ letterSpacing: "-0.03em", margin: 0 }}>Top campuses</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Filter events by your university</p>
            </div>
            <Link href="/events" className="text-xs md:text-sm font-bold no-underline flex items-center gap-1" style={{ color: "#f05537" }}>
              See all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {campuses.map((campus) => (
              <Link
                key={campus.name}
                href={`/events?university=${campus.name}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="relative h-[120px] md:h-[160px] rounded-2xl overflow-hidden bg-gray-900 cursor-pointer transition-transform duration-250 ease-out hover:-translate-y-1 hover:shadow-xl"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <img src={campus.image} alt={campus.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: "12px", left: "14px", right: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 900, color: "#fff" }}>{campus.name}</span>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f05537", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                  {/* Orange bottom bar */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "#f05537" }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── POPULAR CAMPUS PILLS ──────────────────── */}
        <section style={{ marginBottom: "56px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#374151", letterSpacing: "-0.02em", marginBottom: "14px" }}>
            Browse by campus
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {universities.map((uni) => (
              <Link
                key={uni}
                href={`/events?university=${uni}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "100px",
                  background: "#fff", border: "1.5px solid #E5E7EB",
                  fontSize: "0.82rem", fontWeight: 600, color: "#374151",
                  textDecoration: "none", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#f05537";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#f05537";
                  (e.currentTarget as HTMLAnchorElement).style.background = "#FFF5F2";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#E5E7EB";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#374151";
                  (e.currentTarget as HTMLAnchorElement).style.background = "#fff";
                }}
              >
                <span style={{ fontSize: "0.75rem" }}>📍</span>
                Events in {uni}
              </Link>
            ))}
          </div>
        </section>

        {/* ── ACTIVE VOTING CAMPAIGNS ────────────────────── */}
        <section style={{ marginBottom: "56px", position: "relative" }}>
          {/* Subtle background glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "500px", height: "300px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(240, 85, 55, 0.04) 0%, transparent 70%)",
            zIndex: 0, pointerEvents: "none"
          }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f05537] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f05537]"></span>
                </span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", margin: 0 }}>Active Elections & Voting</h2>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginTop: "3px", fontWeight: 500 }}>
                Support your favorite contestants and cast your ballot in real-time
              </p>
            </div>
          </div>

          {/* Grid of voting events */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))", gap: "20px", position: "relative", zIndex: 1 }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ height: "180px", background: "rgba(255,255,255,0.4)", borderRadius: "20px", border: "1.5px solid rgba(255,255,255,0.5)", animation: "shimmer 1.4s infinite" }} />
              ))}
            </div>
          ) : events.filter(e => e.isVotingEnabled).length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px",
            border: "1.5px solid rgba(255,255,255,0.8)",
            boxShadow: "0 8px 32px rgba(31,38,135,0.04)",
            padding: "48px 32px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}>
            {/* Icon */}
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px",
              background: "linear-gradient(135deg, #fff5f2 0%, #fff 100%)",
              border: "1.5px solid rgba(240,85,55,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 4px 12px rgba(240,85,55,0.08)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 1.2-.504 2.303-1.313 3.098M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
              </svg>
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              No Active Campaigns
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", maxWidth: "340px", margin: "0 auto 24px", lineHeight: 1.65 }}>
              Hosting an SUG election, department awards, or pageantry on campus? Create an active voting lobby instantly.
            </p>

            <Link href="/organizer/voting" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              height: "44px", padding: "0 24px", borderRadius: "100px",
              textDecoration: "none",
              background: "#f05537", color: "#ffffff",
              fontWeight: 800, fontSize: "0.875rem",
              boxShadow: "0 4px 14px rgba(240,85,55,0.25)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#d1410c"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f05537"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Setup Voting Campaign
            </Link>
          </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))", gap: "20px", position: "relative", zIndex: 1 }}>
              {events.filter(e => e.isVotingEnabled).map((event) => {
                return (
                  <Link
                    key={event.id}
                    href={`/voting/${event.id}`}
                    style={{
                      background: "rgba(255, 255, 255, 0.42)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      borderRadius: "20px",
                      border: "1.5px solid rgba(255, 255, 255, 0.55)",
                      padding: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.03)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                      height: "120px",
                      boxSizing: "border-box",
                      position: "relative",
                      overflow: "hidden",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 20px 40px 0 rgba(240, 85, 55, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(240, 85, 55, 0.25)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.03)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.55)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.42)";
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: 0, flex: 1 }}>
                      <img
                        src={event.bannerImage || '/images/party.png'}
                        alt={event.title}
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          flexShrink: 0,
                          background: "#F3F4F6",
                          border: "1px solid rgba(0,0,0,0.05)"
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f05537] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#f05537]"></span>
                          </span>
                          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#f05537", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Live Voting
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "#4B5563",
                          margin: 0,
                          lineHeight: 1.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          Vote for your favorite for <strong style={{ color: "#111827", fontWeight: 800 }}>{event.title}</strong>
                        </p>
                      </div>
                    </div>

                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#f05537",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: "16px",
                      boxShadow: "0 4px 10px rgba(240, 85, 55, 0.2)",
                      transition: "all 0.2s"
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── UPCOMING EVENTS ──────────────────────── */}
        <section style={{ position: "relative" }}>
          {/* Glassmorphism background blur blobs */}
          <div style={{
            position: "absolute", top: "10%", left: "-5%",
            width: "350px", height: "350px", borderRadius: "50%",
            background: "rgba(240, 85, 55, 0.05)", filter: "blur(70px)",
            zIndex: 0, pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute", bottom: "10%", right: "-5%",
            width: "380px", height: "380px", borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.04)", filter: "blur(80px)",
            zIndex: 0, pointerEvents: "none"
          }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", position: "relative", zIndex: 1 }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", margin: 0 }}>Upcoming events</h2>
              <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginTop: "3px", fontWeight: 500 }}>
                {loading ? "Loading..." : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <Link href="/events" style={{ fontSize: "0.82rem", color: "#f05537", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* Event Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))", gap: "20px", position: "relative", zIndex: 1 }}>
              {[1, 2, 3, 4, 6, 8].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredEvents.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px",
            border: "1.5px solid rgba(255,255,255,0.8)",
            boxShadow: "0 8px 32px rgba(31,38,135,0.04)",
            padding: "56px 32px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}>
            {/* Icon */}
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px",
              background: "linear-gradient(135deg, #fff5f2 0%, #fff 100%)",
              border: "1.5px solid rgba(240,85,55,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 4px 12px rgba(240,85,55,0.08)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V22H4V12"/>
                <path d="M22 7H2v5h20V7z"/>
                <path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              {events.length === 0 ? "No events yet" : `No ${activeFilter} events`}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", maxWidth: "320px", margin: "0 auto 24px", lineHeight: 1.65 }}>
              {events.length === 0
                ? "Be the first to create an event on SWYFT and start selling tickets to your campus."
                : `No events in the ${activeFilter} category right now. Try a different filter.`}
            </p>

            {events.length === 0 && (
              <Link href="/organizer/events/new" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                height: "44px", padding: "0 24px", borderRadius: "100px",
                textDecoration: "none",
                background: "#f05537", color: "#fff",
                fontWeight: 800, fontSize: "0.875rem",
                boxShadow: "0 4px 14px rgba(240,85,55,0.25)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d1410c"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f05537"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Create an Event
              </Link>
            )}
          </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))", gap: "20px", position: "relative", zIndex: 1 }}>
              {filteredEvents.slice(0, 8).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {filteredEvents.length > 8 && (
            <div style={{ marginTop: "32px", textAlign: "center", position: "relative", zIndex: 1 }}>
              <Link href="/events" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                height: "44px", padding: "0 28px", borderRadius: "100px",
                border: "1.5px solid #E5E7EB", background: "#fff",
                color: "#111827", fontWeight: 700, fontSize: "0.875rem",
                textDecoration: "none", transition: "all 0.15s ease",
              }}>
                See all {filteredEvents.length} events
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
