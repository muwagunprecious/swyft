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
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">Orders</p>
            <h1 className="text-2xl font-black text-[#1a202c]">All Orders</h1>
            <p className="mt-1 text-[13px] font-semibold text-gray-400">Every ticket purchase across all your events.</p>
          </div>
          <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-600 transition hover:bg-gray-50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Paid Orders", value: orders.filter(o => o.status === "paid").length },
            { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
              <p className="mt-3 text-2xl font-black text-[#1a202c]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Order ID", "Buyer", "Event", "Ticket", "Qty", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-purple-50/30">
                    <td className="px-4 py-3.5 text-[12px] font-black text-[#9333ea] whitespace-nowrap">{o.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-bold text-[#1a202c] whitespace-nowrap">{o.buyer}</p>
                      <p className="text-[11px] font-semibold text-gray-400">{o.email}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <p className="truncate text-[12px] font-semibold text-gray-700">{o.event}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-[#9333ea] whitespace-nowrap">{o.ticket}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-bold text-gray-700">{o.qty}</td>
                    <td className="px-4 py-3.5 text-[13px] font-black text-[#12B76A] whitespace-nowrap">₦{o.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-gray-500 whitespace-nowrap">{o.date}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${o.status === "paid" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${o.status === "paid" ? "bg-green-500" : "bg-red-400"}`} />
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
    </div>
  );
}
