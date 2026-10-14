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
  const [voteCost, setVoteCost] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real-time categories & contestant stats
  const [categories, setCategories] = useState<any[]>([]);
  const [customTweakCounts, setCustomTweakCounts] = useState<Record<string, string>>({});
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // UI Flow States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Add Contestant Form state
  const [contestantForm, setContestantForm] = useState({
    name: '',
    nickname: '',
    faculty: '',
    department: '',
    level: '',
    bio: '',
    instagram: '',
    category: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSavingContestant, setIsSavingContestant] = useState(false);
  const [contestantError, setContestantError] = useState('');

  // Add Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Select Category for Contestant Selection state
  const [isSelectCategoryModalOpen, setIsSelectCategoryModalOpen] = useState(false);

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

      // Refresh list
      fetchVotingResults();
    } catch (err: any) {
      console.error('Error adding category', err);
      setCategoryError(err.response?.data?.message || 'Failed to create category. Try again.');
    } finally {
      setIsSavingCategory(false);
    }
  };


  // Fetch all organizer events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/organizer/events');
        setEvents(res.data);
        if (res.data.length > 0) {
          setSelectedEventId(res.data[0].id);
          setIsVotingEnabled(res.data[0].isVotingEnabled || false);
          setIsVotingPaid(res.data[0].isVotingPaid || false);
          setVoteCost(res.data[0].voteCost || 50);
        }
      } catch (err) {
        console.error('Failed to fetch events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch live voting tallies
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

  // Update categories and state variables when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (selectedEvent) {
        setIsVotingEnabled(selectedEvent.isVotingEnabled || false);
        setIsVotingPaid(selectedEvent.isVotingPaid || false);
        setVoteCost(selectedEvent.voteCost || 50);
      }
      fetchVotingResults();
    }
  }, [selectedEventId, events]);

  // Extract activity feed logs from categories.votes database records
  useEffect(() => {
    if (categories.length > 0) {
      const allVotes: any[] = [];
      categories.forEach((cat: any) => {
        const catVotes = cat.votes || [];
        catVotes.forEach((v: any) => {
          const contestant = (cat.contestants || []).find((c: any) => c.id === v.contestantId);
          allVotes.push({
            ...v,
            contestantName: contestant?.name || 'Candidate',
            categoryName: cat.name
          });
        });
      });
      // Sort by date descending
      allVotes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivityLogs(allVotes.slice(0, 10)); // Take last 10
    } else {
      setActivityLogs([]);
    }
  }, [categories]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const toggleVoting = () => {
    setIsVotingEnabled(!isVotingEnabled);
  };

  const handleSaveSettings = async () => {
    if (!selectedEventId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.put(`/organizer/events/${selectedEventId}/voting-settings`, {
        isVotingEnabled,
        isVotingPaid,
        voteCost: Number(voteCost)
      });
      
      setEvents(prev => prev.map(e => e.id === selectedEventId ? {
        ...e, isVotingEnabled, isVotingPaid, voteCost: Number(voteCost)
      } : e));
      
      setSaveSuccess(true);
      triggerToast("Voting settings updated successfully!", "success");
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchVotingResults();
    } catch (err: any) {
      console.error('Failed to update settings', err);
      triggerToast(err.response?.data?.message || 'Failed to update settings', "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Cast vote tweaks
  const handleTweakVotesCast = async (contestantId: string, categoryId: string, amount: number) => {
    try {
      await api.post(`/votes/tweak/${contestantId}`, {
        categoryId,
        tweakCount: amount
      });
      triggerToast(`Adjusted votes by ${amount > 0 ? '+' : ''}${amount}`, "success");
      fetchVotingResults();
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to adjust votes.', "error");
    }
  };

  const handleCustomTweakSubmit = (contestantId: string, categoryId: string) => {
    const rawVal = customTweakCounts[contestantId] || '';
    const num = parseInt(rawVal);
    if (isNaN(num) || num === 0) {
      triggerToast('Please enter a valid non-zero adjustment count.', "error");
      return;
    }
    handleTweakVotesCast(contestantId, categoryId, num);
    setCustomTweakCounts(prev => ({ ...prev, [contestantId]: '' }));
  };

  // Image Upload handler for Add Contestant Drawer
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContestantError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setContestantError('Image size should be less than 5MB.');
        return;
      }
      
      const url = URL.createObjectURL(file);
      setImagePreview(url);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save new contestant via inline drawer
  const handleSaveContestant = async (e: React.FormEvent) => {
    e.preventDefault();
    setContestantError('');
    if (!selectedEventId) return;
    
    if (!contestantForm.name || !contestantForm.category) {
      setContestantError('Contestant name and category are required.');
      return;
    }

    setIsSavingContestant(true);
    try {
      await api.post('/organizer/contestants', {
        ...contestantForm,
        eventId: selectedEventId,
        image: imageBase64
      });

      triggerToast(`Contestant "${contestantForm.name}" added successfully!`, "success");
      
      // Reset form & close drawer
      setContestantForm({
        name: '',
        nickname: '',
        faculty: '',
        department: '',
        level: '',
        bio: '',
        instagram: '',
        category: ''
      });
      setImagePreview(null);
      setImageBase64(null);
      setIsDrawerOpen(false);

      // Refresh list
      fetchVotingResults();
    } catch (err: any) {
      console.error('Error adding contestant', err);
      setContestantError(err.response?.data?.message || 'Failed to add contestant. Try again.');
    } finally {
      setIsSavingContestant(false);
    }
  };

  // Totals calculations
  const totalVotesCast = categories.reduce(
    (sum, cat) => sum + (cat.contestants || []).reduce((s: number, c: any) => s + (c.totalVotesCount || 0), 0), 
    0
  );

  const totalRealVotes = categories.reduce(
    (sum, cat) => sum + (cat.contestants || []).reduce((s: number, c: any) => s + (c.realVotesCount || 0), 0), 
    0
  );

  const activeContestantsCount = categories.reduce(
    (sum, cat) => sum + (cat.contestants || []).length, 
    0
  );

  const votingRevenue = isVotingPaid ? totalRealVotes * voteCost : 0;

  return (
    <div className="space-y-6 pt-2">
      {/* Toast Feedback Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 backdrop-blur-md px-5 py-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border ${
            toast.type === "success" 
              ? "bg-emerald-950/60 border-emerald-800/40 text-emerald-400" 
              : "bg-rose-950/60 border-rose-800/40 text-rose-400"
          }`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-semibold text-[#fafafa]">{toast.message}</p>
        </div>
      )}

      {/* ── HEADER & EVENT SELECTOR ───────────────────────────────── */}
      <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#262626] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-30">
        <div className="space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] bg-[#171717] border border-[#262626] px-2.5 py-1 rounded-full">
            Operations Module
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[#fafafa] tracking-tight mt-2">
            Voting & Contests
          </h1>
          <p className="text-xs text-[#9ca3af]">
            Configure live ballot categories, register candidates, and monitor real-time votes.
          </p>
        </div>
        
        {/* Custom Dropdown Selector */}
        <div className="w-full sm:w-80 relative z-20" ref={dropdownRef}>
          <label className="text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1 block">
            Active Campaign
          </label>
          
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-2.5 bg-[#171717] hover:bg-[#202020] border border-[#262626] hover:border-[#374151] rounded-full text-xs font-semibold text-[#fafafa] outline-none flex items-center justify-between transition-all cursor-pointer shadow-sm select-none"
          >
            <span className="truncate">
              {selectedEvent ? selectedEvent.title : 'Loading events...'}
            </span>
            <span className="text-[#737373] text-[10px] ml-2">▼</span>
          </button>

          {isDropdownOpen && events.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden z-50 py-1 divide-y divide-[#262626]">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-xs font-medium transition-all hover:bg-[#1a1a1a] flex items-center gap-3 ${
                    e.id === selectedEventId ? "bg-[#171717] text-[#fafafa]" : "text-[#9ca3af]"
                  }`}
                >
                  {e.bannerImage && (
                    <img src={e.bannerImage} className="h-6 w-10 object-cover rounded bg-[#171717] shrink-0 border border-[#262626]" alt="" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#fafafa]">{e.title}</p>
                    <p className="text-[10px] text-[#737373] truncate mt-0.5">{e.location} • {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <div className="w-8 h-8 border-2 border-[#262626] border-t-[#fafafa] rounded-full animate-spin"></div>
          <span className="text-xs text-[#737373] tracking-wide">Synchronizing ballot records...</span>
        </div>
      ) : selectedEvent ? (
        <>
          {/* ── SELECTED EVENT BANNER ───────────────────────────────── */}
          <div className="relative min-h-[220px] md:h-56 w-full rounded-2xl bg-[#121212] overflow-hidden border border-[#262626] flex flex-col justify-between p-6 md:p-8">
            <img 
              src={selectedEvent.bannerImage || '/images/party.png'} 
              alt={selectedEvent.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium border border-emerald-800/40 bg-emerald-950/40 text-emerald-400">
                  SELECTED EVENT
                </span>
                <span className="text-xs font-medium text-[#9ca3af]">
                  {selectedEvent.category || 'Campaign'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="rounded-full border border-[#262626] bg-[#171717]/80 backdrop-blur-sm text-[#fafafa] hover:bg-[#202020] hover:border-[#374151] px-4 py-2 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span> Add Category
                </button>
                <button
                  onClick={() => setIsSelectCategoryModalOpen(true)}
                  className="rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white px-4 py-2 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span> Add Contestant
                </button>
              </div>
            </div>
            
            <div className="relative z-10 space-y-1.5 mt-4 sm:mt-0">
              <div className="space-y-0.5">
                <h3 className="text-xl md:text-2xl font-bold text-[#fafafa] tracking-tight uppercase">{selectedEvent.title}</h3>
                <p className="text-xs text-[#9ca3af]">
                  📍 {selectedEvent.location} • 📅 {new Date(selectedEvent.date).toLocaleDateString()}
                </p>
              </div>
              
              <p className="text-xs text-[#737373] max-w-2xl line-clamp-2">
                {selectedEvent.description}
              </p>
            </div>
          </div>

          {/* ── VOTING CAMPAIGN TOGGLE ─────────────────────────────────── */}
          <div className="p-6 md:p-8 rounded-2xl bg-[#121212] border border-[#262626] transition-all flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-[#fafafa] flex items-center gap-3">
                {isVotingEnabled && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
                {isVotingEnabled ? 'Voting Campaign is ACTIVE' : 'Voting System is Inactive'}
              </h3>
              <p className="text-xs text-[#9ca3af] mt-1.5 max-w-2xl leading-relaxed">
                {isVotingEnabled 
                  ? 'Contestants are live. Attendees can buy and cast votes on the event lobby. Turn settings off below to freeze standings.'
                  : 'Turn on the voting switch to create categories, add contestants, and launch the campaign live for attendees.'}
              </p>
            </div>
            
            {/* Custom Switch */}
            <button 
              onClick={toggleVoting}
              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isVotingEnabled ? 'bg-emerald-500' : 'bg-[#262626]'}`}
            >
              <span className="sr-only">Toggle voting</span>
              <span className={`pointer-events-none relative inline-block h-7 w-7 transform rounded-full bg-white shadow transition duration-300 ease-in-out flex items-center justify-center text-[10px] ${isVotingEnabled ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-gray-400'}`}>
                {isVotingEnabled ? "✓" : "✕"}
              </span>
            </button>
          </div>

          {/* ── VOTING MANAGEMENT DASHBOARD ───────────────────────────── */}
          {isVotingEnabled && (
            <div className="space-y-6">
              
              {/* Metric KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Votes Cast', value: totalVotesCast.toLocaleString(), sub: 'Organic & tweaks combined', icon: '🗳️' },
                  { label: 'Real Voting Revenue', value: formatNaira(votingRevenue), sub: `Generated from ${totalRealVotes.toLocaleString()} paid votes`, icon: '💰' },
                  { label: 'Active Candidates', value: activeContestantsCount.toLocaleString(), sub: `Registered in ${categories.length} categories`, icon: '👥' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#121212] p-5 rounded-2xl border border-[#262626] hover:border-[#374151] transition-all flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#9ca3af]">{s.label}</p>
                      <p className="text-2xl font-bold text-[#fafafa] tracking-tight mt-1">{s.value}</p>
                      <p className="text-[11px] text-[#737373] mt-0.5">{s.sub}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-base">
                      {s.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Central Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Columns (Contestants & Visual SVG Graphs) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Visual Standing Share Charts Widget */}
                  {categories.length > 0 && (
                    <div className="bg-[#121212] rounded-2xl border border-[#262626] p-6 md:p-8 space-y-6">
                      <div>
                        <h3 className="text-base font-bold text-[#fafafa] tracking-tight">Standings Share Analytics</h3>
                        <p className="text-xs text-[#9ca3af] mt-0.5">Voter weight distribution per candidate (real vs tweaked counts)</p>
                      </div>

                      <div className="space-y-4">
                        {categories.map((category) => {
                          const categoryTotal = (category.contestants || []).reduce(
                            (sum: number, c: any) => sum + (c.totalVotesCount || 0),
                            0
                          );

                          return (
                            <div key={category.id} className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-3">
                              <div className="flex justify-between items-center border-b border-[#262626] pb-2">
                                <span className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">{category.name}</span>
                                <span className="text-[10px] font-mono text-[#9ca3af]">{categoryTotal.toLocaleString()} total votes</span>
                              </div>
                              
                              <div className="space-y-2.5">
                                {(category.contestants || []).map((contestant: any) => {
                                  const sharePct = categoryTotal > 0 ? Math.round((contestant.totalVotesCount / categoryTotal) * 100) : 0;
                                  
                                  return (
                                    <div key={contestant.id} className="space-y-1 text-xs">
                                      <div className="flex justify-between items-center text-[#fafafa]">
                                        <span className="truncate max-w-[60%] font-medium">{contestant.name}</span>
                                        <span className="font-mono text-[#9ca3af] text-[10px]">
                                          {contestant.totalVotesCount.toLocaleString()} votes ({sharePct}%)
                                        </span>
                                      </div>

                                      {/* Dual stack bar */}
                                      <div className="h-2 w-full rounded-full bg-[#262626] overflow-hidden flex relative">
                                        {contestant.totalVotesCount > 0 ? (
                                          <>
                                            <div className="h-full bg-emerald-500" style={{ width: `${(contestant.realVotesCount / categoryTotal) * 100}%` }} />
                                            <div className="h-full bg-amber-400" style={{ width: `${(contestant.tweakedVotesCount / categoryTotal) * 100}%` }} />
                                          </>
                                        ) : (
                                          <div className="h-full w-full bg-[#262626]" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] p-6 rounded-2xl border border-[#262626]">
                    <div>
                      <h3 className="text-base font-bold text-[#fafafa] tracking-tight">Campaign Categories</h3>
                      <p className="text-xs text-[#9ca3af]">Manage voting categories and register contestants</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="rounded-full border border-[#262626] bg-[#171717] text-[#fafafa] hover:bg-[#202020] hover:border-[#374151] px-4 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer"
                      >
                        <span>+</span> Add Category
                      </button>
                      <button
                        onClick={() => setIsSelectCategoryModalOpen(true)}
                        className="rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white px-4 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer"
                      >
                        <span>+</span> Add Contestant
                      </button>
                    </div>
                  </div>

                  {/* Contestant Management Cards List */}
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category.id} className="bg-[#121212] rounded-2xl border border-[#262626] overflow-hidden">
                        <div className="p-5 border-b border-[#262626] bg-[#171717]/50 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#fafafa]">{category.name}</h3>
                            <p className="text-[10px] font-mono text-[#737373] mt-0.5">
                              ID: {category.id}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setContestantForm((prev) => ({ ...prev, category: category.name }));
                              setIsDrawerOpen(true);
                            }}
                            className="text-xs font-semibold text-[#fafafa] hover:underline flex items-center gap-1"
                          >
                            <span>+</span> Add Contestant
                          </button>
                        </div>

                        {/* Contestant listing under category */}
                        <div className="p-6 divide-y divide-[#262626] space-y-4">
                          {(category.contestants && category.contestants.length > 0) ? (
                            category.contestants.map((c: any) => {
                              return (
                                <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                    <img src={c.image || '/images/party.png'} className="h-12 w-12 object-cover rounded-xl border border-[#262626] bg-[#171717] shrink-0" alt="" />
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-sm font-bold text-[#fafafa] truncate">{c.name}</h4>
                                      
                                      {/* Audit standings */}
                                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]">
                                        <span className="text-[#9ca3af]">
                                          Total: <strong className="text-[#fafafa]">{c.totalVotesCount}</strong>
                                        </span>
                                        <span className="text-[#737373]">•</span>
                                        <span className="rounded-full px-2 py-0.5 text-[9px] font-medium border border-emerald-800/40 bg-emerald-950/40 text-emerald-400">
                                          Real: <strong>{c.realVotesCount}</strong>
                                        </span>
                                        <span className="text-[#737373]">•</span>
                                        <span className="rounded-full px-2 py-0.5 text-[9px] font-medium border border-amber-800/40 bg-amber-950/40 text-amber-400">
                                          Tweaked: <strong>{c.tweakedVotesCount}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* TWEAK INTERACTION BUTTONS */}
                                  <div className="flex flex-wrap items-center gap-2 shrink-0 justify-start md:justify-end">
                                    {/* Quick Increment capsules */}
                                    <div className="flex items-center gap-1 border border-[#262626] rounded-full p-1 bg-[#171717]">
                                      <button
                                        onClick={() => handleTweakVotesCast(c.id, category.id, 5)}
                                        className="px-2.5 py-1 bg-[#121212] hover:bg-[#202020] border border-[#262626] hover:border-[#374151] rounded-full text-[10px] font-semibold text-[#fafafa] active:scale-95 transition"
                                      >
                                        +5
                                      </button>
                                      <button
                                        onClick={() => handleTweakVotesCast(c.id, category.id, 25)}
                                        className="px-2.5 py-1 bg-[#121212] hover:bg-[#202020] border border-[#262626] hover:border-[#374151] rounded-full text-[10px] font-semibold text-[#fafafa] active:scale-95 transition"
                                      >
                                        +25
                                      </button>
                                      {c.tweakedVotesCount >= 5 && (
                                        <button
                                          onClick={() => handleTweakVotesCast(c.id, category.id, -5)}
                                          className="px-2.5 py-1 bg-[#121212] hover:bg-rose-950/50 border border-rose-900/40 rounded-full text-[10px] font-semibold text-rose-400 active:scale-95 transition"
                                        >
                                          -5
                                        </button>
                                      )}
                                    </div>

                                    {/* Direct adjustment input block */}
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        placeholder="Count"
                                        value={customTweakCounts[c.id] || ''}
                                        onChange={(e) => setCustomTweakCounts(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        className="w-20 px-3 py-1 bg-[#171717] border border-[#262626] focus:border-[#fafafa] rounded-full text-xs font-medium text-[#fafafa] outline-none placeholder-[#737373]"
                                      />
                                      <button
                                        onClick={() => handleCustomTweakSubmit(c.id, category.id)}
                                        className="px-3 py-1 bg-[#fafafa] text-[#0a0a0a] hover:bg-white text-xs font-semibold rounded-full transition active:scale-95"
                                      >
                                        Adjust
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-xs text-[#737373]">
                              No contestants registered in this category yet.
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#121212] rounded-2xl border border-[#262626] p-12 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-xl mx-auto">
                        📁
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#fafafa]">No Categories Configured</p>
                        <p className="text-xs text-[#9ca3af] max-w-sm mx-auto">
                          Create at least one category before registering contestants.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white px-5 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>+</span> Create First Category
                      </button>
                    </div>
                  )}

                </div>

                {/* Right Columns (Vote Settings & Feed) */}
                <div className="space-y-6 h-fit sticky top-24">
                  
                  {/* Vote Settings card */}
                  <div className="bg-[#121212] rounded-2xl border border-[#262626] p-6 flex flex-col gap-5">
                    <div className="border-b border-[#262626] pb-4">
                      <h3 className="text-base font-bold text-[#fafafa]">
                        Rules Settings
                      </h3>
                      <p className="text-[10px] text-[#737373] uppercase tracking-wider mt-0.5">Configure ballot parameters</p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      
                      {/* Paid switch */}
                      <div className="flex items-center justify-between p-4 bg-[#171717] rounded-xl border border-[#262626]">
                        <div>
                          <p className="text-xs font-semibold text-[#fafafa]">Paid Voting</p>
                          <p className="text-[10px] text-[#737373] mt-0.5">Require transaction to vote</p>
                        </div>
                        <button 
                          onClick={() => setIsVotingPaid(!isVotingPaid)}
                          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isVotingPaid ? 'bg-emerald-500' : 'bg-[#262626]'}`}
                        >
                          <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-300 ease-in-out ${isVotingPaid ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Vote cost input */}
                      <div className={`transition-all duration-300 ${isVotingPaid ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Cost Per Vote (₦)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] font-semibold text-xs">₦</span>
                          <input 
                            type="number" 
                            value={voteCost}
                            onChange={(e) => setVoteCost(Number(e.target.value))}
                            disabled={!isVotingPaid}
                            className="w-full pl-8 pr-4 py-2 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition-all"
                          />
                        </div>
                      </div>

                      {/* Live rankings switch */}
                      <div className="flex items-center justify-between p-4 bg-[#171717] rounded-xl border border-[#262626]">
                        <div>
                          <p className="text-xs font-semibold text-[#fafafa]">Live Standings</p>
                          <p className="text-[10px] text-[#737373] mt-0.5">Allow public to view leaders</p>
                        </div>
                        <button 
                          className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ease-in-out focus:outline-none bg-emerald-500"
                        >
                          <span className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-300 ease-in-out translate-x-5" />
                        </button>
                      </div>

                    </div>
                    
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="w-full rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white py-2.5 font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      ) : (
                        "Save Settings"
                      )}
                    </button>
                  </div>

                  {/* Real-time audit activity feed logs */}
                  <div className="bg-[#121212] rounded-2xl border border-[#262626] p-6 flex flex-col gap-4">
                    <div className="border-b border-[#262626] pb-3">
                      <h3 className="text-sm font-bold text-[#fafafa]">Recent Votes Activity</h3>
                      <p className="text-[10px] text-[#737373] uppercase tracking-wider mt-0.5">Real-time audit log</p>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {activityLogs.length > 0 ? (
                        activityLogs.map((log, idx) => (
                          <div key={log.id || idx} className="p-3 rounded-xl bg-[#171717] border border-[#262626] text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                log.isTweaked 
                                  ? "bg-amber-950/40 text-amber-400 border-amber-800/40" 
                                  : "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                              }`}>
                                {log.isTweaked ? "Tweaked" : "Organic"}
                              </span>
                              <span className="text-[9px] font-mono text-[#737373]">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-[#fafafa] text-[11px]">
                              Vote registered for <strong className="font-bold text-white">{log.contestantName}</strong> ({log.categoryName})
                            </p>
                            <p className="text-[9.5px] font-mono text-[#737373] truncate">
                              Voter: {log.email}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[#737373] text-xs">No active votes logged yet.</div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#121212] rounded-2xl border border-[#262626] p-16 text-center text-[#737373] text-xs">
          No events found. You need an event before you can enable voting.
        </div>
      )}

      {/* ── CONTESTANT CREATION SLIDE-OUT DRAWER ─────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-full max-w-4xl h-full border-l border-[#262626] bg-[#0d0d0d] p-6 md:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto z-10">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] bg-[#171717] border border-[#262626] px-2.5 py-1 rounded-full">
                    Contestant Registration
                  </span>
                  <h3 className="text-lg font-bold text-[#fafafa] mt-2">Register New Candidate</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {contestantError && (
                <div className="bg-rose-950/50 border border-rose-800/40 text-rose-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {contestantError}
                </div>
              )}

              {/* Side-by-Side: Preview & Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left side: Live Card Preview */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-medium text-[#737373] uppercase tracking-wider">Candidate Card Preview</h4>
                  
                  <div className="bg-[#121212] rounded-2xl border border-[#262626] overflow-hidden flex flex-col relative max-w-sm mx-auto shadow-sm">
                    {/* Header Image */}
                    <div className="relative h-56 bg-[#171717] w-full overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Candidate preview" 
                          className="absolute inset-0 w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#737373] gap-2">
                          <span className="text-2xl">📷</span>
                          <span className="text-[10px] font-medium uppercase tracking-wider">No Photo Uploaded</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-3 left-3 bg-[#fafafa] text-[#0a0a0a] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        👑 Rank #1
                      </div>
                      
                      <div className="absolute bottom-3 right-3 bg-[#171717]/80 backdrop-blur-md border border-[#262626] px-2.5 py-0.5 rounded-full text-[9px] font-semibold text-[#fafafa] uppercase tracking-wider">
                        {contestantForm.category || 'Category Label'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-[#fafafa]">
                          {contestantForm.name || 'Full Name'}
                          {contestantForm.nickname && (
                            <span className="text-[#9ca3af] font-medium text-xs ml-1.5 italic">
                              "{contestantForm.nickname}"
                            </span>
                          )}
                        </h3>
                        
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(contestantForm.department || 'Department') && (
                            <span className="text-[9px] font-medium text-[#9ca3af] bg-[#171717] border border-[#262626] px-2 py-0.5 rounded-full uppercase">
                              {contestantForm.department || 'Department'}
                            </span>
                          )}
                          {contestantForm.level && (
                            <span className="text-[9px] font-medium text-[#9ca3af] bg-[#171717] border border-[#262626] px-2 py-0.5 rounded-full uppercase">
                              {contestantForm.level}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#9ca3af] bg-[#171717] border border-[#262626] p-3 rounded-xl min-h-[50px] line-clamp-3">
                        "{contestantForm.bio || 'Brief manifesto or candidate pitch.'}"
                      </p>

                      {contestantForm.instagram && (
                        <p className="text-[10px] text-pink-400 font-semibold">
                          📷 @{contestantForm.instagram.replace('@', '')}
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-[10px] text-[#737373]">
                        <span>Total Votes: 0</span>
                        <span className="rounded-full bg-[#171717] border border-[#262626] text-[#fafafa] px-3 py-1 font-semibold">Cast Vote</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right side: Form controls */}
                <form onSubmit={handleSaveContestant} className="space-y-4">
                  {/* Photo upload */}
                  <div className="p-4 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#fafafa]">Contestant Photo</p>
                      <p className="text-[10px] text-[#737373] mt-0.5">JPG, PNG up to 5MB.</p>
                    </div>
                    <label className="rounded-full border border-[#262626] bg-[#171717] hover:bg-[#202020] hover:border-[#374151] px-4 py-2 text-[10px] font-semibold uppercase text-[#fafafa] cursor-pointer active:scale-95 transition">
                      Choose file
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Teniola Adeyemi" 
                        value={contestantForm.name}
                        onChange={(e) => setContestantForm({...contestantForm, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Stage / Nickname</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Teni" 
                        value={contestantForm.nickname}
                        onChange={(e) => setContestantForm({...contestantForm, nickname: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Faculty</label>
                      <input 
                        type="text" 
                        placeholder="Science" 
                        value={contestantForm.faculty}
                        onChange={(e) => setContestantForm({...contestantForm, faculty: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Department</label>
                      <input 
                        type="text" 
                        placeholder="Computer Sci" 
                        value={contestantForm.department}
                        onChange={(e) => setContestantForm({...contestantForm, department: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Level</label>
                      <select 
                        value={contestantForm.level}
                        onChange={(e) => setContestantForm({...contestantForm, level: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition cursor-pointer"
                      >
                        <option value="">Select</option>
                        <option value="100L">100L</option>
                        <option value="200L">200L</option>
                        <option value="300L">300L</option>
                        <option value="400L">400L</option>
                        <option value="500L">500L</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Campaign Category</label>
                    <select 
                      value={contestantForm.category}
                      onChange={(e) => setContestantForm({...contestantForm, category: e.target.value})}
                      className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition cursor-pointer"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-[10px] text-rose-400 font-medium mt-1.5">
                        ⚠️ Create a category first before adding contestants.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Instagram Username</label>
                    <input 
                      type="text" 
                      placeholder="username" 
                      value={contestantForm.instagram}
                      onChange={(e) => setContestantForm({...contestantForm, instagram: e.target.value})}
                      className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Manifesto / Short Bio</label>
                    <textarea 
                      rows={3} 
                      placeholder="Candidate pitch / bio..." 
                      value={contestantForm.bio}
                      onChange={(e) => setContestantForm({...contestantForm, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-[#171717] border border-[#262626] rounded-2xl text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingContestant}
                    className="w-full rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white py-3 font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSavingContestant ? (
                      <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      "Save Contestant"
                    )}
                  </button>

                </form>

              </div>

            </div>

            <div className="pt-6 border-t border-[#262626] text-center text-[10px] font-mono text-[#737373]">
              Swyft Creator Studio • Real-time Operations
            </div>

          </div>
        </div>
      )}

      {/* ── CATEGORY CREATION MODAL ─────────────────────────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#121212] border border-[#262626] p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-1.5">
              <span className="text-2xl">🗳️</span>
              <h3 className="text-base font-bold text-[#fafafa]">Create New Category</h3>
              <p className="text-xs text-[#9ca3af]">
                Setup a new ballot category for this event.
              </p>
            </div>

            {categoryError && (
              <div className="bg-rose-950/50 border border-rose-800/40 text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span> {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-medium uppercase text-[#737373] tracking-wider">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prom King, SUG President"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCategory}
                className="w-full h-10 rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingCategory ? (
                  <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  "Create Category"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryNameInput('');
                  setCategoryError('');
                }}
                className="w-full text-center text-xs text-[#737373] hover:text-[#fafafa] transition cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SELECT CATEGORY MODAL FOR CONTESTANT ADDITION ────────────────── */}
      {isSelectCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#121212] border border-[#262626] p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] bg-[#171717] border border-[#262626] px-2.5 py-1 rounded-full">
                  Category Router
                </span>
                <h3 className="text-base font-bold text-[#fafafa] mt-2">Select Candidate Category</h3>
              </div>
              <button
                onClick={() => setIsSelectCategoryModalOpen(false)}
                className="h-8 w-8 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#9ca3af]">
                  Select a category below to register a contestant:
                </p>
                
                {/* Categories selection grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const contestantCount = cat.contestants?.length || 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setContestantForm((prev) => ({ ...prev, category: cat.name }));
                          setIsSelectCategoryModalOpen(false);
                          setIsDrawerOpen(true);
                        }}
                        className="p-4 rounded-xl border border-[#262626] hover:border-[#374151] bg-[#171717] hover:bg-[#202020] text-left transition active:scale-98 cursor-pointer flex flex-col justify-between h-24"
                      >
                        <span className="text-xs font-bold text-[#fafafa] line-clamp-2">
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#737373]">
                          <span>👥</span> {contestantCount} {contestantCount === 1 ? 'Candidate' : 'Candidates'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-[#171717] border border-[#262626] rounded-full flex items-center justify-center text-xl mx-auto">
                  ⚠️
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#fafafa]">No Categories Found</p>
                  <p className="text-xs text-[#9ca3af] max-w-sm mx-auto">
                    Create at least one category to start registering contestants.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectCategoryModalOpen(false);
                    setIsCategoryModalOpen(true);
                  }}
                  className="rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white px-5 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>+</span> Add Category
                </button>
              </div>
            )}
            
            <div className="text-center text-[10px] font-mono text-[#737373] border-t border-[#262626] pt-3">
              Swyft Creator Studio
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
