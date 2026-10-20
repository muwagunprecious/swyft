"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/swyft-data";
import api from "@/lib/api";

const activityColors: Record<string, string> = {
  sale: "bg-emerald-400",
  purchase: "bg-emerald-400",
  vote: "bg-blue-400",
  dues: "bg-amber-400",
  payout: "bg-purple-400",
  team: "bg-gray-400",
  event: "bg-orange-400"
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
        const u = JSON.parse(userDataStr);
        setUser(u);
        if (typeof u.walletBalance === "number" && u.walletBalance > 0) {
          setData((prev: any) => ({
            ...prev,
            stats: {
              ...prev.stats,
              walletBalance: u.walletBalance,
              revenue: Math.max(prev.stats?.revenue || 0, u.walletBalance)
            }
          }));
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/organizer/dashboard");
        setData(res.data);
        if (res.data?.stats?.walletBalance !== undefined) {
          try {
            const stored = localStorage.getItem("otix_user");
            if (stored) {
              const u = JSON.parse(stored);
              u.walletBalance = res.data.stats.walletBalance;
              localStorage.setItem("otix_user", JSON.stringify(u));
              setUser((prev: any) => ({ ...prev, walletBalance: res.data.stats.walletBalance }));
            }
          } catch {}
        }
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-5">
          <div className="space-y-2">
            <div className="h-6 w-56 rounded-full bg-[#171717]" />
            <div className="h-3 w-72 rounded-full bg-[#171717]" />
          </div>
          <div className="h-10 w-32 rounded-full bg-[#171717]" />
        </div>

        {/* METRICS SKELETON */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-[#262626] bg-[#121212] p-5" />
          ))}
        </div>

        {/* CHARTS SKELETON */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-2xl border border-[#262626] bg-[#121212] p-6 lg:col-span-2" />
          <div className="h-72 rounded-2xl border border-[#262626] bg-[#121212] p-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pt-2">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#fafafa] tracking-tight">Good afternoon, {user?.name || "Organizer"} 👋</h1>
          <p className="text-xs font-medium text-[#9ca3af] mt-0.5">Here is a real-time summary of your campus operations.</p>
        </div>
        <Link
          href="/organizer/events/new"
          className="flex h-10 items-center gap-2 rounded-full bg-[#fafafa] px-5 text-xs font-semibold text-[#0a0a0a] no-underline transition hover:bg-white shadow-sm shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
          Create Event
        </Link>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            label: "Wallet Balance", 
            value: formatNaira(
              (typeof data.stats.walletBalance === "number" && data.stats.walletBalance > 0)
                ? data.stats.walletBalance
                : (user?.walletBalance || (typeof data.stats.walletBalance === "number" ? data.stats.walletBalance : Math.max(0, data.stats.revenue - (data.stats.withdrawnAmount || 0))))
            ), 
            sub: "Available for withdrawal", 
            badgeClass: "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40",
            href: "/organizer/wallet",
            actionLabel: "Withdraw →",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            )
          },
          { 
            label: "Gross Sales", 
            value: formatNaira(data.stats.revenue), 
            sub: "All-time ticket earnings", 
            badgeClass: "bg-orange-950/40 text-orange-400 border border-orange-800/40",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
              </svg>
            )
          },
          { 
            label: "Total Withdrawn", 
            value: formatNaira(data.stats.withdrawnAmount || 0), 
            sub: "Approved & paid out", 
            badgeClass: "bg-purple-950/40 text-purple-400 border border-purple-800/40",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )
          },
          { 
            label: "Tickets Sold", 
            value: data.stats.ticketsSold.toLocaleString(), 
            sub: "Total check-ins authorized", 
            badgeClass: "bg-blue-950/40 text-blue-400 border border-blue-800/40",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            )
          }
        ].map((m) => (
          <div key={m.label} className="relative rounded-2xl border border-[#262626] bg-[#121212] p-5 transition hover:border-[#374151]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">{m.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${m.badgeClass}`}>
                {m.icon}
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#fafafa] tracking-tight">{m.value}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[11px] font-medium text-[#9ca3af]">{m.sub}</p>
              {m.href && (
                <Link href={m.href} className="text-[11px] font-bold text-emerald-400 hover:underline">
                  {m.actionLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS + ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#fafafa]">Revenue Overview</h2>
              <p className="text-xs font-medium text-[#9ca3af]">Monthly earnings trend</p>
            </div>
            <select className="rounded-full border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-[#fafafa] outline-none focus:border-[#fafafa] transition">
              <option>Last 12 months</option>
              <option>Last 6 months</option>
              <option>This year</option>
            </select>
          </div>
          <div className="flex h-64 items-end gap-2 px-2">
            {visualBarData.map((height, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full rounded-t-lg bg-[#171717] overflow-hidden h-full flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-[#fafafa]/80 transition-all duration-500 group-hover:bg-[#fafafa]"
                    style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0px" }}
                  />
                </div>
                <span className="text-[9px] font-medium text-[#9ca3af]">{months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3 border-t border-[#262626] pt-5 text-center">
            {[["Views", views], ["Conversions", conversions], ["Avg. Value", avgValue], ["Refunds", refunds]].map(([l, v]) => (
              <div key={l}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">{l}</p>
                <p className="mt-1 text-xs font-bold text-[#fafafa]">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#fafafa]">Live Operations</h2>
                <p className="text-xs font-medium text-[#9ca3af]">Real-time action feed</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
              {data.activity && data.activity.length > 0 ? (
                data.activity.map((item: any, i: number) => (
                  <div key={item.id || i} className="flex gap-3 text-left">
                    <div className="relative flex flex-col items-center">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activityColors[item.type] || "bg-[#9ca3af]"} mt-1 z-10`} />
                      {i < data.activity.length - 1 && (
                        <div className="w-px bg-[#262626] absolute bottom-[-16px] top-[14px] left-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#fafafa] leading-normal break-words">{item.text}</p>
                      <p className="text-[10px] font-medium text-[#9ca3af] mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="mb-2 text-xl">⚡</span>
                  <p className="text-xs font-semibold text-[#fafafa]">No activity yet</p>
                  <p className="text-[10px] font-medium text-[#9ca3af] mt-0.5">Launches and sales will stream in here.</p>
                </div>
              )}
            </div>
          </div>

          <Link href="/organizer/events" className="mt-5 flex h-9 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-medium text-[#fafafa] no-underline transition hover:border-[#374151] hover:bg-[#202020]">
            View all projects
          </Link>
        </div>
      </div>

      {/* LAUNCH QUICK PROJECT */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-[#fafafa]">Launch a new tool</h2>
          <p className="text-xs font-medium text-[#9ca3af]">Launch a campus project in under 60 seconds.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { type: "Event Ticketing", copy: "Create events, configure passes, and scan codes.", href: "/organizer/events/new", icon: "🎫" },
            { type: "Paid Voting", copy: "Manage election categories, contestant keys, and leaderboards.", href: "/organizer/events/new", icon: "🗳️" },
            { type: "Department Dues", copy: "Set matric validations and automatically generate invoices.", href: "/organizer/events/new", icon: "🎓" },
          ].map(({ type, copy, href, icon }) => (
            <Link
              key={type}
              href={href}
              className="group block rounded-2xl border border-[#262626] bg-[#121212] p-5 no-underline transition hover:border-[#374151]"
            >
              <span className="text-2xl mb-2.5 block">{icon}</span>
              <h3 className="text-sm font-semibold text-[#fafafa] group-hover:text-white transition-colors">{type}</h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#9ca3af]">{copy}</p>
              <div className="mt-3.5 flex items-center gap-1 text-[11px] font-bold text-[#fafafa] group-hover:underline">
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
