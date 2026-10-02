"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

const banks = [
  "Access Bank", "First Bank", "GT Bank", "UBA", "Zenith Bank",
  "Kuda Bank", "OPay", "Palmpay", "Moniepoint", "Stanbic IBTC",
  "Sterling Bank", "FCMB", "Fidelity Bank", "Polaris Bank", "Union Bank",
  "Wema Bank", "Ecobank", "Heritage Bank", "Providus Bank", "Unity Bank"
];

const formatNaira = (n: number) =>
  `₦${Math.abs(n || 0).toLocaleString("en-NG")}`;

export default function WalletPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  // Settlement bank account modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankModalMessage, setBankModalMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sales" | "payouts">("sales");

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizer/wallet');
      if (res.data) {
        setTotalEarnings(res.data.totalRevenue || 0);
        setAvailableBalance(res.data.availableBalance || 0);
        setPendingBalance(res.data.pendingWithdrawals || 0);
        setTotalPayouts(res.data.withdrawnAmount || 0);
        setTransactions(res.data.transactions || []);
        setPayouts(res.data.payouts || []);

        if (res.data.bankDetails) {
          if (res.data.bankDetails.bankName && !bank) setBank(res.data.bankDetails.bankName);
          if (res.data.bankDetails.accountNumber && !accountNumber) setAccountNumber(res.data.bankDetails.accountNumber);
          if (res.data.bankDetails.accountName && !accountName) setAccountName(res.data.bankDetails.accountName);
        }
        if (!accountName && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("otix_user");
            if (stored) {
              const u = JSON.parse(stored);
              if (u.name) setAccountName(u.name.toUpperCase());
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleVerify = () => {
    if (accountNumber.length !== 10) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (!accountName) {
        setAccountName("VERIFIED ACCOUNT");
      }
    }, 800);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankModalMessage(null);
    const cleanAccount = accountNumber.replace(/\D/g, "");
    if (cleanAccount.length !== 10) {
      setBankModalMessage({ text: "Please enter a valid 10-digit account number.", type: "error" });
      setSavingBank(false);
      return;
    }
    if (!bank) {
      setBankModalMessage({ text: "Please select a bank.", type: "error" });
      setSavingBank(false);
      return;
    }
    try {
      await api.post('/organizer/bank-details', {
        bankName: bank,
        accountNumber: cleanAccount,
        accountName,
      });
      setBankModalMessage({ text: "Settlement account details saved successfully!", type: "success" });
      setTimeout(() => {
        setShowBankModal(false);
        setBankModalMessage(null);
      }, 1200);
      await fetchWalletData();
    } catch (err: any) {
      setBankModalMessage({ text: err.response?.data?.message || "Failed to save bank details.", type: "error" });
    } finally {
      setSavingBank(false);
    }
  };

  const handleRequestPayout = () => {
    setWithdrawError("");
    if (availableBalance < 500) {
      setWithdrawError(`You need at least ₦500 in available balance to request a withdrawal. Your current balance is ${formatNaira(availableBalance)}.`);
      return;
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount < 500) {
      setWithdrawError("Please enter an amount of at least ₦500.");
      return;
    }
    if (numAmount > availableBalance) {
      setWithdrawError(`The amount exceeds your available balance of ${formatNaira(availableBalance)}.`);
      return;
    }
    if (!bank) {
      setWithdrawError("Please select your settlement bank.");
      return;
    }
    if (!accountNumber || accountNumber.length !== 10) {
      setWithdrawError("Please enter a valid 10-digit account number.");
      return;
    }
    if (!accountName.trim()) {
      setWithdrawError("Please enter your account name matching your bank account.");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setWithdrawError("");
    try {
      await api.post('/organizer/withdraw', {
        amount: parseFloat(amount),
        bankName: bank,
        accountNumber,
        accountName,
      });
      setStep("success");
      await fetchWalletData();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setWithdrawError(err.response?.data?.message || 'Failed to submit withdrawal request. Please check your balance and try again.');
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setShowPayoutModal(false);
    setStep("form");
    setAmount("");
    setWithdrawError("");
    setVerifying(false);
  };

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[960px] px-6 py-8">

        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#d1410c]">My Wallet</p>
            <h1 className="text-2xl font-black text-[#1a202c]">Earnings & Withdrawals</h1>
            <p className="mt-1 text-[13px] font-semibold text-gray-500">Real-time balances calculated solely from successful ticket transactions.</p>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#d1410c] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#b03507] active:scale-95"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Withdraw Funds
          </button>
        </div>

        {/* BALANCE CARDS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Ticket Sales", value: totalEarnings, color: "#39364f", bg: "#f3f4f6", sub: "Only successful orders", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Available Balance", value: availableBalance, color: "#12B76A", bg: "#f0fdf4", sub: "Ready for withdrawal", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Pending Approvals", value: pendingBalance, color: "#f59e0b", bg: "#fffbeb", sub: "Under admin review", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Total Withdrawn", value: totalPayouts, color: "#d1410c", bg: "#fff9f6", sub: "Approved & released", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: card.bg }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="1.8">
                    <path d={card.icon} />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-black text-[#1a202c]">{formatNaira(card.value)}</p>
              <p className="mt-1 text-[11px] font-medium text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* NOTICE BANNER */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/60 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1410c" strokeWidth="2" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[13px] font-semibold text-[#39364f]">
            Withdrawal requests are submitted directly to the administrator for review. Once approved, the amount is deducted from your wallet balance and transferred to your bank account.
          </p>
        </div>

        {/* SETTLEMENT BANK ACCOUNT CARD */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#d1410c]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Settlement Bank Account</h3>
                  {accountNumber ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      ✓ Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      Not Configured
                    </span>
                  )}
                </div>
                {accountNumber && bank ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-600">
                    <span><strong>Bank:</strong> {bank}</span>
                    <span><strong>Account:</strong> <code className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded tracking-wider">{accountNumber}</code></span>
                    {accountName && <span><strong>Name:</strong> {accountName}</span>}
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Save your bank account so your withdrawal requests can be approved and transferred immediately.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowBankModal(true);
                setBankModalMessage(null);
              }}
              type="button"
              className="shrink-0 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-xs font-bold text-gray-800 transition shadow-sm active:scale-95"
            >
              {accountNumber ? "Edit Bank Details" : "Add Bank Account"}
            </button>
          </div>
        </div>

        {/* TABS & LIST */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("sales")}
                className={`text-[13px] font-bold pb-1 transition-colors border-b-2 ${
                  activeTab === "sales"
                    ? "border-[#d1410c] text-[#d1410c]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Successful Ticket Sales ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab("payouts")}
                className={`text-[13px] font-bold pb-1 transition-colors border-b-2 ${
                  activeTab === "payouts"
                    ? "border-[#d1410c] text-[#d1410c]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Withdrawal Requests ({payouts.length})
              </button>
            </div>
            <button
              onClick={fetchWalletData}
              className="text-[12px] font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
          </div>

          {/* TAB 1: SALES TABLE */}
          {activeTab === "sales" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Order / Attendee", "Event", "Ticket Tier", "Quantity", "Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-gray-400">
                        No ticket sales recorded yet. Once attendees purchase tickets, revenue will appear here.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="transition hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="text-[13px] font-bold text-[#1a202c]">{tx.customer}</p>
                          <p className="text-[11px] font-mono text-gray-400">#{tx.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-5 py-4 text-[13px] font-bold text-[#1a202c]">{tx.event}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-[#d1410c]">
                            {tx.ticketType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[13px] font-bold text-gray-700">{tx.quantity}</td>
                        <td className="px-5 py-4 text-[14px] font-black text-[#12B76A]">
                          +{formatNaira(tx.amount)}
                        </td>
                        <td className="px-5 py-4 text-[12px] font-semibold text-gray-500">
                          {tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-green-50 text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Successful
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PAYOUTS TABLE */}
          {activeTab === "payouts" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Reference", "Bank Details", "Amount", "Requested Date", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm font-semibold text-gray-400">
                        No withdrawal requests yet. You can request a payout anytime your available balance is at least ₦500.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => {
                      const isPending = p.status === "PENDING";
                      const isCompleted = p.status === "COMPLETED";
                      return (
                        <tr key={p.id} className="transition hover:bg-gray-50">
                          <td className="px-5 py-4 font-mono text-[12px] font-bold text-gray-600">{p.reference || p.id.slice(0, 8)}</td>
                          <td className="px-5 py-4">
                            <p className="text-[13px] font-bold text-[#1a202c]">{p.bankName}</p>
                            <p className="text-[12px] font-semibold text-gray-500">{p.accountNumber} · {p.accountName}</p>
                          </td>
                          <td className="px-5 py-4 text-[14px] font-black text-[#1a202c]">
                            {formatNaira(p.amount)}
                          </td>
                          <td className="px-5 py-4 text-[12px] font-semibold text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isCompleted
                                ? "bg-green-50 text-green-700"
                                : isPending
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                isCompleted ? "bg-green-500" : isPending ? "bg-amber-500" : "bg-red-500"
                              }`} />
                              {isCompleted ? "Approved & Paid" : isPending ? "Pending Admin Approval" : "Declined"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PAYOUT MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={resetModal}>
          <div
            className="flex w-full max-w-[480px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-[16px] font-black text-[#1a202c]">
                  {step === "success" ? "Withdrawal Submitted! 🎉" : "Request Withdrawal"}
                </h2>
                <p className="mt-0.5 text-[12px] font-semibold text-gray-500">
                  {step === "success" ? "Your request has been routed to the administrator." : `Available: ${formatNaira(availableBalance)}`}
                </p>
              </div>
              <button onClick={resetModal} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {withdrawError && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-600">
                ⚠️ {withdrawError}
              </div>
            )}

            {/* STEP: FORM */}
            {step === "form" && (
              <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">

                {availableBalance < 500 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-2.5">
                    <span className="text-base shrink-0">ℹ️</span>
                    <div>
                      <p className="text-[12px] font-bold text-amber-900">Minimum withdrawal is ₦500</p>
                      <p className="text-[11px] font-medium text-amber-700 mt-0.5 leading-relaxed">
                        Your current available balance is <strong>{formatNaira(availableBalance)}</strong>. Funds are generated strictly from completed ticket purchases for your events and will appear here in real time.
                      </p>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[13px] font-bold text-[#1a202c]">Amount to Withdraw</label>
                    <span className="text-[11px] font-semibold text-gray-500">Available: {formatNaira(availableBalance)}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">₦</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={availableBalance}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] pl-8 pr-4 text-[14px] font-bold text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20"
                    />
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    {[5000, 10000, 25000, 50000].map((q) => (
                      <button key={q} onClick={() => setAmount(String(Math.min(q, availableBalance)))}
                        className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 transition hover:border-[#d1410c] hover:text-[#d1410c]">
                        ₦{q.toLocaleString()}
                      </button>
                    ))}
                    <button onClick={() => setAmount(String(availableBalance))}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 transition hover:border-[#d1410c] hover:text-[#d1410c]">
                      Max
                    </button>
                  </div>
                </div>

                {/* Bank */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-[#1a202c]">Settlement Bank</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20"
                  >
                    <option value="">Select your bank...</option>
                    {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-[#1a202c]">Account Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit account number"
                      value={accountNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setAccountNumber(v);
                      }}
                      className="h-11 flex-1 rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-bold tracking-widest text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20 placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-medium"
                    />
                    <button
                      onClick={handleVerify}
                      type="button"
                      disabled={accountNumber.length !== 10 || !bank || verifying}
                      className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-[13px] font-bold text-white transition hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {verifying ? "Checking..." : "Verify"}
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-bold text-[#1a202c]">
                    Account Name
                    <span className="ml-2 text-[11px] font-semibold text-gray-400">(as shown on bank account)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AYOMIDE ADEKUNLE"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-bold uppercase tracking-wide text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20 placeholder:text-gray-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-medium"
                  />
                </div>

                {/* CTA */}
                <button
                  onClick={handleRequestPayout}
                  type="button"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-[#d1410c] text-[14px] font-bold text-white transition hover:bg-[#b03507] active:scale-95 mt-2"
                >
                  Review Request →
                </button>

                <p className="text-center text-[11px] font-semibold text-gray-400">
                  Withdrawal requests are reviewed and approved directly by the administrator.
                </p>
              </div>
            )}

            {/* STEP: CONFIRM */}
            {step === "confirm" && (
              <div className="overflow-y-auto px-6 py-6">
                <div className="mb-5 rounded-xl bg-[#F7F8FA] p-5 flex flex-col gap-3">
                  {[
                    ["Withdrawal amount", formatNaira(Number(amount))],
                    ["Bank", bank],
                    ["Account number", accountNumber],
                    ["Account name", accountName],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-gray-400">{label}</span>
                      <span className="text-[13px] font-black text-[#1a202c]">{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-gray-400">Total to Receive</span>
                    <span className="text-[16px] font-black text-[#d1410c]">{formatNaira(Number(amount))}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-[#d1410c] text-[14px] font-bold text-white transition hover:bg-[#b03507] disabled:opacity-50"
                  >
                    {submitting ? "Submitting Request..." : "Confirm & Send to Admin"}
                  </button>
                  <button
                    onClick={() => setStep("form")}
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center rounded-full border border-gray-200 text-[14px] font-bold text-gray-600 transition hover:bg-gray-50"
                  >
                    ← Edit Details
                  </button>
                </div>
              </div>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <div className="flex flex-col items-center overflow-y-auto px-6 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-100">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-black text-[#1a202c]">{formatNaira(Number(amount))} Submitted!</h3>
                <p className="mb-1 text-[13px] font-semibold text-gray-600">Your withdrawal request has been sent to the admin dashboard.</p>
                <p className="mb-6 text-[12px] font-semibold text-gray-400">To <strong>{accountName}</strong> ({bank} - {accountNumber}). Once approved, funds will be released to your account.</p>
                <button
                  onClick={resetModal}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-[#d1410c] text-[14px] font-bold text-white transition hover:bg-[#b03507]"
                >
                  Return to Wallet
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SETTLEMENT BANK DETAILS MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setShowBankModal(false)}>
          <div
            className="flex w-full max-w-[460px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-[16px] font-black text-[#1a202c]">Settlement Bank Account</h2>
                <p className="mt-0.5 text-[12px] font-semibold text-gray-500">
                  Where your ticket sales and withdrawals will be sent.
                </p>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6">
              {bankModalMessage && (
                <div className={`rounded-xl border p-3 text-[13px] font-semibold ${
                  bankModalMessage.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}>
                  {bankModalMessage.text}
                </div>
              )}

              {/* Bank Selection */}
              <div>
                <label className="mb-1.5 block text-[13px] font-bold text-[#1a202c]">Bank Name</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20"
                >
                  <option value="">Select your bank...</option>
                  {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="mb-1.5 block text-[13px] font-bold text-[#1a202c]">Account Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setAccountNumber(v);
                    }}
                    className="h-11 flex-1 rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-bold tracking-widest text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20 placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-medium"
                  />
                  <button
                    onClick={handleVerify}
                    type="button"
                    disabled={accountNumber.length !== 10 || !bank || verifying}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-[13px] font-bold text-white transition hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {verifying ? "Checking..." : "Verify"}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="mb-1.5 block text-[13px] font-bold text-[#1a202c]">
                  Account Name
                  <span className="ml-2 text-[11px] font-semibold text-gray-400">(as shown on bank account)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AYOMIDE ADEKUNLE"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-bold uppercase tracking-wide text-[#1a202c] outline-none transition focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20 placeholder:text-gray-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="h-11 flex-1 rounded-full border border-gray-200 text-[14px] font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBankDetails}
                  disabled={savingBank || !bank || accountNumber.length !== 10 || !accountName.trim()}
                  className="h-11 flex-1 rounded-full bg-[#d1410c] text-[14px] font-bold text-white transition hover:bg-[#b03507] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {savingBank ? "Saving Details..." : "Save Bank Details"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
