import Link from "next/link";

export default function AnalyticsPage() {
  const barData = [42, 58, 36, 74, 61, 88, 68, 92, 76, 100, 82, 94];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-6 pt-2">
      <div>
        <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
          Analytics
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">Performance Overview</h1>
        <p className="mt-1 text-xs text-[#9ca3af]">Revenue, conversions, and event performance at a glance.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: "₦184,500", change: "+18.4%", up: true },
          { label: "Tickets Sold", value: "8,942", change: "+11.2%", up: true },
          { label: "Conversion Rate", value: "12.4%", change: "+2.1%", up: true },
          { label: "Avg. Ticket Value", value: "₦2,064", change: "-3.2%", up: false },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
            <p className="text-xs font-medium text-[#9ca3af]">{k.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">{k.value}</p>
            <p className={`mt-1 text-[11px] font-medium ${k.up ? "text-emerald-400" : "text-rose-400"}`}>{k.change} vs last month</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#fafafa]">Monthly Revenue</h2>
          <select className="rounded-full border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]">
            <option className="bg-[#171717] text-[#fafafa]">Last 12 months</option>
            <option className="bg-[#171717] text-[#fafafa]">This year</option>
          </select>
        </div>
        <div className="flex h-56 items-end gap-1.5 sm:gap-2">
          {barData.map((h, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
              <div className="w-full overflow-hidden rounded-t-md bg-[#1a1a1a]" style={{ height: "100%" }}>
                <div className="w-full rounded-t-md bg-[#fafafa] transition-all group-hover:bg-emerald-400" style={{ height: `${h}%` }} />
              </div>
              <span className="text-[10px] font-medium text-[#737373]">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Events */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden">
        <div className="border-b border-[#262626] px-6 py-4 bg-[#141414]">
          <h2 className="text-xs font-semibold text-[#fafafa]">Top Performing Events</h2>
        </div>
        <div className="divide-y divide-[#262626]">
          {[
            { name: "OOU Campus Tech Summit 2026", sold: 612, revenue: 92400, pct: 100 },
            { name: "Faculty of Arts Dinner and Awards", sold: 284, revenue: 81000, pct: 87 },
            { name: "Hack The Campus Hackathon", sold: 129, revenue: 11600, pct: 56 },
            { name: "LASU Sports Festival", sold: 912, revenue: 9120, pct: 43 },
          ].map((e) => (
            <div key={e.name} className="flex items-center gap-4 px-6 py-4 hover:bg-[#171717] transition">
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-[#fafafa]">{e.name}</p>
                <p className="text-[11px] text-[#9ca3af]">{e.sold} tickets · ₦{e.revenue.toLocaleString()}</p>
              </div>
              <div className="hidden sm:block w-32">
                <div className="h-1.5 rounded-full bg-[#262626]">
                  <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${e.pct}%` }} />
                </div>
              </div>
              <span className="text-xs font-semibold text-[#fafafa]">{e.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
