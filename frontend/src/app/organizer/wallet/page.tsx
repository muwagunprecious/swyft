"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

const banks = [
  "Access Bank", "First Bank", "GT Bank", "UBA", "Zenith Bank",
  "Kuda Bank", "OPay", "Palmpay", "Moniepoint", "Stanbic IBTC",
  "Sterling Bank", "FCMB", "Fidelity Bank", "Polaris Bank", "Union Bank",
];

const formatNaira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG")}`;

export default function WalletPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const res = await api.get('/organizer/dashboard');
        if (res.data) {
          setTotalEarnings(res.data.stats?.revenue || 0);
          
          const salesData = res.data.sales || [];
          const mappedTxns = salesData.map((s: any) => ({
            id: s.id.substring(0, 8).toUpperCase(),
            event: s.ticket.eventTitle || 'Ticket Sale',
            type: 'Ticket Sale',
            amount: s.ticket.price || 0,
            qty: 1,
            date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: s.status === 'Paid' ? 'settled' : 'pending'
          }));
          setTransactions(mappedTxns);
        }
      } catch (err) {
        console.error('Failed to fetch wallet data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  const availableBalance = totalEarnings;
  const pendingBalance = 0;
  const totalPayouts = 0;

  const handleVerify = () => {
    if (accountNumber.length !== 10) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setAccountName("AYOMIDE ADEKUNLE");
    }, 1400);
  };

  const handleRequestPayout = () => {
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("success");
  };

  const resetModal = () => {
    setShowPayoutModal(false);
    setStep("form");
    setBank("");
    setAccountNumber("");
    setAccountName("");
    setAmount("");
    setVerifying(false);
  };

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[900px] px-6 py-8">

        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">My Wallet</p>
            <h1 className="text-2xl font-black text-[#1a202c]">Earnings & Payouts</h1>
            <p className="mt-1 text-[13px] font-semibold text-gray-400">All revenue from your events in one place.</p>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#9333ea] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#7e22ce]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Request Payout
          </button>
        </div>

        {/* BALANCE CARDS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Earnings", value: totalEarnings, color: "#9333ea", bg: "#faf5ff", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Available Balance", value: availableBalance, color: "#12B76A", bg: "#f0fdf4", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Pending Clearance", value: pendingBalance, color: "#f59e0b", bg: "#fffbeb", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Total Paid Out", value: totalPayouts, color: "#3b82f6", bg: "#eff6ff", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: card.bg }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="1.8">
                    <path d={card.icon} />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-black text-[#1a202c]">{formatNaira(card.value)}</p>
            </div>
          ))}
        </div>

        {/* NOTICE BANNER */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[13px] font-semibold text-amber-700">
            Available balance is cleared within <strong>24–48 hours</strong> of requesting a payout. Pending balance clears after event date.
          </p>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-[14px] font-black text-[#1a202c]">Transaction History</h2>
              <p className="mt-0.5 text-[12px] font-semibold text-gray-400">{transactions.length} transactions</p>
            </div>
            <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-bold text-gray-600 outline-none focus:border-[#9333ea]">
              <option>All time</option>
              <option>This month</option>
              <option>Last 30 days</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Transaction ID", "Event / Description", "Type", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4 text-[12px] font-bold text-gray-500">{tx.id}</td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-bold text-[#1a202c]">{tx.event}</p>
                      {tx.qty > 0 && <p className="text-[11px] font-semibold text-gray-400">{tx.qty}× ticket{tx.qty > 1 ? "s" : ""}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        tx.type === "Payout" ? "bg-blue-50 text-blue-600" :
                        tx.type === "Donation" ? "bg-amber-50 text-amber-600" :
                        "bg-purple-50 text-purple-600"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[14px] font-black ${tx.amount < 0 ? "text-red-500" : "text-[#12B76A]"}`}>
                        {tx.amount < 0 ? "-" : "+"}{formatNaira(tx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12px] font-semibold text-gray-500">{tx.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        tx.status === "settled" ? "bg-green-50 text-green-600" :
                        tx.status === "pending" ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          tx.status === "settled" ? "bg-green-500" :
                          tx.status === "pending" ? "bg-amber-500" :
                          "bg-blue-500"
                        }`} />
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PAYOUT MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={resetModal}>
          <div
            className="flex w-full max-w-[480px] flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-[16px] font-black text-[#1a202c]">
                  {step === "success" ? "Payout Requested! 🎉" : "Request Payout"}
                </h2>
                <p className="mt-0.5 text-[12px] font-semibold text-gray-400">
                  {step === "success" ? "We'll process it within 24–48 hours" : `Available: ${formatNaira(availableBalance)}`}
                </p>
              </div>
              <button onClick={resetModal} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* STEP: FORM */}
            {step === "form" && (
              <div className="flex flex-col gap-5 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: "thin" }}>

                {/* Amount */}
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Amount to Withdraw</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">₦</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={availableBalance}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] pl-8 pr-4 text-[14px] font-bold text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20"
                    />
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    {[10000, 25000, 50000].map((q) => (
                      <button key={q} onClick={() => setAmount(String(Math.min(q, availableBalance)))}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-500 transition hover:border-[#9333ea] hover:text-[#9333ea]">
                        ₦{q.toLocaleString()}
                      </button>
                    ))}
                    <button onClick={() => setAmount(String(availableBalance))}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-500 transition hover:border-[#9333ea] hover:text-[#9333ea]">
                      Max
                    </button>
                  </div>
                </div>

                {/* Bank */}
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Bank</label>
                  <select
                    value={bank}
                    onChange={(e) => { setBank(e.target.value); setAccountName(""); }}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20"
                  >
                    <option value="">Select your bank</option>
                    {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Account Number</label>
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
                        setAccountName("");
                      }}
                      className="h-12 flex-1 rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-bold tracking-widest text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20 placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-medium"
                    />
                    <button
                      onClick={handleVerify}
                      disabled={accountNumber.length !== 10 || !bank || verifying}
                      className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-[#9333ea] px-4 text-[13px] font-bold text-white transition hover:bg-[#7e22ce] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {verifying ? (
                        <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0" strokeLinecap="round" /></svg>
                      ) : "Verify"}
                    </button>
                  </div>

                  {/* Verified badge */}
                  {accountName && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      <span className="text-[12px] font-black tracking-wide text-[#12B76A]">{accountName}</span>
                    </div>
                  )}
                </div>

                {/* Account Name */}
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">
                    Account Name
                    <span className="ml-2 text-[11px] font-semibold text-gray-400">(as it appears on your bank account)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AYOMIDE ADEKUNLE"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-bold uppercase tracking-wide text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20 placeholder:text-gray-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-medium"
                  />
                  <p className="mt-1.5 text-[11px] font-semibold text-gray-400">
                    Make sure this matches your bank records exactly to avoid failed transfers.
                  </p>
                </div>


                {/* CTA */}
                <button
                  onClick={handleRequestPayout}
                  disabled={!accountName || !amount || Number(amount) <= 0 || Number(amount) > availableBalance}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#9333ea] text-[14px] font-bold text-white transition hover:bg-[#7e22ce] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>

                <p className="text-center text-[11px] font-semibold text-gray-400">
                  SWYFT charges <strong>0%</strong> payout fee. Your bank may charge a transfer fee.
                </p>
              </div>
            )}

            {/* STEP: CONFIRM */}
            {step === "confirm" && (
              <div className="overflow-y-auto px-6 py-6">
                <div className="mb-5 rounded-xl bg-[#F7F8FA] p-5 flex flex-col gap-3">
                  {[
                    ["Withdraw amount", formatNaira(Number(amount))],
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
                    <span className="text-[12px] font-semibold text-gray-400">You will receive</span>
                    <span className="text-[16px] font-black text-[#9333ea]">{formatNaira(Number(amount))}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleConfirm}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-[#9333ea] text-[14px] font-bold text-white transition hover:bg-[#7e22ce]">
                    Confirm & Submit
                  </button>
                  <button onClick={() => setStep("form")}
                    className="flex h-12 w-full items-center justify-center rounded-full border border-gray-200 text-[14px] font-bold text-gray-600 transition hover:bg-gray-50">
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
                <h3 className="mb-2 text-xl font-black text-[#1a202c]">{formatNaira(Number(amount))} requested</h3>
                <p className="mb-1 text-[13px] font-semibold text-gray-500">to <strong>{accountName}</strong> · {bank}</p>
                <p className="mb-6 text-[12px] font-semibold text-gray-400">Account {accountNumber} · Processed in 24–48 hrs</p>
                <button onClick={resetModal}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-[#9333ea] text-[14px] font-bold text-white transition hover:bg-[#7e22ce]">
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
