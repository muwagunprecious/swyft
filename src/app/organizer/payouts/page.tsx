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

  const fetchBankDetails = async () => {
    try {
      setFetching(true);
      const res = await api.get('/organizer/bank-details');
      if (res.data?.accountNumber) {
        setSavedDetails(res.data);
        setBankName(res.data.bankName || "");
        setAccountNumber(res.data.accountNumber || "");
        if (res.data.bankCode) setBankCode(res.data.bankCode);
        if (res.data.name) setAccountName(res.data.name);
      }
    } catch (err) {
      // Ignored
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
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
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Link href="/organizer" className="hover:text-[#d1410c] transition no-underline">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-600">Settlement Settings</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-gray-900 tracking-tight">Payout & Bank Account</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Configure the settlement account where all ticket and voting proceeds will be sent.</p>
        </div>
        <Link
          href="/organizer/wallet"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 no-underline transition shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Go to Wallet
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-sm font-black opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl">
        {savedDetails && !isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-lg">
                  ✓
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900">Settlement Account Active</h3>
                  <p className="text-xs font-medium text-emerald-700 mt-0.5">Approved withdrawal payouts will be routed to this bank account.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMessage(null);
                }}
                type="button"
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-sm"
              >
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#faf9fc] rounded-xl border border-gray-150">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Settlement Bank</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{savedDetails.bankName || "Not specified"}</p>
              </div>
              <div className="p-4 bg-[#faf9fc] rounded-xl border border-gray-150">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Account Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1 tracking-wider font-mono">{savedDetails.accountNumber}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400 font-medium">
                Need to transfer funds? Request a withdrawal anytime from your wallet.
              </p>
              <Link
                href="/organizer/wallet"
                className="text-xs font-bold text-[#d1410c] hover:underline"
              >
                Open Wallet &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black text-gray-900">
                {savedDetails ? "Update Settlement Account" : "Add Settlement Bank Account"}
              </h3>
              {savedDetails && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Select Settlement Bank</label>
              <select
                required
                value={bankCode}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20 outline-none text-sm font-semibold bg-white transition"
              >
                <option value="">-- Choose your bank --</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">10-Digit Account Number</label>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20 outline-none text-sm font-bold tracking-widest text-gray-900 transition"
              />
              <p className="text-[11px] font-medium text-gray-400 mt-1.5">Enter the exact 10-digit NUBAN account number for payouts.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !bankCode || accountNumber.replace(/\D/g, '').length !== 10}
                className="h-12 flex-1 bg-[#d1410c] hover:bg-[#b03507] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? "Saving Account..." : (savedDetails ? "Update Account Details" : "Save Payout Account")}
              </button>
              {savedDetails && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-12 px-5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
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
