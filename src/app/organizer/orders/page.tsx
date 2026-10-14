const orders = [
  { id: "ORD-4421", buyer: "Ayomide Adekunle", email: "ayomide@student.oou.edu.ng", event: "OOU Campus Tech Summit 2026", ticket: "Student", qty: 1, amount: 2500, date: "Jun 15, 2026", status: "paid" },
  { id: "ORD-4420", buyer: "Chiamaka Obi", email: "chiamaka@unilag.edu.ng", event: "Faculty of Arts Dinner", ticket: "Regular", qty: 2, amount: 16000, date: "Jun 15, 2026", status: "paid" },
  { id: "ORD-4419", buyer: "Ibrahim Musa", email: "ibrahim@abu.edu.ng", event: "OOU Campus Tech Summit 2026", ticket: "VIP", qty: 1, amount: 7500, date: "Jun 14, 2026", status: "paid" },
  { id: "ORD-4418", buyer: "Ngozi Eze", email: "ngozi@ui.edu.ng", event: "Hack The Campus Hackathon", ticket: "Team Slot", qty: 1, amount: 3000, date: "Jun 14, 2026", status: "paid" },
  { id: "ORD-4417", buyer: "Tunde Adeyemi", email: "tunde@oau.edu.ng", event: "OOU Campus Tech Summit 2026", ticket: "Student", qty: 3, amount: 7500, date: "Jun 13, 2026", status: "paid" },
  { id: "ORD-4416", buyer: "Fatima Aliyu", email: "fatima@abu.edu.ng", event: "LASU Sports Festival", ticket: "Access Band", qty: 5, amount: 5000, date: "Jun 13, 2026", status: "paid" },
  { id: "ORD-4415", buyer: "Emeka Nwosu", email: "emeka@uniben.edu.ng", event: "Faculty of Arts Dinner", ticket: "Table", qty: 1, amount: 65000, date: "Jun 12, 2026", status: "refunded" },
  { id: "ORD-4414", buyer: "Adaeze Okonkwo", email: "adaeze@futa.edu.ng", event: "Hack The Campus Hackathon", ticket: "Team Slot", qty: 1, amount: 3000, date: "Jun 12, 2026", status: "paid" },
];

export default function OrdersPage() {
  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
            Orders
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">All Orders</h1>
          <p className="mt-1 text-xs text-[#9ca3af]">Every ticket purchase across all your events.</p>
        </div>
        <button className="flex shrink-0 items-center gap-2 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Orders", value: orders.length.toString(), color: "text-[#fafafa]" },
          { label: "Paid Orders", value: orders.filter(o => o.status === "paid").length.toString(), color: "text-[#fafafa]" },
          { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
            <p className="text-xs font-medium text-[#9ca3af]">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626] bg-[#141414]">
                {["Order ID", "Buyer", "Event", "Ticket", "Qty", "Amount", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-[#171717]">
                  <td className="px-4 py-3.5 text-xs font-semibold text-[#fafafa] whitespace-nowrap">{o.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-[#fafafa] whitespace-nowrap">{o.buyer}</p>
                    <p className="text-[11px] text-[#9ca3af]">{o.email}</p>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="truncate text-xs text-[#fafafa]">{o.event}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full border border-[#262626] bg-[#171717] px-2.5 py-0.5 text-[11px] font-medium text-[#fafafa] whitespace-nowrap">{o.ticket}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-[#fafafa]">{o.qty}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-emerald-400 whitespace-nowrap">₦{o.amount.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-xs text-[#9ca3af] whitespace-nowrap">{o.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium border capitalize ${
                      o.status === "paid"
                        ? "border-emerald-800/40 bg-emerald-950/40 text-emerald-400"
                        : "border-rose-800/40 bg-rose-950/40 text-rose-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${o.status === "paid" ? "bg-emerald-400" : "bg-rose-400"}`} />
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
