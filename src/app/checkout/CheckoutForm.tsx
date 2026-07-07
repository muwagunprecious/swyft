'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import api from '@/lib/api';

const steps = ['Your Info', 'Review Order', 'Payment'];

export default function CheckoutForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', matric: '' });
  const [orderData, setOrderData] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyingText, setVerifyingText] = useState('Connecting to Paystack secure channel...');
  const [orderLoadingText, setOrderLoadingText] = useState('Initiating secure transaction channel...');
  const [checkoutReference, setCheckoutReference] = useState('');
  const [fallbackRef, setFallbackRef] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  useEffect(() => {
    if (step !== 2) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("Your 5-minute ticket reservation has expired. The tickets have been released back to the marketplace.");
          localStorage.removeItem('otix_cart');
          router.push('/events');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

   useEffect(() => {
     setFallbackRef(`REF-${Date.now()}`);
     const token = localStorage.getItem('otix_token');

     const savedCart = localStorage.getItem('otix_cart');
     const user = localStorage.getItem('otix_user');
     
     if (savedCart) {
       try {
         setCartItems(JSON.parse(savedCart));
       } catch (e) {
         console.error('Failed to parse cart from localStorage', e);
         setCartItems([]);
       }
     }

     if (user) {
       try {
         const userData = JSON.parse(user);
         setForm(prev => ({ ...prev, name: userData.name, email: userData.email }));
       } catch (e) {
         console.error('Failed to parse user from localStorage', e);
       }
     }
   }, []); // Empty deps since we don't use router in effect

   const subtotal = cartItems.reduce((acc, item) => {
     const price = Number(item.price) || 0;
     const qty = Number(item.qty) || 0;
     return acc + (price * qty);
   }, 0);
  // OTIX Platform Fee: 5% + ₦100
  const fee = Math.round(subtotal * 0.05) + 100;
  const total = subtotal + fee;

  // Retrieve subaccount code from the first cart item (all items belong to the same event)
  const subaccountCode = cartItems.length > 0 ? cartItems[0].subaccountCode : undefined;

  const config: any = {
    reference: orderData?.reference || checkoutReference || fallbackRef,
    email: form.email,
    amount: total * 100, // Paystack expects kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_demo',
  };

  // If the event organizer has a linked payout account, route funds to them directly
  if (subaccountCode) {
    config.subaccount = subaccountCode;
    // Platform bears Paystack's transaction fee so the organizer gets exactly their subtotal
    config.bearer = 'account';
    // The platform takes the calculated OTIX fee flat
    config.transaction_charge = fee * 100;
  }

  const initializePayment = usePaystackPayment(config);

   const onSuccess = async (reference: any) => {
     setVerifyingPayment(true);

     // Extract reference from Paystack response (handles both string and object formats)
     const paymentReference = typeof reference === 'object' && reference !== null && reference.reference 
       ? reference.reference 
       : reference;

     const stepsList = [
       'Connecting to Paystack secure channel...',
       'Verifying transaction signature...',
       'Securing unique admission credentials...',
       'Generating secure invoice receipt...'
     ];

     let currentStep = 0;
     const interval = setInterval(() => {
       currentStep++;
       if (currentStep < stepsList.length) {
         setVerifyingText(stepsList[currentStep]);
       }
     }, 250);

      try {
        // Extract reference from Paystack response (handles both string and object formats)
        const paymentReference = typeof reference === 'object' && reference !== null && reference.reference 
          ? reference.reference 
          : reference;
        
        const rawRef = orderData?.reference || checkoutReference || paymentReference;
        const refToUse = rawRef ? rawRef.trim() : '';
        
        if (!refToUse) {
          throw new Error('Payment reference is missing');
        }
        
        console.log('Verifying payment with reference:', refToUse); // Debug log
        const response = await api.post(`/orders/verify-payment/${refToUse}`);
       console.log('Payment verification response:', response); // Debug log
       localStorage.removeItem('otix_cart');

       const remainingTime = Math.max(0, 1000 - currentStep * 250);
       setTimeout(() => {
         clearInterval(interval);
         // Note: We keep verifyingPayment as true here so the full-screen loader remains active
         // and doesn't flash the checkout payment card while Next.js finishes router.push() navigation!
         router.push(`/success?ref=${refToUse}`);
       }, remainingTime);
     } catch (err: any) {
       clearInterval(interval);
       setVerifyingPayment(false);
       console.error('Payment verification failed:', err);
       if (err.response) {
         console.error('Error response data:', JSON.stringify(err.response.data, null, 2));
         console.error('Error response status:', err.response.status);
       }
       alert('Payment verification failed. Please contact support. Details: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
     }
   };

  const onClose = () => {
    console.log('Payment closed');
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setOrderLoadingText('Connecting to OOU secure admission gateway...');
    
    // Generate the unique payment reference on the frontend
    const ref = `REF-${Date.now()}`;
    setCheckoutReference(ref);
    
    const interval = setInterval(() => {
      const steps = [
        'Connecting to OOU secure admission gateway...',
        'Verifying ticket remaining capacity...',
        'Securing unique seat reservation keys...',
        'Generating digital admission credentials...',
        'Sealing transaction invoice details...',
        'Finalizing database synchronization...'
      ];
      setOrderLoadingText(prev => {
        const idx = steps.indexOf(prev);
        return steps[(idx + 1) % steps.length];
      });
    }, 200);

    try {
      const items = cartItems.map(item => ({
        ticketId: item.ticketId || item.id, // Ensure we use the correct ID
        quantity: item.qty
      }));

      const res = await api.post('/orders', { 
        items,
        name: form.name,
        email: form.email,
        phone: form.phone,
        matricNumber: form.matric,
        reference: ref
      });
      clearInterval(interval);
      setOrderLoadingText('Order created successfully!');
      setOrderData(res.data);
      setStep(2);
    } catch (err: any) {
      clearInterval(interval);
      console.error('Failed to create order', err);
      alert(err.response?.data?.message || 'Failed to create order');
      
      if (err.response?.status === 401) {
        localStorage.removeItem('otix_token');
        localStorage.removeItem('otix_user');
        router.push('/login?redirect=/checkout');
      }
      
      alert('Failed to create order. Details: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <div style={{ background: '#F9FAFB', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Your cart is empty.</p>
          <Link href="/events" className="btn-indigo">Browse Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', padding: '48px 0' }}>
      <div className="wrap" style={{ maxWidth: '960px' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '0' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: i < step ? '#10B981' : i === step ? '#f05537' : '#E5E7EB',
                  color: i <= step ? '#fff' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.875rem', flexShrink: 0, transition: 'all 0.2s',
                }}>
                  {i < step ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                </div>
                <span style={{ fontWeight: i === step ? 800 : 600, color: i === step ? '#f05537' : '#9CA3AF', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: '2px', background: i < step ? '#10B981' : '#E5E7EB', margin: '0 16px', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Main Panel */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden w-full lg:w-[calc(100%-352px)] flex-1">

            {/* Step 0: User Info */}
            {step === 0 && (
              <div style={{ padding: '32px' }}>
                <h2 className="text-xl font-black mb-2 uppercase tracking-wider text-gray-950 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#f05537] rounded-full" />
                  Personal Information
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '28px' }}>Your ticket will be sent to the email address below.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ayomide Adekunle', required: true },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@student.oouagoiwoye.edu.ng', required: true },
                    { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '080XXXXXXXX', required: true },
                    { label: 'Matric Number (optional)', key: 'matric', type: 'text', placeholder: 'FOS/19/20/0001', required: false },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</label>
                      <input
                        className="w-full h-12 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none transition-all focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/15"
                        type={type}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(1)}
                  disabled={!form.name || !form.email || !form.phone}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-sm font-black uppercase tracking-wider text-white shadow-md hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 mt-7"
                >
                  Continue to Review →
                </button>
              </div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <div style={{ padding: '32px' }}>
                <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-gray-950 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#f05537] rounded-full" />
                  Review Your Order
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {cartItems.map((item, idx) => (
                    <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginBottom: '8px' }}>
                      <p style={{ fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{item.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>{item.qty}× {item.ticketType}</p>
                        <p style={{ fontWeight: 800, color: '#111827' }}>₦{(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    { label: 'Attendee', value: form.name || '—' },
                    { label: 'Email', value: form.email || '—' },
                    { label: 'Phone', value: form.phone || '—' },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 600 }}>{r.label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#111827' }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setStep(0)} 
                    className="flex-1 flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleCreateOrder} 
                    disabled={loading}
                    className="flex-[2] flex h-12 items-center justify-center rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-sm font-black uppercase tracking-wider text-white shadow-md hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                  >
                    {loading ? 'Creating Order...' : 'Confirm & Proceed →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div style={{ padding: '32px' }}>
                <h2 className="text-xl font-black mb-2 uppercase tracking-wider text-gray-950 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#f05537] rounded-full" />
                  Complete Payment
                </h2>

                {/* Countdown Timer Display */}
                <div style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#991B1B',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                  <span>Ticket reserved for: <strong style={{ color: '#DC2626', fontSize: '0.95rem', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</strong></span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '28px' }}>Click below to pay securely with Paystack.</p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', marginBottom: '28px', display: 'inline-block', minWidth: '260px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Amount Due</p>
                    <p style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f05537' }}>₦{total.toLocaleString()}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (timeLeft <= 0) {
                      alert('Your reservation has expired. Please go back and reserve again.');
                      return;
                    }
                    // Validate required fields
                    if (!form.email || !form.email.trim()) {
                      alert('Please enter a valid email address');
                      return;
                    }
                    
                    if (total <= 0) {
                      alert('Invalid order amount');
                      return;
                    }
                    
                    try {
                      const updatedConfig = {
                        ...config,
                        reference: orderData?.reference || checkoutReference || fallbackRef,
                        email: form.email.trim(),
                        amount: Math.round(total * 100), // Ensure integer amount in kobo
                      };
                      
                      // Double-check amount is valid
                      if (updatedConfig.amount <= 0) {
                        alert('Invalid payment amount');
                        return;
                      }
                      
                      initializePayment({ onSuccess, onClose, config: updatedConfig });
                    } catch (error) {
                      console.error('Paystack initialization error:', error);
                      alert('Failed to initialize payment. Please try again.');
                    }
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-sm font-black uppercase tracking-wider text-white shadow-md hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 mb-6"
                >
                  Pay with Paystack 🔒
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => setStep(1)} 
                    className="text-xs font-black uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Go back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="w-full lg:w-[320px] shrink-0 sticky top-[90px]">
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
              <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #F3F4F6', paddingBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Order Summary</p>
                {cartItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                      <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>{item.title}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px', fontWeight: 600 }}>{item.qty}× {item.ticketType}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#111827' }}>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-500">Service Fee</span>
                  <span className="text-sm font-bold text-gray-800">₦{fee.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#111827' }}>Total</span>
                  <span style={{ fontWeight: 900, color: '#f05537', fontSize: '1.25rem' }}>₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Verification & Invoice Loader Overlay */}
      {(verifyingPayment || loading) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', textAlign: 'center' }}>
            
            {/* Pulsing Glowing Ring with Swyft Logo */}
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '32px' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '50%', border: '4px solid rgba(240, 85, 55, 0.08)',
                borderTopColor: '#f05537', borderRightColor: '#ff7a59',
                animation: 'spin 1s linear infinite',
                boxShadow: '0 0 15px rgba(240, 85, 55, 0.15)'
              }} />
              <div style={{
                position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,85,55,0.08) 0%, transparent 70%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                {/* SVG Swyft Logo */}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-[#f05537] drop-shadow-[0_0_8px_rgba(240,85,55,0.3)]">
                  <path
                    d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {verifyingPayment ? 'Confirming Your Purchase' : 'Securing Your Order'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#f05537', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px' }}>
              SWYFT SECURE CHECKOUT
            </p>

            {/* Status Steps */}
            <div style={{
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: '16px', padding: '18px 24px', width: '100%', minHeight: '68px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              backdropFilter: 'blur(8px)'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#1F2937', fontWeight: 700, margin: 0 }}>
                ⚡ {loading ? orderLoadingText : verifyingText}
              </p>
            </div>
            
            <p style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '24px', fontWeight: 600 }}>
              🔒 Secured by Paystack & SWYFT Cryptographic Tokens
            </p>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.85; }
              50% { transform: scale(1.08); opacity: 1; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}
