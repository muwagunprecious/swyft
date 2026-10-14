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
    <div className="space-y-6 pt-2">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
            Access Control
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">Ticket Verification</h1>
          <p className="mt-1 text-xs text-[#9ca3af]">
            Scan or search attendee name, email, phone, or ticket ID to grant entry.
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT — SEARCH + RESULT */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-sm">
            <label className="mb-2 block text-xs font-semibold text-[#fafafa]">
              Search Attendee
            </label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <input
                autoFocus
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); setJustCheckedIn(false); }}
                placeholder="Type name, email, phone or ticket ID..."
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
                <p className="mt-1 text-[11px] text-rose-400/80">Check the spelling or try their email / phone number.</p>
              </div>
            )}
          </div>

          {/* SELECTED ATTENDEE CARD */}
          {selected && (
            <div className={`rounded-2xl border p-6 shadow-sm ${
              justCheckedIn ? "border-emerald-800/50 bg-[#121212]" :
              selected.status === "checked-in" ? "border-amber-800/50 bg-[#121212]" :
              "border-[#262626] bg-[#121212]"
            }`}>
              {/* Status banner */}
              <div className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                justCheckedIn ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400" :
                selected.status === "checked-in" ? "border-amber-800/40 bg-amber-950/40 text-amber-400" :
                "border-[#262626] bg-[#171717] text-[#fafafa]"
              }`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  justCheckedIn ? "bg-emerald-900/50 text-emerald-400" :
                  selected.status === "checked-in" ? "bg-amber-900/50 text-amber-400" :
                  "bg-[#262626] text-[#fafafa]"
                }`}>
                  {justCheckedIn || selected.status === "checked-in" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold">
                    {justCheckedIn ? "Checked In Successfully" :
                     selected.status === "checked-in" ? "Already Checked In" :
                     "Valid Ticket — Ready to Verify"}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {justCheckedIn ? `Admitted at ${selected.checkedInAt}` :
                     selected.status === "checked-in" ? `Admitted at ${selected.checkedInAt} — do not admit twice` :
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
                        onClick={handleCheckIn}
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
                      <p className="text-[11px] text-[#9ca3af]">{a.ticket} · {a.checkedInAt}</p>
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
