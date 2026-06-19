import { formatNaira, fundraisers } from "@/lib/swyft-data";

export default function FundraisersPage() {
  const featured = fundraisers[0];
  const pct = Math.round((featured.raised / featured.goal) * 100);

  return (
    <div className="bg-gray-50">
      <section className="bg-white py-10">
        <div className="wrap">
          <p className="eyebrow mb-2">Fundraising</p>
          <h1 className="text-4xl font-black text-gray-950 md:text-5xl">Raise funds with public trust</h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-gray-600">
            Campaign pages include goals, donation progress, donor wall, updates, comments, and receipts.
          </p>
        </div>
      </section>

      <section className="wrap grid gap-8 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <article className="card overflow-hidden">
          <img src={featured.image} alt="" className="h-72 w-full object-cover" />
          <div className="p-6">
            <span className="chip chip-active">{featured.tag}</span>
            <h2 className="mt-4 text-3xl font-black">{featured.title}</h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">{featured.university} - {featured.backers} recent donations</p>
            <div className="mt-6 h-3 rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[#FF6B00]" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-4 flex justify-between text-sm font-black">
              <span>{formatNaira(featured.raised)} raised</span>
              <span>{formatNaira(featured.goal)} goal</span>
            </div>
          </div>
        </article>

        <aside className="grid h-fit gap-5">
          <div className="card p-6">
            <p className="eyebrow mb-2">Donate</p>
            <div className="grid grid-cols-3 gap-2">
              {[1000, 5000, 10000].map((amount) => <button key={amount} className="chip justify-center">{formatNaira(amount)}</button>)}
            </div>
            <input className="input mt-3" placeholder="Custom amount" />
            <button className="btn-primary mt-4 w-full">Donate Now</button>
          </div>
          <div className="card p-6">
            <h3 className="mb-4 text-xl font-black">Recent donations</h3>
            {["Ada - NGN 25,000", "Class of 2021 - NGN 150,000", "Anonymous - NGN 10,000"].map((donation) => (
              <p key={donation} className="border-b border-gray-100 py-3 text-sm font-bold text-gray-700 last:border-b-0">{donation}</p>
            ))}
          </div>
        </aside>
      </section>

      <section className="wrap pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {fundraisers.map((fundraiser) => (
            <article key={fundraiser.id} className="card overflow-hidden">
              <img src={fundraiser.image} alt="" className="h-44 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#FF6B00]">{fundraiser.tag}</p>
                <h3 className="mt-2 text-xl font-black">{fundraiser.title}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">{formatNaira(fundraiser.raised)} raised</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
