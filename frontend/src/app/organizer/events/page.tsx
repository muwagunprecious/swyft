'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function OrganizerEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/organizer/events');
        setEvents(res.data);
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Manage Events</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Create, edit, and track all your campus events.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input 
              type="text" 
              placeholder="Search events..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#f05537]/20 focus:border-[#f05537] transition-all w-64"
            />
          </div>
          <Link href="/organizer/events/new" className="bg-[#f05537] hover:bg-[#d1410c] text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 no-underline whitespace-nowrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Event
          </Link>
        </div>
      </div>

      {/* ── EVENTS LIST ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#f05537]/10 rounded-2xl flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2" strokeLinecap="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No events found</h3>
          <p className="text-sm text-gray-500 max-w-md mb-6">You haven't created any events yet. Click the button below to set up your first campus event.</p>
          <Link href="/organizer/events/new" className="bg-[#f05537] hover:bg-[#d1410c] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm no-underline">
            Create First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              
              {/* Event Image */}
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                {event.bannerImage ? (
                  <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#f05537]/5">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff8f7a" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-black text-gray-900 shadow-sm">
                  {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <Link href={`/organizer/events/${event.id}`} className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm text-gray-700 flex items-center justify-center shadow-sm hover:text-[#f05537] transition-colors" title="Manage & Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">{event.title}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider whitespace-nowrap ${event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {event.status || 'DRAFT'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-4 line-clamp-2">{event.description || 'No description provided.'}</p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tickets Sold</p>
                    <p className="text-sm font-black text-gray-900">{event.sold || 0}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Revenue</p>
                    <p className="text-sm font-black text-emerald-600">₦{(event.revenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between">
                <Link href={`/organizer/events/${event.id}`} className="text-xs font-bold text-gray-600 hover:text-[#f05537] transition-colors flex items-center gap-1.5 px-2 py-1 no-underline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                  Manage
                </Link>
                <button className="text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5 px-2 py-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Duplicate
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
