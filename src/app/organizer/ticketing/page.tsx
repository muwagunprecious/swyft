'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function TicketingModule() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Ticketing Operations</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Manage ticket tiers, pricing, and availability across your events.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Ticket Tier
        </button>
      </div>

      {/* ── TICKET OVERVIEW ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
          No events found. You need an event before you can create tickets.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{event.title}</h3>
                    <p className="text-xs font-medium text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedEventId(event.id); setIsModalOpen(true); }}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  + Add Tier
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">Ticket Type</th>
                      <th className="px-5 py-3 text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-5 py-3 text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">Sold / Cap</th>
                      <th className="px-5 py-3 text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {/* Note: This assumes event.Ticket is passed from the backend grouping tickets by type. 
                        If the backend just returns raw sold tickets, you need a different table structure. 
                        Assuming we have event.TicketTiers for this UI. If not, we map sold tickets. */}
                    {event.Ticket && event.Ticket.length > 0 ? (
                      event.Ticket.reduce((acc: any, t: any) => {
                        // Rough grouping for UI purposes if true tiers aren't in DB yet
                        const existing = acc.find((x: any) => x.type === t.type);
                        if (existing) {
                          existing.sold += 1;
                        } else {
                          acc.push({ type: t.type, price: t.price, sold: 1, capacity: 100 });
                        }
                        return acc;
                      }, []).map((tier: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                              tier.type.toLowerCase().includes('vip') ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {tier.type}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-gray-900">
                              {tier.price === 0 ? 'FREE' : `₦${tier.price.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((tier.sold / tier.capacity) * 100, 100)}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-600">{tier.sold} / {tier.capacity}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button className="text-gray-400 hover:text-indigo-600 transition-colors p-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-sm font-medium text-gray-400">
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Create Ticket Tier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-6 flex flex-col gap-4">
              
              {!selectedEventId && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Select Event <span className="text-red-500">*</span></label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="">-- Choose an event --</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ticket Type <span className="text-red-500">*</span></label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none"
                  value={newTicket.type}
                  onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                >
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                  <option value="Early Bird">Early Bird</option>
                  <option value="Table">Table Reservation</option>
                  <option value="Backstage">Backstage Pass</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Price (₦) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    placeholder="0 for free" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket({...newTicket, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Capacity</label>
                  <input 
                    type="number" 
                    placeholder="Unlimited" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none"
                    value={newTicket.capacity}
                    onChange={(e) => setNewTicket({...newTicket, capacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all">
                  Create Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
