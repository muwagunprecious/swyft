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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#262626] border-t-[#fafafa]" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-[600px] px-6 py-12 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose-950/30 text-rose-400 mx-auto border border-rose-800/40">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">Event Not Found</h2>
        <p className="mt-2 text-xs text-[#9ca3af]">{error || 'The event you are looking for does not exist.'}</p>
        <Link href="/organizer/events" className="mt-6 inline-flex rounded-full bg-[#fafafa] px-6 py-2.5 text-xs font-semibold text-[#0a0a0a] no-underline hover:bg-white transition">
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
    <div className="space-y-6 pt-2">
      
      {/* ── BREADCRUMB & ACTIONS ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#737373]">
            <Link href="/organizer/events" className="hover:text-[#fafafa] transition no-underline">My Events</Link>
            <span>/</span>
            <span className="text-[#9ca3af]">Event Details</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#fafafa] md:text-3xl">{event.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleShareEvent}
            type="button"
            className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            {copied ? "Link Copied!" : "Share Event"}
          </button>
          <Link 
            href={publicEventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] no-underline transition hover:bg-[#202020] hover:border-[#374151]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Live
          </Link>
          <Link 
            href="/organizer/verification" 
            className="flex items-center gap-2 rounded-full bg-[#fafafa] px-5 py-2 text-xs font-semibold text-[#0a0a0a] no-underline transition hover:bg-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            Verify Tickets
          </Link>
        </div>
      </div>

      {/* ── METRICS GRID ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Event Revenue', value: `₦${totalRevenue.toLocaleString()}`, sub: 'Clearance within 48h', color: 'text-emerald-400' },
          { label: 'Tickets Sold', value: `${totalSold} / ${totalCapacity}`, sub: `${totalCapacity - totalSold} tickets remaining`, color: 'text-[#fafafa]' },
          { label: 'Attendance Check-in', value: `${checkedInCount} / ${totalSold || 1}`, sub: `${Math.round((checkedInCount / (totalSold || 1)) * 100)}% attendance rate`, color: 'text-emerald-400' },
          { label: 'Voting Status', value: isVotingEnabled ? 'Active' : 'Disabled', sub: isVotingPaid ? `Paid • ₦${voteCost}/vote` : 'Free voting', color: isVotingEnabled ? 'text-amber-400' : 'text-[#737373]' }
        ].map((s, idx) => (
          <div key={idx} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
            <p className="text-xs font-medium text-[#9ca3af]">{s.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">{s.value}</p>
            <p className={`mt-1 text-[11px] font-medium ${s.color}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── EVENT METADATA & TICKETS ────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden">
            <div className="relative h-48 bg-[#171717]">
              <img src={event.bannerImage || '/images/party.png'} alt={event.title} className="h-full w-full object-cover" />
              <div className="absolute top-4 left-4 rounded-full border border-[#262626] bg-[#121212]/90 backdrop-blur px-3 py-1 text-[11px] font-semibold text-[#fafafa] shadow">
                {event.category || 'Event'}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#fafafa]">About Event</h3>
                  <p className="mt-1.5 text-xs text-[#9ca3af] leading-relaxed">{event.description || 'No description provided.'}</p>
                </div>
                <button
                  onClick={handleShareEvent}
                  type="button"
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-semibold text-[#fafafa] hover:bg-[#202020] hover:border-[#374151] transition"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  {copied ? "Copied!" : "Share Event"}
                </button>
              </div>

              <div className="grid gap-4 border-t border-[#262626] pt-4 sm:grid-cols-2 text-xs font-medium text-[#fafafa]">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 2 2z"/></svg>
                  <span>{new Date(event.date).toLocaleDateString('en-GB', { dateStyle: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              {/* Dedicated Share Box */}
              <div className="mt-4 rounded-2xl border border-[#262626] bg-[#171717] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#fafafa]">Public Event Link</span>
                  </div>
                  <span className="text-[11px] text-[#9ca3af]">Promote to drive ticket sales</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={publicEventUrl}
                    className="h-10 flex-1 rounded-full border border-[#262626] bg-[#141414] px-4 text-xs font-medium text-[#fafafa] select-all truncate outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className={`h-10 px-5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                      copied 
                        ? "bg-emerald-500 text-white" 
                        : "bg-[#fafafa] text-[#0a0a0a] hover:bg-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Link
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#262626]">
                  <span className="text-[10px] uppercase tracking-wider text-[#737373] mr-1">Share:</span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${event.title} on Swyft: ${publicEventUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-800/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 transition text-[11px] font-medium no-underline"
                  >
                    <span>💬</span> WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get tickets for ${event.title}`)}&url=${encodeURIComponent(publicEventUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#262626] bg-[#141414] text-[#fafafa] hover:bg-[#202020] transition text-[11px] font-medium no-underline"
                  >
                    <span className="text-xs font-bold">𝕏</span> Post
                  </a>
                  <Link
                    href={publicEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#262626] bg-[#141414] text-[#fafafa] hover:bg-[#202020] transition text-[11px] font-medium no-underline ml-auto"
                  >
                    View Live Page &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Tiers list */}
          <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden">
            <div className="border-b border-[#262626] px-6 py-4 bg-[#141414] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fafafa]">Ticket Tiers & Pricing</h3>
                <p className="text-[11px] text-[#9ca3af]">Add flash discounts with time-limited countdowns</p>
              </div>
            </div>
            <div className="divide-y divide-[#262626]">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-[#9ca3af]">
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
                        <span className="text-xs font-semibold text-[#fafafa]">{t.name}</span>
                        {hasDiscount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#737373] line-through">
                              ₦{t.price.toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-emerald-400 border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                              ₦{t.discountPrice.toLocaleString()} ({daysRemaining}d left)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-[#9ca3af] border border-[#262626] bg-[#171717] px-2.5 py-0.5 rounded-full">
                            {t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-32 bg-[#262626] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-[#9ca3af]">{pct}% Sold ({t.sold} / {t.quantity})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[#737373]">Revenue</p>
                        <p className="text-xs font-bold text-emerald-400">
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
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 border ${
                            hasDiscount
                              ? 'border-amber-800/40 bg-amber-950/40 text-amber-400 hover:bg-amber-900/40'
                              : 'border-[#262626] bg-[#171717] text-[#fafafa] hover:bg-[#202020] hover:border-[#374151]'
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
          <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fafafa] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#fafafa]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Voting Settings
              </h3>
              <p className="mt-1 text-xs text-[#9ca3af]">Configure voting rules for Miss Faculty or pageants.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Toggle Voting Enable */}
              <div className="flex items-center justify-between p-4 bg-[#171717] rounded-2xl border border-[#262626]">
                <div>
                  <p className="text-xs font-semibold text-[#fafafa]">Enable Voting</p>
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">Activate contestant voting</p>
                </div>
                <button 
                  onClick={() => setIsVotingEnabled(!isVotingEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVotingEnabled ? 'bg-emerald-500' : 'bg-[#262626]'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVotingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {isVotingEnabled && (
                <>
                  {/* Toggle Paid Voting */}
                  <div className="flex items-center justify-between p-4 bg-[#171717] rounded-2xl border border-[#262626] animate-in fade-in duration-200">
                    <div>
                      <p className="text-xs font-semibold text-[#fafafa]">Paid Voting</p>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5">Requires vote purchase</p>
                    </div>
                    <button 
                  onClick={() => setIsVotingPaid(!isVotingPaid)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVotingPaid ? 'bg-emerald-500' : 'bg-[#262626]'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVotingPaid ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                  </div>

                  {/* Pricing field */}
                  {isVotingPaid && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-medium text-[#fafafa] mb-1.5">Cost Per Vote (₦)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373] text-xs font-bold">₦</span>
                        <input 
                          type="number" 
                          value={voteCost}
                          onChange={(e) => setVoteCost(Number(e.target.value))}
                          className="w-full pl-8 pr-4 h-10 bg-[#171717] border border-[#262626] rounded-full text-xs font-semibold text-[#fafafa] outline-none focus:border-[#374151] transition"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="relative">
              {saveSuccess && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 border border-emerald-800/40 bg-emerald-950/40 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300">
                  Settings saved successfully!
                </div>
              )}
              <button 
                onClick={handleSaveVotingSettings}
                disabled={isSavingSettings}
                className="w-full bg-[#fafafa] text-[#0a0a0a] py-2.5 rounded-full font-semibold text-xs hover:bg-white transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingSettings ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm p-6 space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fafafa]">Quick Links</h3>
            </div>
            <div className="grid gap-2 text-xs font-medium">
              <Link href={`/organizer/voting?eventId=${id}`} className="flex items-center justify-between p-3 rounded-full bg-[#171717] border border-[#262626] text-[#fafafa] hover:bg-[#202020] hover:border-[#374151] no-underline transition">
                <span>Manage Contestants & Categories</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
              <Link href="/organizer/attendees" className="flex items-center justify-between p-3 rounded-full bg-[#171717] border border-[#262626] text-[#fafafa] hover:bg-[#202020] hover:border-[#374151] no-underline transition">
                <span>View All Attendees</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ── RECENT REGISTRATIONS (ATTENDEES LIST) ───────────────── */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262626] px-6 py-4 bg-[#141414]">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fafafa]">Recent Registrations</h3>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Attendee orders for this event</p>
          </div>
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendee by name..."
              className="h-9 w-full rounded-full border border-[#262626] bg-[#171717] pl-9 pr-3 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none focus:border-[#374151]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626] bg-[#141414]">
                {['Ticket ID', 'Name', 'Ticket Type', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9ca3af]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] text-xs">
              {filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[#9ca3af]">
                    No registrations found matching search query.
                  </td>
                </tr>
              ) : filteredAttendees.map((a) => (
                <tr key={a.id} className="hover:bg-[#171717] transition">
                  <td className="px-5 py-3.5 text-[#fafafa] font-semibold">{a.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#fafafa]">{a.user?.name || 'Guest'}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full border border-[#262626] bg-[#171717] px-2.5 py-0.5 text-[11px] font-medium text-[#fafafa]">{a.ticket?.type || 'Regular'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${
                      a.status === 'Paid' || a.status === 'Completed'
                        ? 'border-emerald-800/40 bg-emerald-950/40 text-emerald-400'
                        : 'border-amber-800/40 bg-amber-950/40 text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'Paid' || a.status === 'Completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {a.status === 'Paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#9ca3af]">{new Date(a.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DISCOUNT CONFIGURATION MODAL ─────────────────────────── */}
      {showDiscountModal && selectedTicketForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#121212] border border-[#262626] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#fafafa]">
                  Manage Discount: {selectedTicketForDiscount.name}
                </h3>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  Regular Price: ₦{Number(selectedTicketForDiscount.price).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="h-8 w-8 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] hover:bg-[#202020] text-xs font-semibold transition"
              >
                ✕
              </button>
            </div>

            {discountMessage && (
              <div className="mb-4 rounded-2xl border border-rose-800/40 bg-rose-950/30 p-3 text-xs font-medium text-rose-400">
                {discountMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#fafafa] mb-1.5">
                  Discounted Price (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373]">₦</span>
                  <input
                    type="number"
                    min="0"
                    max={selectedTicketForDiscount.price - 1}
                    value={discountPriceInput}
                    onChange={(e) => setDiscountPriceInput(e.target.value)}
                    placeholder={`Less than ₦${selectedTicketForDiscount.price.toLocaleString()}`}
                    className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] pl-8 pr-4 text-xs font-semibold text-[#fafafa] placeholder-[#737373] outline-none focus:border-[#374151]"
                  />
                </div>
                <p className="text-[11px] text-[#737373] mt-1">
                  Attendees will see a strikethrough on the regular price.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#fafafa] mb-1.5">
                  Duration (Days until expiration) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={discountDaysInput}
                    onChange={(e) => setDiscountDaysInput(e.target.value)}
                    placeholder="5"
                    className="h-10 w-24 rounded-full border border-[#262626] bg-[#171717] px-3 text-center text-xs font-semibold text-[#fafafa] outline-none focus:border-[#374151]"
                  />
                  <span className="text-xs text-[#9ca3af]">Days from today</span>
                </div>
                <p className="text-[11px] text-[#737373] mt-1">
                  Reverts automatically back to ₦{selectedTicketForDiscount.price.toLocaleString()} when expired.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between gap-3">
              {selectedTicketForDiscount.discountPrice ? (
                <button
                  type="button"
                  onClick={() => handleSaveDiscount(true)}
                  disabled={savingDiscount}
                  className="px-4 py-2 rounded-full border border-rose-800/40 bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 text-xs font-semibold transition disabled:opacity-50"
                >
                  Remove Discount
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 rounded-full border border-[#262626] bg-[#171717] text-[#9ca3af] hover:text-[#fafafa] hover:bg-[#202020] text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDiscount(false)}
                  disabled={savingDiscount || !discountPriceInput || !discountDaysInput}
                  className="px-5 py-2 rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white text-xs font-semibold transition disabled:opacity-50"
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
