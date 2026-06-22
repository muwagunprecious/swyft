"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import TicketWidget from "@/components/events/TicketWidget";
import ShareButton from "@/components/events/ShareButton";

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
  Ticket?: { id: string; name: string; price: number; quantity: number; sold: number }[];
}

export default function EventDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (err: any) {
        console.error("Failed to fetch event:", err);
        setError(err.response?.data?.message || "Event not found");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9fc] text-[#1e0a3c] pb-24">
        <div className="mx-auto max-w-[1200px] px-6 pt-8">
          <div className="mb-8">
            <Link href="/events" className="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-[#f05537] transition-colors group no-underline">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Events
            </Link>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start animate-pulse">
            <div className="space-y-8">
              <div className="rounded-2xl bg-gray-200 aspect-[16/10]" />
              <div className="bg-white rounded-2xl p-8 border border-gray-100 space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 space-y-4">
              <div className="h-8 w-2/3 bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-200 rounded-xl" />
              <div className="h-12 w-full bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#faf9fc] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The event you're looking for doesn't exist or has been removed."}</p>
          <Link href="/events" className="inline-flex h-11 items-center rounded-full bg-[#f05537] px-6 text-sm font-bold text-white no-underline transition hover:bg-[#d1410c]">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  // Parse date
  const eventDateObj = new Date(event.date);
  const formattedDate = eventDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const monthName = eventDateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = eventDateObj.getDate();
  const displayTime = eventDateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // Normalize tickets (API returns Ticket[], mock had tickets[])
  const tickets = (event.Ticket || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    quantity: t.quantity,
    sold: t.sold,
  }));

  const organizerName = typeof event.organizer === "object" ? event.organizer?.name : (event.organizer || "Event Organizer");

  return (
    <div className="min-h-screen bg-[#faf9fc] text-[#1e0a3c] relative overflow-hidden pb-24">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-100/30 blur-[160px] pointer-events-none" />

      {/* Main Container */}
      <div className="mx-auto max-w-[1200px] px-6 pt-8 relative z-10">
        
        {/* Navigation Breadcrumb & Mobile Share */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/events" 
            className="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-[#f05537] transition-colors group no-underline"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Events
          </Link>

          <div className="lg:hidden">
            <ShareButton />
          </div>
        </div>

        {/* Outer Shell Grid */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* Left Column: Visual Assets & Description */}
          <div className="space-y-8">
            
            {/* Stunning Floating Image Banner */}
            <div className="relative group rounded-2xl overflow-hidden shadow-2xl bg-black border border-gray-100 transition duration-500 hover:shadow-orange-100/50">
              <img 
                src={event.bannerImage} 
                alt={event.title} 
                className="w-full object-cover aspect-[16/10] transition duration-700 group-hover:scale-[1.01]" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Event Overview Section */}
            <div className="bg-white border border-gray-150 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-black mb-4 uppercase tracking-wider text-gray-950 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#f05537] rounded-full" />
                About This Event
              </h2>
              <p className="text-[15px] font-medium leading-relaxed text-gray-600">
                {event.description || "No description provided for this event."}
              </p>
              
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Organizer</h4>
                  <p className="text-sm font-bold text-gray-800 mt-1">{organizerName}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Category</h4>
                  <p className="text-sm font-bold text-gray-800 mt-1">{event.category}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Location</h4>
                  <p className="text-sm font-bold text-gray-800 mt-1">{event.location || "TBA"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Ticket Purchase & Details Sidebar */}
          <div className="space-y-8 sticky top-[90px]">
            
            {/* Floating Details Card */}
            <div className="bg-white border border-gray-150 rounded-2xl p-8 shadow-md">
              
              {/* Category chip & share */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#f05537]">
                  {event.category}
                </span>
                
                {/* Micro-interactive Share button (Desktop Only) */}
                <div className="hidden lg:block">
                  <ShareButton />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black text-gray-950 leading-tight mb-6">
                {event.title}
              </h1>

              {/* Event Meta */}
              <div className="space-y-4">
                
                {/* Date card */}
                <div className="flex items-center gap-4 bg-[#fbfbfd] p-3 rounded-xl border border-gray-100">
                  <div className="flex flex-col items-center justify-center bg-orange-50 border border-orange-100/50 text-[#f05537] w-12 h-12 rounded-lg shrink-0">
                    <span className="text-[9px] font-black tracking-widest">{monthName}</span>
                    <span className="text-lg font-black leading-none mt-0.5">{dayNum}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Date & Time</h4>
                    <p className="text-xs font-bold text-gray-700 mt-0.5">{formattedDate}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{displayTime}</p>
                  </div>
                </div>

                {/* Location card */}
                <div className="flex items-center gap-4 bg-[#fbfbfd] p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-center bg-purple-50 border border-purple-100/50 text-purple-600 w-12 h-12 rounded-lg shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Venue</h4>
                    <p className="text-xs font-bold text-gray-700 mt-0.5 truncate">{event.location || "TBA"}</p>
                  </div>
                </div>

              </div>

              {/* Live Voting Lobby Callout */}
              {event.isVotingEnabled && (
                <div className="mt-6 bg-gradient-to-r from-[#1e0a3c] to-[#2c1056] rounded-2xl p-5 shadow-lg border border-white/5 text-white space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f05537]/20 to-transparent rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f05537] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f05537]"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#f05537]">
                        Live Campaign
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">🗳️ voting active</span>
                  </div>

                  <div className="flex gap-4 items-center relative z-10">
                    <img
                      src={event.bannerImage || '/images/party.png'}
                      alt={event.title}
                      className="h-14 w-14 rounded-xl object-cover bg-slate-800 border border-white/10 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-sm font-black tracking-tight text-white">Cast Your Ballot Now</h3>
                      <p className="text-xs font-semibold text-slate-350 line-clamp-2">
                        Support your favorite contestants by voting today.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/voting/${event.id}`}
                    className="w-full bg-[#f05537] hover:bg-[#d1410c] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-600/10 hover:-translate-y-0.5 flex items-center justify-center gap-2 h-11 no-underline relative z-10"
                  >
                    Enter Voting Lobby 🗳️
                  </Link>
                </div>
              )}

              <hr className="my-6 border-gray-100" />

              {/* Tickets Widget Wrapper */}
              <TicketWidget 
                eventId={event.id} 
                eventTitle={event.title}
                eventImage={event.bannerImage}
                tickets={tickets} 
              />

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
