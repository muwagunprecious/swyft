"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import SendFreeTicketModal from "@/components/SendFreeTicketModal";

const allEvents = ["All Events", "OOU Campus Tech Summit 2026", "Faculty of Arts Dinner", "Hack The Campus Hackathon", "LASU Sports Festival"];
const allStatuses = ["All", "checked-in", "not-checked-in"];

export default function AttendeesPage() {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All Events");
  const [statusFilter, setStatusFilter] = useState("All");
  const [mockAttendees, setMockAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFreeTicketModalOpen, setIsFreeTicketModalOpen] = useState(false);

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await api.get('/organizer/attendees');
      if (res.data) setMockAttendees(res.data);
    } catch (err) {
      console.error('Failed to fetch attendees', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const filtered = mockAttendees.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search);
    const matchEvent = eventFilter === "All Events" || a.event === eventFilter;
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchEvent && matchStatus;
  });

  const checkedIn = mockAttendees.filter((a) => a.status === "checked-in").length;
  const totalRevenue = mockAttendees.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6 pt-2">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#fafafa] tracking-tight">Ticket Buyers</h1>
          <p className="text-xs font-medium text-[#9ca3af] mt-0.5">Everyone who purchased a ticket across all your events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFreeTicketModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#fafafa] px-4 py-2 text-xs font-semibold text-[#0a0a0a] shadow-sm transition hover:bg-white cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Send Free Ticket
          </button>
          <Link
            href="/organizer/verification"
            className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] no-underline transition hover:border-[#374151] hover:bg-[#202020]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Verify Tickets
          </Link>
          <button className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:border-[#374151] hover:bg-[#202020] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Buyers", value: mockAttendees.length, sub: "across all events" },
          { label: "Checked In", value: `${checkedIn} / ${mockAttendees.length}`, sub: `${mockAttendees.length ? Math.round((checkedIn / mockAttendees.length) * 100) : 0}% attendance rate` },
          { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, sub: "from ticket sales" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 transition hover:border-[#374151]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">{s.label}</p>
            <p className="mt-3 text-2xl font-bold text-[#fafafa] tracking-tight">{s.value}</p>
            <p className="mt-1 text-[11px] font-medium text-[#9ca3af]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or ticket ID..."
            className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] pl-9 pr-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280]"
          />
        </div>

        {/* Event filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="h-10 rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa]"
        >
          {allEvents.map((e) => <option key={e} value={e} className="bg-[#171717] text-[#fafafa]">{e}</option>)}
        </select>

        {/* Status filter */}
        <div className="flex rounded-full border border-[#262626] bg-[#171717] p-1">
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full capitalize transition cursor-pointer ${
                statusFilter === s
                  ? "bg-[#fafafa] text-[#0a0a0a]"
                  : "text-[#9ca3af] hover:text-[#fafafa]"
              }`}
            >
              {s === "checked-in" ? "Checked In" : s === "not-checked-in" ? "Pending" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
          <p className="text-xs font-medium text-[#9ca3af]">
            Showing <span className="font-bold text-[#fafafa]">{filtered.length}</span> of {mockAttendees.length} attendees
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626] bg-[#171717]/60">
                {["Ticket ID", "Name", "Contact", "Event", "Ticket", "Amount", "Date", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs font-medium text-[#9ca3af]">
                    No attendees found matching your filters.
                  </td>
                </tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="transition hover:bg-[#171717]/40">
                  <td className="px-5 py-4 text-xs font-mono text-[#9ca3af] whitespace-nowrap">{a.id}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#171717] border border-[#262626] text-[10px] font-bold text-[#fafafa]">
                        {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-xs font-semibold text-[#fafafa]">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-medium text-[#fafafa]">{a.email}</p>
                    <p className="text-[11px] text-[#9ca3af]">{a.phone}</p>
                  </td>
                  <td className="px-5 py-4 max-w-[180px]">
                    <p className="truncate text-xs font-medium text-[#fafafa]">{a.event}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full border border-[#262626] bg-[#171717] px-2.5 py-0.5 text-[11px] font-medium text-[#fafafa] whitespace-nowrap">{a.ticket}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-emerald-400 whitespace-nowrap">
                    ₦{a.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#9ca3af] whitespace-nowrap">{a.date}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                      a.status === "checked-in"
                        ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
                        : "border-amber-800/40 bg-amber-950/40 text-amber-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${a.status === "checked-in" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {a.status === "checked-in" ? "Checked In" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Free Ticket Modal */}
      <SendFreeTicketModal
        isOpen={isFreeTicketModalOpen}
        onClose={() => setIsFreeTicketModalOpen(false)}
        onSuccess={fetchAttendees}
      />

    </div>
  );
}
