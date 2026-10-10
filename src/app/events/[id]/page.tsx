"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import TicketWidget from "@/components/events/TicketWidget";
import ShareButton from "@/components/events/ShareButton";

interface ApiEvent {
  id: string;
  slug?: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  location: string;
  category: string;
  isVotingEnabled?: boolean;
  organizer?: { name: string; subaccountCode?: string };
  Ticket?: { id: string; name: string; price: number; quantity: number; sold: number }[];
}

export default function EventDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

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
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] pb-24">
        <div className="grix-container pt-12">
          <div className="mb-10">
            <Link href="/events" className="btn-link inline-flex items-center gap-2 text-[14px]">
              &larr; Back to Events
            </Link>
          </div>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-start animate-pulse">
            <div className="space-y-8">
              <div className="rounded-lg bg-[#171717] aspect-[16/10] border border-[#374151]" />
              <div className="grix-card space-y-4 p-8">
                <div className="h-6 w-48 bg-[#262626] rounded" />
                <div className="h-4 w-full bg-[#262626] rounded" />
                <div className="h-4 w-3/4 bg-[#262626] rounded" />
              </div>
            </div>
            <div className="grix-card p-8 space-y-6">
              <div className="h-8 w-2/3 bg-[#262626] rounded" />
              <div className="h-14 w-full bg-[#262626] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#374151] bg-[#171717]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          </div>
          <h2 className="text-2xl font-light text-[#fafafa] mb-3">Event Not Found</h2>
          <p className="text-[#9ca3af] font-light text-[14px] mb-8">{error || "The event you are looking for does not exist or has ended."}</p>
          <Link href="/events" className="btn-primary">
            Explore Events
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
  const displayTime = eventDateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const tickets = (event.Ticket || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    discountPrice: t.discountPrice,
    discountEndsAt: t.discountEndsAt,
    quantity: t.quantity,
    sold: t.sold,
  }));

  const organizerName = typeof event.organizer === "object" ? event.organizer?.name : (event.organizer || "Event Organizer");
  const eventSlugOrId = event.slug || event.id;
  const shareUrl = origin ? `${origin}/events/${eventSlugOrId}` : `/events/${eventSlugOrId}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] pb-28">
      
      <div className="grix-container pt-10">
        
        {/* Navigation Breadcrumb & Share Pill */}
        <div className="mb-10 flex items-center justify-between">
          <Link 
            href="/events" 
            className="btn-link inline-flex items-center gap-2 text-[14px]"
          >
            <span>&larr;</span> Back to Events
          </Link>

          <div>
            <ShareButton url={shareUrl} title={event.title} />
          </div>
        </div>

        {/* Outer Grid: Visual / Description & Ticket Booking Sidebar */}
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-start">
          
          {/* Left Column: Visual Artwork & Editorial Description */}
          <div className="space-y-10">
            
            {/* Dominant Poster Artwork */}
            <div className="relative rounded-lg overflow-hidden border border-[#374151] bg-[#171717]">
              <img 
                src={event.bannerImage} 
                alt={event.title} 
                className="w-full object-cover aspect-[16/10]" 
              />
              <div className="absolute top-4 left-4">
                <span className="rounded-full bg-[#0a0a0a]/90 border border-[#374151] px-3.5 py-1 text-[12px] font-medium text-[#fafafa] tracking-wide">
                  {event.category}
                </span>
              </div>
            </div>

            {/* Event Description Section (Editorial Minimal UI) */}
            <div className="grix-card p-8 md:p-10">
              <span className="text-[12px] font-medium uppercase tracking-widest text-[#9ca3af]">
                Overview
              </span>
              <h2 className="text-[28px] md:text-[32px] font-extralight text-[#fafafa] mt-1 mb-6">
                About this event
              </h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-[16px] md:text-[17px] font-light leading-[28px] text-[#fafafa] whitespace-pre-line">
                  {event.description || "No specific details provided for this event."}
                </p>
              </div>
              
              {/* Event Metadata Spec Breakdown */}
              <div className="mt-10 pt-8 border-t border-[#374151] grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-[12px] font-medium uppercase tracking-wider text-[#9ca3af]">Organizer</h4>
                  <p className="text-[15px] font-medium text-[#fafafa] mt-1.5">{organizerName}</p>
                </div>
                <div>
                  <h4 className="text-[12px] font-medium uppercase tracking-wider text-[#9ca3af]">Category</h4>
                  <p className="text-[15px] font-medium text-[#fafafa] mt-1.5">{event.category}</p>
                </div>
                <div>
                  <h4 className="text-[12px] font-medium uppercase tracking-wider text-[#9ca3af]">Venue</h4>
                  <p className="text-[15px] font-medium text-[#fafafa] mt-1.5">{event.location || "TBA"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Ticket Purchase & Booking Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-[96px]">
            
            <div className="grix-card p-8 md:p-10 space-y-6">
              
              {/* Event Title */}
              <div>
                <span className="text-[12px] font-medium uppercase tracking-widest text-[#9ca3af]">
                  Live Registration
                </span>
                <h1 className="text-[26px] md:text-[32px] font-light text-[#fafafa] leading-tight mt-1.5 mb-4">
                  {event.title}
                </h1>
              </div>

              {/* Date & Location Highlights */}
              <div className="space-y-3 pb-6 border-b border-[#374151]">
                
                <div className="flex items-start gap-3.5 text-[#9ca3af]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-[#fafafa]">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div>
                    <p className="text-[14px] font-medium text-[#fafafa]">{formattedDate}</p>
                    <p className="text-[13px] font-light text-[#9ca3af]">{displayTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-[#9ca3af]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-[#fafafa]">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <p className="text-[14px] font-medium text-[#fafafa]">{event.location || "Venue to be announced"}</p>
                  </div>
                </div>

              </div>

              {/* Live Voting Lobby Callout */}
              {event.isVotingEnabled && (
                <div className="rounded-lg border border-[#374151] bg-[#171717] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium uppercase tracking-wider text-[#fafafa] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#fafafa] animate-pulse" />
                      Voting Active
                    </span>
                    <span className="text-[12px] text-[#9ca3af]">Live Ballot</span>
                  </div>
                  <p className="text-[13px] font-light text-[#9ca3af]">
                    Vote for registered contestants and support your favorites directly.
                  </p>
                  <Link
                    href={`/voting/${event.id}`}
                    className="btn-secondary w-full justify-center !min-h-[44px] !text-[14px] !py-2"
                  >
                    Enter Voting Lobby &rarr;
                  </Link>
                </div>
              )}

              {/* Tickets Widget Selection */}
              <TicketWidget 
                eventId={event.id} 
                eventTitle={event.title}
                eventImage={event.bannerImage}
                subaccountCode={event.organizer?.subaccountCode}
                tickets={tickets} 
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
