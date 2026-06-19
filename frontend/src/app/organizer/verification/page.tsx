"use client";

import { useState, useEffect } from "react";
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
}

const mockAttendees: Attendee[] = [];

export default function VerificationPage() {
  const [search, setSearch] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>(mockAttendees);
  const [selected, setSelected] = useState<Attendee | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
        a.id.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const checkedInCount = attendees.filter((a) => a.status === "checked-in").length;

  const handleSelect = (a: Attendee) => {
    setSelected(a);
    setSearch("");
    setConfirming(false);
    setJustCheckedIn(false);
  };

  const handleCheckIn = async () => {
    if (!selected) return;
    try {
      await api.post(`/organizer/verify/${selected.id}`);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const updated = { ...selected, status: "checked-in" as const, checkedInAt: now };
      setAttendees((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
      setSelected(updated);
      setConfirming(false);
      setJustCheckedIn(true);
    } catch (error) {
      console.error('Failed to verify ticket', error);
      alert('Failed to verify ticket. Please try again.');
    }
  };

  const handleReset = () => {
    setSelected(null);
    setSearch("");
    setConfirming(false);
    setJustCheckedIn(false);
  };

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[860px] px-6 py-8">

        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">Access Manager</p>
            <h1 className="text-2xl font-black text-[#1a202c]">Ticket Verification</h1>
            <p className="mt-1 text-[13px] font-semibold text-gray-400">
              Search attendee name, email, or phone to verify their ticket.
            </p>
          </div>
          <Link
            href="/organizer/attendees"
            className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-bold text-gray-600 no-underline transition hover:bg-gray-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            All Attendees
          </Link>
        </div>

        {/* STAT STRIP */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Attendees", value: attendees.length, color: "text-[#1a202c]" },
            { label: "Checked In", value: checkedInCount, color: "text-[#12B76A]" },
            { label: "Pending Entry", value: attendees.length - checkedInCount, color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          {/* LEFT — SEARCH + RESULT */}
          <div className="flex flex-col gap-4">

            {/* SEARCH BOX */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-3 block text-[14px] font-black text-[#1a202c]">
                Search Attendee
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelected(null); setJustCheckedIn(false); }}
                  placeholder="Type name, email, phone or ticket ID..."
                  className="h-13 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] py-3.5 pl-11 pr-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20 placeholder:text-gray-300"
                />
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {results.length > 0 && (
                <div className="mt-2 flex flex-col divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {results.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSelect(a)}
                      className="flex items-center gap-3 px-4 py-3.5 text-left transition hover:bg-purple-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3e8ff] text-[12px] font-black text-[#9333ea]">
                        {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1a202c]">{a.name}</p>
                        <p className="truncate text-[11px] font-semibold text-gray-400">{a.event} · {a.ticket}</p>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        a.status === "checked-in" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${a.status === "checked-in" ? "bg-green-500" : "bg-amber-500"}`} />
                        {a.status === "checked-in" ? "In" : "Pending"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {search.trim().length > 1 && results.length === 0 && (
                <div className="mt-2 rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-center">
                  <p className="text-[13px] font-bold text-red-600">No attendee found for "{search}"</p>
                  <p className="mt-1 text-[11px] font-semibold text-red-400">Check the spelling or try their email / phone number.</p>
                </div>
              )}
            </div>

            {/* SELECTED ATTENDEE CARD */}
            {selected && (
              <div className={`rounded-2xl border p-6 shadow-sm ${
                justCheckedIn ? "border-green-200 bg-green-50" :
                selected.status === "checked-in" ? "border-amber-200 bg-amber-50" :
                "border-gray-200 bg-white"
              }`}>

                {/* Status banner */}
                <div className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${
                  justCheckedIn ? "bg-green-100" :
                  selected.status === "checked-in" ? "bg-amber-100" :
                  "bg-[#f3e8ff]"
                }`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    justCheckedIn ? "bg-green-200" :
                    selected.status === "checked-in" ? "bg-amber-200" :
                    "bg-[#e9d5ff]"
                  }`}>
                    {justCheckedIn || selected.status === "checked-in" ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={justCheckedIn ? "#16a34a" : "#d97706"} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-[14px] font-black ${
                      justCheckedIn ? "text-green-700" :
                      selected.status === "checked-in" ? "text-amber-700" :
                      "text-[#9333ea]"
                    }`}>
                      {justCheckedIn ? "✅ Checked In Successfully!" :
                       selected.status === "checked-in" ? "⚠️ Already Checked In" :
                       "🎟 Valid Ticket — Ready to Verify"}
                    </p>
                    <p className={`text-[12px] font-semibold ${
                      justCheckedIn ? "text-green-600" :
                      selected.status === "checked-in" ? "text-amber-600" :
                      "text-purple-400"
                    }`}>
                      {justCheckedIn ? `Admitted at ${selected.checkedInAt}` :
                       selected.status === "checked-in" ? `Was admitted at ${selected.checkedInAt} — do not allow re-entry` :
                       "Tap the button below to grant entry"}
                    </p>
                  </div>
                </div>

                {/* Attendee details */}
                <div className="mb-5 flex flex-col gap-3">
                  {[
                    ["Ticket ID", selected.id],
                    ["Full Name", selected.name],
                    ["Email", selected.email],
                    ["Phone", selected.phone],
                    ["Event", selected.event],
                    ["Ticket Type", selected.ticket],
                    ["Amount Paid", `₦${selected.amount.toLocaleString()}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 border-b border-black/5 pb-3 last:border-0 last:pb-0">
                      <span className="text-[12px] font-semibold text-gray-400 whitespace-nowrap">{label}</span>
                      <span className="text-[13px] font-black text-[#1a202c] text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {selected.status === "not-checked-in" && !justCheckedIn && (
                  <>
                    {!confirming ? (
                      <button
                        onClick={() => setConfirming(true)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#9333ea] text-[14px] font-bold text-white transition hover:bg-[#7e22ce]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        Validate & Grant Entry
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="mb-1 text-center text-[12px] font-bold text-gray-500">Confirm entry for <strong>{selected.name}</strong>?</p>
                        <button
                          onClick={handleCheckIn}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#12B76A] text-[14px] font-bold text-white transition hover:bg-[#0da55f]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                          Yes, Grant Entry
                        </button>
                        <button
                          onClick={() => setConfirming(false)}
                          className="flex h-10 w-full items-center justify-center rounded-full border border-gray-200 text-[13px] font-bold text-gray-500 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={handleReset}
                  className={`mt-3 flex h-10 w-full items-center justify-center rounded-full border text-[13px] font-bold transition hover:opacity-70 ${
                    justCheckedIn ? "border-green-300 text-green-600" :
                    selected.status === "checked-in" ? "border-amber-300 text-amber-600" :
                    "border-gray-200 text-gray-500"
                  }`}
                >
                  Search Another Attendee
                </button>
              </div>
            )}
          </div>

          {/* RIGHT — RECENT CHECK-INS */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden h-fit">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-[14px] font-black text-[#1a202c]">Checked In</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            </div>
            <div className="flex flex-col divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {attendees.filter((a) => a.status === "checked-in").length === 0 ? (
                <p className="px-5 py-8 text-center text-[12px] font-semibold text-gray-400">No check-ins yet.</p>
              ) : (
                attendees
                  .filter((a) => a.status === "checked-in")
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-[11px] font-black text-green-600">
                        {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[13px] font-bold text-[#1a202c]">{a.name}</p>
                        <p className="text-[11px] font-semibold text-gray-400">{a.ticket} · {a.checkedInAt}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  ))
              )}
            </div>
            <div className="border-t border-gray-100 px-5 py-3 text-center">
              <p className="text-[12px] font-bold text-gray-400">
                <span className="font-black text-[#12B76A]">{checkedInCount}</span> of {attendees.length} admitted
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
