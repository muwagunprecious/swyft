"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setError("No transaction reference provided.");
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/my-tickets?reference=${ref}`);
        setTickets(res.data);
      } catch (err: any) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order receipt details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [ref]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-6">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold text-[#1e0a3c] mb-2">Generating Receipt...</h2>
          <p className="text-sm font-semibold text-gray-500">Securing ticket passes and generating invoice details.</p>
        </div>
      </div>
    );
  }

  if (error || tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-lg text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-[#1e0a3c] mb-2">No Receipt Found</h2>
          <p className="text-sm font-semibold text-gray-500 mb-6">{error || "Could not retrieve any order data for the provided reference."}</p>
          <div className="grid gap-3">
            <Link href="/tickets" className="btn-primary w-full text-center py-3">
              Track Ticket manually
            </Link>
            <Link href="/events" className="btn-quiet w-full text-center py-3">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate receipt totals from the tickets
  const buyer = tickets[0];
  const orderDate = buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : "N/A";
  
  // Calculate subtotal from tickets in response
  const subtotal = tickets.reduce((acc, t) => acc + (t.price * (t.quantity || 1)), 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const totalPaid = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#1e0a3c] py-12 lg:py-20">
      <div className="mx-auto max-w-[1050px] px-6">
        
        {/* Success Banner */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 shadow-sm border border-green-100 animate-bounce">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1e0a3c] sm:text-4xl">Order Confirmed!</h1>
          <p className="mt-3 text-base font-semibold text-gray-500 max-w-lg mx-auto">
            You're all set. Your ticket passes and transaction receipt have been generated below.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-start">
          
          {/* LEFT: Premium Store Receipt */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
            <div className="bg-[#1e0a3c] text-white p-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#f05537]">SWYFT RECEIPT</span>
                <h2 className="text-lg font-black mt-1">Transaction Invoice</h2>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>

            <div className="p-8">
              {/* Receipt Header details */}
              <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-6 mb-6 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billing Info</p>
                  <p className="text-sm font-bold text-gray-800 mt-2">{buyer.attendeeName}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{buyer.attendeeEmail}</p>
                  <p className="text-xs font-semibold text-gray-500">{buyer.attendeePhone}</p>
                  {buyer.attendeeMatric && (
                    <p className="text-xs font-semibold text-gray-500 mt-1">Matric: {buyer.attendeeMatric}</p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Details</p>
                  <p className="text-sm font-bold text-gray-800 mt-2">Ref: <code className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs">{buyer.reference}</code></p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{orderDate}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-black px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Paid via Paystack
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs">Item Description</th>
                      <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs text-center w-16">Qty</th>
                      <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs text-right w-24">Price</th>
                      <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-4">
                          <p className="font-extrabold text-gray-900">{t.event}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.type} Admission Pass</p>
                        </td>
                        <td className="py-4 text-center font-bold text-gray-600">{t.quantity || 1}</td>
                        <td className="py-4 text-right font-bold text-gray-600">₦{t.price.toLocaleString()}</td>
                        <td className="py-4 text-right font-extrabold text-gray-950">₦{(t.price * (t.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="mt-6 border-t border-gray-100 pt-4 flex flex-col gap-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-800">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-500">Service Fee (5%)</span>
                  <span className="font-bold text-gray-800">₦{serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base border-t border-gray-200 pt-3 mt-1">
                  <span className="font-extrabold text-gray-950">Grand Total</span>
                  <span className="font-black text-[#f05537] text-lg">₦{totalPaid.toLocaleString()}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="mt-12 text-center border-t border-dashed border-gray-200 pt-6">
                <p className="text-xs font-bold text-gray-400 tracking-wider">THANK YOU FOR YOUR PATRONAGE</p>
                <p className="text-[11px] text-gray-400 mt-1">This transaction is secured cryptographically. Access your ticket anytime at swyft.ng/tickets</p>
              </div>

            </div>
          </section>

          {/* RIGHT: Dynamic QR Ticket Passes */}
          <section className="grid gap-6">
            <h3 className="text-lg font-black text-gray-900 px-1">Admission Passes ({tickets.length})</h3>
            
            {tickets.map((t, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6 grid sm:grid-cols-[160px_1fr] gap-6 items-center">
                  
                  {/* Real Dynamic QR Code */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.id}&color=1e0a3c`} 
                      alt={`Ticket QR Code for ${t.id}`}
                      className="w-[140px] h-[140px] object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        // Fallback in case QR generation fails
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <code className="mt-2 text-[10px] font-black text-gray-500 tracking-wide select-all">{t.id}</code>
                  </div>

                  {/* Pass details */}
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          Valid Ticket
                        </span>
                        <span className="text-xs font-bold text-gray-400">#{(idx + 1)} of {tickets.length}</span>
                      </div>
                      <h4 className="text-lg font-black text-[#1e0a3c] mt-2 leading-snug">{t.event}</h4>
                      
                      <div className="mt-3 space-y-1 text-xs font-bold text-gray-500">
                        <div className="flex items-center gap-2">
                          <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span>{t.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span className="truncate max-w-[220px]">{t.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span>{t.attendeeName} • {t.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 text-center py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-lg transition"
                      >
                        Print Pass
                      </button>
                      <button 
                        onClick={() => alert(`Offline download initialized for pass: ${t.id}`)}
                        className="flex-1 text-center py-2 bg-[#1e0a3c] hover:bg-[#110524] text-white text-xs font-bold rounded-lg transition"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}

            <Link 
              href="/events" 
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-700 font-bold py-3 text-sm transition"
            >
              Browse more events
            </Link>
          </section>

        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500 font-bold">Loading secure transaction portal...</div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
