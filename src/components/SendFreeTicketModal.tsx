"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  sold?: number;
}

interface OrganizerEvent {
  id: string;
  title: string;
  name?: string;
  date?: string;
  location?: string;
  isPassed?: boolean;
  tickets?: TicketTier[];
  Ticket?: TicketTier[];
}

interface SendFreeTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedEventId?: string;
}

export default function SendFreeTicketModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedEventId,
}: SendFreeTicketModalProps) {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || "");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [attendeeName, setAttendeeName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issuedResult, setIssuedResult] = useState<any | null>(null);

  // Fetch organizer events when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setErrorMessage(null);
      try {
        const res = await api.get<OrganizerEvent[]>("/organizer/events");
        const allEvents = res.data || [];
        setEvents(allEvents);

        // If preselectedEventId is supplied or only 1 active event exists, select it
        if (preselectedEventId) {
          setSelectedEventId(preselectedEventId);
        } else {
          // Pre-select first active event if none selected
          const firstActive = allEvents.find((e) => {
            if (e.isPassed) return false;
            if (e.date) {
              const d = new Date(e.date);
              d.setHours(23, 59, 59, 999);
              return d.getTime() >= Date.now();
            }
            return true;
          });
          if (firstActive) setSelectedEventId(firstActive.id);
        }
      } catch (err: any) {
        console.error("Failed to load organizer events:", err);
        setErrorMessage("Failed to load events. Please try again.");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [isOpen, preselectedEventId]);

  // Derive active events (exclude passed events)
  const activeEvents = events.filter((e) => {
    if (e.isPassed) return false;
    if (e.date) {
      const eventDate = new Date(e.date);
      if (!isNaN(eventDate.getTime())) {
        const endOfDay = new Date(eventDate);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay.getTime() >= Date.now();
      }
    }
    return true;
  });

  // Current selected event object
  const currentEvent = events.find((e) => e.id === selectedEventId);
  const currentTickets = currentEvent?.tickets || currentEvent?.Ticket || [];

  // Auto-select first ticket tier when event changes
  useEffect(() => {
    if (currentTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(currentTickets[0].id);
    } else if (currentTickets.length > 0 && !currentTickets.some((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(currentTickets[0].id);
    }
  }, [currentTickets, selectedTicketId]);

  const resetForm = () => {
    setAttendeeName("");
    setRecipientEmail("");
    setPhone("");
    setErrorMessage(null);
    setIssuedResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedEventId) {
      setErrorMessage("Please select an active event.");
      return;
    }
    if (!selectedTicketId) {
      setErrorMessage("Please select a ticket category.");
      return;
    }
    if (!attendeeName.trim()) {
      setErrorMessage("Please enter the attendee's name.");
      return;
    }
    if (!recipientEmail.trim()) {
      setErrorMessage("Please enter the recipient's email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/organizer/send-free-ticket", {
        eventId: selectedEventId,
        ticketId: selectedTicketId,
        name: attendeeName.trim(),
        email: recipientEmail.trim(),
        phone: phone.trim() || undefined,
      });

      setIssuedResult(res.data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Failed to send free ticket:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to send free ticket. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#d1410c]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-[#1a202c]">Send Free Ticket</h2>
              <p className="text-xs font-semibold text-gray-400">Issue a complimentary pass directly to attendee&apos;s email</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {/* SUCCESS VIEW */}
          {issuedResult ? (
            <div className="flex flex-col items-center py-2 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black uppercase text-emerald-800">
                Ticket Sent Successfully! 🎉
              </span>

              <h3 className="mt-3 text-lg font-black text-[#1a202c]">
                {issuedResult.ticket?.attendeeName}
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                Delivered to <strong>{issuedResult.ticket?.attendeeEmail}</strong>
              </p>

              <div className="my-5 w-full rounded-2xl bg-[#F8F9FA] border border-gray-200 p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Event:</span>
                  <span className="font-bold text-[#1a202c] text-right">{issuedResult.ticket?.eventName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Ticket Tier:</span>
                  <span className="font-extrabold text-[#d1410c] uppercase">{issuedResult.ticket?.ticketType} (Complimentary)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Booking Reference:</span>
                  <span className="font-mono font-bold text-gray-700">{issuedResult.ticket?.reference}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Verification Token:</span>
                  <span className="font-mono font-bold text-gray-700">{issuedResult.ticket?.qrCode}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Live QR Verification:</span>
                  <a
                    href={`/verify?code=${encodeURIComponent(issuedResult.ticket?.qrCode)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#d1410c] hover:underline flex items-center gap-1"
                  >
                    Test Verification Scan &rarr;
                  </a>
                </div>
              </div>

              <p className="text-[11px] font-medium text-gray-400 leading-relaxed mb-6">
                ✓ A confirmation receipt and official scannable QR ticket pass with attached PDF have been dispatched to the recipient via email.
              </p>

              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Send Another Pass
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl bg-[#d1410c] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#b03507] transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-600">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 1. SELECT EVENT (Must be active upcoming event) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                    Active Event <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600">Only Active Upcoming Events</span>
                </div>

                {loadingEvents ? (
                  <div className="h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 text-xs font-semibold text-gray-400">
                    Loading your events...
                  </div>
                ) : events.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️</span> No events created yet
                    </p>
                    <p className="mt-1 text-amber-700 leading-relaxed">
                      You need at least one upcoming event to issue tickets. Please create an event first.
                    </p>
                    <a
                      href="/organizer/events"
                      className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#d1410c] px-3.5 py-1.5 font-bold text-white shadow-xs transition hover:bg-[#b03507]"
                    >
                      + Create Event Now &rarr;
                    </a>
                  </div>
                ) : activeEvents.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⏳</span> All your events have passed
                    </p>
                    <p className="mt-1 text-amber-700 leading-relaxed">
                      Complimentary passes can only be issued for upcoming active events. Please create a new upcoming event.
                    </p>
                    <a
                      href="/organizer/events"
                      className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#d1410c] px-3.5 py-1.5 font-bold text-white shadow-xs transition hover:bg-[#b03507]"
                    >
                      + Create Upcoming Event &rarr;
                    </a>
                  </div>
                ) : (
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      setSelectedTicketId("");
                    }}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-xs font-bold text-[#1a202c] outline-hidden focus:border-[#d1410c] focus:bg-white transition"
                  >
                    <option value="">Select an active event...</option>
                    {activeEvents.map((ev) => {
                      const dateStr = ev.date
                        ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Upcoming";
                      return (
                        <option key={ev.id} value={ev.id}>
                          {ev.title || ev.name} ({dateStr})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* 2. SELECT TICKET CATEGORY / TIER */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  Ticket Category / Tier <span className="text-red-500">*</span>
                </label>
                {currentTickets.length === 0 ? (
                  <div className="h-11 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center px-4 text-xs font-semibold text-gray-400">
                    {selectedEventId ? "No ticket categories set up for this event yet." : "Select an event above first."}
                  </div>
                ) : (
                  <select
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-xs font-bold text-[#1a202c] outline-hidden focus:border-[#d1410c] focus:bg-white transition"
                  >
                    <option value="">Choose category (Regular, VIP, etc.)...</option>
                    {currentTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Original Price: ₦{t.price?.toLocaleString()} • Free Issue)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3. ATTENDEE FULL NAME */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  Attendee Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Ayomide Adekunle"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-xs font-bold text-[#1a202c] outline-hidden focus:border-[#d1410c] focus:bg-white transition placeholder:font-medium placeholder:text-gray-400"
                />
              </div>

              {/* 4. RECIPIENT EMAIL ADDRESS */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  Recipient Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. attendee@gmail.com"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-xs font-bold text-[#1a202c] outline-hidden focus:border-[#d1410c] focus:bg-white transition placeholder:font-medium placeholder:text-gray-400"
                />
              </div>

              {/* 5. PHONE NUMBER (OPTIONAL) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                    Phone Number
                  </label>
                  <span className="text-[10px] font-semibold text-gray-400">Optional</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F8F9FA] px-3.5 text-xs font-bold text-[#1a202c] outline-hidden focus:border-[#d1410c] focus:bg-white transition placeholder:font-medium placeholder:text-gray-400"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !selectedEventId ||
                    !selectedTicketId ||
                    !attendeeName.trim() ||
                    !recipientEmail.trim()
                  }
                  className="flex-1 rounded-xl bg-[#d1410c] py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#b03507] active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending Pass...
                    </>
                  ) : (
                    "Send Free Ticket →"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
