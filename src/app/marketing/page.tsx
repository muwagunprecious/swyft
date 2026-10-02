import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a202c]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <span className="rounded-full bg-orange-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#d1410c]">
            Event Promotion & Growth
          </span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl text-[#1a202c]">
            Boost your event reach across campus
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Tools built directly into Swyft to help you sell out your next event fast.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-xl">
              🔗
            </div>
            <h3 className="text-sm font-black text-[#1a202c] mb-1">Custom Share Links</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every event gets a short, copyable link featuring your event title to share directly across WhatsApp and social media.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              ⚡
            </div>
            <h3 className="text-sm font-black text-[#1a202c] mb-1">Instant Pass Delivery</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Attendees receive their scannable QR ticket immediately via email and on their dashboard, ensuring high satisfaction and fast check-in.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-xl">
              📊
            </div>
            <h3 className="text-sm font-black text-[#1a202c] mb-1">Real-Time Analytics</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Track ticket sales, attendance metrics, and wallet balances live from your organizer dashboard.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center justify-center rounded-full bg-[#d1410c] px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#b03507]"
          >
            Create Your Event on Swyft
          </Link>
        </div>
      </div>
    </div>
  );
}
