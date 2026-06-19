'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Cart() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('otix_cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    } else {
      // Demo items if empty for the first time, but we'll allow it to be empty
      // setItems([
      //   { id: '1', ticketId: '...', title: 'OOU Annual Tech Summit 2026', ticketType: 'Student Regular', price: 2500, qty: 2, image: '/images/academic.png' },
      // ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('otix_cart', JSON.stringify(items));
    }
  }, [items, loading]);

  const updateQty = (id: string, delta: number) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const fee = Math.round(subtotal * 0.05);
  const discount = promoApplied ? -1000 : 0;
  const total = subtotal + fee + discount;

  if (loading) return <div style={{ padding: '48px', textAlign: 'center' }}>Loading your cart...</div>;

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Your Cart</h1>
        <p style={{ color: '#6B7280', marginBottom: '40px' }}>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Cart Items */}
          <div className="flex flex-col gap-4 w-full lg:w-[calc(100%-392px)] flex-1">
            {items.map((item) => (
              <div key={item.id} className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '88px', height: '64px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#F3F4F6' }}>
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                  <span className="badge badge-indigo">{item.ticketType}</span>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '6px' }}>₦{item.price.toLocaleString()} each</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1.5px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{ width: '36px', height: '36px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>–</button>
                    <span style={{ padding: '0 12px', fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{ width: '36px', height: '36px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>₦{(item.price * item.qty).toLocaleString()}</p>
                  <button onClick={() => removeItem(item.id)} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '3rem', marginBottom: '12px' }}>🎟️</p>
                <p style={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Your cart is empty</p>
                <Link href="/events" className="btn-indigo" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '16px' }}>Browse Events</Link>
              </div>
            )}

            <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#4F46E5', textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Continue browsing
            </Link>
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="w-full lg:w-[360px] shrink-0 sticky top-[90px]">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div style={{ padding: '24px', borderBottom: '1px solid #F3F4F6' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Order Summary</h3>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Subtotal', value: `₦${subtotal.toLocaleString()}` },
                    { label: 'Service Fee (5%)', value: `₦${fee.toLocaleString()}` },
                    ...(promoApplied ? [{ label: 'Promo (WELCOME)', value: '–₦1,000', green: true }] : []),
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: (row as any).green ? '#10B981' : '#111827' }}>{row.value}</span>
                    </div>
                  ))}

                  <div style={{ borderTop: '1.5px solid #E5E7EB', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Total</span>
                    <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#4F46E5' }}>₦{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Promo code */}
                <div style={{ padding: '0 24px 20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: '10px 14px', fontSize: '0.875rem' }}
                    />
                    <button
                      onClick={() => { if (promo.toUpperCase() === 'WELCOME') setPromoApplied(true); }}
                      style={{ padding: '10px 16px', background: '#F3F4F6', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && <p style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, marginTop: '6px' }}>✓ Promo code applied! ₦1,000 off.</p>}
                </div>

                <div style={{ padding: '0 24px 24px' }}>
                  <Link href="/checkout" className="btn-indigo" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
                    Proceed to Checkout
                  </Link>
                </div>
              </div>

              {/* Trust signals */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {['🔒 Secure Payment', '📧 Instant Tickets', '📄 PDF Included'].map((s) => (
                  <span key={s} style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
