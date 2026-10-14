'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import SendFreeTicketModal from '@/components/SendFreeTicketModal';

export default function TicketingModule() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFreeTicketModalOpen, setIsFreeTicketModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  // New Ticket State
  const [newTicket, setNewTicket] = useState({
    type: 'Regular',
    price: '',
    capacity: '',
    description: ''
  });

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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return alert('Select an event first');

    try {
      await api.post(`/events/${selectedEventId}/tickets`, {
        type: newTicket.type,
        price: parseFloat(newTicket.price) || 0,
        capacity: parseInt(newTicket.capacity) || null
      });
      // Refresh events
      const res = await api.get('/organizer/events');
      setEvents(res.data);
      setIsModalOpen(false);
      setNewTicket({ type: 'Regular', price: '', capacity: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create ticket');
    }
  };

  return (
    <div className="space-y-6 pt-2">
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
            Ticketing
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">Ticketing Operations</h1>
          <p className="mt-1 text-xs text-[#9ca3af]">Manage ticket tiers, pricing, and availability across your events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsFreeTicketModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Send Free Ticket
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#fafafa] px-5 py-2 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Ticket Tier
          </button>
        </div>
      </div>

      {/* ── TICKET OVERVIEW ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#262626] border-t-[#fafafa]" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-12 text-center text-xs text-[#9ca3af]">
          No events found. You need an event before you can create tickets.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {events.map(event => (
            <div key={event.id} className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#141414] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#171717] border border-[#262626] text-[#fafafa] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#fafafa]">{event.title}</h3>
                    <p className="text-[11px] text-[#9ca3af]">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedEventId(event.id); setIsModalOpen(true); }}
                  className="rounded-full border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]"
                >
                  + Add Tier
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#141414]">
                      <th className="px-5 py-3 text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider">Ticket Type</th>
                      <th className="px-5 py-3 text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider">Price</th>
                      <th className="px-5 py-3 text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider">Sold / Cap</th>
                      <th className="px-5 py-3 text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {event.Ticket && event.Ticket.length > 0 ? (
                      event.Ticket.reduce((acc: any, t: any) => {
                        const existing = acc.find((x: any) => x.type === t.type);
                        if (existing) {
                          existing.sold += 1;
                        } else {
                          acc.push({ type: t.type, price: t.price, sold: 1, capacity: 100 });
                        }
                        return acc;
                      }, []).map((tier: any, i: number) => (
                        <tr key={i} className="hover:bg-[#171717] transition">
                          <td className="px-5 py-3.5">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-[#262626] bg-[#171717] text-[#fafafa]">
                              {tier.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-bold text-emerald-400">
                              {tier.price === 0 ? 'FREE' : `₦${tier.price.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-24 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min((tier.sold / tier.capacity) * 100, 100)}%` }} />
                              </div>
                              <span className="text-xs font-medium text-[#9ca3af]">{tier.sold} / {tier.capacity}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button className="text-[#737373] hover:text-[#fafafa] transition p-1">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-xs text-[#9ca3af]">
                          No ticket tiers created yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE TIER MODAL ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#262626] flex justify-between items-center bg-[#141414]">
              <h3 className="text-sm font-bold text-[#fafafa]">Create Ticket Tier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#737373] hover:text-[#fafafa] transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-6 flex flex-col gap-4">
              
              {!selectedEventId && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#fafafa]">Select Event *</label>
                  <select 
                    required
                    className="w-full h-10 px-4 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="" className="bg-[#171717] text-[#9ca3af]">-- Choose an event --</option>
                    {events.map(e => <option key={e.id} value={e.id} className="bg-[#171717] text-[#fafafa]">{e.title}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#fafafa]">Ticket Type *</label>
                <select 
                  className="w-full h-10 px-4 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]"
                  value={newTicket.type}
                  onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                >
                  <option value="Regular" className="bg-[#171717] text-[#fafafa]">Regular</option>
                  <option value="VIP" className="bg-[#171717] text-[#fafafa]">VIP</option>
                  <option value="VVIP" className="bg-[#171717] text-[#fafafa]">VVIP</option>
                  <option value="Early Bird" className="bg-[#171717] text-[#fafafa]">Early Bird</option>
                  <option value="Table" className="bg-[#171717] text-[#fafafa]">Table Reservation</option>
                  <option value="Backstage" className="bg-[#171717] text-[#fafafa]">Backstage Pass</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#fafafa]">Price (₦) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0 for free" 
                    className="w-full h-10 px-4 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket({...newTicket, price: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#fafafa]">Capacity</label>
                  <input 
                    type="number" 
                    placeholder="Unlimited" 
                    className="w-full h-10 px-4 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
                    value={newTicket.capacity}
                    onChange={(e) => setNewTicket({...newTicket, capacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#262626] mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#9ca3af] transition hover:bg-[#202020] hover:text-[#fafafa]">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-[#fafafa] px-5 py-2 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white">
                  Create Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SEND FREE TICKET MODAL ─────────────────────────────────── */}
      <SendFreeTicketModal
        isOpen={isFreeTicketModalOpen}
        onClose={() => setIsFreeTicketModalOpen(false)}
        onSuccess={() => {
          api.get('/organizer/events').then(res => setEvents(res.data)).catch(console.error);
        }}
      />

    </div>
  );
}
