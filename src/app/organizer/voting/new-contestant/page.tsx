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
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-20 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-md">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Missing Event Selection</h2>
        <p className="text-gray-500 mb-8 max-w-md">You need to select an event before adding a contestant. Let's get you back to the voting dashboard.</p>
        <Link href="/organizer/voting" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-1 no-underline">
          Go to Voting Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20 relative">
      
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
      <div className="absolute top-40 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -mr-20 pointer-events-none"></div>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 mb-2 relative z-10">
        <Link href="/organizer/voting" className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] rounded-2xl flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:-translate-x-1 transition-all no-underline group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="group-hover:scale-110 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Add Contestant</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {eventData ? `Uploading to: ${eventData.title}` : 'Upload a participant for the active voting categories.'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50/90 backdrop-blur-md border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 relative z-10 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 relative z-10">
        
        {/* ── FORM ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              Contestant Profile
            </h3>
            
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="E.g. Precious Ademuwagun" 
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Nickname / Stage Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Preshy" 
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    value={form.nickname}
                    onChange={(e) => setForm({...form, nickname: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Faculty</label>
                  <input 
                    type="text" 
                    placeholder="Engineering" 
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    value={form.faculty}
                    onChange={(e) => setForm({...form, faculty: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Department</label>
                  <input 
                    type="text" 
                    placeholder="Computer Eng." 
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Level</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-5 pr-10 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner appearance-none"
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
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-gray-400"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Short Bio / Manifesto</label>
                <textarea 
                  rows={4}
                  placeholder="Why should people vote for you? (Max 250 words)" 
                  className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner resize-none leading-relaxed"
                  value={form.bio}
                  onChange={(e) => setForm({...form, bio: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Instagram Handle</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="username" 
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                    value={form.instagram}
                    onChange={(e) => setForm({...form, instagram: e.target.value})}
                  />
                </div>
              </div>

            </div>
          </div>
          
          {/* Category Assignment */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  Category Assignment
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-2">Which category is this contestant running in?</p>
              </div>
            </div>
            
            <div className="relative">
              <input 
                type="text"
                list="categories"
                placeholder="Type or select a category (e.g. Prom King)"
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
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
            <p className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              If the category doesn't exist, we'll create it for you automatically.
            </p>
          </div>
        </div>

        {/* ── LIVE PREVIEW & UPLOAD ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          
          <div className="sticky top-24 flex flex-col gap-8">
            
            {/* Live Preview Card */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Live Preview</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              
              <div className="bg-white rounded-[32px] border border-gray-100/50 shadow-[0_20px_50px_rgb(0,0,0,0.1)] overflow-hidden flex flex-col group relative transition-all duration-300 hover:shadow-[0_20px_50px_rgb(79,70,229,0.15)] hover:-translate-y-1">
                
                {/* Image Upload Area */}
                <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200 w-full cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-colors hover:from-indigo-50 hover:to-purple-50">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 z-10 relative pointer-events-none group-hover:text-indigo-500 transition-colors bg-white/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/60 shadow-sm">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span className="text-[10px] font-black tracking-widest uppercase">Upload Photo</span>
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
                  
                  {/* Category Badge overlay */}
                  <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-md border border-white/30 px-3.5 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-widest z-10 shadow-lg">
                    {form.category || 'Category'}
                  </div>
                </div>

                {/* Card Content Preview */}
                <div className="p-7 relative z-10 bg-white -mt-4 rounded-t-[32px]">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 leading-tight">
                        {form.name || 'Full Name'} {form.nickname && <span className="text-indigo-500 font-bold ml-1">"{form.nickname}"</span>}
                      </h3>
                      <p className="text-[11px] font-black text-gray-500 mt-2 flex items-center gap-1.5 uppercase tracking-widest">
                        {form.department || 'Department'} {form.level && <span className="text-gray-300">•</span>} {form.level}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 font-medium line-clamp-3 mt-4 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {form.bio || 'This is how the short bio will appear to voters on the main event page. Make it catchy!'}
                  </p>

                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl shadow-inner">
                        🔥
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Votes</span>
                        <span className="text-xl font-black text-gray-900 leading-none">0</span>
                      </div>
                    </div>
                    
                    <button className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-xl font-black text-sm pointer-events-none opacity-50 shadow-md">
                      Vote Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4.5 rounded-2xl font-black tracking-wide text-sm transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2 h-14"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save Contestant
                  </>
                )}
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm">
                Bulk Import (CSV)
              </button>
            </div>

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
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    }>
      <AddContestantForm />
    </Suspense>
  );
}
