"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface AttendeeDetails {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  matricNumber?: string;
  university?: string;
  ticketType: string;
  type?: string;
  event: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  price: number;
  quantity?: number;
  reference: string;
  qrCode: string;
  isUsed: boolean;
}

interface VerificationResponse {
  message: string;
  status: "valid" | "used" | "invalid";
  attendee?: AttendeeDetails;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ticketResult, setTicketResult] = useState<VerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<AttendeeDetails[]>([]);

  // Clean raw input (handles plain OTX code or full URLs like https://swyft-ticket.name.ng/verify?code=OTX-xxx)
  const extractCode = (str: string): string => {
    if (!str) return "";
    const match = str.match(/(?:code=|^)(OTX-[a-zA-Z0-9-]+)/i);
    return match ? match[1] : str.trim();
  };

  const handleVerifyCode = useCallback(async (rawCode: string) => {
    const code = extractCode(rawCode);
    if (!code) {
      setErrorMessage("Please enter or scan a valid ticket code (e.g. OTX-...)");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Use GET to preview ticket details without prematurely consuming the ticket
      const res = await api.get<VerificationResponse>(`/orders/verify-ticket/${encodeURIComponent(code)}`);
      setTicketResult(res.data);
      setShowModal(true);

      if (res.data.attendee) {
        setRecentScans((prev) => {
          const filtered = prev.filter((item) => item.qrCode !== res.data.attendee!.qrCode);
          return [res.data.attendee!, ...filtered.slice(0, 4)];
        });
      }
    } catch (err: any) {
      const errRes = err.response?.data;
      if (errRes?.status === "invalid" || err.response?.status === 404) {
        setTicketResult({
          message: errRes?.message || "Invalid ticket: no matching record found.",
          status: "invalid",
        });
        setShowModal(true);
      } else {
        setErrorMessage(errRes?.message || "Failed to verify ticket. Please check connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-verify if code parameter is in URL
  useEffect(() => {
    if (codeParam) {
      setInputCode(codeParam);
      handleVerifyCode(codeParam);
    }
  }, [codeParam, handleVerifyCode]);

  // Confirm admission / Check In
  const handleAdmitAttendee = async () => {
    if (!ticketResult?.attendee?.qrCode) return;
    setAdmitting(true);
    try {
      const code = ticketResult.attendee.qrCode;
      const res = await api.post<VerificationResponse>(`/orders/verify-ticket/${encodeURIComponent(code)}`);
      setTicketResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          message: "Attendee admitted successfully! 🎉",
          status: "valid",
          attendee: prev.attendee ? { ...prev.attendee, isUsed: true } : undefined,
        };
      });

      // Update recent scans list
      setRecentScans((prev) =>
        prev.map((item) => (item.qrCode === code ? { ...item, isUsed: true } : item))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to check in attendee. Please try again.");
    } finally {
      setAdmitting(false);
    }
  };

  const getTierBadgeStyle = (tier: string = "") => {
    const lower = tier.toLowerCase();
    if (lower.includes("vip") || lower.includes("gold") || lower.includes("table")) {
      return "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/20";
    }
    if (lower.includes("vvip") || lower.includes("platinum")) {
      return "bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-400/20";
    }
    if (lower.includes("early")) {
      return "bg-blue-100 text-blue-900 border-blue-300 ring-2 ring-blue-400/20";
    }
    return "bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400/20";
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#1a202c]">
      {/* Top Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-[#d1410c] px-2.5 py-1 text-xs font-black tracking-wider text-white">
              SWYFT
            </span>
            <span className="text-base font-black tracking-tight text-[#1a202c]">
              Ticket Verifier
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Gate Scanner Active
            </span>
            <Link
              href="/"
              className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Exit to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d1410c]/10 text-[#d1410c] mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1a202c] sm:text-3xl">
            Scan & Verify Admission Pass
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Scan attendee QR codes or enter the verification token to check ticket authenticity, purchaser details, and ticket tier.
          </p>
        </div>

        {/* Verification Card */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyCode(inputCode);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Ticket Verification Token or Scan URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. OTX-f4ed6065-0aba-4e2c-8485 or paste link"
                  className="h-13 w-full rounded-xl border-2 border-gray-200 bg-[#F8F9FB] px-4 font-mono text-sm font-bold text-[#1a202c] outline-hidden transition focus:border-[#d1410c] focus:bg-white"
                />
                {inputCode && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputCode("");
                      setErrorMessage(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-600">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d1410c] text-sm font-extrabold text-white shadow-md transition hover:bg-[#b03507] active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying Pass...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Verify Pass
                  </>
                )}
              </button>

              <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-700 transition hover:bg-gray-100 active:scale-98">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Scan with Camera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setErrorMessage("Scanning QR image... You can also copy the verification code directly from the ticket.");
                    }
                  }}
                />
              </label>
            </div>
          </form>

          {/* Quick instructions */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-start gap-3 text-xs font-semibold text-gray-500">
              <span className="text-base shrink-0">💡</span>
              <p>
                When an attendee shows their scannable ticket pass on their phone or printable PDF, simply point any mobile camera at the QR code. It will open this verification page and automatically display their details and ticket tier in the pop-up modal.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Scans Session */}
        {recentScans.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Recently Verified in this Session
            </h3>
            <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
              {recentScans.map((scan) => (
                <div
                  key={scan.qrCode}
                  onClick={() => {
                    setTicketResult({
                      message: scan.isUsed ? "Ticket already used" : "Valid ticket",
                      status: scan.isUsed ? "used" : "valid",
                      attendee: scan,
                    });
                    setShowModal(true);
                  }}
                  className="flex items-center justify-between p-4 cursor-pointer transition hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1a202c]">{scan.name}</p>
                    <p className="text-xs text-gray-500">{scan.event} · <span className="font-semibold text-[#d1410c]">{scan.ticketType || scan.type}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scan.isUsed ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {scan.isUsed ? "Checked In" : "Valid"}
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TICKET DETAILS POP-UP MODAL (User Request) */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "92vh" }}
          >
            {/* Modal Header Status Banner */}
            {ticketResult?.status === "valid" && !ticketResult.attendee?.isUsed && (
              <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 font-black">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Valid Ticket Pass</h3>
                    <p className="text-xs text-emerald-100 font-medium">Ready for admission check-in</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1.5 text-emerald-100 hover:bg-emerald-700 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {ticketResult?.status === "valid" && ticketResult.attendee?.isUsed && (
              <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 font-black">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Checked In Successfully!</h3>
                    <p className="text-xs text-emerald-100 font-medium">Attendee admitted to event</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1.5 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {ticketResult?.status === "used" && (
              <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-amber-600 font-black">
                    !
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Ticket Already Used</h3>
                    <p className="text-xs text-amber-100 font-medium">This pass has already been checked in</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1.5 text-amber-100 hover:bg-amber-600 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {ticketResult?.status === "invalid" && (
              <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 font-black">
                    ✕
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Invalid Ticket</h3>
                    <p className="text-xs text-red-100 font-medium">No matching pass found on Swyft</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-1.5 text-red-100 hover:bg-red-700 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 sm:p-7">
              {ticketResult?.attendee ? (
                <div className="flex flex-col gap-6">

                  {/* PROMINENT TICKET TYPE BADGE (VIP, REGULAR, ETC) */}
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-200 p-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Ticket Tier</p>
                      <p className="text-xl font-black tracking-tight text-[#1a202c]">
                        {ticketResult.attendee.ticketType || ticketResult.attendee.type || "General Admission"}
                      </p>
                    </div>
                    <span className={`rounded-xl border px-3.5 py-1.5 text-xs font-black uppercase tracking-wider ${getTierBadgeStyle(ticketResult.attendee.ticketType || ticketResult.attendee.type)}`}>
                      {ticketResult.attendee.ticketType || ticketResult.attendee.type || "Regular"}
                    </span>
                  </div>

                  {/* PURCHASER DETAILS (User Request: Details of the person that bought the ticket) */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-[#d1410c]">
                      Purchaser / Attendee Details
                    </p>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d1410c]/10 text-base font-black text-[#d1410c]">
                        {ticketResult.attendee.name ? ticketResult.attendee.name.charAt(0).toUpperCase() : "A"}
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-[#1a202c]">
                          {ticketResult.attendee.name || "Valued Guest"}
                        </h4>
                        <p className="text-xs font-medium text-gray-500">{ticketResult.attendee.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
                      <div>
                        <span className="font-semibold text-gray-400">Phone Number:</span>
                        <p className="font-bold text-[#1a202c]">{ticketResult.attendee.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400">Admission Price:</span>
                        <p className="font-bold text-[#1a202c]">
                          {ticketResult.attendee.price ? `₦${ticketResult.attendee.price.toLocaleString()}` : "Free Admission"}
                        </p>
                      </div>
                      {ticketResult.attendee.university && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-400">Institution:</span>
                          <p className="font-bold text-[#1a202c]">{ticketResult.attendee.university}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EVENT DETAILS */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-500">
                      Event Information
                    </p>
                    <h4 className="text-base font-extrabold text-[#1a202c]">{ticketResult.attendee.event}</h4>
                    <div className="mt-3 flex flex-col gap-2 text-xs font-semibold text-gray-600">
                      {ticketResult.attendee.eventDate && (
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{ticketResult.attendee.eventDate} {ticketResult.attendee.eventTime ? `• ${ticketResult.attendee.eventTime}` : ""}</span>
                        </div>
                      )}
                      {ticketResult.attendee.venue && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{ticketResult.attendee.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-mono text-gray-400 text-[11px]">
                        <span>🔑</span>
                        <span>Token: {ticketResult.attendee.qrCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col gap-2 pt-2">
                    {ticketResult.status === "valid" && !ticketResult.attendee.isUsed && (
                      <button
                        onClick={handleAdmitAttendee}
                        disabled={admitting}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-98 disabled:opacity-50"
                      >
                        {admitting ? "Checking In..." : "Admit Attendee & Check In →"}
                      </button>
                    )}

                    {ticketResult.status === "used" && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800">
                        ⚠️ Pass has already been checked in. Do not admit a duplicate attendee.
                      </div>
                    )}

                    <button
                      onClick={() => setShowModal(false)}
                      className="h-11 w-full rounded-xl border border-gray-200 text-xs font-extrabold text-gray-600 transition hover:bg-gray-100"
                    >
                      Close / Scan Next Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-gray-600">
                    {ticketResult?.message || "Invalid ticket code. Please ensure you scanned the correct Swyft QR pass."}
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
                  >
                    Try Another Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#F4F5F8] text-center">
          <div>
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#d1410c] border-t-transparent" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Loading Swyft Ticket Scanner...
            </p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
