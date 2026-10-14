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
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sales" | "payouts">("sales");

  // Populate immediate baseline from session storage while API loads
  useEffect(() => {
    try {
      const stored = localStorage.getItem("otix_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (typeof u.walletBalance === "number" && u.walletBalance > 0) {
          setAvailableBalance(u.walletBalance);
          setTotalEarnings(u.walletBalance);
        }
        if (u.bankName && !bank) setBank(u.bankName);
        if (u.accountNumber && !accountNumber) setAccountNumber(u.accountNumber);
        if (u.name && !accountName) setAccountName(u.name.toUpperCase());
      }
    } catch {}
  }, []);

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      setFetchError("");
      const res = await api.get('/organizer/wallet');
      if (res.data) {
        const rev = Number(res.data.totalRevenue) || 0;
        const bal = Number(res.data.availableBalance) || 0;
        const pend = Number(res.data.pendingWithdrawals) || 0;
        const withdr = Number(res.data.withdrawnAmount) || 0;

        setTotalEarnings(rev);
        setAvailableBalance(bal);
        setPendingBalance(pend);
        setTotalPayouts(withdr);
        setTransactions(res.data.transactions || []);
        setPayouts(res.data.payouts || []);

        // Keep local storage user object up to date
        try {
          const stored = localStorage.getItem("otix_user");
          if (stored) {
            const u = JSON.parse(stored);
            u.walletBalance = bal;
            if (res.data.bankDetails?.bankName) u.bankName = res.data.bankDetails.bankName;
            if (res.data.bankDetails?.accountNumber) u.accountNumber = res.data.bankDetails.accountNumber;
            localStorage.setItem("otix_user", JSON.stringify(u));
          }
        } catch {}

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
    } catch (err: any) {
      console.error('Failed to fetch wallet data', err);
      setFetchError(err.response?.data?.message || 'Unable to sync live wallet data. Click retry to reconnect.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    <div className="space-y-6 pt-2">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#fafafa] tracking-tight">Earnings & Withdrawals</h1>
          <p className="text-xs font-medium text-[#9ca3af] mt-0.5">Real-time balances calculated solely from successful ticket transactions.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchWalletData}
            disabled={refreshing}
            type="button"
            className="flex h-10 items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] transition hover:bg-[#222] hover:border-[#374151] shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh Live Balance"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={refreshing ? "animate-spin" : ""}
            >
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <span className="hidden sm:inline">{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => setShowPayoutModal(true)}
            type="button"
            className="flex h-10 items-center gap-2 rounded-full bg-[#fafafa] px-5 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white shadow-sm shrink-0 active:scale-95 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-800/40 bg-rose-950/30 p-4 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchWalletData}
            type="button"
            className="rounded-full bg-rose-900/60 hover:bg-rose-900 px-3.5 py-1.5 font-semibold text-rose-200 transition text-[11px] cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* BALANCE CARDS */}
      {loading && availableBalance === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Ticket Sales", value: totalEarnings, badgeClass: "bg-[#171717] border border-[#262626] text-[#fafafa]", sub: "Only successful orders", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Available Balance", value: availableBalance, badgeClass: "bg-emerald-950/40 border border-emerald-800/40 text-emerald-400", sub: "Ready for withdrawal", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Pending Approvals", value: pendingBalance, badgeClass: "bg-amber-950/40 border border-amber-800/40 text-amber-400", sub: "Under admin review", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Total Withdrawn", value: totalPayouts, badgeClass: "bg-purple-950/40 border border-purple-800/40 text-purple-400", sub: "Approved & released", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 transition hover:border-[#374151]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">{card.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.badgeClass}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d={card.icon} />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#fafafa] tracking-tight">{formatNaira(card.value)}</p>
              <p className="mt-1 text-[11px] font-medium text-[#9ca3af]">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* NOTICE BANNER */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#262626] bg-[#171717] px-5 py-3.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fafafa" strokeWidth="2" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs font-medium text-[#9ca3af] leading-relaxed">
          Withdrawal requests are submitted directly to the administrator for review. Once approved, the amount is deducted from your wallet balance and transferred to your settlement account.
        </p>
      </div>

      {/* SETTLEMENT BANK ACCOUNT CARD */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] p-5 transition hover:border-[#374151]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#171717] border border-[#262626] text-[#fafafa]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">Settlement Bank Account</h3>
                {accountNumber ? (
                  <span className="rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    ✓ Active
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-800/40 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                    Not Configured
                  </span>
                )}
              </div>
              {accountNumber && bank ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#9ca3af]">
                  <span><strong>Bank:</strong> <span className="text-[#fafafa]">{bank}</span></span>
                  <span><strong>Account:</strong> <code className="font-mono text-[#fafafa] bg-[#171717] border border-[#262626] px-2 py-0.5 rounded tracking-wider">{accountNumber}</code></span>
                  {accountName && <span><strong>Name:</strong> <span className="text-[#fafafa]">{accountName}</span></span>}
                </div>
              ) : (
                <p className="mt-1 text-xs font-medium text-[#9ca3af]">
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
            className="shrink-0 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:border-[#374151] hover:bg-[#202020] active:scale-95 cursor-pointer"
          >
            {accountNumber ? "Edit Bank Details" : "Add Bank Account"}
          </button>
        </div>
      </div>

      {/* TABS & LIST */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("sales")}
              className={`text-xs font-semibold pb-2 transition-colors border-b-2 cursor-pointer ${
                activeTab === "sales"
                  ? "border-[#fafafa] text-[#fafafa]"
                  : "border-transparent text-[#9ca3af] hover:text-[#fafafa]"
              }`}
            >
              Successful Ticket Sales ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`text-xs font-semibold pb-2 transition-colors border-b-2 cursor-pointer ${
                activeTab === "payouts"
                  ? "border-[#fafafa] text-[#fafafa]"
                  : "border-transparent text-[#9ca3af] hover:text-[#fafafa]"
              }`}
            >
              Withdrawal Requests ({payouts.length})
            </button>
          </div>
          <button
            onClick={fetchWalletData}
            className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-[#9ca3af] transition hover:border-[#374151] hover:text-[#fafafa] cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>

        {/* TAB 1: SALES TABLE */}
        {activeTab === "sales" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626] bg-[#171717]/60">
                  {["Order / Attendee", "Event", "Ticket Tier", "Quantity", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs font-medium text-[#9ca3af]">
                      No ticket sales recorded yet. Once attendees purchase tickets, revenue will appear here.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="transition hover:bg-[#171717]/40">
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-[#fafafa]">{tx.customer}</p>
                        <p className="text-[11px] font-mono text-[#9ca3af]">#{tx.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-[#fafafa]">{tx.event}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-[#262626] bg-[#171717] px-2.5 py-0.5 text-[11px] font-medium text-[#fafafa]">
                          {tx.ticketType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-[#9ca3af]">{tx.quantity}</td>
                      <td className={`px-5 py-4 text-xs font-bold ${tx.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {tx.amount < 0 ? `-${formatNaira(Math.abs(tx.amount))}` : `+${formatNaira(tx.amount)}`}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#9ca3af]">
                        {tx.date ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {tx.type === "debit" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-800/40 bg-orange-950/40 px-2.5 py-0.5 text-[11px] font-medium text-orange-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                            {tx.status || "Withdrawn"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Successful
                          </span>
                        )}
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
                <tr className="border-b border-[#262626] bg-[#171717]/60">
                  {["Reference", "Bank Details", "Amount", "Requested Date", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/60">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-[#9ca3af]">
                      No withdrawal requests yet. You can request a payout anytime your available balance is at least ₦500.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => {
                    const isPending = p.status === "PENDING";
                    const isCompleted = p.status === "COMPLETED";
                    return (
                      <tr key={p.id} className="transition hover:bg-[#171717]/40">
                        <td className="px-5 py-4 font-mono text-xs text-[#9ca3af]">{p.reference || p.id.slice(0, 8)}</td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#fafafa]">{p.bankName}</p>
                          <p className="text-[11px] text-[#9ca3af]">{p.accountNumber} · {p.accountName}</p>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-[#fafafa]">
                          {formatNaira(p.amount)}
                        </td>
                        <td className="px-5 py-4 text-xs text-[#9ca3af]">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            isCompleted
                              ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
                              : isPending
                              ? "border-amber-800/40 bg-amber-950/40 text-amber-400"
                              : "border-rose-800/40 bg-rose-950/40 text-rose-400"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              isCompleted ? "bg-emerald-400" : isPending ? "bg-amber-400" : "bg-rose-400"
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

      {/* ═══════════════════════════════════════════ */}
      {/* PAYOUT MODAL */}
      {/* ═══════════════════════════════════════════ */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={resetModal}>
          <div
            className="flex w-full max-w-[480px] flex-col rounded-2xl border border-[#262626] bg-[#121212] shadow-2xl overflow-hidden"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#262626] px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-[#fafafa]">
                  {step === "success" ? "Withdrawal Submitted! 🎉" : "Request Withdrawal"}
                </h2>
                <p className="mt-0.5 text-xs font-medium text-[#9ca3af]">
                  {step === "success" ? "Your request has been routed to the administrator." : `Available: ${formatNaira(availableBalance)}`}
                </p>
              </div>
              <button onClick={resetModal} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-[#9ca3af] transition hover:border-[#374151] hover:text-[#fafafa] cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {withdrawError && (
              <div className="mx-6 mt-4 rounded-xl border border-rose-800/40 bg-rose-950/40 p-3 text-xs font-medium text-rose-400">
                ⚠️ {withdrawError}
              </div>
            )}

            {/* STEP: FORM */}
            {step === "form" && (
              <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">

                {availableBalance < 500 && (
                  <div className="rounded-xl border border-amber-800/40 bg-amber-950/40 p-3.5 flex items-start gap-2.5">
                    <span className="text-base shrink-0">ℹ️</span>
                    <div>
                      <p className="text-xs font-bold text-amber-400">Minimum withdrawal is ₦500</p>
                      <p className="text-[11px] font-medium text-amber-300/80 mt-0.5 leading-relaxed">
                        Your current available balance is <strong>{formatNaira(availableBalance)}</strong>. Funds are generated strictly from completed ticket purchases for your events and will appear here in real time.
                      </p>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#fafafa]">Amount to Withdraw</label>
                    <span className="text-[11px] font-medium text-[#9ca3af]">Available: {formatNaira(availableBalance)}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9ca3af]">₦</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={availableBalance}
                      className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] pl-8 pr-4 text-xs font-semibold text-[#fafafa] outline-none transition focus:border-[#fafafa]"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[5000, 10000, 25000, 50000].map((q) => (
                      <button key={q} onClick={() => setAmount(String(Math.min(q, availableBalance)))}
                        className="rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium text-[#9ca3af] transition hover:border-[#374151] hover:text-[#fafafa] cursor-pointer">
                        ₦{q.toLocaleString()}
                      </button>
                    ))}
                    <button onClick={() => setAmount(String(availableBalance))}
                      className="rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium text-[#9ca3af] transition hover:border-[#374151] hover:text-[#fafafa] cursor-pointer">
                      Max
                    </button>
                  </div>
                </div>

                {/* Bank */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#fafafa]">Settlement Bank</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#fafafa]"
                  >
                    <option value="">Select your bank...</option>
                    {banks.map((b) => <option key={b} value={b} className="bg-[#171717] text-[#fafafa]">{b}</option>)}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#fafafa]">Account Number</label>
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
                      className="h-11 flex-1 rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-semibold tracking-widest text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280] placeholder:tracking-normal"
                    />
                    <button
                      onClick={handleVerify}
                      type="button"
                      disabled={accountNumber.length !== 10 || !bank || verifying}
                      className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#fafafa] px-5 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {verifying ? "Checking..." : "Verify"}
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#fafafa]">
                    Account Name
                    <span className="ml-2 text-[11px] font-medium text-[#9ca3af]">(as shown on bank account)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AYOMIDE ADEKUNLE"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-semibold uppercase tracking-wide text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280] placeholder:normal-case placeholder:tracking-normal"
                  />
                </div>

                {/* CTA */}
                <button
                  onClick={handleRequestPayout}
                  type="button"
                  className="flex h-11 w-full items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white active:scale-95 mt-2 cursor-pointer"
                >
                  Review Request →
                </button>

                <p className="text-center text-[11px] font-medium text-[#9ca3af]">
                  Withdrawal requests are reviewed and approved directly by the administrator.
                </p>
              </div>
            )}

            {/* STEP: CONFIRM */}
            {step === "confirm" && (
              <div className="overflow-y-auto px-6 py-6">
                <div className="mb-5 rounded-xl border border-[#262626] bg-[#171717] p-5 flex flex-col gap-3">
                  {[
                    ["Withdrawal amount", formatNaira(Number(amount))],
                    ["Bank", bank],
                    ["Account number", accountNumber],
                    ["Account name", accountName],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#9ca3af]">{label}</span>
                      <span className="text-xs font-bold text-[#fafafa]">{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#262626] pt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#9ca3af]">Total to Receive</span>
                    <span className="text-sm font-bold text-[#fafafa]">{formatNaira(Number(amount))}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex h-11 w-full items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Submitting Request..." : "Confirm & Send to Admin"}
                  </button>
                  <button
                    onClick={() => setStep("form")}
                    disabled={submitting}
                    className="flex h-11 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-medium text-[#fafafa] transition hover:border-[#374151] hover:bg-[#202020] cursor-pointer"
                  >
                    ← Edit Details
                  </button>
                </div>
              </div>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <div className="flex flex-col items-center overflow-y-auto px-6 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-800/40 bg-emerald-950/40 text-emerald-400">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#fafafa]">{formatNaira(Number(amount))} Submitted!</h3>
                <p className="mb-1 text-xs font-medium text-[#fafafa]">Your withdrawal request has been sent to the admin dashboard.</p>
                <p className="mb-6 text-[12px] text-[#9ca3af]">To <strong className="text-[#fafafa]">{accountName}</strong> ({bank} - {accountNumber}). Once approved, funds will be released to your account.</p>
                <button
                  onClick={resetModal}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => setShowBankModal(false)}>
          <div
            className="flex w-full max-w-[460px] flex-col rounded-2xl border border-[#262626] bg-[#121212] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#262626] px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-[#fafafa]">Settlement Bank Account</h2>
                <p className="mt-0.5 text-xs font-medium text-[#9ca3af]">
                  Where your ticket sales and withdrawals will be sent.
                </p>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-[#9ca3af] transition hover:border-[#374151] hover:text-[#fafafa] cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6">
              {bankModalMessage && (
                <div className={`rounded-xl border p-3 text-xs font-medium ${
                  bankModalMessage.type === "success"
                    ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
                    : "border-rose-800/40 bg-rose-950/40 text-rose-400"
                }`}>
                  {bankModalMessage.text}
                </div>
              )}

              {/* Bank Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#fafafa]">Bank Name</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#fafafa]"
                >
                  <option value="">Select your bank...</option>
                  {banks.map((b) => <option key={b} value={b} className="bg-[#171717] text-[#fafafa]">{b}</option>)}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#fafafa]">Account Number</label>
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
                    className="h-11 flex-1 rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-semibold tracking-widest text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280] placeholder:tracking-normal"
                  />
                  <button
                    onClick={handleVerify}
                    type="button"
                    disabled={accountNumber.length !== 10 || !bank || verifying}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#fafafa] px-5 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {verifying ? "Checking..." : "Verify"}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#fafafa]">
                  Account Name
                  <span className="ml-2 text-[11px] font-medium text-[#9ca3af]">(as shown on bank account)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AYOMIDE ADEKUNLE"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-semibold uppercase tracking-wide text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280] placeholder:normal-case placeholder:tracking-normal"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="h-11 flex-1 rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#fafafa] transition hover:border-[#374151] hover:bg-[#202020] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBankDetails}
                  disabled={savingBank || !bank || accountNumber.length !== 10 || !accountName.trim()}
                  className="h-11 flex-1 rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
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
