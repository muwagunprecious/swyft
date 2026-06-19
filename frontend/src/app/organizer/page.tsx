"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/swyft-data";
import api from "@/lib/api";

const activityColors: Record<string, string> = {
  sale: "bg-[#12B76A]",
  purchase: "bg-[#12B76A]",
  vote: "bg-[#1565ff]",
  dues: "bg-[#f59e0b]",
  payout: "bg-[#3b82f6]",
  team: "bg-gray-400",
  event: "bg-[#3b82f6]"
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function OrganizerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>({
    stats: { revenue: 0, ticketsSold: 0, totalVotes: 0, activeEvents: 0 },
    sales: [],
    activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = localStorage.getItem("otix_user");
    if (userDataStr) {
      try {
        setUser(JSON.parse(userDataStr));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/organizer/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch organizer dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Group revenue by month if there is data, else show empty bars
  const barData = Array(12).fill(0);
  
  if (data.sales && data.sales.length > 0) {
    data.sales.forEach((sale: any) => {
      if (sale.status === "Paid" && sale.createdAt) {
        const date = new Date(sale.createdAt);
        const mIdx = date.getMonth();
        barData[mIdx] += (sale.ticket?.price || 0);
      }
    });
  }

  // Scale data between 0 and 100 for visual heights
  const maxVal = Math.max(...barData);
  const visualBarData = barData.map((val) => (maxVal > 0 ? (val / maxVal) * 100 : 0));

  const views = data.stats.revenue > 0 ? "24.8k" : "0";
  const conversions = data.stats.revenue > 0 ? "12.4%" : "0.0%";
  const avgValue = data.stats.ticketsSold > 0 ? formatNaira(Math.round(data.stats.revenue / data.stats.ticketsSold)) : "₦0";
  const refunds = data.stats.revenue > 0 ? "0.3%" : "0.0%";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 animate-pulse pt-4">
        {/* HEADER SKELETON */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-7 w-48 rounded bg-gray-200" />
            <div className="h-3 w-64 rounded bg-gray-200" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-gray-200" />
        </div>

        {/* METRICS SKELETON */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-gray-150 bg-white p-6 shadow-sm" />
          ))}
        </div>

        {/* CHARTS SKELETON */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-2xl border border-gray-150 bg-white p-6 shadow-sm lg:col-span-2" />
          <div className="h-72 rounded-2xl border border-gray-150 bg-white p-6 shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pt-2">

      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Good afternoon, {user?.name || "Admin"} 👋</h1>
          <p className="text-xs font-semibold text-gray-400">Here is a summary of your campus operations today.</p>
        </div>
        <Link
          href="/organizer/events/new"
          className="flex h-10 items-center gap-2 rounded-xl bg-[#f05537] px-5 text-xs font-bold text-white no-underline transition hover:bg-[#d1410c] shadow-sm hover:shadow"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
          Create Event
        </Link>
      </div>

      {/* METRICS */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { 
            label: "Gross Revenue", 
            value: formatNaira(data.stats.revenue), 
            sub: "Total ticket & voting sales", 
            colorClass: "bg-[#f05537]/10 text-[#f05537]",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
              </svg>
            )
          },
          { 
            label: "Tickets Sold", 
            value: data.stats.ticketsSold.toLocaleString(), 
            sub: "Total check-ins authorized", 
            colorClass: "bg-[#1565ff]/10 text-[#1565ff]",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            )
          },
          { 
            label: "Active Projects", 
            value: data.stats.activeEvents.toLocaleString(), 
            sub: "Live campus campaigns", 
            colorClass: "bg-emerald-50 text-emerald-600",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )
          }
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{m.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.colorClass}`}>
                {m.icon}
              </div>
            </div>
            <p className="mt-4 text-2xl font-black text-gray-900">{m.value}</p>
            <p className="mt-1 text-xs font-semibold text-gray-400">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* CHARTS + ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900">Revenue Overview</h2>
              <p className="text-xs font-semibold text-gray-400">Monthly earnings trend</p>
            </div>
            <select className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-750 outline-none focus:border-[#f05537] transition">
              <option>Last 12 months</option>
              <option>Last 6 months</option>
              <option>This year</option>
            </select>
          </div>
          <div className="flex h-64 items-end gap-2 px-2">
            {visualBarData.map((height, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full rounded-t-lg bg-gray-50 overflow-hidden h-full flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-[#1565ff] transition-all duration-500 hover:bg-[#004ecf]"
                    style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0px" }}
                  />
                </div>
                <span className="text-[9px] font-bold text-gray-400">{months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3 border-t border-gray-100 pt-5 text-center">
            {[["Views", views], ["Conversions", conversions], ["Avg. Value", avgValue], ["Refunds", refunds]].map(([l, v]) => (
              <div key={l}>
                <p className="text-[10px] font-bold uppercase text-gray-400">{l}</p>
                <p className="mt-1 text-xs font-black text-gray-900">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-gray-900">Live Operations</h2>
                <p className="text-xs font-semibold text-gray-400">Real-time action feed</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-[#12B76A]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#12B76A]" />
                Live
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
              {data.activity && data.activity.length > 0 ? (
                data.activity.map((item: any, i: number) => (
                  <div key={item.id || i} className="flex gap-3 text-left">
                    <div className="relative flex flex-col items-center">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activityColors[item.type] || "bg-gray-400"} mt-1 z-10`} />
                      {i < data.activity.length - 1 && (
                        <div className="w-0.5 bg-gray-100 absolute bottom-[-16px] top-[14px] left-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 leading-normal break-words">{item.text}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="mb-2 text-xl">⚡</span>
                  <p className="text-xs font-bold text-gray-600">No activity yet</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">Launches show up here.</p>
                </div>
              )}
            </div>
          </div>

          <Link href="/organizer/events" className="mt-5 flex h-9 w-full items-center justify-center rounded-xl border border-gray-250 text-xs font-bold text-gray-600 no-underline transition hover:bg-gray-50">
            View all projects
          </Link>
        </div>
      </div>

      {/* LAUNCH QUICK PROJECT */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-black text-gray-900">Launch a new tool</h2>
          <p className="text-xs font-semibold text-gray-400">Launch a campus project in under 60 seconds.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { type: "Event Ticketing", copy: "Create events, configure passes, and scan codes.", href: "/organizer/events/new", accent: "#f05537", icon: "🎫" },
            { type: "Paid Voting", copy: "Manage election categories, contestant keys, and leaderboards.", href: "/organizer/events/new", accent: "#1565ff", icon: "🗳️" },
            { type: "Department Dues", copy: "Set matric validations and automatically generate invoices.", href: "/organizer/events/new", accent: "#f59e0b", icon: "🎓" },
          ].map(({ type, copy, href, accent, icon }) => (
            <Link
              key={type}
              href={href}
              className="group block rounded-2xl border border-gray-150 bg-white p-5 no-underline transition hover:border-[#f05537] hover:shadow-sm"
            >
              <span className="text-2xl mb-2.5 block">{icon}</span>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#f05537] transition-colors">{type}</h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-400">{copy}</p>
              <div className="mt-3.5 flex items-center gap-1 text-[11px] font-bold" style={{ color: accent }}>
                Create
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
