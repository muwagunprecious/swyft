"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { filters, universities } from "@/lib/swyft-data";

interface ApiEvent {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  location: string;
  category: string;
  organizer?: { name: string };
  Ticket?: { name: string; price: number; quantity: number; sold: number }[];
}

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [university, setUniversity] = useState("All");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const haystack = `${event.title} ${event.location} ${event.category} ${event.organizer?.name || ""}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesCategory = category === "All" || event.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category, events]);

  const getPriceLabel = (event: ApiEvent) => {
    const tickets = event.Ticket || [];
    if (tickets.length === 0) return "Free";
    const minPrice = Math.min(...tickets.map((t) => t.price));
    if (minPrice === 0) return "Free";
    return `From ₦${minPrice.toLocaleString()}`;
  };

  const getAttendees = (event: ApiEvent) => {
    const tickets = event.Ticket || [];
    return tickets.reduce((sum, t) => sum + (t.sold || 0), 0);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1e0a3c]">
      {/* FILTER HEADER */}
      <div className="border-b border-gray-200 bg-white sticky top-[66px] z-40 shadow-sm">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-full bg-[#f8f7fa] pl-10 pr-4 text-sm font-medium text-[#1e0a3c] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#f05537]"
                placeholder="Search events, organizers, or locations"
              />
            </div>
            
            <div className="hidden h-10 items-center rounded-full border border-gray-200 p-1 md:flex">
              <button 
                onClick={() => setView("grid")}
                className={`flex h-full items-center justify-center rounded-full px-4 text-sm font-bold transition ${view === "grid" ? "bg-[#f8f7fa] text-[#1e0a3c]" : "text-gray-500 hover:text-[#1e0a3c]"}`}
              >
                List
              </button>
              <button 
                onClick={() => setView("map")}
                className={`flex h-full items-center justify-center rounded-full px-4 text-sm font-bold transition ${view === "map" ? "bg-[#f8f7fa] text-[#1e0a3c]" : "text-gray-500 hover:text-[#1e0a3c]"}`}
              >
                Map
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-6 py-8 lg:flex-row">
        {/* SIDEBAR FILTERS */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="sticky top-[150px]">
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-bold text-[#1e0a3c]">Categories</h3>
              <div className="flex flex-col gap-2">
                {filters.map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setCategory(filter)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${category === filter ? "bg-[#f05537]/10 text-[#d1410c] font-bold" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {filter}
                    {category === filter && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-lg font-bold text-[#1e0a3c]">Price</h3>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-[#f05537] focus:ring-[#f05537]" /> Free
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-[#f05537] focus:ring-[#f05537]" /> Paid
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS AREA */}
        <div className="flex-1">
          <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-black tracking-tight text-[#1e0a3c]">
              {category === "All" ? "All Events" : `${category} Events`}
            </h1>
            <p className="text-sm font-bold text-gray-500">{filtered.length} events</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] w-full rounded-[16px] bg-gray-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : view === "map" ? (
             <div className="h-[600px] w-full rounded-2xl bg-gray-100 overflow-hidden relative shadow-inner flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md text-[#d1410c]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#1e0a3c]">Map view enabled</h3>
                  <p className="mt-2 text-sm text-gray-500">Production map integration required for heatmap.</p>
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((event) => {
                const day = new Date(event.date).toLocaleDateString("en-US", { day: "2-digit" });
                const month = new Date(event.date).toLocaleDateString("en-US", { month: "short" });
                const displayTime = new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <Link key={event.id} href={`/events/${event.id}`} className="group block no-underline">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-gray-200">
                      <img 
                        src={event.bannerImage} 
                        alt={event.title} 
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                        <p className="text-[0.68rem] font-black uppercase text-[#f05537]">{month}</p>
                        <p className="text-lg font-black leading-none text-gray-950">{day}</p>
                      </div>
                      <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
                        {event.category}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-[#1e0a3c] line-clamp-2 leading-tight group-hover:text-[#f05537] transition-colors">{event.title}</h3>
                      <p className="mt-1.5 text-sm font-medium text-[#d1410c]">{new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} • {displayTime}</p>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-1">{event.location}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-sm font-black text-gray-950">{getPriceLabel(event)}</span>
                        <span className="text-xs font-black text-[#1565FF]">{getAttendees(event).toLocaleString()} going</span>
                      </div>
                      {event.organizer?.name && (
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                            {event.organizer.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">No events found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your filters or search query.</p>
                  <button onClick={() => {setQuery(""); setCategory("All"); setUniversity("All");}} className="mt-6 font-bold text-[#f05537] hover:underline">Clear all filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
