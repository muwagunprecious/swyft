"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  event: string;
  ticket: string;
  amount: number;
  status: "not-checked-in" | "checked-in";
  checkedInAt?: string;
  qrCode?: string;
}

interface ScanAlert {
  type: "success" | "void" | "unauthorized" | "error";
  title: string;
  message: string;
  attendee?: Attendee;
}

const mockAttendees: Attendee[] = [];

function VerificationContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState(codeParam);
  const [attendees, setAttendees] = useState<Attendee[]>(mockAttendees);
  const [selected, setSelected] = useState<Attendee | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanAlert, setScanAlert] = useState<ScanAlert | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const res = await api.get('/organizer/attendees');
        if (res.data) setAttendees(res.data);
      } catch (err) {
        console.error('Failed to fetch attendees', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendees();
  }, []);

  const results = search.trim().length > 0
    ? attendees.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search) ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        (a.qrCode && a.qrCode.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const checkedInCount = attendees.filter((a) => a.status === "checked-in").length;

  const extractCode = (str: string): string => {
    if (!str) return "";
    const match = str.match(/(?:code=|^)(OTX-[a-zA-Z0-9-]+)/i);
    return match ? match[1] : str.trim();
  };

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Main verification handler for QR code or Attendee ID
  const handleVerifyTicket = useCallback(async (rawCode: string) => {
    const code = extractCode(rawCode);
    if (!code) return;

    setScanning(true);
    setScanAlert(null);
    setSelected(null);

    try {
      const res = await api.post(`/organizer/verify/${encodeURIComponent(code)}`);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const attendeeData = res.data?.attendee;

      if (attendeeData) {
        const updated: Attendee = {
          id: attendeeData.id || code,
          name: attendeeData.name || "Attendee",
          email: attendeeData.email || "",
          phone: attendeeData.phone || "",
          event: attendeeData.event || "Event",
          ticket: attendeeData.ticketType || "Admission",
          amount: attendeeData.price || 0,
          status: "checked-in",
          checkedInAt: now,
          qrCode: attendeeData.qrCode || code,
        };

        setAttendees((prev) => {
          const exists = prev.some((a) => a.id === updated.id || a.qrCode === updated.qrCode);
          if (exists) {
            return prev.map((a) => (a.id === updated.id || a.qrCode === updated.qrCode ? updated : a));
          }
          return [updated, ...prev];
        });

        setSelected(updated);
        setJustCheckedIn(true);
        setScanAlert({
          type: "success",
          title: "Ticket Valid · Checked In Successfully! 🎉",
          message: `Admitted ${updated.name} (${updated.ticket})`,
          attendee: updated,
        });
      } else {
        setScanAlert({
          type: "success",
          title: "Ticket Verified Successfully! 🎉",
          message: "Attendee entry granted.",
        });
      }

      setScanInput("");
      stopCamera();
    } catch (err: any) {
      const errRes = err.response?.data;
      const status = err.response?.status;
      const errMsg = errRes?.message || "";

      if (status === 400 && (errRes?.status === "used" || errMsg.includes("already been used"))) {
        setScanAlert({
          type: "void",
          title: "VOID: This ticket has already been used",
          message: "This pass has already been checked in. Duplicate entry is not permitted.",
          attendee: errRes?.attendee,
        });
      } else if (status === 403 || errRes?.status === "unauthorized") {
        setScanAlert({
          type: "unauthorized",
          title: "You are not authorized to scan this ticket",
          message: "This ticket belongs to another event. You do not have permission to admit attendees for this event.",
        });
      } else if (status === 404 || errRes?.status === "invalid") {
        setScanAlert({
          type: "error",
          title: "Invalid Ticket Pass",
          message: "No matching ticket record found on Swyft.",
        });
      } else {
        setScanAlert({
          type: "error",
          title: "Scan Error",
          message: errMsg || "Failed to verify ticket. Please try again.",
        });
      }
    } finally {
      setScanning(false);
    }
  }, [stopCamera]);

  // Auto-verify if code parameter is in URL
  useEffect(() => {
    if (codeParam) {
      setScanInput(codeParam);
      handleVerifyTicket(codeParam);
    }
  }, [codeParam, handleVerifyTicket]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start camera scanner
  const startCamera = async () => {
    setScanAlert(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // If BarcodeDetector is natively supported, scan frames continuously
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  stopCamera();
                  handleVerifyTicket(barcodes[0].rawValue);
                }
              } catch (detectErr) {
                // Ignore frame parse misses
              }
            }
          }, 300);
        } catch (e) {
          console.warn("BarcodeDetector setup error:", e);
        }
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      alert("Unable to access camera. Please allow camera permissions in your browser or type the verification code.");
      setIsCameraActive(false);
    }
  };

  const handleSelect = (a: Attendee) => {
    setSelected(a);
    setSearch("");
    setConfirming(false);
    setJustCheckedIn(false);
    setScanAlert(null);
  };

  const handleCheckInFromSelect = async () => {
    if (!selected) return;
    handleVerifyTicket(selected.qrCode || selected.id);
  };

  const handleReset = () => {
    setSelected(null);
    setSearch("");
    setConfirming(false);
    setJustCheckedIn(false);
    setScanAlert(null);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
            Access Control
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">Ticket Verification</h1>
          <p className="mt-1 text-xs text-[#9ca3af]">
            Scan attendee QR codes with your device camera or search attendee credentials to grant gate entry.
          </p>
        </div>
        <Link
          href="/organizer/attendees"
          className="flex shrink-0 items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          All Attendees
        </Link>
      </div>

      {/* STAT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Attendees", value: attendees.length, color: "text-[#fafafa]" },
          { label: "Checked In", value: checkedInCount, color: "text-emerald-400" },
          { label: "Pending Entry", value: attendees.length - checkedInCount, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
            <p className="text-xs font-medium text-[#9ca3af]">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* PROMINENT SCAN ALERT BANNER */}
      {scanAlert && (
        <div
          className={`rounded-2xl border p-5 flex items-start gap-4 animate-in fade-in transition-all ${
            scanAlert.type === "void"
              ? "border-red-600/50 bg-red-950/40 text-red-300"
              : scanAlert.type === "unauthorized"
              ? "border-amber-600/50 bg-amber-950/40 text-amber-300"
              : scanAlert.type === "success"
              ? "border-emerald-600/50 bg-emerald-950/40 text-emerald-300"
              : "border-gray-700 bg-gray-900 text-gray-300"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-base ${
              scanAlert.type === "void"
                ? "bg-red-500/20 text-red-400"
                : scanAlert.type === "unauthorized"
                ? "bg-amber-500/20 text-amber-400"
                : scanAlert.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {scanAlert.type === "void" ? "⚠️" : scanAlert.type === "unauthorized" ? "🔒" : scanAlert.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider">{scanAlert.title}</h3>
            <p className="mt-1 text-xs opacity-90">{scanAlert.message}</p>
          </div>
          <button
            onClick={() => setScanAlert(null)}
            className="text-gray-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT — SCANNER + SEARCH + RESULT */}
        <div className="flex flex-col gap-5">

          {/* DEDICATED QR SCANNER CARD */}
          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#fafafa] flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#d1410c] text-white text-xs">
                    QR
                  </span>
                  Organizer Gate Scanner
                </h2>
                <p className="mt-1 text-xs text-[#9ca3af]">
                  Point camera at attendee QR pass or enter token code to verify and admit.
                </p>
              </div>
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isCameraActive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-[#374151] bg-[#1a1a1a] text-[#fafafa] hover:bg-[#262626]"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                {isCameraActive ? "Stop Camera" : "Open Camera"}
              </button>
            </div>

            {/* CAMERA VIEWFINDER */}
            {isCameraActive && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#d1410c] bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanner Target Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-[#d1410c] rounded-2xl relative animate-pulse">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-[11px] text-white font-medium">
                  Align QR code inside frame
                </div>
              </div>
            )}

            {/* SCAN/TOKEN INPUT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyTicket(scanInput);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan QR or enter token (e.g. OTX-f4ed6065-0aba-4e2c)..."
                  className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] py-2.5 pl-11 pr-4 text-xs font-mono font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
                />
              </div>
              <button
                type="submit"
                disabled={scanning || !scanInput.trim()}
                className="h-11 px-6 rounded-full bg-[#d1410c] text-xs font-semibold text-white transition hover:bg-[#b03507] disabled:opacity-50 shrink-0"
              >
                {scanning ? "Verifying..." : "Verify & Admit"}
              </button>
            </form>
          </div>

          {/* SEARCH ATTENDEE CARD */}
          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-sm">
            <label className="mb-2 block text-xs font-semibold text-[#fafafa]">
              Search Attendee Credentials
            </label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); setJustCheckedIn(false); }}
                placeholder="Type attendee name, email, or phone number..."
                className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] py-2.5 pl-11 pr-4 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
              />
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {results.length > 0 && (
              <div className="mt-3 flex flex-col divide-y divide-[#262626] overflow-hidden rounded-2xl border border-[#262626] bg-[#171717] shadow-xl">
                {results.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[#202020]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#262626] text-xs font-semibold text-[#fafafa]">
                      {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#fafafa]">{a.name}</p>
                      <p className="truncate text-[11px] text-[#9ca3af]">{a.event} · {a.ticket}</p>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${
                      a.status === "checked-in"
                        ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
                        : "border-amber-800/40 bg-amber-950/40 text-amber-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${a.status === "checked-in" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {a.status === "checked-in" ? "In" : "Pending"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {search.trim().length > 1 && results.length === 0 && (
              <div className="mt-3 rounded-2xl border border-rose-900/30 bg-rose-950/20 px-4 py-4 text-center">
                <p className="text-xs font-semibold text-rose-400">No attendee found for &ldquo;{search}&rdquo;</p>
                <p className="mt-1 text-[11px] text-rose-400/80">Check the spelling or try searching by email or phone.</p>
              </div>
            )}
          </div>

          {/* SELECTED ATTENDEE CARD */}
          {selected && (
            <div className={`rounded-2xl border p-6 shadow-sm ${
              justCheckedIn ? "border-emerald-800/50 bg-[#121212]" :
              selected.status === "checked-in" ? "border-red-800/50 bg-[#121212]" :
              "border-[#262626] bg-[#121212]"
            }`}>
              {/* Status banner */}
              <div className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                justCheckedIn ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400" :
                selected.status === "checked-in" ? "border-red-800/40 bg-red-950/40 text-red-400" :
                "border-[#262626] bg-[#171717] text-[#fafafa]"
              }`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  justCheckedIn ? "bg-emerald-900/50 text-emerald-400" :
                  selected.status === "checked-in" ? "bg-red-900/50 text-red-400" :
                  "bg-[#262626] text-[#fafafa]"
                }`}>
                  {justCheckedIn ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : selected.status === "checked-in" ? (
                    <span className="font-bold text-sm">⚠️</span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold">
                    {justCheckedIn ? "Checked In Successfully" :
                     selected.status === "checked-in" ? "VOID · This ticket has already been used" :
                     "Valid Ticket — Ready to Verify"}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {justCheckedIn ? `Admitted at ${selected.checkedInAt}` :
                     selected.status === "checked-in" ? `This ticket was already checked in. Duplicate entry is not permitted.` :
                     "Tap validate to grant venue entry"}
                  </p>
                </div>
              </div>

              {/* Attendee details */}
              <div className="mb-6 flex flex-col divide-y divide-[#262626]">
                {[
                  ["Ticket ID", selected.id],
                  ["Full Name", selected.name],
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["Event", selected.event],
                  ["Ticket Type", selected.ticket],
                  ["Amount Paid", `₦${selected.amount.toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-xs text-[#9ca3af]">{label}</span>
                    <span className="text-xs font-semibold text-[#fafafa] text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {selected.status === "not-checked-in" && !justCheckedIn && (
                <>
                  {!confirming ? (
                    <button
                      onClick={() => setConfirming(true)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      Validate & Grant Entry
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="mb-1 text-center text-xs font-medium text-[#9ca3af]">Confirm entry for <strong className="text-[#fafafa]">{selected.name}</strong>?</p>
                      <button
                        onClick={handleCheckInFromSelect}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-xs font-semibold text-white transition hover:bg-emerald-600"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        Yes, Grant Entry
                      </button>
                      <button
                        onClick={() => setConfirming(false)}
                        className="flex h-10 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#9ca3af] transition hover:bg-[#202020] hover:text-[#fafafa]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}

              {selected.status === "checked-in" && !justCheckedIn && (
                <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-center text-xs font-bold text-red-400">
                  ⚠️ This ticket has already been used and cannot be admitted again.
                </div>
              )}

              <button
                onClick={handleReset}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]"
              >
                Search Another Attendee
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — RECENT CHECK-INS */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden h-fit">
          <div className="flex items-center justify-between border-b border-[#262626] px-5 py-4">
            <h2 className="text-xs font-semibold text-[#fafafa]">Recent Check-Ins</h2>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
          <div className="flex flex-col divide-y divide-[#262626] max-h-[480px] overflow-y-auto">
            {attendees.filter((a) => a.status === "checked-in").length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-[#9ca3af]">No check-ins yet.</p>
            ) : (
              attendees
                .filter((a) => a.status === "checked-in")
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-800/40 bg-emerald-950/40 text-xs font-semibold text-emerald-400">
                      {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-[#fafafa]">{a.name}</p>
                      <p className="text-[11px] text-[#9ca3af]">{a.ticket} · {a.checkedInAt || "Checked In"}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                ))
            )}
          </div>
          <div className="border-t border-[#262626] px-5 py-3 text-center">
            <p className="text-xs text-[#9ca3af]">
              <span className="font-semibold text-emerald-400">{checkedInCount}</span> of {attendees.length} admitted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#fafafa] border-t-transparent" />
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
