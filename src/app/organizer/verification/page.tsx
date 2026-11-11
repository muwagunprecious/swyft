"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import jsQR from "jsqr";

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
  type: "success" | "void" | "unauthorized" | "event_ended" | "error";
  title: string;
  message: string;
  attendee?: Attendee;
}

const mockAttendees: Attendee[] = [];

// Soft audio chime on successful QR scan
function playScanChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Autoplay restrictions or audio unsupported
  }
}

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

  // Camera & Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const [scanAlert, setScanAlert] = useState<ScanAlert | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Extracts ticket verification code from raw string or full URL
  const extractCode = (str: string): string => {
    if (!str) return "";
    const trimmed = str.trim();

    // 1. URL with ?code=...
    const paramMatch = trimmed.match(/[?&]code=([a-zA-Z0-9-]+)/i);
    if (paramMatch) return paramMatch[1];

    // 2. URL path with /verify-ticket/... or /verify/...
    const pathMatch = trimmed.match(/(?:\/verify-ticket\/|\/verify\/)([a-zA-Z0-9-]+)/i);
    if (pathMatch) return pathMatch[1];

    // 3. Raw OTX code
    const otxMatch = trimmed.match(/(OTX-[a-zA-Z0-9-]+)/i);
    if (otxMatch) return otxMatch[1];

    // 4. Raw UUID format
    const uuidMatch = trimmed.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidMatch) return uuidMatch[1];

    return trimmed;
  };

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsInitializingCamera(false);
    setTorchActive(false);
    setQrDetected(false);
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

      if (status === 400 && (errRes?.status === "event_ended" || errMsg.toLowerCase().includes("event ended") || errMsg.toLowerCase().includes("already passed"))) {
        setScanAlert({
          type: "event_ended",
          title: "Event Ended",
          message: errMsg || `This event has ended. Tickets can no longer be checked in.`,
          attendee: errRes?.attendee,
        });
      } else if (status === 400 && (errRes?.status === "void" || errRes?.status === "used" || errMsg.includes("already been used") || errMsg.includes("VOID"))) {
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

  // Continuous frame scanner using jsQR + BarcodeDetector fallback
  const startContinuousScanning = useCallback(() => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    if (!offscreenCanvasRef.current && typeof document !== "undefined") {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });

    let lastScanTime = 0;
    let isProcessing = false;

    // Optional native BarcodeDetector fast path
    let barcodeDetector: any = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    const scanTick = async (timestamp: number) => {
      const video = videoRef.current;
      if (!video || !mediaStreamRef.current) return;

      // Throttle to scan every ~100ms for high responsiveness without freezing the UI
      if (timestamp - lastScanTime > 100 && !isProcessing) {
        lastScanTime = timestamp;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          isProcessing = true;
          try {
            let decodedText = "";

            // 1. Try native BarcodeDetector if available
            if (barcodeDetector) {
              try {
                const barcodes = await barcodeDetector.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
                  decodedText = barcodes[0].rawValue;
                }
              } catch (detErr) {
                // fall back to jsQR
              }
            }

            // 2. High-reliability universal jsQR decoder
            if (!decodedText && canvas && ctx) {
              const width = video.videoWidth;
              const height = video.videoHeight;
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(video, 0, 0, width, height);

              const imageData = ctx.getImageData(0, 0, width, height);
              const qr = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              if (qr && qr.data && qr.data.trim()) {
                decodedText = qr.data.trim();
              }
            }

            // 3. If a QR code is found, trigger verification
            if (decodedText) {
              playScanChime();
              setQrDetected(true);
              stopCamera();
              handleVerifyTicket(decodedText);
              return; // Stop animation loop
            }
          } catch (scanErr) {
            console.warn("Scan frame error:", scanErr);
          } finally {
            isProcessing = false;
          }
        }
      }

      scanFrameRef.current = requestAnimationFrame(scanTick);
    };

    scanFrameRef.current = requestAnimationFrame(scanTick);
  }, [handleVerifyTicket, stopCamera]);

  // Start device camera
  const startCamera = async (overrideFacing?: "environment" | "user") => {
    setScanAlert(null);
    setCameraError(null);
    setQrDetected(false);
    setIsInitializingCamera(true);

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Camera access is not supported by your browser or requires a secure connection (HTTPS / localhost)."
      );
      setIsInitializingCamera(false);
      return;
    }

    // Stop any existing stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    const desiredFacing = overrideFacing || cameraFacingMode;

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: desiredFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (initialErr) {
        // Fallback constraint for devices without environment facing camera
        console.warn("Ideal facing mode constraint failed, falling back to basic video:", initialErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setIsInitializingCamera(false);

      // Check for flashlight capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = typeof videoTrack.getCapabilities === "function" ? videoTrack.getCapabilities() : {};
        setHasTorch(Boolean(capabilities?.torch));
      }

      // Check if device has multiple cameras (back and front)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (devErr) {
        // ignore
      }

      // Attach stream to video tag
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play().catch((playErr) => console.warn("Video play interrupted:", playErr));
        startContinuousScanning();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setIsInitializingCamera(false);
      setIsCameraActive(false);

      let msg = "Unable to access camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera permissions in your browser address bar/settings, or enter the code manually below.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera found on this device. You can type or paste the ticket code manually.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Camera is currently in use by another application. Please close other camera apps and retry.";
      }
      setCameraError(msg);
    }
  };

  // Flip front / back camera
  const toggleFacingMode = () => {
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  // Toggle torch / flashlight on supported mobile devices
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchActive;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchActive(nextTorch);
    } catch (e) {
      console.warn("Torch error:", e);
    }
  };

  // Ensure video element receives stream whenever it becomes active in DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== mediaStreamRef.current) {
        video.srcObject = mediaStreamRef.current;
      }
      video.setAttribute("playsinline", "true");
      video.play().then(() => {
        startContinuousScanning();
      }).catch((playErr) => {
        console.warn("Video play error on state sync:", playErr);
      });
    }
  }, [isCameraActive, startContinuousScanning]);

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
            scanAlert.type === "event_ended"
              ? "border-amber-600/60 bg-amber-950/40 text-amber-300"
              : scanAlert.type === "void"
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
              scanAlert.type === "event_ended"
                ? "bg-amber-500/20 text-amber-400"
                : scanAlert.type === "void"
                ? "bg-red-500/20 text-red-400"
                : scanAlert.type === "unauthorized"
                ? "bg-amber-500/20 text-amber-400"
                : scanAlert.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {scanAlert.type === "event_ended" ? "⏳" : scanAlert.type === "void" ? "⚠️" : scanAlert.type === "unauthorized" ? "🔒" : scanAlert.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider">{scanAlert.title}</h3>
            <p className="mt-1 text-xs opacity-90">{scanAlert.message}</p>
          </div>
          <button
            onClick={() => setScanAlert(null)}
            className="text-gray-400 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* CAMERA ERROR BANNER */}
      {cameraError && (
        <div className="rounded-2xl border border-rose-800/40 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <span className="text-base">📷</span>
            <div>
              <p className="font-bold text-rose-200">Camera Notice</p>
              <p className="mt-0.5 text-rose-300/90 leading-relaxed">{cameraError}</p>
            </div>
          </div>
          <button
            onClick={() => startCamera()}
            className="rounded-full bg-rose-900/60 hover:bg-rose-900 px-3.5 py-1.5 font-semibold text-rose-200 transition text-[11px] cursor-pointer shrink-0"
          >
            Retry Camera
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT — SCANNER + SEARCH + RESULT */}
        <div className="flex flex-col gap-5">

          {/* DEDICATED QR SCANNER CARD */}
          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#fafafa] flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#d1410c] text-white text-xs font-black">
                    QR
                  </span>
                  Organizer Gate Scanner
                </h2>
                <p className="mt-1 text-xs text-[#9ca3af]">
                  Point camera at attendee QR pass to auto-detect and admit instantly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isCameraActive && hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="flex items-center gap-1.5 rounded-full border border-[#374151] bg-[#1a1a1a] px-3 py-1.5 text-xs font-semibold text-[#fafafa] transition hover:bg-[#262626]"
                    title="Switch camera"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
                      <path d="m16 8-4-4-4 4" />
                      <path d="M12 4v12" />
                    </svg>
                    Flip
                  </button>
                )}

                {isCameraActive && hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      torchActive
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-[#374151] bg-[#1a1a1a] text-[#fafafa] hover:bg-[#262626]"
                    }`}
                    title="Toggle flashlight"
                  >
                    🔦 {torchActive ? "Torch On" : "Torch"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : () => startCamera()}
                  disabled={isInitializingCamera}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer shadow-sm ${
                    isCameraActive
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-[#fafafa] text-[#0a0a0a] hover:bg-white"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {isInitializingCamera ? "Opening..." : isCameraActive ? "Stop Camera" : "Open Camera Scanner"}
                </button>
              </div>
            </div>

            {/* CAMERA VIEWFINDER */}
            {isCameraActive && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#d1410c] bg-black aspect-video sm:aspect-[16/10] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
                      startContinuousScanning();
                    }
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Laser Scanning Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-52 h-52 sm:w-64 sm:h-64 border-2 rounded-2xl relative transition-all duration-300 ${
                    qrDetected ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.5)]" : "border-[#d1410c]"
                  }`}>
                    {/* Scanner corner markers */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-white rounded-br" />

                    {/* Animated scanning laser line */}
                    {!qrDetected && (
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f05537] to-transparent shadow-[0_0_8px_#f05537] animate-pulse top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] text-white font-medium border border-white/10 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  {qrDetected ? "QR Code Recognized!" : "Point camera at QR code"}
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
                className="h-11 px-6 rounded-full bg-[#d1410c] text-xs font-semibold text-white transition hover:bg-[#b03507] disabled:opacity-50 shrink-0 cursor-pointer"
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
                    className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[#202020] cursor-pointer"
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
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      Validate & Grant Entry
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="mb-1 text-center text-xs font-medium text-[#9ca3af]">Confirm entry for <strong className="text-[#fafafa]">{selected.name}</strong>?</p>
                      <button
                        onClick={handleCheckInFromSelect}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-xs font-semibold text-white transition hover:bg-emerald-600 cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        Yes, Grant Entry
                      </button>
                      <button
                        onClick={() => setConfirming(false)}
                        className="flex h-10 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#9ca3af] transition hover:bg-[#202020] hover:text-[#fafafa] cursor-pointer"
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
                className="mt-3 flex h-10 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151] cursor-pointer"
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
