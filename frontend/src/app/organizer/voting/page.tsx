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
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20 relative">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-100/35 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-purple-100/25 blur-[120px] pointer-events-none" />

      {/* TOAST FEEDBACK NOTIFICATIONS */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-gray-150 bg-white px-5 py-4 shadow-2xl animate-slideLeft">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-black text-gray-800">{toast.message}</p>
        </div>
      )}

      {/* ── HEADER & EVENT SELECTOR ───────────────────────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-30">
        {/* Blurry glow confined inside card boundaries */}
        <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-[#f05537]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </div>
        
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#f05537] bg-[#f05537]/10 px-2.5 py-1 rounded">
            Creator Studio Core
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-[#1e0a3c] tracking-tight mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#f05537] rounded-full shrink-0" />
            Voting Module
          </h2>
        </div>
        
        {/* Custom Dropdown Selector */}
        <div className="w-full sm:w-80 relative z-20" ref={dropdownRef}>
          <label className="absolute -top-2.5 left-4 bg-white/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest rounded-md border border-gray-100 shadow-sm">
            Active Campaign
          </label>
          
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full pl-5 pr-10 py-3.5 bg-gray-50/50 hover:bg-white border border-gray-200 hover:border-indigo-300 rounded-xl text-xs font-black text-gray-900 outline-none flex items-center justify-between transition-all cursor-pointer shadow-sm select-none"
          >
            <span className="truncate">
              {selectedEvent ? selectedEvent.title : 'Loading events...'}
            </span>
            <span className="text-gray-400">▼</span>
          </button>

          {isDropdownOpen && events.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl overflow-hidden animate-fadeIn z-50 py-1">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEventId(e.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-xs font-bold transition-all hover:bg-slate-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                    e.id === selectedEventId ? "bg-indigo-50/40 text-indigo-600" : "text-gray-750"
                  }`}
                >
                  {e.bannerImage && (
                    <img src={e.bannerImage} className="h-6 w-10 object-cover rounded bg-slate-100 shrink-0" alt="" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{e.title}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{e.location} • {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

       {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <div className="w-10 h-10 border-4 border-[#f05537]/20 border-t-[#f05537] rounded-full animate-spin"></div>
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Synchronizing dashboard data...</span>
        </div>
      ) : selectedEvent ? (
        <>
          {/* ── AUTOMATIC EVENT BANNER DISPLAY ───────────────────────── */}
          <div className="relative min-h-[260px] md:h-64 w-full rounded-[24px] bg-slate-950 overflow-hidden shadow-lg border border-white/5 select-none animate-in fade-in duration-500 flex flex-col justify-between p-6 md:p-8">
            <img 
              src={selectedEvent.bannerImage || '/images/party.png'} 
              alt={selectedEvent.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40 md:via-slate-950/60 md:to-transparent pointer-events-none" />
            
            {/* Banner Content */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#f05537] bg-[#f05537]/10 px-2.5 py-1 rounded border border-[#f05537]/20">
                  ⚡ SELECTED EVENT
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  {selectedEvent.category || 'Campaign'}
                </span>
              </div>

              {/* Inline contestant & category creation buttons */}
              <div className="flex flex-wrap items-center gap-2.5 text-white">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-white hover:bg-gray-100 text-[#1e0a3c] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-white"
                >
                  <span>+</span> Add Category
                </button>
                <button
                  onClick={() => setIsSelectCategoryModalOpen(true)}
                  className="bg-[#f05537] hover:bg-[#d1410c] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span> Add Contestant
                </button>
              </div>
            </div>
            
            <div className="relative z-10 space-y-2 mt-4 sm:mt-0">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">{selectedEvent.title}</h3>
                <p className="text-xs font-semibold text-slate-300">
                  📍 {selectedEvent.location} • 📅 {new Date(selectedEvent.date).toLocaleDateString()}
                </p>
              </div>
              
              <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-2">
                {selectedEvent.description}
              </p>
            </div>
          </div>

          {/* ── VOTING TOGGLE ─────────────────────────────────────────── */}
          <div className={`p-6 md:p-8 rounded-[24px] border transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group ${
            isVotingEnabled 
              ? 'bg-gradient-to-r from-[#1e0a3c] to-[#2c1056] border-white/5 shadow-[0_8px_30px_rgba(30,10,60,0.15)]' 
              : 'bg-white border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)]'
          }`}>
            <div className="relative z-10">
              <h3 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-3 ${isVotingEnabled ? 'text-white' : 'text-[#1e0a3c]'}`}>
                {isVotingEnabled && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
                {isVotingEnabled ? 'Voting Campaign is ACTIVE' : 'Voting System is Inactive'}
              </h3>
              <p className={`text-xs md:text-sm font-medium mt-1.5 max-w-2xl ${isVotingEnabled ? 'text-slate-300' : 'text-slate-400'}`}>
                {isVotingEnabled 
                  ? 'Contestants are live. Attendees can buy and cast votes on the event lobby. Turn settings off below to freeze standings.'
                  : 'Turn on the voting switch to create categories, add contestants, and launch the campaign live for attendees.'}
              </p>
            </div>
            
            {/* Custom Toggle Switch */}
            <button 
              onClick={toggleVoting}
              className={`relative z-10 inline-flex h-11 w-20 flex-shrink-0 cursor-pointer rounded-full border-4 transition-all duration-300 ease-in-out focus:outline-none ${isVotingEnabled ? 'bg-emerald-400 border-emerald-300/30' : 'bg-slate-200 border-white hover:bg-slate-300'}`}
            >
              <span className="sr-only">Toggle voting</span>
              <span className={`pointer-events-none relative inline-block h-9 w-9 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out flex items-center justify-center ${isVotingEnabled ? 'translate-x-9' : 'translate-x-0'}`}>
                {isVotingEnabled ? (
                  <span className="text-xs text-emerald-500">✓</span>
                ) : (
                  <span className="text-xs text-gray-400">✕</span>
                )}
              </span>
            </button>
          </div>

          {/* ── VOTING MANAGEMENT DASHBOARD ───────────────────────────── */}
          {isVotingEnabled && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 flex flex-col gap-8">
              
              {/* Quick real-time analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Votes Cast', value: totalVotesCast.toLocaleString(), sub: 'Organic & tweaks combined', iconClass: 'bg-purple-50 border border-purple-100/50 text-[#9333ea]' },
                  { label: 'Real Voting Revenue', value: formatNaira(votingRevenue), sub: `Generated from ${totalRealVotes.toLocaleString()} paid votes`, iconClass: 'bg-emerald-50 border border-emerald-100/50 text-emerald-600' },
                  { label: 'Active Candidates', value: activeContestantsCount.toLocaleString(), sub: `Registered in ${categories.length} categories`, iconClass: 'bg-orange-50 border border-orange-100/50 text-[#f05537]' },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex items-center justify-between group hover:border-[#f05537]/35 hover:-translate-y-0.5 transition-all duration-300">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-3xl font-black text-[#1e0a3c] tracking-tight">{s.value}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg shrink-0 transform group-hover:scale-105 transition-all duration-300 ${s.iconClass}`}>
                      {i === 0 ? "🗳️" : i === 1 ? "💰" : "👥"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Central Panel Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Columns (Contestants & Visual SVG Graphs) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  
                  {/* Visual Standing Share SVG Charts Widget */}
                  {categories.length > 0 && (
                    <div className="bg-white rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-6 md:p-8 space-y-6">
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-6 bg-[#f05537] rounded-full shrink-0" />
                        <div>
                          <h3 className="text-base font-black text-[#1e0a3c] tracking-tight">Standings Share Analytics</h3>
                          <p className="text-xs font-semibold text-gray-400 mt-0.5">Voter weight distribution per candidate (real vs tweaked counts)</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {categories.map((category) => {
                          const categoryTotal = (category.contestants || []).reduce(
                            (sum: number, c: any) => sum + (c.totalVotesCount || 0),
                            0
                          );

                          return (
                            <div key={category.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{category.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">{categoryTotal.toLocaleString()} total votes</span>
                              </div>
                              
                              <div className="space-y-3">
                                {(category.contestants || []).map((contestant: any) => {
                                  const sharePct = categoryTotal > 0 ? Math.round((contestant.totalVotesCount / categoryTotal) * 100) : 0;
                                  const realShare = contestant.totalVotesCount > 0 ? Math.round((contestant.realVotesCount / contestant.totalVotesCount) * 100) : 0;
                                  
                                  return (
                                    <div key={contestant.id} className="space-y-1.5 text-xs">
                                      <div className="flex justify-between items-center font-bold text-gray-700">
                                        <span className="truncate max-w-[60%]">{contestant.name}</span>
                                        <span className="font-mono text-slate-500 font-extrabold text-[10px]">
                                          {contestant.totalVotesCount.toLocaleString()} votes ({sharePct}%)
                                        </span>
                                      </div>

                                      {/* Dual stack bar representing voter weights */}
                                      <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden flex relative shadow-inner">
                                        {contestant.totalVotesCount > 0 ? (
                                          <>
                                            {/* Real Votes Portion */}
                                            <div className="h-full bg-emerald-500" style={{ width: `${(contestant.realVotesCount / categoryTotal) * 100}%` }} />
                                            {/* Tweaked Votes Portion */}
                                            <div className="h-full bg-amber-400" style={{ width: `${(contestant.tweakedVotesCount / categoryTotal) * 100}%` }} />
                                          </>
                                        ) : (
                                          <div className="h-full w-full bg-slate-200" />
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)]">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-[#1e0a3c] tracking-tight flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-[#f05537] rounded-full shrink-0" />
                        Campaign Categories
                      </h3>
                      <p className="text-xs font-semibold text-gray-400">Manage voting categories and register contestants</p>
                    </div>
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="bg-gray-100 hover:bg-gray-200 text-[#1e0a3c] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-gray-200"
                      >
                        <span>+</span> Add Category
                      </button>
                      <button
                        onClick={() => setIsSelectCategoryModalOpen(true)}
                        className="bg-[#f05537] hover:bg-[#d1410c] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>+</span> Add Contestant
                      </button>
                    </div>
                  </div>

                  {/* Contestant Management Cards List */}
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category.id} className="bg-white rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] overflow-hidden">
                        <div className="p-6 border-b border-gray-150 bg-gradient-to-r from-gray-50/50 to-transparent flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-1 h-4 bg-[#f05537] rounded-full shrink-0" />
                            <div>
                              <h3 className="text-base font-black text-[#1e0a3c] tracking-tight">{category.name}</h3>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                SYSTEM UID: {category.id}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setContestantForm((prev) => ({ ...prev, category: category.name }));
                              setIsDrawerOpen(true);
                            }}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                          >
                            <span>+</span> Add Contestant
                          </button>
                        </div>

                        {/* Contestant listing under category */}
                        <div className="p-6 divide-y divide-gray-100 space-y-4">
                          {(category.contestants && category.contestants.length > 0) ? (
                            category.contestants.map((c: any) => {
                              return (
                                <div key={c.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <img src={c.image} className="h-14 w-14 object-cover rounded-xl border border-gray-100 bg-gray-50 shrink-0 shadow-sm" alt="" />
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-sm font-black text-gray-900 truncate">{c.name}</h4>
                                      
                                      {/* Audit standings */}
                                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[9px] font-black uppercase tracking-wider">
                                        <span className="text-slate-400">
                                          Total Standings: <strong className="text-slate-800">{c.totalVotesCount}</strong>
                                        </span>
                                        <span className="text-slate-200">•</span>
                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                          Real: <strong>{c.realVotesCount}</strong>
                                        </span>
                                        <span className="text-slate-200">•</span>
                                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                          Tweaked: <strong>{c.tweakedVotesCount}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* TWEAK INTERACTION BUTTONS */}
                                  <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto justify-start sm:justify-end mt-3 sm:mt-0">
                                    
                                    {/* Quick Increment capsules */}
                                    <div className="flex items-center gap-1.5 border border-gray-150 rounded-xl p-1 bg-gray-50 shadow-inner">
                                      <button
                                        onClick={() => handleTweakVotesCast(c.id, category.id, 5)}
                                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[9px] font-black text-gray-700 hover:text-indigo-600 active:scale-95 transition-all shadow-sm"
                                      >
                                        +5
                                      </button>
                                      <button
                                        onClick={() => handleTweakVotesCast(c.id, category.id, 25)}
                                        className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[9px] font-black text-gray-700 hover:text-indigo-600 active:scale-95 transition-all shadow-sm"
                                      >
                                        +25
                                      </button>
                                      {c.tweakedVotesCount >= 5 && (
                                        <button
                                          onClick={() => handleTweakVotesCast(c.id, category.id, -5)}
                                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-300 rounded-lg text-[9px] font-black text-rose-650 active:scale-95 transition-all shadow-sm"
                                        >
                                          -5
                                        </button>
                                      )}
                                    </div>

                                    {/* Direct adjustment input block */}
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        placeholder="Custom (e.g. 50)"
                                        value={customTweakCounts[c.id] || ''}
                                        onChange={(e) => setCustomTweakCounts(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        className="w-24 px-3 py-1.5 bg-white border border-gray-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-gray-800 outline-none placeholder-gray-400 shadow-sm"
                                      />
                                      <button
                                        onClick={() => handleCustomTweakSubmit(c.id, category.id)}
                                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition active:scale-95 shadow"
                                      >
                                        Adjust
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-xs font-semibold text-gray-400">
                              No contestants added to this category.
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center text-2xl mx-auto shadow-sm">
                        📁
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900">No Categories Found</p>
                        <p className="text-xs font-semibold text-gray-400 max-w-sm mx-auto">
                          You need to create categories first before you can register any contestants.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-[#f05537] hover:bg-[#d1410c] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                      >
                        <span>+</span> Create First Category
                      </button>
                    </div>
                  )}

                </div>

                {/* Right Columns (Vote Settings & Live Audit Feed) */}
                <div className="space-y-6 h-fit sticky top-24">
                  
                  {/* Vote Settings card */}
                  <div className="bg-white rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                      <span className="w-1.5 h-5 bg-[#f05537] rounded-full shrink-0" />
                      <div>
                        <h3 className="text-lg font-black text-[#1e0a3c] tracking-tight">
                          Rules Settings
                        </h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Configure campaign parameters</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-5">
                      
                      {/* Paid switch */}
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-150">
                        <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Paid Voting</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">Require transaction to vote</p>
                        </div>
                        <button 
                          onClick={() => setIsVotingPaid(!isVotingPaid)}
                          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isVotingPaid ? 'bg-indigo-650' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${isVotingPaid ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Vote cost input */}
                      <div className={`transition-all duration-300 ${isVotingPaid ? 'opacity-100 max-h-32' : 'opacity-40 max-h-32 pointer-events-none grayscale'}`}>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Cost Per Vote (₦)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xs">₦</span>
                          <input 
                            type="number" 
                            value={voteCost}
                            onChange={(e) => setVoteCost(Number(e.target.value))}
                            disabled={!isVotingPaid}
                            className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-550 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Live rankings switch */}
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-150">
                        <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-wide">Live Standings</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">Allow public to view leaders</p>
                        </div>
                        <button 
                          className="relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none bg-indigo-650"
                        >
                          <span className="pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out translate-x-6" />
                        </button>
                      </div>

                    </div>
                    
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="w-full bg-[#1e0a3c] hover:bg-[#2c1056] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10 hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-2 h-11"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Save Settings"
                      )}
                    </button>
                  </div>

                  {/* Real-time audit activity feed logs */}
                  <div className="bg-white rounded-[24px] border border-gray-150 shadow-[0_4px_25px_rgba(0,0,0,0.015)] p-6 md:p-8 flex flex-col gap-5">
                    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                      <span className="w-1.5 h-5 bg-[#f05537] rounded-full shrink-0" />
                      <div>
                        <h3 className="text-base font-black text-[#1e0a3c] tracking-tight">Recent Votes Activity</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Real-time audit log feeds</p>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activityLogs.length > 0 ? (
                        activityLogs.map((log, idx) => (
                          <div key={log.id || idx} className="p-3.5 rounded-xl bg-white border border-gray-100 hover:bg-slate-50 transition-all text-xs font-semibold space-y-1 relative">
                            <div className="flex justify-between items-center">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                log.isTweaked 
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              }`}>
                                {log.isTweaked ? "Tweaked Cast" : "Organic Cast"}
                              </span>
                              <span className="text-[9px] font-mono text-gray-400">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-gray-800 text-[11px] leading-relaxed">
                              Vote registered for <strong className="text-slate-950 font-black">{log.contestantName}</strong> ({log.categoryName})
                            </p>
                            <p className="text-[9.5px] font-mono text-gray-400 truncate">
                              Voter: {log.email}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-slate-400 font-bold text-xs">No active votes logged.</div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-16 text-center text-gray-500 font-medium">
          No events found. You need an event before you can enable voting.
        </div>
      )}

      {/* ── CONTESTANT CREATION SLIDE-OUT DRAWER ─────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-full max-w-4xl h-full border-l border-gray-150 bg-white p-6 md:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft z-10">
            
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                    Contestant Wizard
                  </span>
                  <h3 className="text-lg font-black text-gray-900 mt-1">Register New Candidate</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 rounded-full border border-gray-200 bg-slate-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all active:scale-90"
                >
                  ✕
                </button>
              </div>

              {contestantError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-650 p-4 rounded-xl text-xs font-black flex items-center gap-2">
                  <span>⚠️</span> {contestantError}
                </div>
              )}

              {/* Side-by-Side: Preview & Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left side: Live Card Preview */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate Card Preview</h4>
                  
                  <div className="bg-white rounded-[24px] border border-gray-150 shadow-[0_12px_40px_rgb(0,0,0,0.05)] overflow-hidden flex flex-col relative max-w-sm mx-auto">
                    
                    {/* Header Image */}
                    <div className="relative h-56 bg-slate-100 w-full overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Candidate preview" 
                          className="absolute inset-0 w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
                          <span className="text-3xl">📷</span>
                          <span className="text-[9px] font-black uppercase tracking-wider">No Photo Uploaded</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-4 left-4 bg-[#f05537] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                        <span>👑</span> Rank #1
                      </div>
                      
                      <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                        {contestantForm.category || 'Category Label'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-2.5">
                        <h3 className="text-sm font-black text-gray-900 leading-snug">
                          {contestantForm.name || 'Full Name'}
                          {contestantForm.nickname && (
                            <span className="text-[#f05537] font-extrabold text-xs ml-1.5 italic">
                              "{contestantForm.nickname}"
                            </span>
                          )}
                        </h3>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(contestantForm.department || 'Department') && (
                            <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-wider">
                              {contestantForm.department || 'Department'}
                            </span>
                          )}
                          {contestantForm.level && (
                            <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-wider">
                              {contestantForm.level}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl min-h-[60px] line-clamp-3">
                        "{contestantForm.bio || 'Provide a brief manifesto or personal message to convince voters to cast their ballot for you.'}"
                      </p>

                      {contestantForm.instagram && (
                        <p className="text-[10px] font-black text-pink-600">
                          📷 @{contestantForm.instagram.replace('@', '')}
                        </p>
                      )}

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                        <span>Total Votes: 0</span>
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg">Cast Vote</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right side: Form controls */}
                <form onSubmit={handleSaveContestant} className="space-y-4">
                  
                  {/* Photo upload input */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-gray-800">Contestant Photo</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG up to 5MB. Visual representation.</p>
                    </div>
                    <label className="bg-white border border-gray-200 hover:border-indigo-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-gray-700 cursor-pointer shadow-sm active:scale-95 transition-all">
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
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Teniola Adeyemi" 
                        value={contestantForm.name}
                        onChange={(e) => setContestantForm({...contestantForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Stage / Nickname</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Teni" 
                        value={contestantForm.nickname}
                        onChange={(e) => setContestantForm({...contestantForm, nickname: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Faculty</label>
                      <input 
                        type="text" 
                        placeholder="Science" 
                        value={contestantForm.faculty}
                        onChange={(e) => setContestantForm({...contestantForm, faculty: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Department</label>
                      <input 
                        type="text" 
                        placeholder="Computer Sci" 
                        value={contestantForm.department}
                        onChange={(e) => setContestantForm({...contestantForm, department: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Level</label>
                      <select 
                        value={contestantForm.level}
                        onChange={(e) => setContestantForm({...contestantForm, level: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-850 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm"
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
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Campaign Category</label>
                    <select 
                      value={contestantForm.category}
                      onChange={(e) => setContestantForm({...contestantForm, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#f05537] transition-all shadow-sm cursor-pointer"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 ? (
                      <p className="text-[9px] text-rose-550 font-bold mt-1.5 flex items-center gap-1">
                        <span>⚠️</span> Create a category first before adding contestants.
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 font-bold mt-1">Select from the categories created for this event.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Instagram Username</label>
                    <input 
                      type="text" 
                      placeholder="username" 
                      value={contestantForm.instagram}
                      onChange={(e) => setContestantForm({...contestantForm, instagram: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Manifesto / Short Bio</label>
                    <textarea 
                      rows={3} 
                      placeholder="Manifesto bio..." 
                      value={contestantForm.bio}
                      onChange={(e) => setContestantForm({...contestantForm, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:bg-white focus:border-indigo-550 transition-all shadow-sm resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingContestant}
                    className="w-full bg-[#f05537] hover:bg-[#d1410c] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingContestant ? (
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Save Contestant"
                    )}
                  </button>

                </form>

              </div>

            </div>

            <div className="pt-6 border-t border-gray-100 text-center text-[9px] font-mono text-gray-400">
              Creator Studio Secure Node Transaction
            </div>

          </div>
        </div>
      )}

      {/* ── CATEGORY CREATION MODAL ─────────────────────────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-[24px] bg-white border border-gray-150 p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-3xl">🗳️</span>
              <h3 className="text-lg font-black text-gray-950">Create New Category</h3>
              <p className="text-xs font-semibold text-gray-400">
                Setup a new contestant voting category box under this event.
              </p>
            </div>

            {categoryError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-650 p-3.5 rounded-xl text-xs font-black flex items-center gap-2">
                <span>⚠️</span> {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prom King, SUG President"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-250 rounded-xl text-xs font-bold text-gray-850 outline-none focus:bg-white focus:border-[#f05537] transition-all shadow-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCategory}
                className="w-full h-11 rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-xs font-black uppercase text-white transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingCategory ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
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
                className="w-full text-center text-[10px] font-bold text-gray-400 hover:underline pt-1 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── SELECT CATEGORY MODAL FOR CONTESTANT ADDITION ────────────────── */}
      {isSelectCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-[24px] bg-white border border-gray-150 p-6 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#f05537] bg-[#f05537]/10 px-2.5 py-1 rounded">
                  Category Router
                </span>
                <h3 className="text-lg font-black text-gray-950 mt-1">Select Candidate Category</h3>
              </div>
              <button
                onClick={() => setIsSelectCategoryModalOpen(false)}
                className="h-8 w-8 rounded-full border border-gray-200 bg-slate-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all active:scale-90"
              >
                ✕
              </button>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400">
                  Select a category box below to add a contestant under that category:
                </p>
                
                {/* Categories selection grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
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
                        className="p-5 rounded-2xl border border-gray-150 hover:border-[#f05537] bg-gray-50/30 hover:bg-orange-50/20 text-left transition-all hover:-translate-y-0.5 active:scale-98 cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f05537]/5 to-transparent rounded-full blur-xl pointer-events-none group-hover:from-[#f05537]/10" />
                        <span className="text-sm font-black text-slate-800 group-hover:text-[#f05537] transition-colors line-clamp-2 leading-tight">
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>👥</span> {contestantCount} {contestantCount === 1 ? 'Contestant' : 'Contestants'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-2xl mx-auto shadow-sm">
                  ⚠️
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-black text-gray-900">No Categories Found</p>
                  <p className="text-xs font-semibold text-gray-400 max-w-sm mx-auto">
                    You cannot register contestants without any categories. Create at least one category to continue.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectCategoryModalOpen(false);
                    setIsCategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-[#f05537] hover:bg-[#d1410c] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>+</span> Add Category
                </button>
              </div>
            )}
            
            <div className="text-center text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-4">
              Creator Studio Secure Node
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
