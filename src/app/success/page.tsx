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
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex flex-col items-center justify-center py-20 px-6">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#374151] border-t-[#fafafa] animate-spin" />
            <div className="absolute inset-2 rounded-full bg-[#171717] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#fafafa]">
                <path
                  d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-light text-[#fafafa] mb-2">Generating Receipt...</h2>
          <p className="text-xs text-[#9ca3af]">Securing ticket passes and generating invoice details.</p>
        </div>
      </div>
    );
  }

  if (error || tickets.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex flex-col items-center justify-center py-20 px-6">
        <div className="rounded-2xl border border-[#374151] bg-[#171717] p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-950/20 flex items-center justify-center mx-auto mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[#fafafa] mb-2">No Receipt Found</h2>
          <p className="text-xs text-[#9ca3af] mb-8">{error || "Could not retrieve any order data for the provided reference."}</p>
          <div className="space-y-3">
            <Link 
              href="/tickets" 
              className="inline-flex w-full items-center justify-center rounded-full bg-[#fafafa] py-3 text-xs font-medium uppercase tracking-wider text-[#0a0a0a] hover:bg-neutral-200 transition"
            >
              Track Ticket Manually
            </Link>
            <Link 
              href="/events" 
              className="inline-flex w-full items-center justify-center rounded-full border border-[#374151] bg-[#0a0a0a] py-3 text-xs font-medium uppercase tracking-wider text-[#fafafa] hover:bg-[#171717] transition"
            >
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
  const serviceFee = subtotal > 0 ? Math.round(subtotal * 0.04) + 20 : 0;
  const totalPaid = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] py-12 lg:py-20">
      <div className="grix-container max-w-[1080px] px-6 mx-auto">
        
        {/* Success Banner */}
        <div className="text-center mb-14">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-[#fafafa]">
            Order Confirmed
          </h1>
          <p className="mt-3 text-sm text-[#9ca3af] max-w-md mx-auto">
            You're all set. Your digital ticket passes and official transaction invoice are ready below.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] items-start">
          
          {/* LEFT: Minimal Editorial Invoice Receipt */}
          <section className="rounded-2xl border border-[#374151] bg-[#171717] overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
            <div className="border-b border-[#374151] p-6 flex justify-between items-center bg-[#0a0a0a]">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af]">SWYFT OFFICIAL INVOICE</span>
                <h2 className="text-base font-light text-[#fafafa] mt-0.5">Transaction Receipt</h2>
              </div>
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 text-xs font-medium bg-[#171717] hover:bg-[#374151] border border-[#374151] text-[#fafafa] rounded-full px-4 py-2 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Receipt
              </button>
            </div>

            <div className="p-8">
              {/* Receipt Header details */}
              <div className="flex flex-col sm:flex-row justify-between border-b border-[#374151] pb-6 mb-6 gap-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af]">Billed To</p>
                  <p className="text-sm font-medium text-[#fafafa] mt-2">{buyer.attendeeName}</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">{buyer.attendeeEmail}</p>
                  <p className="text-xs text-[#9ca3af]">{buyer.attendeePhone}</p>
                  {buyer.attendeeMatric && (
                    <p className="text-xs text-[#9ca3af] mt-1">Matric: {buyer.attendeeMatric}</p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af]">Invoice Details</p>
                  <p className="text-sm font-medium text-[#fafafa] mt-2">
                    Ref: <code className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded text-xs font-mono">{buyer.reference}</code>
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-1">{orderDate}</p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Paid via Paystack
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#374151] text-[#9ca3af] uppercase tracking-wider">
                      <th className="pb-3 font-medium">Item & Tier</th>
                      <th className="pb-3 font-medium text-center w-16">Qty</th>
                      <th className="pb-3 font-medium text-right w-24">Price</th>
                      <th className="pb-3 font-medium text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, idx) => (
                      <tr key={idx} className="border-b border-[#374151]/50 text-sm">
                        <td className="py-4">
                          <p className="font-medium text-[#fafafa]">{t.event}</p>
                          <p className="text-xs text-[#9ca3af] mt-0.5">{t.type} Pass</p>
                        </td>
                        <td className="py-4 text-center text-[#9ca3af]">{t.quantity || 1}</td>
                        <td className="py-4 text-right text-[#9ca3af]">₦{t.price.toLocaleString()}</td>
                        <td className="py-4 text-right font-medium text-[#fafafa]">₦{(t.price * (t.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="mt-6 border-t border-[#374151] pt-4 flex flex-col gap-2 max-w-xs ml-auto text-xs">
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Subtotal</span>
                  <span className="font-medium text-[#fafafa]">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Service Fee (4% + ₦20)</span>
                  <span className="font-medium text-[#fafafa]">₦{serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-[#374151] pt-3 mt-1">
                  <span className="font-medium text-[#fafafa]">Grand Total</span>
                  <span className="text-lg font-light tracking-tight text-[#fafafa]">₦{totalPaid.toLocaleString()}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="mt-12 text-center border-t border-dashed border-[#374151] pt-6">
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#9ca3af]">THANK YOU FOR YOUR PATRONAGE</p>
                <p className="text-[11px] text-[#6b7280] mt-1">Secured cryptographically. Access your tickets anytime at swyft.ng/tickets</p>
              </div>

            </div>
          </section>

          {/* RIGHT: Dynamic QR Ticket Passes */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-light text-[#fafafa]">Admission Passes ({tickets.length})</h3>
              <span className="text-xs text-[#9ca3af]">Present at gate for admission</span>
            </div>
            
            {tickets.map((t, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-[#374151] bg-[#171717] p-6 hover:border-[#fafafa]/40 transition"
              >
                <div className="grid sm:grid-cols-[140px_1fr] gap-6 items-center">
                  
                  {/* Clean Dynamic QR Code */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shrink-0">
                    <a
                      href={`https://swyft-ticket.name.ng/verify?code=${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Click or scan to verify ticket"
                      className="transition-transform hover:scale-105"
                    >
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://swyft-ticket.name.ng/verify?code=${t.id}`)}&color=0a0a0a`} 
                        alt={`Ticket QR Code for ${t.id}`}
                        className="w-[120px] h-[120px] object-contain rounded"
                      />
                    </a>
                    <code className="mt-2 text-[10px] font-mono text-black font-semibold select-all">{t.id}</code>
                  </div>

                  {/* Pass details */}
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5">
                          Valid Ticket
                        </span>
                        <span className="text-xs text-[#9ca3af]">Pass {idx + 1} of {tickets.length}</span>
                      </div>
                      
                      <h4 className="text-lg font-light text-[#fafafa] mt-2.5 leading-snug">{t.event}</h4>
                      
                      <div className="mt-3 space-y-1.5 text-xs text-[#9ca3af]">
                        <div className="flex items-center gap-2">
                          <svg className="text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span>{t.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span className="truncate max-w-[200px]">{t.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span>{t.attendeeName} • {t.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2.5">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 py-2.5 rounded-full border border-[#374151] hover:bg-[#0a0a0a] text-xs font-medium text-[#fafafa] transition"
                      >
                        Print Pass
                      </button>
                      <button 
                        onClick={() => alert(`Offline download initialized for pass: ${t.id}`)}
                        className="flex-1 py-2.5 rounded-full bg-[#fafafa] hover:bg-neutral-200 text-[#0a0a0a] text-xs font-medium transition"
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
              className="mt-6 flex items-center justify-center rounded-full border border-[#374151] bg-[#171717] hover:bg-[#0a0a0a] text-xs font-medium uppercase tracking-wider text-[#fafafa] py-3.5 transition"
            >
              Browse More Events &rarr;
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
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex items-center justify-center py-20">
        <div className="text-xs text-[#9ca3af] uppercase tracking-widest animate-pulse">Loading transaction receipt...</div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
