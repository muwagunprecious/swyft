'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function OrganizerEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleShare = (event: any) => {
    const eventSlugOrId = event.slug || event.id;
    const shareUrl = origin ? `${origin}/events/${eventSlugOrId}` : `/events/${eventSlugOrId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: event.title,
        text: `Get tickets for ${event.title}!`,
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        setCopiedId(event.id);
        setTimeout(() => setCopiedId(null), 2500);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.get('/organizer/events');
      setEvents(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch events', err);
      setFetchError(err.response?.data?.message || 'Failed to load events. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6 pt-2">
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#fafafa] tracking-tight">Manage Events</h1>
          <p className="text-xs font-medium text-[#9ca3af] mt-0.5">Create, edit, and track all your campus events.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input 
              type="text" 
              placeholder="Search events..." 
              className="pl-9 pr-4 py-2 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] placeholder:text-[#6b7280] focus:outline-none focus:border-[#fafafa] transition-all w-60"
            />
          </div>
          <Link href="/organizer/events/new" className="bg-[#fafafa] hover:bg-white text-[#0a0a0a] px-5 py-2 rounded-full font-semibold text-xs transition-colors shadow-sm flex items-center gap-2 no-underline whitespace-nowrap shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Event
          </Link>
        </div>
      </div>

      {/* ── ERROR NOTICE ───────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-800/40 bg-rose-950/30 p-4 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchEvents}
            type="button"
            className="rounded-full bg-rose-900/60 hover:bg-rose-900 px-3.5 py-1.5 font-semibold text-rose-200 transition text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── EVENTS LIST ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#121212] rounded-2xl border border-[#262626] h-72 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#121212] rounded-2xl border border-[#262626] border-dashed p-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#171717] border border-[#262626] rounded-2xl flex items-center justify-center mb-4 text-[#fafafa]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <h3 className="text-base font-bold text-[#fafafa] mb-1">No events found</h3>
          <p className="text-xs font-medium text-[#9ca3af] max-w-md mb-6">You haven't created any events yet. Click below to publish your first campus event.</p>
          <Link href="/organizer/events/new" className="bg-[#fafafa] hover:bg-white text-[#0a0a0a] px-6 py-2.5 rounded-full font-semibold text-xs shadow-sm no-underline">
            Create First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-[#121212] rounded-2xl border border-[#262626] shadow-sm overflow-hidden flex flex-col group hover:border-[#374151] transition">
              
              {/* Event Image */}
              <div className="relative h-44 bg-[#171717] overflow-hidden">
                {event.bannerImage ? (
                  <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#171717] text-[#9ca3af]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#fafafa] shadow-sm">
                  {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <Link href={`/organizer/events/${event.id}`} className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[#fafafa] flex items-center justify-center shadow-sm hover:bg-white hover:text-black transition" title="Manage & Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-base font-bold text-[#fafafa] leading-tight line-clamp-1">{event.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider whitespace-nowrap border ${
                    event.status === 'PUBLISHED' 
                      ? 'border-emerald-800/40 bg-emerald-950/40 text-emerald-400' 
                      : 'border-amber-800/40 bg-amber-950/40 text-amber-400'
                  }`}>
                    {event.status || 'DRAFT'}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#9ca3af] mb-4 line-clamp-2 leading-relaxed">{event.description || 'No description provided.'}</p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[#262626]">
                  <div>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Tickets Sold</p>
                    <p className="text-xs font-bold text-[#fafafa]">{event.sold || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Revenue</p>
                    <p className="text-xs font-bold text-emerald-400">₦{(event.revenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-[#171717] border-t border-[#262626] p-3 flex justify-between items-center">
                <Link href={`/organizer/events/${event.id}`} className="text-xs font-semibold text-[#fafafa] hover:underline flex items-center gap-1.5 px-2 py-1 no-underline">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                  Manage
                </Link>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleShare(event)}
                    type="button"
                    className={`text-xs font-semibold transition-all flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer border ${
                      copiedId === event.id 
                        ? 'border-emerald-800/40 bg-emerald-950/40 text-emerald-400' 
                        : 'border-[#262626] bg-[#121212] text-[#fafafa] hover:border-[#374151]'
                    }`}
                  >
                    {copiedId === event.id ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        Share
                      </>
                    )}
                  </button>
                  <Link 
                    href={`/events/${event.slug || event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full border border-[#262626] bg-[#121212] text-[#9ca3af] hover:text-[#fafafa] hover:border-[#374151] transition flex items-center justify-center no-underline"
                    title="View live public event page"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
