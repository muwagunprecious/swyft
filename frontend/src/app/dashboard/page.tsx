'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import EventCard from '@/components/events/EventCard';
import { Event } from '@/types';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('otix_user');
    if (userData) setUser(JSON.parse(userData));

    const fetchData = async () => {
      try {
        const [ticketsRes, eventsRes] = await Promise.all([
          api.get('/orders/my-tickets'),
          api.get('/events')
        ]);
        setTickets(ticketsRes.data);
        setSuggestedEvents(eventsRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <section style={{ background: '#0F0A23', padding: '60px 0 100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '40%', height: '80%', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)' }} />
        <div className="wrap relative z-10">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                Welcome back, <span style={{ color: '#818CF8' }}>{user.name.split(' ')[0]}!</span>
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '1rem' }}>Manage your campus life and explore what's happening today.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/events" className="btn-indigo" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
                Discover Events
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '48px' }}>
            {[
              { label: 'Active Tickets', value: tickets.filter(t => t.status === 'Valid').length, icon: '🎫', color: '#4F46E5' },
              { label: 'Votes Cast', value: '0', icon: '🗳️', color: '#10B981' },
              { label: 'Points Earned', value: '450', icon: '✨', color: '#F59E0B' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{s.value}</span>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600, marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div className="wrap" style={{ marginTop: '-40px', position: 'relative', zIndex: 20, paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }} className="grid-cols-1 lg:grid-cols-[1fr_340px]">
          
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* My Tickets Section */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>My Active Tickets</h2>
                <Link href="/tickets" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4F46E5', textDecoration: 'none' }}>View History</Link>
              </div>

              {loading ? (
                <div style={{ height: '200px', background: '#F3F4F6', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
              ) : tickets.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tickets.filter(t => t.status === 'Valid').map((ticket: any) => (
                    <div key={ticket.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', borderRadius: '16px', border: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                      <div style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '12px', padding: '8px', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                        <img src={ticket.qr} alt="QR" style={{ width: '100%', height: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem', marginBottom: '4px' }}>{ticket.event}</h3>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {new Date(ticket.date).toLocaleDateString()}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {ticket.location}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', padding: '4px 10px', borderRadius: '6px', background: '#D1FAE5', color: '#059669', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {ticket.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎟️</div>
                  <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>No active tickets yet. Find an event and get started!</p>
                </div>
              )}
            </div>

            {/* Suggested Events */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>Suggested for You</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                {suggestedEvents.map((ev) => <EventCard key={ev.id} {...ev} />)}
              </div>
            </div>

          </div>

          {/* Side Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Quick Actions */}
            <div style={{ background: '#4F46E5', borderRadius: '20px', padding: '32px', color: '#fff' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/voting" style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.4rem' }}>🗳️</span>
                  Cast a Vote
                </Link>
                <Link href="/events" style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.4rem' }}>🛒</span>
                  Buy Tickets
                </Link>
                <Link href="/verify" style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.4rem' }}>🔍</span>
                  Verify Ticket
                </Link>
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', padding: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>Account Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Role</label>
                  <p style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>{user.role}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Matric Number</label>
                  <p style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>{user.matricNumber || 'Not provided'}</p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('otix_token');
                    localStorage.removeItem('otix_user');
                    window.location.href = '/login';
                  }}
                  style={{ marginTop: '12px', background: 'none', border: 'none', color: '#EF4444', fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', padding: 0 }}
                >
                  Logout
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
