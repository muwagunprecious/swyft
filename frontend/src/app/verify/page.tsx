"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [status, setStatus] = useState<"idle" | "valid" | "used" | "invalid">("idle");

  return (
    <div className="grid min-h-screen place-items-center bg-[#101828] px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <p className="mb-2 text-center text-xs font-black uppercase tracking-wider text-orange-300">QR Verification</p>
        <h1 className="text-center text-3xl font-black">Scan and verify in under 2 seconds</h1>

        <div className={`mt-8 rounded-lg border p-5 ${status === "valid" ? "border-green-400 bg-green-500/15" : status === "used" ? "border-orange-300 bg-orange-500/15" : status === "invalid" ? "border-red-400 bg-red-500/15" : "border-white/15 bg-white/8"}`}>
          <div className="relative mx-auto h-64 w-64 rounded-lg border-2 border-dashed border-white/40">
            <span className="absolute left-0 right-0 h-1 bg-[#1565FF] shadow-[0_0_20px_#1565FF]" style={{ animation: "scanLine 1.8s ease-in-out infinite" }} />
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-2xl font-black">{status === "idle" ? "Ready" : status.toUpperCase()}</p>
                <p className="mt-2 text-sm font-semibold text-gray-300">Camera scanner, manual search, and fraud detection states</p>
              </div>
            </div>
          </div>
          <input className="input mt-5 !border-white/15 !bg-white/10 !text-white" placeholder="Manual ticket ID" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={() => setStatus("valid")} className="btn-primary !min-h-10">Valid</button>
            <button onClick={() => setStatus("used")} className="btn-secondary !min-h-10">Used</button>
            <button onClick={() => setStatus("invalid")} className="btn-quiet !min-h-10">Invalid</button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[["842", "checked in"], ["12", "flags"], ["98%", "capacity"]].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xl font-black">{value}</p>
              <p className="text-xs font-bold text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
