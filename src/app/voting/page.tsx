import { votingCampaigns } from "@/lib/swyft-data";

export default function VotingPage() {
  const featured = votingCampaigns[1];
  const total = featured.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  return (
    <div className="bg-gray-50">
      <section className="bg-white py-10">
        <div className="wrap">
          <p className="eyebrow mb-2">Voting Discovery</p>
          <h1 className="text-4xl font-black text-gray-950 md:text-5xl">Discover elections and contests</h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-gray-600">
            Miss Faculty, SUG elections, talent shows, awards, and creator-led contests with fast voting and transparent results.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <input className="input" placeholder="Search campaign, candidate, university" />
            <select className="input"><option>All Universities</option><option>OOU</option><option>UNILAG</option></select>
            <select className="input"><option>Trending</option><option>Ending Soon</option><option>Recently Added</option></select>
          </div>
        </div>
      </section>

      <section className="wrap grid gap-8 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="card overflow-hidden">
          <img src={featured.image} alt="" className="h-64 w-full object-cover" />
          <div className="p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="chip chip-active">{featured.category}</span>
              <span className="chip">{featured.ends}</span>
              <span className="chip">{featured.votes.toLocaleString()} votes</span>
            </div>
            <h2 className="text-3xl font-black">{featured.title}</h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">{featured.university} - verified student voting</p>

            <div className="mt-6 grid gap-4">
              {featured.candidates.map((candidate, index) => {
                const pct = Math.round((candidate.votes / total) * 100);
                return (
                  <div key={candidate.name} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                      <img src={candidate.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-gray-950">{candidate.name}</p>
                            <p className="text-sm font-semibold text-gray-500">{candidate.department}</p>
                          </div>
                          <span className="text-sm font-black text-[#1565FF]">#{index + 1}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#1565FF]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-black">{candidate.votes.toLocaleString()} votes</p>
                      <button className="btn-primary !min-h-9 !px-4 !py-1">Vote</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="grid h-fit gap-5">
          <div className="card p-6">
            <p className="eyebrow mb-2">Payment Widget</p>
            <h3 className="text-2xl font-black">Cast paid vote</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-600">Vote price: NGN 100. Vote limit: 10 votes per verified student.</p>
            <button className="btn-primary mt-5 w-full">Proceed to Vote</button>
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-2">Rules</p>
            {["Only verified students can vote", "Paid votes are confirmed instantly", "Leaderboard updates in real time"].map((rule) => (
              <p key={rule} className="border-b border-gray-100 py-3 text-sm font-bold text-gray-700 last:border-b-0">{rule}</p>
            ))}
          </div>
        </aside>
      </section>

      <section className="wrap pb-16">
        <h2 className="mb-5 text-2xl font-black">More campaigns</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {votingCampaigns.map((campaign) => (
            <article key={campaign.id} className="card overflow-hidden">
              <img src={campaign.image} alt="" className="h-44 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#FF6B00]">{campaign.ends}</p>
                <h3 className="mt-2 text-xl font-black">{campaign.title}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">{campaign.university} - {campaign.votes.toLocaleString()} votes</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
