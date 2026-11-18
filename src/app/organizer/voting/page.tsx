'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const formatNaira = (amount: number) => {
  return "₦" + Math.round(amount).toLocaleString();
};

export default function VotingEngine() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingVoting, setLoadingVoting] = useState(false);

  // Voting settings state
  const [isVotingEnabled, setIsVotingEnabled] = useState(false);
  const [isVotingPaid, setIsVotingPaid] = useState(false);
  const [voteCost, setVoteCost] = useState(100);
  const [isSaving, setIsSaving] = useState(false);

  // Categories & contestants
  const [categories, setCategories] = useState<any[]>([]);
  const [customTweakCounts, setCustomTweakCounts] = useState<Record<string, string>>({});

  // UI Flow States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Simple Pop-up Modal States
  const [isContestantModalOpen, setIsContestantModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCreatingInlineCategory, setIsCreatingInlineCategory] = useState(false);

  // Contestant Form State
  const [contestantName, setContestantName] = useState('');
  const [contestantCategory, setContestantCategory] = useState('');
  const [contestantNote, setContestantNote] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSavingContestant, setIsSavingContestant] = useState(false);
  const [contestantError, setContestantError] = useState('');

  // Category Form State
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Toast feedback state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const publicVotingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/voting/${selectedEvent?.slug || selectedEvent?.id || selectedEventId}`
    : `https://swyft-ticket.name.ng/voting/${selectedEvent?.slug || selectedEvent?.id || selectedEventId}`;

  const handleCopyLink = () => {
    if (!publicVotingUrl) return;
    navigator.clipboard.writeText(publicVotingUrl);
    setCopied(true);
    triggerToast("Voting link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Vote for your favorite candidate in ${selectedEvent?.title || 'this event'}! Cast your vote here: ${publicVotingUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `Vote for your favorite candidate in ${selectedEvent?.title || 'this event'}! ${publicVotingUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Fetch organizer events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/organizer/events');
        setEvents(res.data || []);
        if (res.data?.length > 0) {
          setSelectedEventId(res.data[0].id);
          setIsVotingEnabled(res.data[0].isVotingEnabled || false);
          setIsVotingPaid(res.data[0].isVotingPaid || false);
          setVoteCost(res.data[0].voteCost || 100);
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch voting results
  const fetchVotingResults = async () => {
    if (!selectedEventId) return;
    setLoadingVoting(true);
    try {
      const res = await api.get(`/votes/results/${selectedEventId}`);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch voting results', err);
    } finally {
      setLoadingVoting(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find(e => e.id === selectedEventId);
      if (ev) {
        setIsVotingEnabled(ev.isVotingEnabled || false);
        setIsVotingPaid(ev.isVotingPaid || false);
        setVoteCost(ev.voteCost || 100);
      }
      fetchVotingResults();
    }
  }, [selectedEventId, events]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Voting Rules & Pricing
  const handleSaveSettings = async () => {
    if (!selectedEventId) return;
    setIsSaving(true);
    try {
      await api.put(`/organizer/events/${selectedEventId}/voting-settings`, {
        isVotingEnabled,
        isVotingPaid,
        voteCost: Number(voteCost)
      });
      setEvents(prev => prev.map(e => e.id === selectedEventId ? {
        ...e, isVotingEnabled, isVotingPaid, voteCost: Number(voteCost)
      } : e));
      triggerToast("Voting settings saved successfully!", "success");
      fetchVotingResults();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to save settings', "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContestantError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setContestantError('Image is too large. Please choose a photo under 5MB.');
        return;
      }
      setImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Contestant
  const handleSaveContestant = async (e: React.FormEvent) => {
    e.preventDefault();
    setContestantError('');
    if (!selectedEventId) return;

    if (!contestantName.trim()) {
      setContestantError('Please enter the contestant\'s name.');
      return;
    }

    if (!contestantCategory.trim()) {
      setContestantError('Please choose or enter a category.');
      return;
    }

    setIsSavingContestant(true);
    try {
      await api.post('/organizer/contestants', {
        name: contestantName.trim(),
        category: contestantCategory.trim(),
        department: contestantNote.trim() || undefined,
        eventId: selectedEventId,
        image: imageBase64 || '/images/party.png',
      });

      triggerToast(`Contestant "${contestantName}" added successfully!`, "success");
      setContestantName('');
      setContestantCategory('');
      setContestantNote('');
      setImagePreview(null);
      setImageBase64(null);
      setIsContestantModalOpen(false);
      setIsCreatingInlineCategory(false);
      fetchVotingResults();
    } catch (err: any) {
      setContestantError(err.response?.data?.message || 'Failed to add contestant. Try again.');
    } finally {
      setIsSavingContestant(false);
    }
  };

  // Open Contestant Modal with optional pre-filled category
  const openAddContestantModal = (presetCategory?: string) => {
    setContestantError('');
    setContestantName('');
    setContestantNote('');
    setImagePreview(null);
    setImageBase64(null);
    if (presetCategory) {
      setContestantCategory(presetCategory);
      setIsCreatingInlineCategory(false);
    } else if (categories.length > 0) {
      setContestantCategory(categories[0].name);
      setIsCreatingInlineCategory(false);
    } else {
      setContestantCategory('');
      setIsCreatingInlineCategory(true);
    }
    setIsContestantModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    if (!selectedEventId) return;

    if (!categoryNameInput.trim()) {
      setCategoryError('Category name is required.');
      return;
    }

    setIsSavingCategory(true);
    try {
      await api.post('/organizer/categories', {
        eventId: selectedEventId,
        name: categoryNameInput.trim()
      });
      triggerToast(`Category "${categoryNameInput}" created successfully!`, "success");
      setCategoryNameInput('');
      setIsCategoryModalOpen(false);
      fetchVotingResults();
    } catch (err: any) {
      setCategoryError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"? All its contestants will be removed.`)) return;
    try {
      await api.delete(`/organizer/categories/${categoryId}`);
      triggerToast(`Category "${categoryName}" deleted.`, "success");
      fetchVotingResults();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to delete category.', "error");
    }
  };

  // Delete Contestant
  const handleDeleteContestant = async (contestantId: string, name: string) => {
    if (!window.confirm(`Remove contestant "${name}"?`)) return;
    try {
      await api.delete(`/organizer/contestants/${contestantId}`);
      triggerToast(`Contestant "${name}" removed.`, "success");
      fetchVotingResults();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to remove contestant.', "error");
    }
  };

  // Tweak votes
  const handleTweakVotesCast = async (contestantId: string, categoryId: string, amount: number) => {
    try {
      await api.post(`/votes/tweak/${contestantId}`, {
        categoryId,
        tweakCount: amount
      });
      triggerToast(`Updated votes by ${amount > 0 ? '+' : ''}${amount}`, "success");
      fetchVotingResults();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to adjust votes.', "error");
    }
  };

  const totalVotesCast = categories.reduce(
    (sum, cat) => sum + (cat.contestants || []).reduce((s: number, c: any) => s + (c.totalVotesCount || 0), 0), 
    0
  );

  const activeContestantsCount = categories.reduce(
    (sum, cat) => sum + (cat.contestants || []).length, 
    0
  );

  return (
    <div className="space-y-6 pt-2 pb-16 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[120] flex items-center gap-3 rounded-2xl border border-[#333333] bg-[#121212]/95 backdrop-blur-md px-5 py-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            toast.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
          }`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-semibold text-[#fafafa]">{toast.message}</p>
        </div>
      )}

      {/* ── TOP HEADER & CAMPAIGN SELECTOR ───────────────────────────── */}
      <div className="bg-[#121212] p-5 sm:p-7 rounded-3xl border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#2e2e2e] text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
            🗳️ Voting Section
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fafafa] tracking-tight">
            Event Voting & Contests
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Create categories, upload contestants with photos, set vote prices, and share your link.
          </p>
        </div>

        {/* Event Dropdown */}
        <div className="w-full sm:w-72 relative" ref={dropdownRef}>
          <label className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider mb-1 block">
            Select Event
          </label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 bg-[#18181b] hover:bg-[#202023] border border-[#2e2e2e] rounded-2xl text-xs font-bold text-[#fafafa] outline-none flex items-center justify-between transition cursor-pointer"
          >
            <span className="truncate">
              {selectedEvent ? selectedEvent.title : 'Loading events...'}
            </span>
            <span className="text-[#71717a] text-xs ml-2">▼</span>
          </button>

          {isDropdownOpen && events.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden z-50 py-1 divide-y divide-[#27272a]">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-xs font-semibold transition hover:bg-[#27272a] flex items-center gap-3 ${
                    e.id === selectedEventId ? "bg-emerald-500/10 text-emerald-400" : "text-[#d4d4d8]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{e.title}</p>
                    <p className="text-[10px] text-[#71717a] truncate">{e.location}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#a1a1aa]">Loading voting details...</span>
        </div>
      ) : selectedEvent ? (
        <>
          {/* ── 1. PROMINENT SHAREABLE VOTING LINK CARD ──────────────── */}
          <div className="bg-gradient-to-br from-[#14231a] via-[#121212] to-[#121212] p-6 sm:p-7 rounded-3xl border border-emerald-600/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-0.5 rounded-full">
                    {isVotingEnabled ? '● Live Voting Active' : '○ Voting Paused'}
                  </span>
                  <span className="text-xs font-semibold text-[#a1a1aa]">
                    • {isVotingPaid ? `₦${voteCost.toLocaleString()} per vote` : 'Free Voting'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-[#fafafa] tracking-tight">
                  Public Voting Link for Voters
                </h2>
                <p className="text-xs text-[#a1a1aa] max-w-xl leading-relaxed">
                  Share this link directly on WhatsApp, Instagram, or social media. Anyone who clicks can see all candidates and vote immediately.
                </p>

                {/* Direct Link Box */}
                <div className="flex items-center gap-2 p-2.5 bg-[#09090b] border border-[#27272a] rounded-2xl text-xs font-mono text-emerald-400 max-w-xl overflow-hidden">
                  <span className="text-base ml-1">🔗</span>
                  <span className="truncate select-all flex-1 text-[11px] sm:text-xs">{publicVotingUrl}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={handleCopyLink}
                  className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                    copied
                      ? 'bg-emerald-400 text-[#09090b]'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-[#09090b] active:scale-95'
                  }`}
                >
                  <span className="text-sm">{copied ? '✓' : '📋'}</span>
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Voting Link'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-xs font-extrabold text-[#25D366] transition flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="text-sm">💬</span>
                  <span>WhatsApp</span>
                </button>

                <a
                  href={publicVotingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-2xl bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-xs font-extrabold text-[#fafafa] transition flex items-center gap-1.5 active:scale-95"
                >
                  <span>Preview Page</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── 2. SIMPLE RULES & PRICING SETUP ───────────────────────── */}
          <div className="bg-[#121212] p-6 rounded-3xl border border-[#262626] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#fafafa]">Voting Rules & Price Per Vote</h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">Choose whether voters pay to vote and how much each vote costs</p>
              </div>

              {/* Voting Active Toggle */}
              <button
                type="button"
                onClick={() => setIsVotingEnabled(!isVotingEnabled)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isVotingEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                }`}
              >
                <span>{isVotingEnabled ? '● Voting is OPEN' : '○ Voting is CLOSED'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Free vs Paid Toggle */}
              <div>
                <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">
                  Voting Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#18181b] border border-[#27272a] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsVotingPaid(false)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      !isVotingPaid
                        ? 'bg-[#27272a] text-white shadow-sm'
                        : 'text-[#71717a] hover:text-[#fafafa]'
                    }`}
                  >
                    <span>🟢</span> Free Voting
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVotingPaid(true)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isVotingPaid
                        ? 'bg-emerald-500 text-[#09090b] shadow-sm'
                        : 'text-[#71717a] hover:text-[#fafafa]'
                    }`}
                  >
                    <span>💰</span> Paid Voting
                  </button>
                </div>
              </div>

              {/* Amount Per Vote */}
              <div>
                <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">
                  Amount To Pay Per Vote (₦)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#71717a]">₦</span>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={voteCost}
                      disabled={!isVotingPaid}
                      onChange={(e) => setVoteCost(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#18181b] border border-[#2e2e2e] rounded-2xl text-sm font-bold text-[#fafafa] outline-none focus:border-emerald-500 transition disabled:opacity-40"
                    />
                  </div>

                  {/* Preset Pills */}
                  {isVotingPaid && (
                    <div className="flex items-center gap-1.5">
                      {[50, 100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setVoteCost(amt)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            voteCost === amt
                              ? 'bg-emerald-500 text-[#09090b] border-emerald-500'
                              : 'bg-[#18181b] text-[#a1a1aa] border-[#2e2e2e] hover:border-[#3f3f46]'
                          }`}
                        >
                          ₦{amt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  "✓ Save Settings"
                )}
              </button>
            </div>
          </div>

          {/* ── 3. CANDIDATES & CATEGORIES MANAGEMENT ─────────────────── */}
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="bg-[#121212] p-5 sm:p-6 rounded-3xl border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#fafafa]">Contest Categories & People</h3>
                <p className="text-xs text-[#a1a1aa]">
                  {categories.length} {categories.length === 1 ? 'Category' : 'Categories'} • {activeContestantsCount} Total Contestants • {totalVotesCast.toLocaleString()} Votes Cast
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-[#1f1f23] hover:bg-[#28282e] border border-[#2e2e2e] text-xs font-bold text-[#fafafa] transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span> Add Category
                </button>

                <button
                  type="button"
                  onClick={() => openAddContestantModal()}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#09090b] text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
                >
                  <span className="text-sm">+</span> Add Contestant
                </button>
              </div>
            </div>

            {/* Categories List */}
            {categories.length > 0 ? (
              <div className="space-y-6">
                {categories.map((cat) => {
                  const contestants = cat.contestants || [];
                  const catVotes = contestants.reduce((acc: number, c: any) => acc + (c.totalVotesCount || 0), 0);

                  return (
                    <div key={cat.id} className="bg-[#121212] rounded-3xl border border-[#262626] overflow-hidden">
                      {/* Category Header */}
                      <div className="p-5 sm:p-6 bg-[#18181b]/80 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🏆</span>
                          <div>
                            <h4 className="text-base font-extrabold text-[#fafafa]">{cat.name}</h4>
                            <p className="text-xs text-[#71717a]">
                              {contestants.length} {contestants.length === 1 ? 'contestant' : 'contestants'} • {catVotes.toLocaleString()} votes cast
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => openAddContestantModal(cat.name)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <span>+</span> Add Person
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-2 rounded-xl bg-[#27272a] hover:bg-rose-950/40 border border-[#3f3f46] hover:border-rose-800 text-xs text-[#a1a1aa] hover:text-rose-400 transition cursor-pointer"
                            title="Delete this category"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Contestants Cards Grid */}
                      <div className="p-5 sm:p-6">
                        {contestants.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {contestants.map((c: any) => (
                              <div
                                key={c.id}
                                className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden hover:border-[#3f3f46] transition group flex flex-col justify-between"
                              >
                                <div>
                                  {/* Photo */}
                                  <div className="relative h-44 w-full bg-[#09090b] overflow-hidden">
                                    <img
                                      src={c.image || '/images/party.png'}
                                      alt={c.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                    
                                    {/* Delete Button overlay */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteContestant(c.id, c.name)}
                                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-rose-950/90 border border-white/10 hover:border-rose-500 text-xs text-white/80 hover:text-rose-400 transition cursor-pointer shadow-md"
                                      title="Remove contestant"
                                    >
                                      🗑️
                                    </button>

                                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                      <h5 className="text-sm font-black truncate">{c.name}</h5>
                                      {c.details && (
                                        <p className="text-[11px] text-zinc-300 truncate opacity-90">
                                          {typeof c.details === 'string' ? JSON.parse(c.details)?.department || '' : c.details?.department || ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  <div className="p-3.5 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                      <span className="text-[#a1a1aa]">Total Votes</span>
                                      <span className="text-emerald-400 font-mono text-sm">
                                        🗳️ {c.totalVotesCount || 0}
                                      </span>
                                    </div>

                                    {/* Quick Admin Tweak (discrete) */}
                                    <div className="flex items-center justify-between pt-2 border-t border-[#27272a] text-[10px]">
                                      <span className="text-[#71717a]">Add Votes:</span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleTweakVotesCast(c.id, cat.id, 5)}
                                          className="px-2 py-0.5 rounded-lg bg-[#27272a] hover:bg-[#323236] text-[#d4d4d8] font-bold"
                                        >
                                          +5
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleTweakVotesCast(c.id, cat.id, 25)}
                                          className="px-2 py-0.5 rounded-lg bg-[#27272a] hover:bg-[#323236] text-[#d4d4d8] font-bold"
                                        >
                                          +25
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 space-y-3">
                            <div className="text-3xl">👥</div>
                            <p className="text-xs text-[#a1a1aa]">No contestants added to this category yet.</p>
                            <button
                              type="button"
                              onClick={() => openAddContestantModal(cat.name)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 text-[#09090b] text-xs font-bold hover:bg-emerald-400 transition"
                            >
                              + Add First Contestant
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#121212] rounded-3xl border border-[#262626] p-12 text-center space-y-4">
                <div className="text-4xl">📁</div>
                <div>
                  <h4 className="text-base font-bold text-[#fafafa]">No Categories Created Yet</h4>
                  <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto mt-1">
                    Start by creating your first category (like "Best Dressed Male" or "Campus King").
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-[#09090b] text-xs font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    + Create Category
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddContestantModal()}
                    className="px-5 py-2.5 rounded-2xl bg-[#1f1f23] text-[#fafafa] text-xs font-bold hover:bg-[#28282e] border border-[#2e2e2e] transition cursor-pointer"
                  >
                    + Add Contestant Directly
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-[#121212] rounded-3xl border border-[#262626] p-16 text-center text-[#71717a] text-xs">
          No events found. You need an event before you can enable voting.
        </div>
      )}

      {/* ── SIMPLE POP-UP MODAL: ADD CONTESTANT ──────────────────────── */}
      {isContestantModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#121212] border border-[#262626] p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#fafafa]">Add Contestant</h3>
                <p className="text-xs text-[#a1a1aa]">Add a person people can vote for</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsContestantModalOpen(false);
                  setContestantError('');
                }}
                className="h-8 w-8 rounded-full border border-[#2e2e2e] bg-[#18181b] flex items-center justify-center text-[#a1a1aa] hover:text-[#fafafa] transition"
              >
                ✕
              </button>
            </div>

            {contestantError && (
              <div className="bg-rose-950/50 border border-rose-800/40 text-rose-400 p-3 rounded-2xl text-xs font-semibold">
                ⚠️ {contestantError}
              </div>
            )}

            <form onSubmit={handleSaveContestant} className="space-y-4">
              {/* Photo Area */}
              <div>
                <label className="block text-xs font-bold text-[#fafafa] mb-1.5">
                  Contestant Photo *
                </label>
                <label className="group relative flex flex-col items-center justify-center h-44 w-full rounded-2xl border-2 border-dashed border-[#333333] hover:border-emerald-500 bg-[#18181b] hover:bg-[#202024] transition cursor-pointer overflow-hidden">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition">
                        📷 Tap to change photo
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-[#27272a] flex items-center justify-center text-2xl">
                        📷
                      </div>
                      <p className="text-xs font-bold text-[#fafafa]">Tap here to select photo</p>
                      <p className="text-[11px] text-[#71717a]">Choose from your phone or laptop</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#fafafa] mb-1.5">
                  Contestant Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Precious or DJ Steeze"
                  value={contestantName}
                  onChange={(e) => setContestantName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#18181b] border border-[#2e2e2e] rounded-xl text-sm font-semibold text-[#fafafa] outline-none focus:border-emerald-500 transition placeholder-[#71717a]"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#fafafa]">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingInlineCategory(!isCreatingInlineCategory)}
                    className="text-xs text-emerald-400 hover:underline font-bold"
                  >
                    {isCreatingInlineCategory ? '← Pick existing category' : '+ New Category'}
                  </button>
                </div>

                {isCreatingInlineCategory || categories.length === 0 ? (
                  <input
                    type="text"
                    placeholder="e.g. Best Dressed Male, King of Night"
                    value={contestantCategory}
                    onChange={(e) => setContestantCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-[#18181b] border border-[#2e2e2e] rounded-xl text-sm font-semibold text-[#fafafa] outline-none focus:border-emerald-500 transition placeholder-[#71717a]"
                    required
                  />
                ) : (
                  <select
                    value={contestantCategory}
                    onChange={(e) => setContestantCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-[#18181b] border border-[#2e2e2e] rounded-xl text-sm font-semibold text-[#fafafa] outline-none focus:border-emerald-500 transition cursor-pointer"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Note / Tag (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  Short Note or Department <span className="text-[#71717a] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mass Comm, 400L, Table 5"
                  value={contestantNote}
                  onChange={(e) => setContestantNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#18181b] border border-[#2e2e2e] rounded-xl text-xs font-medium text-[#fafafa] outline-none focus:border-emerald-500 transition placeholder-[#71717a]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSavingContestant}
                className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-black text-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 mt-2"
              >
                {isSavingContestant ? (
                  <div className="h-5 w-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  "✓ Save Contestant"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SIMPLE POP-UP MODAL: ADD CATEGORY ────────────────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#121212] border border-[#262626] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#fafafa]">Add New Category</h3>
                <p className="text-xs text-[#a1a1aa]">e.g. Best Dressed Male, Face of Campus</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryNameInput('');
                  setCategoryError('');
                }}
                className="h-8 w-8 rounded-full border border-[#2e2e2e] bg-[#18181b] flex items-center justify-center text-[#a1a1aa] hover:text-[#fafafa] transition"
              >
                ✕
              </button>
            </div>

            {categoryError && (
              <div className="bg-rose-950/50 border border-rose-800/40 text-rose-400 p-3 rounded-2xl text-xs font-semibold">
                ⚠️ {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#fafafa] mb-1.5">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Best Dressed Male"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#18181b] border border-[#2e2e2e] rounded-xl text-sm font-semibold text-[#fafafa] outline-none focus:border-emerald-500 transition placeholder-[#71717a]"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCategory}
                className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-black text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
              >
                {isSavingCategory ? (
                  <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  "✓ Create Category"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
