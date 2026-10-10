'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function EventDetailManagement() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Voting settings state
  const [isVotingEnabled, setIsVotingEnabled] = useState(false);
  const [isVotingPaid, setIsVotingPaid] = useState(false);
  const [voteCost, setVoteCost] = useState(50);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Attendees list
  const [attendees, setAttendees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Discount settings state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedTicketForDiscount, setSelectedTicketForDiscount] = useState<any>(null);
  const [discountPriceInput, setDiscountPriceInput] = useState('');
  const [discountDaysInput, setDiscountDaysInput] = useState('5');
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState('');

  // Sharing state
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  const handleSaveDiscount = async (remove = false) => {
    if (!selectedTicketForDiscount) return;
    setSavingDiscount(true);
    setDiscountMessage('');

    try {
      const payload = remove
        ? { discountPrice: null, discountDays: null }
        : { discountPrice: discountPriceInput, discountDays: discountDaysInput };

      const res = await api.put(`/organizer/tickets/${selectedTicketForDiscount.id}/discount`, payload);

      // Update local event state
      setEvent((prev: any) => {
        if (!prev) return prev;
        const updatedTickets = (prev.Ticket || prev.tickets || []).map((t: any) =>
          t.id === selectedTicketForDiscount.id ? { ...t, ...res.data.ticket } : t
        );
        return {
          ...prev,
          Ticket: updatedTickets,
          tickets: updatedTickets,
        };
      });

      setShowDiscountModal(false);
    } catch (err: any) {
      console.error('Failed to update discount', err);
      setDiscountMessage(err.response?.data?.message || 'Failed to update discount');
    } finally {
      setSavingDiscount(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      try {
        setLoading(true);
        // Fetch event from backend (falls back to local mock DB)
        const res = await api.get(`/events/${id}`);
        const eventData = res.data;
        setEvent(eventData);
        
        // Sync voting states
        setIsVotingEnabled(eventData.isVotingEnabled || false);
        setIsVotingPaid(eventData.isVotingPaid || false);
        setVoteCost(eventData.voteCost || 50);

        // Fetch attendees for this event
        // We will filter from general attendees list or retrieve mock ones
        try {
          const attendeesRes = await api.get('/organizer/sales');
          // Filter sales items that belong to tickets of this event
          const eventSales = attendeesRes.data.filter((sale: any) => 
            sale.ticket?.event?.title === eventData.title || 
            (eventData.tickets || []).some((t: any) => t.name === sale.ticket?.type)
          );
          setAttendees(eventSales);
        } catch (err) {
          console.warn('Failed to fetch sales, setting mock attendees instead', err);
          // Mock data fallback
          setAttendees([
            { id: 'TKT-8821', user: { name: 'Ayomide Adekunle' }, ticket: { type: 'Student', price: 2500 }, status: 'Paid', createdAt: new Date().toISOString() },
            { id: 'TKT-8820', user: { name: 'Chiamaka Obi' }, ticket: { type: 'VIP', price: 7500 }, status: 'Paid', createdAt: new Date().toISOString() },
            { id: 'TKT-8819', user: { name: 'Ibrahim Musa' }, ticket: { type: 'Student', price: 2500 }, status: 'Paid', createdAt: new Date().toISOString() }
          ]);
        }

      } catch (err: any) {
        console.error('Error fetching event details', err);
        setError('Failed to load event details. It might have been deleted or the backend is offline.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleSaveVotingSettings = async () => {
    setIsSavingSettings(true);
    setSaveSuccess(false);
    try {
      await api.put(`/organizer/events/${id}/voting-settings`, {
        isVotingEnabled,
        isVotingPaid,
        voteCost: Number(voteCost)
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Update local event state
      setEvent((prev: any) => ({
        ...prev,
        isVotingEnabled,
        isVotingPaid,
        voteCost: Number(voteCost)
      }));
    } catch (err: any) {
      console.error('Failed to update voting settings', err);
      alert(err.response?.data?.message || 'Failed to save voting settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#9333ea]/20 border-t-[#9333ea]" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-[600px] px-6 py-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mx-auto border border-red-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-black text-gray-900">Event Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">{error || 'The event you are looking for does not exist.'}</p>
        <Link href="/organizer/events" className="mt-6 inline-flex rounded-xl bg-[#9333ea] px-6 py-2.5 text-sm font-bold text-white no-underline shadow-sm hover:bg-[#7e22ce] transition">
          Back to Events
        </Link>
      </div>
    );
  }

  // Calculate local statistics
  const tickets = event.Ticket || [];
  let totalSold = 0;
  let totalCapacity = 0;
  let totalRevenue = 0;

  tickets.forEach((t: any) => {
    totalSold += t.sold || 0;
    totalCapacity += t.quantity || 0;
    totalRevenue += (t.sold || 0) * (t.price || 0);
  });

  const checkedInCount = attendees.filter(a => a.status === 'Checked In' || a.status === 'Paid').length; // Check-in fallback simulation

  const filteredAttendees = attendees.filter(a => 
    a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const eventSlugOrId = event?.slug || event?.id || id;
  const publicEventUrl = origin ? `${origin}/events/${eventSlugOrId}` : `/events/${eventSlugOrId}`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(publicEventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareEvent = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: event?.title || 'Event on Swyft',
        text: `Get your tickets for ${event?.title}!`,
        url: publicEventUrl,
      }).catch(() => {
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 pb-16">
      
      {/* ── BREADCRUMB & ACTIONS ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Link href="/organizer/events" className="hover:text-[#d1410c] transition no-underline">My Events</Link>
            <span>/</span>
            <span className="text-gray-600">Event Details</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-gray-900 tracking-tight md:text-3xl">{event.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleShareEvent}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#d1410c] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#b03507] transition active:scale-95"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            {copied ? "Link Copied!" : "Share Event"}
          </button>
          <Link 
            href={publicEventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 no-underline shadow-sm hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Live
          </Link>
          <Link 
            href="/organizer/verification" 
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 no-underline shadow-sm hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            Verify Tickets
          </Link>
        </div>
      </div>

      {/* ── METRICS GRID ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Event Revenue', value: `₦${totalRevenue.toLocaleString()}`, sub: 'Clearance within 48h', color: '#12B76A', bg: '#f0fdf4' },
          { label: 'Tickets Sold', value: `${totalSold} / ${totalCapacity}`, sub: `${totalCapacity - totalSold} tickets remaining`, color: '#d1410c', bg: '#fff9f6' },
          { label: 'Attendance Check-in', value: `${checkedInCount} / ${totalSold || 1}`, sub: `${Math.round((checkedInCount / (totalSold || 1)) * 100)}% attendance rate`, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Voting Status', value: isVotingEnabled ? 'Active' : 'Disabled', sub: isVotingPaid ? `Paid • ₦${voteCost}/vote` : 'Free voting', color: '#f59e0b', bg: '#fffbeb' }
        ].map((s, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
            <p className="mt-3 text-2xl font-black text-[#1a202c]">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold" style={{ color: s.color }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── EVENT METADATA & TICKETS ────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              <img src={event.bannerImage || '/images/party.png'} alt={event.title} className="h-full w-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-lg text-xs font-black text-gray-900 shadow">
                {event.category || 'Event'}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">About Event</h3>
                  <p className="mt-1.5 text-sm font-medium text-gray-500 leading-relaxed">{event.description || 'No description provided.'}</p>
                </div>
                <button
                  onClick={handleShareEvent}
                  type="button"
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-[#d1410c] hover:bg-orange-100 transition shadow-sm active:scale-95"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  {copied ? "Copied!" : "Share Event"}
                </button>
              </div>

              <div className="grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span>{new Date(event.date).toLocaleDateString('en-GB', { dateStyle: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              {/* Dedicated Share Box inside the About Event Card */}
              <div className="mt-4 rounded-xl border border-gray-200/90 bg-gradient-to-b from-[#faf9fc] to-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-[#d1410c]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900">Public Event Link</span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">Promote to drive ticket sales</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={publicEventUrl}
                    className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 shadow-inner select-all truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className={`h-10 px-4 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                      copied 
                        ? "bg-emerald-600 text-white" 
                        : "bg-[#d1410c] text-white hover:bg-[#b03507] active:scale-95"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Link
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">Share via:</span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${event.title} on Swyft: ${publicEventUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 transition text-[11px] font-bold no-underline border border-[#25D366]/20"
                  >
                    <span>💬</span> WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get tickets for ${event.title}`)}&url=${encodeURIComponent(publicEventUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 text-gray-900 hover:bg-black/10 transition text-[11px] font-bold no-underline border border-gray-200"
                  >
                    <span className="text-xs font-black">𝕏</span> Post
                  </a>
                  <Link
                    href={publicEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 text-[#d1410c] hover:bg-orange-100 transition text-[11px] font-bold no-underline border border-orange-200/60 ml-auto"
                  >
                    View Live Page &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Tiers list */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Ticket Tiers & Pricing</h3>
                <p className="text-xs text-gray-500 font-medium">Add flash discounts with time-limited countdowns</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-gray-400">
                  No ticket tiers created for this event.
                </div>
              ) : tickets.map((t: any) => {
                const pct = Math.min(100, Math.round(((t.sold || 0) / (t.quantity || 1)) * 100));
                const hasDiscount = t.discountPrice !== null && t.discountPrice !== undefined && t.discountEndsAt && new Date(t.discountEndsAt) > new Date();
                const daysRemaining = hasDiscount ? Math.max(1, Math.ceil((new Date(t.discountEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

                return (
                  <div key={t.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-gray-900">{t.name}</span>
                        {hasDiscount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-400 line-through">
                              ₦{t.price.toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              ₦{t.discountPrice.toLocaleString()} ({daysRemaining}d left)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                            {t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#9333ea] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">{pct}% Sold ({t.sold} / {t.quantity})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                        <p className="text-sm font-black text-emerald-600">
                          ₦{((t.sold || 0) * (hasDiscount ? t.discountPrice : t.price || 0)).toLocaleString()}
                        </p>
                      </div>

                      {t.price > 0 && (
                        <button
                          onClick={() => {
                            setSelectedTicketForDiscount(t);
                            setDiscountPriceInput(t.discountPrice ? String(t.discountPrice) : '');
                            setDiscountDaysInput(daysRemaining ? String(daysRemaining) : '5');
                            setShowDiscountModal(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                            hasDiscount
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              : 'bg-gray-100 text-gray-700 hover:bg-[#f05537] hover:text-white'
                          }`}
                        >
                          🏷️ {hasDiscount ? 'Edit Discount' : 'Add Discount'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Voting Engine configuration */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-[#9333ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Voting Settings
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-400">Configure voting rules for Miss Faculty or pageants.</p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Toggle Voting Enable */}
              <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">Enable Voting</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">Activate contestant voting</p>
                </div>
                <button 
                  onClick={() => setIsVotingEnabled(!isVotingEnabled)}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVotingEnabled ? 'bg-[#9333ea]' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVotingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {isVotingEnabled && (
                <>
                  {/* Toggle Paid Voting */}
                  <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 animate-in fade-in duration-200">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Paid Voting</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">Requires vote purchase</p>
                    </div>
                    <button 
                      onClick={() => setIsVotingPaid(!isVotingPaid)}
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVotingPaid ? 'bg-[#9333ea]' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVotingPaid ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Pricing field */}
                  {isVotingPaid && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cost Per Vote (₦)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                        <input 
                          type="number" 
                          value={voteCost}
                          onChange={(e) => setVoteCost(Number(e.target.value))}
                          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/10 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="relative">
              {saveSuccess && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300">
                  Settings saved successfully!
                </div>
              )}
              <button 
                onClick={handleSaveVotingSettings}
                disabled={isSavingSettings}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-xs hover:bg-black transition-all shadow hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSavingSettings ? (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Quick Links</h3>
            </div>
            <div className="grid gap-2 text-xs font-bold text-gray-600">
              <Link href={`/organizer/voting?eventId=${id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100 no-underline transition">
                <span>Manage Contestants & Categories</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
              <Link href="/organizer/attendees" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100 no-underline transition">
                <span>View All Attendees</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ── RECENT REGISTRATIONS (ATTENDEES LIST) ───────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Recent Registrations</h3>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">Attendee orders for this event</p>
          </div>
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendee by name..."
              className="h-8.5 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs font-semibold text-gray-700 outline-none focus:border-[#9333ea]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Ticket ID', 'Name', 'Ticket Type', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No registrations found matching search query.
                  </td>
                </tr>
              ) : filteredAttendees.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-[#9333ea] font-bold">{a.id}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{a.user?.name || 'Guest'}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-[#9333ea]">{a.ticket?.type || 'Regular'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${a.status === 'Paid' || a.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`h-1 w-1 rounded-full ${a.status === 'Paid' || a.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {a.status === 'Paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">{new Date(a.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DISCOUNT CONFIGURATION MODAL ─────────────────────────── */}
      {showDiscountModal && selectedTicketForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-150 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Manage Discount: {selectedTicketForDiscount.name}
                </h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Regular Price: ₦{Number(selectedTicketForDiscount.price).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {discountMessage && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                {discountMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 tracking-wider mb-1.5">
                  Discounted Price (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    max={selectedTicketForDiscount.price - 1}
                    value={discountPriceInput}
                    onChange={(e) => setDiscountPriceInput(e.target.value)}
                    placeholder={`Less than ₦${selectedTicketForDiscount.price.toLocaleString()}`}
                    className="h-11 w-full rounded-xl border border-gray-200 pl-8 pr-4 text-sm font-bold text-gray-900 outline-none focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/10"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  Attendees will see a dash/strikethrough on the regular price.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 tracking-wider mb-1.5">
                  Duration (How many days until it expires?) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={discountDaysInput}
                    onChange={(e) => setDiscountDaysInput(e.target.value)}
                    placeholder="e.g. 5"
                    className="h-11 w-28 rounded-xl border border-gray-200 px-3 text-center text-sm font-bold text-gray-900 outline-none focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/10"
                  />
                  <span className="text-xs font-bold text-gray-500">Days from today</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  After this period, the ticket will automatically revert back to ₦{selectedTicketForDiscount.price.toLocaleString()}.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              {selectedTicketForDiscount.discountPrice ? (
                <button
                  type="button"
                  onClick={() => handleSaveDiscount(true)}
                  disabled={savingDiscount}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-black transition disabled:opacity-50"
                >
                  Remove Discount
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDiscount(false)}
                  disabled={savingDiscount || !discountPriceInput || !discountDaysInput}
                  className="px-5 py-2.5 rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-white text-xs font-black uppercase tracking-wider transition shadow-sm disabled:opacity-50"
                >
                  {savingDiscount ? 'Saving...' : 'Apply Discount'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
