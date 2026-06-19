"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

const allEvents = ["All Events", "OOU Campus Tech Summit 2026", "Faculty of Arts Dinner", "Hack The Campus Hackathon", "LASU Sports Festival"];
const allStatuses = ["All", "checked-in", "not-checked-in"];

export default function AttendeesPage() {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All Events");
  const [statusFilter, setStatusFilter] = useState("All");
  const [mockAttendees, setMockAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const res = await api.get('/organizer/attendees');
        if (res.data) setMockAttendees(res.data);
      } catch (err) {
        console.error('Failed to fetch attendees', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendees();
  }, []);

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
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[1100px] px-6 py-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">Attendees</p>
            <h1 className="text-2xl font-black text-[#1a202c]">Ticket Buyers</h1>
            <p className="mt-1 text-[13px] font-semibold text-gray-400">Everyone who purchased a ticket across all your events.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/organizer/verification"
              className="flex items-center gap-2 rounded-full bg-[#9333ea] px-5 py-2.5 text-[13px] font-bold text-white no-underline shadow-sm transition hover:bg-[#7e22ce]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Verify Tickets
            </Link>
            <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Buyers", value: mockAttendees.length, sub: "across all events", color: "#9333ea", bg: "#faf5ff" },
            { label: "Checked In", value: `${checkedIn} / ${mockAttendees.length}`, sub: `${Math.round((checkedIn / mockAttendees.length) * 100)}% attendance rate`, color: "#12B76A", bg: "#f0fdf4" },
            { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, sub: "from ticket sales", color: "#f59e0b", bg: "#fffbeb" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
              <p className="mt-3 text-2xl font-black text-[#1a202c]">{s.value}</p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: s.color }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or ticket ID..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-[13px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20"
            />
          </div>

          {/* Event filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-bold text-gray-600 outline-none focus:border-[#9333ea]"
          >
            {allEvents.map((e) => <option key={e}>{e}</option>)}
          </select>

          {/* Status filter */}
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden">
            {allStatuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 text-[12px] font-bold capitalize transition ${
                  statusFilter === s
                    ? "bg-[#9333ea] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s === "checked-in" ? "✅ Checked In" : s === "not-checked-in" ? "⏳ Pending" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <p className="text-[13px] font-bold text-[#1a202c]">
              Showing <span className="text-[#9333ea]">{filtered.length}</span> of {mockAttendees.length} attendees
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Ticket ID", "Name", "Contact", "Event", "Ticket", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[13px] font-semibold text-gray-400">
                      No attendees found matching your filters.
                    </td>
                  </tr>
                ) : filtered.map((a) => (
                  <tr key={a.id} className="group transition hover:bg-purple-50/30">
                    <td className="px-4 py-3.5 text-[12px] font-black text-[#9333ea] whitespace-nowrap">{a.id}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3e8ff] text-[11px] font-black text-[#9333ea]">
                          {a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-[13px] font-bold text-[#1a202c]">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] font-semibold text-gray-600">{a.email}</p>
                      <p className="text-[11px] font-semibold text-gray-400">{a.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <p className="truncate text-[12px] font-semibold text-gray-700">{a.event}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-[#9333ea] whitespace-nowrap">{a.ticket}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-black text-[#12B76A] whitespace-nowrap">
                      ₦{a.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-gray-500 whitespace-nowrap">{a.date}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        a.status === "checked-in"
                          ? "bg-green-50 text-green-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${a.status === "checked-in" ? "bg-green-500" : "bg-amber-500"}`} />
                        {a.status === "checked-in" ? "Checked In" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
