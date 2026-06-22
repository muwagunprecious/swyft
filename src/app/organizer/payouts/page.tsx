"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Moniepoint", code: "090405" }
];

export default function PayoutsPage() {
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [subaccount, setSubaccount] = useState<any>(null);

  useEffect(() => {
    const fetchSubaccount = async () => {
      try {
        const res = await api.get('/organizer/subaccount');
        if (res.data?.subaccountCode) {
          setSubaccount(res.data);
        }
      } catch (err) {
        // Ignored
      } finally {
        setFetching(false);
      }
    };
    fetchSubaccount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const bankName = NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || "";

    try {
      const res = await api.post("/organizer/subaccount", {
        bankName,
        accountNumber,
        bankCode
      });
      setSubaccount({ bankName, accountNumber, subaccountCode: res.data.subaccountCode });
      setMessage("Payout account linked successfully!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to link payout account");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e0a3c] uppercase tracking-tight">Payout Settings</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">Manage where your ticket and voting funds are sent.</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm max-w-2xl">
        {subaccount ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <span className="text-xl">✅</span>
              <div>
                <h3 className="text-sm font-black uppercase">Payout Account Linked</h3>
                <p className="text-xs font-semibold mt-0.5">Your earnings will be automatically paid out to this account.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400">Bank Name</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{subaccount.bankName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400">Account Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{subaccount.accountNumber}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-4">
              To update your payout account, please contact platform support.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className="p-4 rounded-xl text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                {message}
              </div>
            )}
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-2">Select Bank</label>
              <select
                required
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#f05537] outline-none text-sm font-semibold"
              >
                <option value="">-- Choose your bank --</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-2">Account Number</label>
              <input
                required
                type="text"
                maxLength={10}
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#f05537] outline-none text-sm font-semibold"
              />
              <p className="text-[10px] font-semibold text-gray-400 mt-2">Make sure this matches the 10-digit NUBAN account number.</p>
            </div>
            <button
              type="submit"
              disabled={loading || !bankCode || accountNumber.length < 10}
              className="h-12 w-full bg-[#f05537] hover:bg-[#d1410c] disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl transition"
            >
              {loading ? "Linking..." : "Link Payout Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
