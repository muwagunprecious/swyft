"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function TrackTicketContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto search if ref parameter exists
  useEffect(() => {
    if (initialRef) {
      setSearchQuery(initialRef);
      handleSearch(initialRef);
    }
  }, [initialRef]);

  const handleSearch = async (queryToUse?: string) => {
    const q = queryToUse || searchQuery;
    if (!q || !q.trim()) {
      alert("Please enter a ticket ID, email, or phone number.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const res = await api.get(`/orders/my-tickets?search=${encodeURIComponent(q.trim())}`);
      setTickets(res.data);
    } catch (err: any) {
      console.error("Error searching tickets:", err);
      setError("Failed to retrieve tickets. Please check your connection and try again.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Receipt calculations if tickets are found
  const hasTickets = tickets.length > 0;
  const buyer = hasTickets ? tickets[0] : null;
  const orderDate = buyer?.createdAt ? new Date(buyer.createdAt).toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : "N/A";
  
  const subtotal = tickets.reduce((acc, t) => acc + (t.price * (t.quantity || 1)), 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const totalPaid = subtotal + serviceFee;

  return (
    <div className="bg-gray-50 py-12 lg:py-20 min-h-screen font-sans text-[#1e0a3c]">
      <div className="wrap grid gap-10 lg:grid-cols-[0.9fr_1.1fr] max-w-[1360px] mx-auto px-6">
        
        {/* Left Column: Search Panel */}
        <section>
          <p className="eyebrow mb-2">Track Ticket</p>
          <h1 className="text-4xl font-black text-gray-950 md:text-5xl tracking-tight leading-tight">
            Retrieve tickets, receipts, and QR passes
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-gray-600">
            Search by ticket ID, email, or phone number. SWYFT helps attendees recover lost tickets quickly.
          </p>

          <div className="card mt-8 grid gap-4 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                Ticket ID, email, or phone
              </span>
              <input 
                className="input h-12 px-4 rounded-xl border border-gray-300 focus:border-orange-500 focus:outline-none text-base font-medium" 
                placeholder="SWYFT-TKT-8F41 or you@student.edu.ng"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </label>
            <button 
              onClick={() => handleSearch()}
              className="btn-primary h-12 rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-white font-bold transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? "Searching..." : "View Ticket"}
            </button>
          </div>
        </section>

        {/* Right Column: Dynamic Output */}
        <section className="min-h-[400px]">
          {loading ? (
            <div className="card bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center h-full shadow-sm">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-[#f05537] animate-spin" />
              </div>
              <p className="text-sm font-bold text-gray-500">Searching SWYFT database...</p>
            </div>
          ) : hasTickets ? (
            <div className="grid gap-6">
              
              {/* Receipt / Invoice Section */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
                <div className="bg-[#1e0a3c] text-white p-5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#f05537]">SWYFT OFFICIAL RECEIPT</span>
                    <h3 className="text-sm font-black mt-0.5">Order Invoice Summary</h3>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="text-xs font-bold border border-white/20 bg-white/10 hover:bg-white/25 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </button>
                </div>

                <div className="p-6 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attendee Info</p>
                      <p className="font-extrabold text-gray-800 mt-1">{buyer?.attendeeName}</p>
                      <p className="text-gray-500 mt-0.5">{buyer?.attendeeEmail}</p>
                      <p className="text-gray-500">{buyer?.attendeePhone}</p>
                      {buyer?.attendeeMatric && (
                        <p className="text-[11px] text-gray-500 mt-1">Matric: {buyer.attendeeMatric}</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Info</p>
                      <p className="font-extrabold text-gray-800 mt-1">Ref: <code className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-xs font-mono">{buyer?.reference}</code></p>
                      <p className="text-gray-500 mt-0.5">{orderDate}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2 font-bold text-gray-400 text-[10px] uppercase">
                      <span>Item</span>
                      <span className="text-right">Total</span>
                    </div>
                    {tickets.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <div>
                          <p className="font-bold text-gray-800">{t.event}</p>
                          <p className="text-[11px] text-gray-500">{t.quantity || 1}x {t.type} ticket</p>
                        </div>
                        <span className="font-extrabold text-gray-800">₦{(t.price * (t.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-2 flex flex-col gap-1.5 max-w-[200px] ml-auto font-bold text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Service Fee (5%)</span>
                      <span>₦{serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-950 border-t border-gray-200 pt-2 mt-1 text-sm font-black">
                      <span>Total Paid</span>
                      <span className="text-[#f05537]">₦{totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passes Cards */}
              <div className="grid gap-4">
                {tickets.map((t, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row gap-5 items-center">
                    
                    {/* Functional QR code image */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.id}&color=1e0a3c`} 
                        alt="Ticket QR Code"
                        className="w-[120px] h-[120px] object-contain rounded-md"
                      />
                      <code className="mt-2 text-[9px] font-black text-gray-500 tracking-wide select-all">{t.id}</code>
                    </div>

                    {/* Details */}
                    <div className="flex-1 w-full flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                            Valid Ticket
                          </span>
                          <span className="text-xs font-bold text-gray-400">Pass {idx + 1} of {tickets.length}</span>
                        </div>
                        <h4 className="mt-2 text-base font-black text-gray-950 leading-snug">{t.event}</h4>
                        
                        <div className="mt-3 space-y-1 text-xs font-bold text-gray-500">
                          <div className="flex items-center gap-2">
                            <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>{t.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span className="truncate max-w-[200px]">{t.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="flex-1 py-1.5 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50"
                        >
                          Print Pass
                        </button>
                        <button 
                          onClick={() => alert(`Offline download initialized for pass: ${t.id}`)}
                          className="flex-1 py-1.5 bg-[#1e0a3c] hover:bg-[#110524] text-white text-xs font-bold rounded-lg transition"
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ) : searched ? (
            <div className="card bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center h-full shadow-sm text-center">
              <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 text-xl font-bold">
                ⚠️
              </div>
              <h3 className="text-lg font-black text-[#1e0a3c] mb-1">No Tickets Found</h3>
              <p className="text-sm font-semibold text-gray-500 max-w-xs leading-relaxed">
                We couldn't find any tickets associated with <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-bold font-mono">{searchQuery}</code>.
              </p>
            </div>
          ) : (
            /* Premium Default State Card */
            <div className="card bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center h-full shadow-sm text-center border-dashed border-gray-300">
              <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#1e0a3c] mb-2">Awaiting Search Query</h3>
              <p className="text-sm font-semibold text-gray-500 max-w-xs leading-relaxed">
                Enter your ticket reference ID, email, or phone number on the left to locate and display your active passes and billing invoice receipt.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default function TrackTicketPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 py-12 min-h-screen flex items-center justify-center">
        <div className="text-gray-500 font-bold animate-pulse">Loading Track Ticket Portal...</div>
      </div>
    }>
      <TrackTicketContent />
    </Suspense>
  );
}
