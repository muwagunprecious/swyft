'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { universities } from '@/lib/swyft-data';

const roles = [
  { id: 'STUDENT', label: 'Student', desc: 'Buy tickets & vote in campus events', icon: '🎓' },
  { id: 'ORGANIZER', label: 'Event Organizer', desc: 'Create and manage campus events', icon: '🎪' },
];

export default function Register() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', matric: '', university: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerHref, setRegisterHref] = useState('/login');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search) setRegisterHref(`/login${search}`);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', {
        ...form,
        role,
        matricNumber: form.matric || undefined,
        university: form.university || undefined,
      });

      const loginRes = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('otix_token', loginRes.data.token);
      localStorage.setItem('otix_user', JSON.stringify(loginRes.data.user));

      const userRole = loginRes.data.user.role;
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTarget = searchParams.get('redirect');
      const target = redirectTarget || (userRole === 'ORGANIZER' ? '/organizer' : '/dashboard');
      window.location.href = target;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F0A23' }}>

      {/* Left: Decorative panel */}
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

        {/* Middle content */}
        <div style={{ position: 'relative', zIndex: 1, margin: '48px 0' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 950, color: '#fff', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.03em' }}>
            Your campus life,<br />
            <span style={{ 
              background: 'linear-gradient(90deg, #ff8a65 0%, #ff5252 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>supercharged.</span>
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '36px' }}>
            Join thousands of students who discover events, cast votes, and get tickets instantly.
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

        {/* Bottom tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '1rem' }}>🇳🇬</span>
          <p style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>
            Serving students across 10+ campuses
          </p>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#fff', overflowY: 'auto', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>

          {/* Mobile Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', justifyContent: 'center' }} className="lg:hidden">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f05537, #d1410c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em' }}>SWYFT</span>
          </div>

          {/* Step 0: Role Selection */}
          {step === 0 && (
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', marginBottom: '6px', letterSpacing: '-0.03em' }}>Create your account</h1>
              <p style={{ color: '#6B7280', marginBottom: '28px', fontSize: '0.95rem' }}>How will you use SWYFT?</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      padding: '20px 24px',
                      borderRadius: '16px',
                      border: `2px solid ${role === r.id ? '#f05537' : '#E5E7EB'}`,
                      background: role === r.id ? '#FFF5F2' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.15s ease',
                      boxShadow: role === r.id ? '0 0 0 4px rgba(240,85,55,0.08)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '2rem', lineHeight: 1 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '2px' }}>{r.label}</p>
                      <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0 }}>{r.desc}</p>
                    </div>
                    {role === r.id && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f05537', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => role && setStep(1)}
                disabled={!role}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                  background: role ? 'linear-gradient(135deg, #f05537, #d1410c)' : '#E5E7EB',
                  color: role ? '#fff' : '#9CA3AF', fontWeight: 800, fontSize: '1rem',
                  cursor: role ? 'pointer' : 'default', transition: 'all 0.2s ease',
                  boxShadow: role ? '0 4px 16px rgba(240,85,55,0.35)' : 'none',
                }}
              >
                Continue →
              </button>

              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#6B7280' }}>
                Already have an account?{' '}
                <Link href={registerHref} style={{ color: '#f05537', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* Step 1: Details Form */}
          {step === 1 && (
            <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #F3F4F6', padding: '36px', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
              <button onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6B7280', fontWeight: 600, cursor: 'pointer', marginBottom: '24px', fontSize: '0.875rem', padding: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back
              </button>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '4px', letterSpacing: '-0.02em' }}>Your details</h2>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '28px' }}>
                Registering as a{' '}
                <span style={{ color: '#f05537', fontWeight: 700, background: '#FFF5F2', padding: '2px 8px', borderRadius: '6px' }}>
                  {roles.find((r) => r.id === role)?.label}
                </span>
              </p>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Full Name */}
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Ayomide Adekunle"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/* Email + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
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
                    <label style={labelStyle}>Phone</label>
                    <input
                      style={inputStyle}
                      type="tel"
                      placeholder="080XXXXXXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* University Selector */}
                <div>
                  <label style={labelStyle}>University / Campus</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '40px', cursor: 'pointer', background: '#F9FAFB' }}
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
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
                </div>

                {/* Matric (Students only) */}
                {role === 'STUDENT' && (
                  <div>
                    <label style={labelStyle}>Matric Number <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="FOS/19/0001"
                      value={form.matric}
                      onChange={(e) => setForm({ ...form, matric: e.target.value })}
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                    background: loading ? '#E5E7EB' : 'linear-gradient(135deg, #f05537, #d1410c)',
                    color: loading ? '#9CA3AF' : '#fff', fontWeight: 800, fontSize: '1rem',
                    cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', marginTop: '4px',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(240,85,55,0.35)',
                  }}
                >
                  {loading ? (
                    <><span style={{ width: '18px', height: '18px', border: '2px solid #9CA3AF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Creating account...</>
                  ) : 'Create Account →'}
                </button>

                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                  By signing up you agree to our{' '}
                  <a href="#" style={{ color: '#f05537', textDecoration: 'none' }}>Terms</a> and{' '}
                  <a href="#" style={{ color: '#f05537', textDecoration: 'none' }}>Privacy Policy</a>
                </p>
              </form>
            </div>
          )}

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @media (min-width: 1024px) { .lg\\:flex { display: flex !important; } .lg\\:hidden { display: none !important; } }
          `}</style>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1.5px solid #E5E7EB', background: '#F9FAFB', fontSize: '0.9rem',
  color: '#111827', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
  fontFamily: 'inherit',
};
