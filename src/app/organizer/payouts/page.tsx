"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Moniepoint", code: "090405" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" }
];

export default function PayoutsPage() {
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [savedDetails, setSavedDetails] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const fetchBankDetails = async () => {
    try {
      setFetching(true);
      const [bankRes, walletRes] = await Promise.allSettled([
        api.get('/organizer/bank-details'),
        api.get('/organizer/wallet'),
      ]);

      if (bankRes.status === 'fulfilled' && bankRes.value.data?.accountNumber) {
        const d = bankRes.value.data;
        setSavedDetails(d);
        setBankName(d.bankName || "");
        setAccountNumber(d.accountNumber || "");
        if (d.bankCode) setBankCode(d.bankCode);
        if (d.name) setAccountName(d.name);
      }

      if (walletRes.status === 'fulfilled' && walletRes.value.data) {
        setWalletBalance(walletRes.value.data.availableBalance ?? 0);
      }
    } catch (err) {
      // Ignored
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("otix_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (typeof u.walletBalance === "number") setWalletBalance(u.walletBalance);
      }
    } catch {}
    fetchBankDetails();
  }, []);

  const handleBankChange = (code: string) => {
    setBankCode(code);
    const selected = NIGERIAN_BANKS.find(b => b.code === code);
    if (selected) {
      setBankName(selected.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanAccount = accountNumber.replace(/\D/g, "");
    if (cleanAccount.length !== 10) {
      setMessage({ text: "Please enter a valid 10-digit NUBAN account number.", type: "error" });
      setLoading(false);
      return;
    }

    const finalBankName = bankName || NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || "";
    if (!finalBankName) {
      setMessage({ text: "Please select your bank.", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/organizer/bank-details", {
        bankName: finalBankName,
        accountNumber: cleanAccount,
        bankCode,
        accountName,
      });

      setSavedDetails({
        bankName: res.data.bankName || finalBankName,
        accountNumber: res.data.accountNumber || cleanAccount,
        bankCode: res.data.bankCode || bankCode,
        subaccountCode: res.data.subaccountCode,
      });

      setIsEditing(false);
      setMessage({ text: "Bank account details saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Failed to save bank account details. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d1410c]/20 border-t-[#d1410c]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider">
            <Link href="/organizer" className="hover:text-[#fafafa] transition no-underline">Dashboard</Link>
            <span>/</span>
            <span className="text-[#fafafa]">Settlement Settings</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-[#fafafa] tracking-tight">Payout & Bank Account</h1>
          <p className="text-xs font-medium text-[#9ca3af] mt-0.5">Configure the settlement account where all ticket and voting proceeds will be sent.</p>
        </div>
        <div className="flex items-center gap-3">
          {walletBalance !== null && (
            <div className="hidden sm:flex flex-col items-end px-3.5 py-1.5 bg-[#171717] rounded-xl border border-[#262626]">
              <span className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Wallet Balance</span>
              <span className="text-xs font-bold text-emerald-400">₦{walletBalance.toLocaleString()}</span>
            </div>
          )}
          <Link
            href="/organizer/wallet"
            className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] hover:border-[#374151] hover:bg-[#202020] px-4 py-2 text-xs font-semibold text-[#fafafa] no-underline transition shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Withdraw in Wallet
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          message.type === "success" 
            ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400" 
            : "border-rose-800/40 bg-rose-950/40 text-rose-400"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-sm font-bold opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#262626] max-w-2xl">
        {savedDetails && !isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-emerald-800/40 bg-emerald-950/40 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900/60 text-emerald-400 text-sm font-bold">
                  ✓
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Settlement Account Active</h3>
                  <p className="text-xs font-medium text-emerald-300/80 mt-0.5">Approved withdrawal payouts will be routed to this bank account.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMessage(null);
                }}
                type="button"
                className="rounded-full border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-semibold text-[#fafafa] hover:border-[#374151] hover:bg-[#202020] transition cursor-pointer"
              >
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#171717] rounded-xl border border-[#262626]">
                <p className="text-[10px] font-bold uppercase text-[#9ca3af] tracking-wider">Settlement Bank</p>
                <p className="text-sm font-semibold text-[#fafafa] mt-1">{savedDetails.bankName || "Not specified"}</p>
              </div>
              <div className="p-4 bg-[#171717] rounded-xl border border-[#262626]">
                <p className="text-[10px] font-bold uppercase text-[#9ca3af] tracking-wider">Account Number</p>
                <p className="text-sm font-semibold text-[#fafafa] mt-1 tracking-wider font-mono">{savedDetails.accountNumber}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
              <p className="text-xs text-[#9ca3af] font-medium">
                Need to transfer funds? Request a withdrawal anytime from your wallet.
              </p>
              <Link
                href="/organizer/wallet"
                className="text-xs font-bold text-[#fafafa] hover:underline"
              >
                Open Wallet &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#fafafa]">
                {savedDetails ? "Update Settlement Account" : "Add Settlement Bank Account"}
              </h3>
              {savedDetails && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage(null);
                  }}
                  className="text-xs font-semibold text-[#9ca3af] hover:text-[#fafafa] cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#fafafa] mb-2">Select Settlement Bank</label>
              <select
                required
                value={bankCode}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full h-11 px-4 rounded-full border border-[#262626] bg-[#171717] focus:border-[#fafafa] outline-none text-xs font-medium text-[#fafafa] transition"
              >
                <option value="" className="bg-[#171717] text-[#fafafa]">-- Choose your bank --</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code} className="bg-[#171717] text-[#fafafa]">{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#fafafa] mb-2">10-Digit Account Number</label>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full h-11 px-4 rounded-full border border-[#262626] bg-[#171717] focus:border-[#fafafa] outline-none text-xs font-semibold tracking-widest text-[#fafafa] placeholder:text-[#6b7280] placeholder:tracking-normal transition"
              />
              <p className="text-[11px] font-medium text-[#9ca3af] mt-1.5">Enter the exact 10-digit NUBAN account number for payouts.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !bankCode || accountNumber.replace(/\D/g, '').length !== 10}
                className="h-11 flex-1 bg-[#fafafa] hover:bg-white disabled:opacity-40 text-[#0a0a0a] text-xs font-semibold rounded-full transition shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Saving Account..." : (savedDetails ? "Update Account Details" : "Save Payout Account")}
              </button>
              {savedDetails && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-11 px-5 border border-[#262626] bg-[#171717] rounded-full text-xs font-semibold text-[#fafafa] hover:border-[#374151] hover:bg-[#202020] transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
