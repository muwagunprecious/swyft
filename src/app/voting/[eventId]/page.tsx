"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePaystackPayment } from "react-paystack";
import api from "@/lib/api";

const formatNaira = (amount: number) => {
  return "₦" + Math.round(amount).toLocaleString();
};

export default function EventVotingPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showMobileCandidates, setShowMobileCandidates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Voter identification states
  const [voterDetails, setVoterDetails] = useState<{ name: string; email: string } | null>(null);
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [voterNameInput, setVoterNameInput] = useState("");
  const [voterEmailInput, setVoterEmailInput] = useState("");

  // Active target candidate to vote for
  const [pendingVote, setPendingVote] = useState<{ categoryId: string; contestantId: string } | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Simulated Paid Vote Payment flow
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paidVoteQty, setPaidVoteQty] = useState(1);

  // Success toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // Load event info and category voting results
  const fetchVotingData = async () => {
    try {
      const [eventRes, resultsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/votes/results/${eventId}`),
      ]);
      setEvent(eventRes.data);
      const fetchedCats = resultsRes.data || [];
      setCategories(fetchedCats);
      if (fetchedCats.length > 0) {
        setActiveCategoryId((prev) => prev || fetchedCats[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load voting page data:", err);
      setError(err.response?.data?.message || "Voting campaign not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchVotingData();
      
      // Load saved voter from local storage if any
      const savedVoter = localStorage.getItem("swyft_voter");
      if (savedVoter) {
        try {
          setVoterDetails(JSON.parse(savedVoter));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [eventId]);

  // Handle click on Vote button
  const handleVoteClick = (categoryId: string, contestantId: string) => {
    setPendingVote({ categoryId, contestantId });

    if (!voterDetails) {
      // If name/email not set, trigger detail popup form
      setShowVoterModal(true);
    } else {
      // Voter is identified. If event is paid voting, open paid widget. Else cast free vote.
      if (event.isVotingPaid) {
        setShowPaymentModal(true);
      } else {
        castFreeVote(voterDetails.name, voterDetails.email, categoryId, contestantId);
      }
    }
  };

  // Save voter details and proceed
  const handleVoterDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterNameInput.trim() || !voterEmailInput.trim()) {
      triggerToast("Name and email are required to vote.", "error");
      return;
    }

    const voter = { name: voterNameInput.trim(), email: voterEmailInput.trim() };
    setVoterDetails(voter);
    localStorage.setItem("swyft_voter", JSON.stringify(voter));
    setShowVoterModal(false);

    if (pendingVote) {
      if (event.isVotingPaid) {
        setShowPaymentModal(true);
      } else {
        castFreeVote(voter.name, voter.email, pendingVote.categoryId, pendingVote.contestantId);
      }
    }
  };

  // Cast free vote API call
  const castFreeVote = async (name: string, email: string, categoryId: string, contestantId: string) => {
    try {
      setIsSubmittingVote(true);
      const res = await api.post("/votes/cast", {
        categoryId,
        contestantId,
        name,
        email,
      });

      triggerToast(res.data.message || "Vote recorded successfully!", "success");
      fetchVotingData(); // refresh leaderboards
      setPendingVote(null);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || "Failed to record vote.", "error");
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Calculate Split Fees
  const subtotal = (event?.voteCost || 50) * paidVoteQty;
  const fee = Math.round(subtotal * 0.05) + 100;
  const total = subtotal + fee;
  const subaccountCode = event?.organizer?.subaccountCode;

  const config: any = {
    reference: `VOTE-${Date.now()}`,
    email: voterDetails?.email || 'voter@otix.com',
    amount: total * 100, // Paystack expects kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_171204c7a940f7191190fc6bbd8e2e4c20092c00',
  };

  if (subaccountCode) {
    config.subaccount = subaccountCode;
    config.bearer = 'account';
    config.transaction_charge = fee * 100;
  }

  const initializePayment = usePaystackPayment(config);

  // Cast paid vote API call (loops multiple casts for quantity)
  const handleCastPaidVotes = () => {
    if (!pendingVote || !voterDetails) return;
    
    initializePayment({
      onSuccess: async () => {
        try {
          setIsSubmittingVote(true);
          setShowPaymentModal(false);
          
          // We cast multiple votes
          const promises = [];
          for (let i = 0; i < paidVoteQty; i++) {
            promises.push(
              api.post("/votes/cast", {
                categoryId: pendingVote.categoryId,
                contestantId: pendingVote.contestantId,
                name: voterDetails.name,
                email: voterDetails.email,
              })
            );
          }

          await Promise.all(promises);
          triggerToast(`Successfully cast ${paidVoteQty} paid votes!`, "success");
          fetchVotingData();
          setPaidVoteQty(1);
          setPendingVote(null);
        } catch (err: any) {
          triggerToast(err.response?.data?.message || "Paid voting cast failed.", "error");
        } finally {
          setIsSubmittingVote(false);
        }
      },
      onClose: () => {
        triggerToast("Payment cancelled.", "error");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9fc] flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f05537]/20 border-t-[#f05537]" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Opening voting lobby...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#faf9fc] flex items-center justify-center text-center p-6">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">🗳️</span>
          <h2 className="text-xl font-black text-gray-900">Campaign Not Found</h2>
          <p className="text-sm font-semibold text-gray-500">{error}</p>
          <Link href="/events" className="inline-block rounded-xl bg-[#f05537] hover:bg-[#d1410c] px-6 py-3 text-xs font-bold text-white no-underline transition shadow">
            Return to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9fc] text-[#1e0a3c] pb-24 relative overflow-hidden">
      
      {/* Glow blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-100/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-purple-100/30 blur-[150px] pointer-events-none" />

      {/* FLOATING TOAST FEEDBACK */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-gray-150 bg-white px-5 py-4 shadow-2xl animate-slideLeft">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-650"}`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-black text-gray-800">{toast.message}</p>
        </div>
      )}

      {/* VOTER INFORMATION MODAL FORM */}
      {showVoterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-gray-100 p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-3xl">🗳️</span>
              <h3 className="text-lg font-black text-gray-900">Enter Voter Details</h3>
              <p className="text-xs font-semibold text-gray-400">
                Provide your details to cast votes. Emails are verified against duplicate voting in free campaigns.
              </p>
            </div>
            
            <form onSubmit={handleVoterDetailsSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase text-gray-400">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Precious Ademuwagun"
                  value={voterNameInput}
                  onChange={(e) => setVoterNameInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 focus:border-[#f05537] px-4 py-3 text-xs font-semibold text-gray-800 outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase text-gray-400">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ademuwagun@gmail.com"
                  value={voterEmailInput}
                  onChange={(e) => setVoterEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 focus:border-[#f05537] px-4 py-3 text-xs font-semibold text-gray-800 outline-none transition"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingVote}
                className="w-full h-11 rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-xs font-black uppercase text-white transition shadow disabled:opacity-50"
              >
                Save & Continue
              </button>
              <button
                type="button"
                onClick={() => { setShowVoterModal(false); setPendingVote(null); }}
                className="w-full text-center text-[10px] font-bold text-gray-405 hover:underline mt-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATED PAID VOTE CHECKOUT WIDGET */}
      {showPaymentModal && pendingVote && voterDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-gray-100 p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-3xl">💳</span>
              <h3 className="text-lg font-black text-gray-900">Cast Paid Votes</h3>
              <p className="text-xs font-semibold text-gray-400">
                This campaign requires paid verification. Cast counts are unlimited for paid votes.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-3 font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Voter Name</span>
                <span className="font-bold text-slate-800">{voterDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Voter Email</span>
                <span className="font-bold text-slate-800">{voterDetails.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost Per Vote</span>
                <span className="font-bold text-slate-800">{formatNaira(event.voteCost || 50)}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between border-t border-b border-gray-100 py-3">
              <span className="text-xs font-black uppercase text-gray-400">Vote Quantity</span>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPaidVoteQty(Math.max(1, paidVoteQty - 1))}
                  disabled={paidVoteQty <= 1}
                  className="h-7 w-7 rounded border border-gray-200 bg-white text-xs font-bold text-gray-500"
                >
                  -
                </button>
                <span className="min-w-[20px] text-center text-xs font-black text-gray-800">{paidVoteQty}</span>
                <button
                  onClick={() => setPaidVoteQty(paidVoteQty + 1)}
                  className="h-7 w-7 rounded border border-gray-200 bg-white text-xs font-bold text-gray-500"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total price calculation */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Subtotal</span>
                <span>{formatNaira((event.voteCost || 50) * paidVoteQty)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Service Fee</span>
                <span>{formatNaira(Math.round(((event.voteCost || 50) * paidVoteQty) * 0.05) + 100)}</span>
              </div>
              <div className="flex items-center justify-between font-black text-gray-900 text-sm border-t border-gray-100 pt-2">
                <span>Grand Total</span>
                <span className="text-[#f05537]">
                  {formatNaira(((event.voteCost || 50) * paidVoteQty) + Math.round(((event.voteCost || 50) * paidVoteQty) * 0.05) + 100)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCastPaidVotes}
                disabled={isSubmittingVote}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black uppercase text-slate-950 transition shadow-md shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
              >
                Pay & Cast {paidVoteQty} Vote{paidVoteQty > 1 ? "s" : ""}
              </button>
              <button
                type="button"
                onClick={() => { setShowPaymentModal(false); setPendingVote(null); }}
                className="w-full text-center text-[10px] font-bold text-gray-400 hover:underline pt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUNNING FLOATING BANNER HEADER */}
      <section className="relative min-h-[380px] w-full bg-slate-950 border-b border-slate-900 select-none flex items-end pb-10">
        <img 
          src={event.bannerImage || '/images/party.png'} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-45 blur-sm" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf9fc] via-slate-950/60 to-transparent" />
        
        {/* Banner metadata details */}
        <div className="relative z-10 w-full">
          <div className="mx-auto max-w-[1200px] px-6 flex flex-col md:flex-row items-center gap-6">
            
            {/* Clear Event Poster Thumbnail */}
            <img 
              src={event.bannerImage || '/images/party.png'} 
              alt={event.title}
              className="w-36 h-36 md:w-44 md:h-44 object-cover rounded-2xl border border-white/20 shadow-2xl shrink-0 bg-slate-900"
            />

            <div className="space-y-4 flex-1 text-center md:text-left">
              <Link href={`/events/${event.id}`} className="inline-flex items-center gap-2 text-xs font-black text-white bg-white/10 backdrop-blur-md hover:bg-white/20 px-4 py-2 rounded-full no-underline transition border border-white/5 shadow-sm">
                ← Event Lobby
              </Link>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border ${event.isVotingEnabled ? 'text-[#f05537] bg-[#f05537]/10 border-[#f05537]/20' : 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {event.isVotingEnabled ? "🗳️ LIVE ELECTION" : "🔒 CAMPAIGN CLOSED"}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {event.isVotingPaid ? `Paid Voting (${formatNaira(event.voteCost || 50)}/vote)` : "Free Campus Election"}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{event.title}</h1>
              <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                {event.location} • {new Date(event.date).toLocaleDateString()}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* LEADERBOARDS & VOTING CARDS GRID */}
      <section className="mx-auto max-w-[1200px] px-6 mt-12 grid gap-10 lg:grid-cols-3 items-start">
        
        {/* Left Column: Categories List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Category Selection boxes */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-400">Select Voting Section</h3>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {categories.map((category) => {
                  const categoryTotal = (category.contestants || []).reduce(
                    (sum: number, c: any) => sum + (c.totalVotesCount || 0),
                    0
                  );
                  const isActive = category.id === activeCategoryId;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategoryId(category.id);
                        setShowMobileCandidates(true);
                      }}
                      className={`text-left p-6 rounded-[24px] border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden group select-none ${
                        isActive
                          ? "bg-[#1e0a3c] border-transparent shadow-[0_8px_30px_rgba(30,10,60,0.15)] scale-[1.02] text-white"
                          : "bg-white border-gray-150 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-gray-350 hover:scale-[1.01] text-[#1e0a3c]"
                      }`}
                    >
                      {/* Category Icon Ball */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        isActive ? "bg-white/10 text-orange-400" : "bg-orange-50 text-[#f05537]"
                      }`}>
                        <span className="text-xl">🗳️</span>
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h4 className="text-sm font-black truncate">{category.name}</h4>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          isActive ? "text-slate-400" : "text-gray-400"
                        }`}>
                          {(category.contestants || []).length} Candidates • {categoryTotal.toLocaleString()} Votes
                        </p>
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                          isActive ? "text-[#f05537]" : "text-[#1565ff] group-hover:underline"
                        }`}>
                          {isActive ? "Active Section • Selected" : "Click to view candidates →"}
                        </span>
                      </div>

                      {/* Active focus indicator dot */}
                      {isActive && (
                        <span className="absolute right-4 top-4 w-2 h-2 rounded-full bg-[#f05537]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 bg-white text-xs font-semibold text-gray-400 space-y-2">
                <span>🗳️</span>
                <p>No voting categories created for this campaign.</p>
              </div>
            )}
          </div>

          {/* Active Category Candidates Dashboard */}
          {activeCategoryId && (
            <>
              {/* Mobile overlay backdrop */}
              {showMobileCandidates && (
                <div 
                  className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" 
                  onClick={() => setShowMobileCandidates(false)} 
                />
              )}
              
              <div className={`
                ${showMobileCandidates ? 'fixed inset-x-0 bottom-0 z-[70] h-[85vh] overflow-y-auto bg-[#faf9fc] rounded-t-[32px] p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-full duration-300 lg:static lg:h-auto lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none lg:rounded-none lg:mt-8' : 'hidden lg:block lg:static lg:mt-8 lg:animate-in lg:fade-in lg:slide-in-from-bottom-4'}
              `}>
                {/* Mobile close handle */}
                <div className="lg:hidden flex items-center justify-center mb-6 sticky -top-5 bg-[#faf9fc] z-20 -mx-5 px-5 py-4 border-b border-gray-150">
                  <div className="absolute top-2 w-12 h-1.5 rounded-full bg-gray-300" />
                  <h3 className="text-base font-black text-gray-900 mt-2 truncate max-w-[70%] text-center">
                    {categories.find(c => c.id === activeCategoryId)?.name}
                  </h3>
                  <button onClick={() => setShowMobileCandidates(false)} className="absolute right-5 top-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm text-xs">✕</button>
                </div>

              {(() => {
                const activeCategory = categories.find((c) => c.id === activeCategoryId);
                if (!activeCategory) return null;

                const categoryTotal = (activeCategory.contestants || []).reduce(
                  (sum: number, c: any) => sum + (c.totalVotesCount || 0),
                  0
                );

                return (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
                    {/* Category Title Header */}
                    <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#f05537] bg-[#f05537]/10 px-2.5 py-1 rounded">
                          Live Standings Leaderboard
                        </span>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight mt-2">{activeCategory.name}</h2>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Votes Cast</p>
                        <p className="font-mono text-sm font-black text-slate-800 mt-0.5">{categoryTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Contestants Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(activeCategory.contestants || []).map((contestant: any, idx: number) => {
                        const votesPct = categoryTotal > 0 ? Math.round((contestant.totalVotesCount / categoryTotal) * 100) : 0;
                        
                        // Parse details JSON string
                        let nickname = "";
                        let department = "";
                        let faculty = "";
                        let level = "";
                        let bio = "";
                        let instagram = "";
                        try {
                          const details = JSON.parse(contestant.details || "{}");
                          nickname = details.nickname || "";
                          department = details.department || "";
                          faculty = details.faculty || "";
                          level = details.level || "";
                          bio = details.bio || "";
                          instagram = details.instagram || "";
                        } catch (e) {}

                        return (
                          <div key={contestant.id} className="bg-white rounded-[24px] border border-gray-150 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col group relative transition-all duration-300 hover:shadow-[0_12px_40px_rgb(240,85,55,0.08)] hover:-translate-y-1 hover:border-orange-200/50">
                            
                            {/* Image Container with Absolute Badges */}
                            <div className="relative h-60 bg-gradient-to-br from-slate-50 to-slate-100 w-full overflow-hidden shrink-0">
                              <img 
                                src={contestant.image || "/images/party.png"} 
                                alt={contestant.name} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              />
                              {/* Dark Gradient overlay */}
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                              
                              {/* Rank Badge */}
                              <div className="absolute top-4 left-4 bg-[#f05537] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1">
                                <span>👑</span> Rank #{idx + 1}
                              </div>
                              
                              {/* Category Standing Pct overlay at bottom-right */}
                              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm">
                                {votesPct}% of Votes
                              </div>
                            </div>

                            {/* Details Body */}
                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-3">
                                {/* Name & Stage Nickname */}
                                <div>
                                  <h3 className="text-sm font-black text-gray-900 leading-snug group-hover:text-[#f05537] transition-colors">
                                    {contestant.name}
                                    {nickname && (
                                      <span className="text-[#f05537] font-extrabold text-xs ml-1.5 italic">
                                        "{nickname}"
                                      </span>
                                    )}
                                  </h3>
                                  {/* Meta Badges */}
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {department && (
                                      <span className="text-[8px] font-black text-slate-550 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-wider">
                                        {department}
                                      </span>
                                    )}
                                    {faculty && (
                                      <span className="text-[8px] font-black text-slate-550 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-wider">
                                        {faculty}
                                      </span>
                                    )}
                                    {level && (
                                      <span className="text-[8px] font-black text-slate-550 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-wider">
                                        {level}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Bio/Manifesto Box */}
                                {bio && (
                                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed bg-slate-50/80 border border-slate-100 p-3 rounded-xl min-h-[50px] line-clamp-3 hover:line-clamp-none transition-all duration-300">
                                    "{bio}"
                                  </p>
                                )}

                                {/* Instagram Handle */}
                                {instagram && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-pink-600 hover:text-pink-700">
                                    <span>📷</span>
                                    <a 
                                      href={`https://instagram.com/${instagram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="no-underline hover:underline"
                                    >
                                      @{instagram.replace('@', '')}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Standing Percentage Indicator & Vote button */}
                              <div className="space-y-4 pt-3 border-t border-gray-150">
                                {/* Visual Standing Bar */}
                                <div className="space-y-1">
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-indigo-550 transition-all duration-500" style={{ width: `${votesPct}%` }} />
                                  </div>
                                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-400">
                                    <span>{contestant.totalVotesCount.toLocaleString()} votes cast</span>
                                    <span>{votesPct}% standing</span>
                                  </div>
                                </div>

                                {/* Vote button */}
                                <button
                                  onClick={() => {
                                    if (event.isVotingEnabled) {
                                      handleVoteClick(activeCategory.id, contestant.id);
                                    }
                                  }}
                                  disabled={!event.isVotingEnabled}
                                  className={`w-full h-10 rounded-xl text-xs font-black uppercase text-white transition-all shadow flex items-center justify-center gap-1.5 ${event.isVotingEnabled ? 'bg-[#1e0a3c] hover:bg-[#2c1056] active:scale-95' : 'bg-gray-400 cursor-not-allowed opacity-60'}`}
                                >
                                  {event.isVotingEnabled ? "🗳️ Cast Vote" : "🚫 Voting Closed"}
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            </>
          )}
        </div>

        {/* Right Column: Information & Voter Identification Details */}
        <aside className="space-y-6">
          
          {/* Voter Card Widget */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Voter Profile</h3>
            
            {voterDetails ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600">
                  <p className="text-[10px] font-black uppercase text-gray-400">Identified Voter</p>
                  <p className="font-black text-slate-800 text-sm mt-1">{voterDetails.name}</p>
                  <p className="text-slate-500 mt-0.5">{voterDetails.email}</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("swyft_voter");
                    setVoterDetails(null);
                    setVoterNameInput("");
                    setVoterEmailInput("");
                  }}
                  className="w-full text-center py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition"
                >
                  Clear Identification
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-medium leading-relaxed text-gray-500">
                  Enter your details to identify yourself before casting votes. Free votes are restricted to 1 vote per category.
                </p>
                <button
                  onClick={() => setShowVoterModal(true)}
                  className="w-full h-10 rounded-xl border border-[#1e0a3c] text-xs font-black uppercase text-[#1e0a3c] hover:bg-[#1e0a3c] hover:text-white transition"
                >
                  Identify Voter
                </button>
              </div>
            )}
          </div>

          {/* Voting Rules Panel */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Official Rules</h3>
            <div className="space-y-2 text-xs font-semibold text-gray-650">
              {[
                { title: "Authentication Check", desc: "No signup required, voters are validated via their unique email addresses." },
                { title: "Free Vote Quota", desc: "For free voting campaigns, only 1 vote can be cast per email in each category." },
                { title: "Paid Vote Quota", desc: "For paid voting campaigns, voters can buy and cast countless votes to support candidates." },
                { title: "Live Leaderboard", desc: "Standings and standings standings percentage calculate in real-time on vote cast." },
              ].map((rule, idx) => (
                <div key={idx} className="py-2.5 border-b border-gray-100 last:border-0">
                  <p className="font-black text-gray-900">{rule.title}</p>
                  <p className="text-[11px] font-medium leading-relaxed text-gray-400 mt-0.5">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </section>

    </div>
  );
}
