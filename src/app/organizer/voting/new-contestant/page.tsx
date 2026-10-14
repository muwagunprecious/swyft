'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function AddContestantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [form, setForm] = useState({
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
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (eventId) {
      // Fetch event info to confirm eventId is valid and to get existing categories
      api.get('/organizer/events').then(res => {
        const ev = res.data.find((e: any) => e.id === eventId);
        if (ev) setEventData(ev);
        // We could extract existing categories if they were returned, but for now we just use some defaults in the datalist
      }).catch(err => console.error(err));
    }
  }, [eventId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 5MB.');
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

  const handleSave = async () => {
    setErrorMsg('');
    if (!eventId) {
      setErrorMsg('Event ID is missing. Please return to the voting dashboard and select an event.');
      return;
    }
    if (!form.name || !form.category) {
      setErrorMsg('Please fill out the contestant name and category.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/organizer/contestants', {
        ...form,
        eventId,
        image: imageBase64
      });
      router.push('/organizer/voting');
    } catch (error: any) {
      console.error('Error adding contestant', error);
      setErrorMsg(error.response?.data?.message || 'Failed to add contestant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!eventId) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center p-12 text-center bg-[#121212] border border-[#262626] rounded-2xl space-y-4 my-12">
        <div className="w-12 h-12 bg-[#171717] border border-[#262626] rounded-full flex items-center justify-center text-xl">
          ⚠️
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#fafafa]">Missing Event Selection</h2>
          <p className="text-xs text-[#9ca3af] max-w-md">You need to select an event before adding a contestant. Let's get you back to the voting dashboard.</p>
        </div>
        <Link href="/organizer/voting" className="rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white px-6 py-2.5 text-xs font-semibold transition active:scale-95 no-underline">
          Go to Voting Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link 
          href="/organizer/voting" 
          className="w-10 h-10 bg-[#121212] border border-[#262626] hover:border-[#374151] rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] transition-all no-underline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Add Contestant</h1>
          <p className="text-xs text-[#9ca3af]">
            {eventData ? `Registering candidate for ${eventData.title}` : 'Upload a participant for the active voting categories.'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/50 border border-rose-800/40 text-rose-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        
        {/* ── FORM ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
            <h3 className="text-base font-bold text-[#fafafa]">
              Contestant Profile
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Precious Ademuwagun" 
                    className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">
                    Nickname / Stage Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Preshy" 
                    className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                    value={form.nickname}
                    onChange={(e) => setForm({...form, nickname: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Faculty</label>
                  <input 
                    type="text" 
                    placeholder="Engineering" 
                    className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                    value={form.faculty}
                    onChange={(e) => setForm({...form, faculty: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Department</label>
                  <input 
                    type="text" 
                    placeholder="Computer Eng." 
                    className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Level</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition cursor-pointer"
                    value={form.level}
                    onChange={(e) => setForm({...form, level: e.target.value})}
                  >
                    <option value="">Select Level</option>
                    <option value="100L">100L</option>
                    <option value="200L">200L</option>
                    <option value="300L">300L</option>
                    <option value="400L">400L</option>
                    <option value="500L">500L</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Short Bio / Manifesto</label>
                <textarea 
                  rows={4}
                  placeholder="Why should people vote for you? (Max 250 words)" 
                  className="w-full px-4 py-3 bg-[#171717] border border-[#262626] rounded-2xl text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373] resize-none"
                  value={form.bio}
                  onChange={(e) => setForm({...form, bio: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#737373] uppercase tracking-wider mb-1.5">Instagram Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373] text-xs">@</span>
                  <input 
                    type="text" 
                    placeholder="username" 
                    className="w-full pl-8 pr-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                    value={form.instagram ? form.instagram.replace('@', '') : ''}
                    onChange={(e) => setForm({...form, instagram: e.target.value})}
                  />
                </div>
              </div>

            </div>
          </div>
          
          {/* Category Assignment */}
          <div className="bg-[#121212] rounded-2xl border border-[#262626] p-6 md:p-8 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#fafafa]">
                Category Assignment
              </h3>
              <p className="text-xs text-[#9ca3af] mt-0.5">Which ballot category is this contestant running in?</p>
            </div>
            
            <div className="relative">
              <input 
                type="text"
                list="categories"
                placeholder="Type or select a category (e.g. Prom King)"
                className="w-full px-4 py-2.5 bg-[#171717] border border-[#262626] rounded-full text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition placeholder-[#737373]"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
              />
              <datalist id="categories">
                <option value="Prom King" />
                <option value="Prom Queen" />
                <option value="Most Popular Student" />
                <option value="Fresher of the Year" />
                <option value="Sportsman of the Year" />
              </datalist>
            </div>
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <span>✓</span> If the category doesn't exist, it will be created automatically.
            </p>
          </div>
        </div>

        {/* ── LIVE PREVIEW & UPLOAD ─────────────────────────────────── */}
        <div className="space-y-6 sticky top-24">
          
          {/* Live Preview Card */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-medium text-[#737373] uppercase tracking-wider">Candidate Card Preview</h3>
            
            <div className="bg-[#121212] rounded-2xl border border-[#262626] overflow-hidden flex flex-col shadow-sm">
              
              {/* Image Upload Area */}
              <div className="relative h-64 bg-[#171717] w-full cursor-pointer overflow-hidden flex flex-col items-center justify-center border-b border-[#262626] group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#737373] z-10">
                    <span className="text-2xl">📷</span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-[#fafafa] bg-[#262626] px-3 py-1 rounded-full">
                      Choose Photo
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                
                {/* Category Badge overlay */}
                <div className="absolute top-3 right-3 bg-[#121212]/80 backdrop-blur-md border border-[#262626] px-3 py-1 rounded-full text-[9px] font-semibold text-[#fafafa] uppercase tracking-wider z-10">
                  {form.category || 'Category'}
                </div>
              </div>

              {/* Card Content Preview */}
              <div className="p-6 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-[#fafafa] leading-tight">
                    {form.name || 'Full Name'} {form.nickname && <span className="text-[#9ca3af] font-medium text-xs ml-1 italic">"{form.nickname}"</span>}
                  </h3>
                  <p className="text-[10px] font-medium text-[#9ca3af] mt-1 uppercase tracking-wider">
                    {form.department || 'Department'} {form.level && <span>• {form.level}</span>}
                  </p>
                </div>

                <p className="text-xs text-[#9ca3af] bg-[#171717] border border-[#262626] p-3 rounded-xl min-h-[50px] line-clamp-3">
                  {form.bio || 'This is how the short bio will appear to voters on the main event page.'}
                </p>

                <div className="flex justify-between items-center pt-3 border-t border-[#262626]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <div>
                      <span className="text-[9px] font-medium text-[#737373] uppercase tracking-wider block">Total Votes</span>
                      <span className="text-sm font-bold text-[#fafafa] leading-none">0</span>
                    </div>
                  </div>
                  
                  <span className="bg-[#fafafa] text-[#0a0a0a] px-4 py-1.5 rounded-full text-xs font-semibold opacity-50 pointer-events-none">
                    Vote Now
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full rounded-full bg-[#fafafa] text-[#0a0a0a] hover:bg-white py-3 font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                "Save Contestant"
              )}
            </button>
            <button 
              type="button"
              className="w-full rounded-full border border-[#262626] bg-[#171717] hover:bg-[#202020] hover:border-[#374151] text-[#fafafa] py-2.5 font-semibold text-xs transition cursor-pointer"
            >
              Bulk Import (CSV)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function AddContestant() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#262626] border-t-[#fafafa] rounded-full animate-spin"></div>
      </div>
    }>
      <AddContestantForm />
    </Suspense>
  );
}
