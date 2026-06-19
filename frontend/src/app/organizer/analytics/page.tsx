import Link from "next/link";

export default function AnalyticsPage() {
  const barData = [42, 58, 36, 74, 61, 88, 68, 92, 76, 100, 82, 94];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[1000px] px-6 py-8">
        <div className="mb-8">
          <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">Analytics</p>
          <h1 className="text-2xl font-black text-[#1a202c]">Performance Overview</h1>
          <p className="mt-1 text-[13px] font-semibold text-gray-400">Revenue, conversions, and event performance at a glance.</p>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Revenue", value: "₦184,500", change: "+18.4%", up: true },
            { label: "Tickets Sold", value: "8,942", change: "+11.2%", up: true },
            { label: "Conversion Rate", value: "12.4%", change: "+2.1%", up: true },
            { label: "Avg. Ticket Value", value: "₦2,064", change: "-3.2%", up: false },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{k.label}</p>
              <p className="mt-3 text-2xl font-black text-[#1a202c]">{k.value}</p>
              <p className={`mt-1 text-[12px] font-bold ${k.up ? "text-[#12B76A]" : "text-red-500"}`}>{k.change} vs last month</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[15px] font-black text-[#1a202c]">Monthly Revenue</h2>
            <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-bold text-gray-600 outline-none">
              <option>Last 12 months</option>
              <option>This year</option>
            </select>
          </div>
          <div className="flex h-56 items-end gap-1.5">
            {barData.map((h, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <div className="w-full overflow-hidden rounded-t-md bg-gray-100" style={{ height: "100%" }}>
                  <div className="w-full rounded-t-md bg-[#9333ea] transition-all hover:bg-[#7e22ce]" style={{ height: `${h}%` }} />
                </div>
                <span className="text-[9px] font-bold text-gray-400">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Events */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-[14px] font-black text-[#1a202c]">Top Performing Events</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { name: "OOU Campus Tech Summit 2026", sold: 612, revenue: 92400, pct: 100 },
              { name: "Faculty of Arts Dinner and Awards", sold: 284, revenue: 81000, pct: 87 },
              { name: "Hack The Campus Hackathon", sold: 129, revenue: 11600, pct: 56 },
              { name: "LASU Sports Festival", sold: 912, revenue: 9120, pct: 43 },
            ].map((e) => (
              <div key={e.name} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-bold text-[#1a202c]">{e.name}</p>
                  <p className="text-[11px] font-semibold text-gray-400">{e.sold} tickets · ₦{e.revenue.toLocaleString()}</p>
                </div>
                <div className="hidden sm:block w-32">
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-[#9333ea]" style={{ width: `${e.pct}%` }} />
                  </div>
                </div>
                <span className="text-[12px] font-black text-[#9333ea]">{e.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
