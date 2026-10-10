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
  // OTIX Platform Fee: 4% + ₦20
  const fee = Math.round(subtotal * 0.04) + 20;
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
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-2xl font-light tracking-tight mb-6">Your cart is empty.</p>
          <Link 
            href="/events" 
            className="inline-flex items-center justify-center rounded-full bg-[#fafafa] px-8 py-3.5 text-sm font-medium text-[#0a0a0a] hover:bg-neutral-200 transition"
          >
            Browse Events &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] py-12 md:py-16">
      <div className="grix-container max-w-[1040px] px-6 mx-auto">

        {/* Step indicator */}
        <div className="flex items-center justify-between max-w-xl mx-auto mb-12">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i < step 
                    ? 'bg-emerald-500 text-[#0a0a0a]' 
                    : i === step 
                    ? 'bg-[#fafafa] text-[#0a0a0a]' 
                    : 'bg-[#171717] border border-[#374151] text-[#9ca3af]'
                }`}>
                  {i < step ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs uppercase tracking-wider font-medium ${
                  i === step ? 'text-[#fafafa]' : 'text-[#9ca3af]'
                }`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  i < step ? 'bg-emerald-500' : 'bg-[#374151]'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px] items-start">

          {/* Main Panel */}
          <div className="rounded-2xl border border-[#374151] bg-[#171717] p-8 md:p-10 overflow-hidden">

            {/* Step 0: User Info */}
            {step === 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-[#9ca3af]">
                  Step 1 of 3
                </span>
                <h2 className="text-2xl md:text-3xl font-light text-[#fafafa] mt-1 mb-2">
                  Personal Details
                </h2>
                <p className="text-sm font-normal text-[#9ca3af] mb-8">
                  Your ticket passes and purchase invoice will be sent to the contact info below.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ayomide Adekunle' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                    { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '080XXXXXXXX' },
                    { label: 'Matric / Student ID (Optional)', key: 'matric', type: 'text', placeholder: 'e.g. 210203001' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
                        {label}
                      </label>
                      <input
                        className="w-full h-12 px-5 rounded-full border border-[#374151] bg-[#0a0a0a] text-sm text-[#fafafa] placeholder-neutral-600 outline-none transition focus:border-[#fafafa]"
                        type={type}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <button
                    onClick={() => setStep(1)}
                    disabled={!form.name || !form.email || !form.phone}
                    className="w-full h-12 rounded-full bg-[#fafafa] text-[#0a0a0a] text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue to Review &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-[#9ca3af]">
                  Step 2 of 3
                </span>
                <h2 className="text-2xl md:text-3xl font-light text-[#fafafa] mt-1 mb-2">
                  Review Your Order
                </h2>
                <p className="text-sm font-normal text-[#9ca3af] mb-8">
                  Verify ticket quantities, attendee information, and final pricing before checkout.
                </p>

                <div className="space-y-4 mb-8">
                  {cartItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 rounded-xl border border-[#374151] bg-[#0a0a0a] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-base font-medium text-[#fafafa]">{item.title}</p>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="text-xs text-[#9ca3af]">{item.qty}× {item.ticketType}</span>
                          {item.originalPrice && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Discount Applied
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {item.originalPrice && (
                          <div className="text-xs text-neutral-500 line-through">
                            ₦{(item.originalPrice * item.qty).toLocaleString()}
                          </div>
                        )}
                        <div className="text-base font-semibold text-[#fafafa]">
                          ₦{(item.price * item.qty).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-[#374151] bg-[#0a0a0a] p-5 space-y-3 mb-8">
                  {[
                    { label: 'Attendee', value: form.name || '—' },
                    { label: 'Email', value: form.email || '—' },
                    { label: 'Phone', value: form.phone || '—' },
                    ...(form.matric ? [{ label: 'Matric / ID', value: form.matric }] : []),
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-xs py-1">
                      <span className="text-[#9ca3af] uppercase tracking-wider">{r.label}</span>
                      <span className="font-medium text-[#fafafa]">{r.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(0)} 
                    className="flex-1 h-12 rounded-full border border-[#374151] bg-[#0a0a0a] text-sm font-medium text-[#fafafa] hover:bg-[#171717] transition"
                  >
                    &larr; Back
                  </button>
                  <button 
                    onClick={handleCreateOrder} 
                    disabled={loading}
                    className="flex-[2] h-12 rounded-full bg-[#fafafa] text-[#0a0a0a] text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50"
                  >
                    {loading ? 'Securing Order...' : 'Confirm & Proceed to Payment &rarr;'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-[#9ca3af]">
                  Final Step
                </span>
                <h2 className="text-2xl md:text-3xl font-light text-[#fafafa] mt-1 mb-2">
                  Complete Payment
                </h2>

                {/* Countdown Timer Display */}
                <div className="mt-4 mb-8 p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex items-center justify-between text-xs text-red-200">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Ticket reservation expires in
                  </span>
                  <span className="font-mono text-sm font-semibold text-red-400">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="text-center py-8 rounded-xl border border-[#374151] bg-[#0a0a0a] mb-8">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#9ca3af] mb-2">
                    Total Amount Due
                  </p>
                  <p className="text-4xl md:text-5xl font-extralight tracking-tight text-[#fafafa]">
                    ₦{total.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-2">
                    Includes ₦{fee.toLocaleString()} platform processing fee
                  </p>
                </div>

                <button 
                  onClick={() => {
                    if (timeLeft <= 0) {
                      alert('Your reservation has expired. Please go back and reserve again.');
                      return;
                    }
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
                        amount: Math.round(total * 100),
                      };
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
                  className="w-full h-12 rounded-full bg-[#fafafa] text-[#0a0a0a] text-sm font-medium hover:bg-neutral-200 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Pay with Paystack</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </button>

                <div className="text-center mt-6">
                  <button 
                    onClick={() => setStep(1)} 
                    className="text-xs text-[#9ca3af] hover:text-[#fafafa] transition"
                  >
                    &larr; Go back to review
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="rounded-2xl border border-[#374151] bg-[#171717] p-6 sticky top-24">
            <span className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af] block mb-4">
              Order Summary
            </span>

            <div className="space-y-4 pb-5 border-b border-[#374151]">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-3.5 items-center">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#374151] bg-[#0a0a0a] shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#fafafa] truncate">{item.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#9ca3af]">{item.qty}× {item.ticketType}</span>
                      <div className="text-right">
                        {item.originalPrice && (
                          <span className="text-[11px] text-neutral-500 line-through mr-1.5">
                            ₦{(item.originalPrice * item.qty).toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[#fafafa]">
                          ₦{(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Subtotal</span>
                <span className="font-medium text-[#fafafa]">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Service Fee (4% + ₦20)</span>
                <span className="font-medium text-[#fafafa]">₦{fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#374151] text-sm">
                <span className="font-medium text-[#fafafa]">Total</span>
                <span className="text-lg font-light tracking-tight text-[#fafafa]">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Verification & Invoice Loader Overlay */}
      {(verifyingPayment || loading) && (
        <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
          <div className="flex flex-col items-center max-w-sm text-center">
            
            {/* Spinning Swyft Ring */}
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-[#374151] border-t-[#fafafa] animate-spin" />
              <div className="absolute inset-2 rounded-full bg-[#171717] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#fafafa]">
                  <path
                    d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-light text-[#fafafa] mb-2 tracking-tight">
              {verifyingPayment ? 'Confirming Purchase' : 'Securing Order'}
            </h2>
            <p className="text-xs uppercase tracking-widest text-[#9ca3af] mb-6">
              SWYFT SECURE CHECKOUT
            </p>

            <div className="rounded-xl border border-[#374151] bg-[#171717] px-5 py-3 w-full">
              <p className="text-xs font-medium text-[#fafafa]">
                {loading ? orderLoadingText : verifyingText}
              </p>
            </div>
            
            <p className="text-[11px] text-[#6b7280] mt-6">
              Secured by Paystack & SWYFT Token Verification
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
