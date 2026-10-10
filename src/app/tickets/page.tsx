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
  const serviceFee = subtotal > 0 ? Math.round(subtotal * 0.04) + 20 : 0;
  const totalPaid = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] py-12 lg:py-20">
      <div className="grix-container max-w-[1280px] mx-auto px-6 grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        
        {/* Left Column: Search Panel */}
        <section>
          <span className="text-xs font-medium uppercase tracking-widest text-[#9ca3af]">
            Track Passes
          </span>
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-[#fafafa] mt-2 mb-4 leading-tight">
            Retrieve your tickets & receipts
          </h1>
          <p className="text-sm font-normal text-[#9ca3af] leading-relaxed max-w-md">
            Search by ticket reference ID, email address, or phone number to access your scannable entry passes and invoices.
          </p>

          <div className="mt-8 rounded-2xl border border-[#374151] bg-[#171717] p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
                Ticket ID, Email, or Phone
              </label>
              <input 
                className="w-full h-12 px-5 rounded-full border border-[#374151] bg-[#0a0a0a] text-sm text-[#fafafa] placeholder-neutral-600 outline-none transition focus:border-[#fafafa]"
                placeholder="SWYFT-TKT-8F41 or you@example.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button 
              onClick={() => handleSearch()}
              className="w-full h-12 rounded-full bg-[#fafafa] text-[#0a0a0a] text-xs font-medium uppercase tracking-wider hover:bg-neutral-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? "Searching..." : "Locate Tickets &rarr;"}
            </button>
          </div>
        </section>

        {/* Right Column: Dynamic Output */}
        <section className="min-h-[400px]">
          {loading ? (
            <div className="rounded-2xl border border-[#374151] bg-[#171717] p-12 flex flex-col items-center justify-center h-full text-center">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-[#374151] border-t-[#fafafa] animate-spin" />
              </div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#9ca3af]">Searching SWYFT database...</p>
            </div>
          ) : hasTickets ? (
            <div className="space-y-8">
              
              {/* Receipt / Invoice Section */}
              <div className="rounded-2xl border border-[#374151] bg-[#171717] overflow-hidden">
                <div className="border-b border-[#374151] p-5 flex justify-between items-center bg-[#0a0a0a]">
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af]">SWYFT OFFICIAL RECEIPT</span>
                    <h3 className="text-sm font-light text-[#fafafa] mt-0.5">Order Invoice Summary</h3>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="text-xs font-medium border border-[#374151] bg-[#171717] hover:bg-[#374151] text-[#fafafa] px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </button>
                </div>

                <div className="p-6 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row justify-between border-b border-[#374151] pb-4 mb-4 gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#9ca3af]">Attendee</p>
                      <p className="font-medium text-[#fafafa] mt-1">{buyer?.attendeeName}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{buyer?.attendeeEmail}</p>
                      <p className="text-xs text-[#9ca3af]">{buyer?.attendeePhone}</p>
                      {buyer?.attendeeMatric && (
                        <p className="text-xs text-[#9ca3af] mt-1">Matric: {buyer.attendeeMatric}</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#9ca3af]">Order Details</p>
                      <p className="font-medium text-[#fafafa] mt-1">
                        Ref: <code className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded text-xs font-mono">{buyer?.reference}</code>
                      </p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{orderDate}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-[#374151] pb-2 text-[10px] font-medium uppercase tracking-wider text-[#9ca3af]">
                      <span>Item & Tier</span>
                      <span className="text-right">Total</span>
                    </div>
                    {tickets.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-[#374151]/50 pb-2.5 text-xs">
                        <div>
                          <p className="font-medium text-[#fafafa]">{t.event}</p>
                          <p className="text-[11px] text-[#9ca3af]">{t.quantity || 1}× {t.type} ticket</p>
                        </div>
                        <span className="font-medium text-[#fafafa]">₦{(t.price * (t.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-2 flex flex-col gap-1.5 max-w-[220px] ml-auto text-xs">
                    <div className="flex justify-between text-[#9ca3af]">
                      <span>Subtotal</span>
                      <span className="text-[#fafafa]">₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#9ca3af]">
                      <span>Service Fee (4% + ₦20)</span>
                      <span className="text-[#fafafa]">₦{serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium border-t border-[#374151] pt-2 mt-1">
                      <span className="text-[#fafafa]">Total Paid</span>
                      <span className="text-[#fafafa]">₦{totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passes Cards */}
              <div className="space-y-4">
                {tickets.map((t, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#374151] bg-[#171717] p-5 flex flex-col sm:flex-row gap-5 items-center">
                    
                    {/* QR code */}
                    <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white shrink-0">
                      <a
                        href={`https://swyft-ticket.name.ng/verify?code=${t.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click or scan to verify ticket"
                        className="transition-transform hover:scale-105"
                      >
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://swyft-ticket.name.ng/verify?code=${t.id}`)}&color=0a0a0a`} 
                          alt="Ticket QR Code"
                          className="w-[110px] h-[110px] object-contain rounded"
                        />
                      </a>
                      <code className="mt-1.5 text-[9px] font-mono font-semibold text-black select-all">{t.id}</code>
                    </div>

                    {/* Details */}
                    <div className="flex-1 w-full flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5">
                            Valid Ticket
                          </span>
                          <span className="text-xs text-[#9ca3af]">Pass {idx + 1} of {tickets.length}</span>
                        </div>
                        
                        <h4 className="mt-2 text-base font-light text-[#fafafa] leading-snug">{t.event}</h4>
                        
                        <div className="mt-2.5 space-y-1 text-xs text-[#9ca3af]">
                          <div className="flex items-center gap-2">
                            <svg className="text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>{t.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span className="truncate max-w-[200px]">{t.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2.5">
                        <button 
                          onClick={() => window.print()}
                          className="flex-1 py-2 rounded-full border border-[#374151] text-xs font-medium text-[#fafafa] hover:bg-[#0a0a0a] transition"
                        >
                          Print Pass
                        </button>
                        <button 
                          onClick={() => alert(`Offline download initialized for pass: ${t.id}`)}
                          className="flex-1 py-2 rounded-full bg-[#fafafa] hover:bg-neutral-200 text-[#0a0a0a] text-xs font-medium transition"
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
            <div className="rounded-2xl border border-[#374151] bg-[#171717] p-10 flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-950/20 flex items-center justify-center mb-4 text-red-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-[#fafafa] mb-1">No Tickets Found</h3>
              <p className="text-xs text-[#9ca3af] max-w-xs leading-relaxed">
                We couldn't find any tickets matching <code className="bg-[#0a0a0a] border border-[#374151] text-[#fafafa] px-1.5 py-0.5 rounded font-mono">{searchQuery}</code>.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#374151] bg-[#171717]/50 p-12 flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-full border border-[#374151] bg-[#171717] flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.75">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-[#fafafa] mb-1">Awaiting Search Query</h3>
              <p className="text-xs text-[#9ca3af] max-w-xs leading-relaxed">
                Enter your booking reference, email, or phone number to retrieve your admission passes and receipts.
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-xs text-[#9ca3af] uppercase tracking-widest animate-pulse">Loading Track Ticket Portal...</div>
      </div>
    }>
      <TrackTicketContent />
    </Suspense>
  );
}
