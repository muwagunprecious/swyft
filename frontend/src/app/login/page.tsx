'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { universities } from '@/lib/swyft-data';

function UniversityPopup({ onSave, onSkip }: { onSave: (uni: string) => void; onSkip: () => void }) {
  const [selectedUni, setSelectedUni] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedUni) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('otix_token');
      const res = await api.patch('/auth/profile', { university: selectedUni }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update stored user
      const stored = localStorage.getItem('otix_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.university = selectedUni;
        localStorage.setItem('otix_user', JSON.stringify(user));
      }
      onSave(selectedUni);
    } catch (err) {
      // Even if it fails, save locally and continue
      const stored = localStorage.getItem('otix_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.university = selectedUni;
        localStorage.setItem('otix_user', JSON.stringify(user));
      }
      onSave(selectedUni);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 10, 35, 0.75)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '40px 36px', maxWidth: '420px', width: '100%', margin: '16px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Icon */}
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, #FFF5F2, #FEE2E2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.8rem' }}>🎓</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Which university are you at?
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '24px' }}>
          This helps us show you events from your campus. You can always change this in settings later.
        </p>

        {/* University dropdown */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <select
            value={selectedUni}
            onChange={(e) => setSelectedUni(e.target.value)}
            style={{
              width: '100%', padding: '13px 40px 13px 14px', borderRadius: '12px',
              border: `2px solid ${selectedUni ? '#f05537' : '#E5E7EB'}`,
              background: '#F9FAFB', fontSize: '0.95rem', color: selectedUni ? '#111827' : '#9CA3AF',
              outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxSizing: 'border-box', transition: 'border-color 0.15s ease',
            }}
          >
            <option value="">Select your university...</option>
            {universities.filter(u => u !== 'Others').map((uni) => (
              <option key={uni} value={uni}>{uni}</option>
            ))}
            <option value="Others">Others</option>
          </select>
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={handleSave}
          disabled={!selectedUni || saving}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: selectedUni && !saving ? 'linear-gradient(135deg, #f05537, #d1410c)' : '#E5E7EB',
            color: selectedUni && !saving ? '#fff' : '#9CA3AF',
            fontWeight: 800, fontSize: '0.95rem', cursor: selectedUni ? 'pointer' : 'default',
            marginBottom: '10px', transition: 'all 0.2s ease',
            boxShadow: selectedUni ? '0 4px 16px rgba(240,85,55,0.35)' : 'none',
          }}
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>

        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
            background: 'transparent', color: '#9CA3AF', fontWeight: 600,
            fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Skip for now
        </button>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.85) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerHref, setRegisterHref] = useState('/register');
  const [showUniPopup, setShowUniPopup] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search) setRegisterHref(`/register${search}`);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('otix_token', res.data.token);
      localStorage.setItem('otix_user', JSON.stringify(res.data.user));

      const searchParams = new URLSearchParams(window.location.search);
      const redirectTarget = searchParams.get('redirect');
      const target = redirectTarget || (res.data.user.role === 'ORGANIZER' ? '/organizer' : '/dashboard');

      // Show university popup if no university saved
      if (!res.data.user.university) {
        setPendingRedirect(target);
        setShowUniPopup(true);
        setLoading(false);
      } else {
        window.location.href = target;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleUniSaved = (uni: string) => {
    setShowUniPopup(false);
    window.location.href = pendingRedirect;
  };

  const handleUniSkip = () => {
    setShowUniPopup(false);
    window.location.href = pendingRedirect;
  };

  return (
    <>
      {showUniPopup && <UniversityPopup onSave={handleUniSaved} onSkip={handleUniSkip} />}

      <div style={{ minHeight: '100vh', display: 'flex' }}>

        {/* Left: Dark Branding Panel */}
        <div style={{
          flex: '0 0 440px', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px 40px', position: 'relative', overflow: 'hidden',
          backgroundImage: 'linear-gradient(180deg, rgba(10, 4, 26, 0.93) 0%, rgba(10, 4, 26, 0.88) 100%), url(https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} className="lg:flex">
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,85,55,0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '15%', right: '-10%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,85,55,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,85,55,0.1) 0%, transparent 70%)', filter: 'blur(45px)', pointerEvents: 'none' }} />
          
          {/* Grid pattern overlay */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)', 
            backgroundSize: '24px 24px', 
            opacity: 0.8,
            pointerEvents: 'none' 
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f05537, #d1410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(240,85,55,0.45)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>SWYFT</span>
            <span style={{ 
              fontSize: '0.62rem', fontWeight: 800, color: '#f05537', 
              background: 'rgba(240,85,55,0.15)', border: '1px solid rgba(240,85,55,0.3)',
              padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.05em'
            }}>CAMPUS</span>
          </div>

          {/* Mid */}
          <div style={{ position: 'relative', zIndex: 1, margin: '48px 0' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 950, color: '#fff', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.03em' }}>
              Welcome back to<br />
              <span style={{ 
                background: 'linear-gradient(90deg, #ff8a65 0%, #ff5252 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>campus life.</span>
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '36px' }}>
              Sign in to access your tickets, upcoming events, and campus activity feed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  title: 'Instant QR-Code Delivery',
                  desc: 'Get secure digital admission tickets instantly.',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="6" height="6" x="7" y="7"/><rect width="6" height="6" x="7" y="11"/><rect width="6" height="6" x="11" y="7"/><path d="M7 17h.01M17 7h.01M17 17h.01"/>
                    </svg>
                  )
                },
                {
                  title: 'Secure Paystack Checkout',
                  desc: 'Safely pay via bank transfer, card, or USSD.',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  )
                },
                {
                  title: 'Campus Election Voting',
                  desc: 'Cast verified votes in secure student polls.',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2.5">
                      <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  )
                },
                {
                  title: 'Create & Manage Events',
                  desc: 'Host concerts, workshops, and SUG events.',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  )
                }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(240, 85, 55, 0.2)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
                >
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', 
                    background: 'rgba(240, 85, 55, 0.1)', border: '1px solid rgba(240, 85, 55, 0.25)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700, margin: '0 0 3px' }}>{item.title}</h4>
                    <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '1rem' }}>🇳🇬</span>
            <p style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>
              Serving students across 10+ campuses
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: '#fff', minHeight: '100vh' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>

            {/* Mobile Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', justifyContent: 'center' }} className="lg:hidden">
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f05537, #d1410c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em' }}>SWYFT</span>
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', marginBottom: '6px', letterSpacing: '-0.03em' }}>Welcome back</h1>
            <p style={{ color: '#6B7280', marginBottom: '28px', fontSize: '0.95rem' }}>Sign in to your SWYFT account.</p>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="you@student.edu.ng"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: '0.8rem', color: '#f05537', fontWeight: 600, textDecoration: 'none' }}>Forgot?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                  background: loading ? '#E5E7EB' : 'linear-gradient(135deg, #f05537, #d1410c)',
                  color: loading ? '#9CA3AF' : '#fff', fontWeight: 800, fontSize: '1rem',
                  cursor: loading ? 'default' : 'pointer', marginTop: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(240,85,55,0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? (
                  <><span style={{ width: '18px', height: '18px', border: '2px solid #9CA3AF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: '#F3F4F6' }} />
              <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#F3F4F6' }} />
            </div>

            {/* Google Button */}
            <button style={{
              width: '100%', padding: '13px', borderRadius: '12px',
              border: '1.5px solid #E5E7EB', background: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#374151',
              transition: 'all 0.15s ease',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.875rem', color: '#6B7280' }}>
              Don&apos;t have an account?{' '}
              <Link href={registerHref} style={{ color: '#f05537', fontWeight: 700, textDecoration: 'none' }}>Sign up free</Link>
            </p>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @media (min-width: 1024px) { .lg\\:flex { display: flex !important; } .lg\\:hidden { display: none !important; } }
            `}</style>
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #E5E7EB', background: '#F9FAFB', fontSize: '0.9rem',
  color: '#111827', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s ease', fontFamily: 'inherit',
};
