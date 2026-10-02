import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a202c]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <span className="rounded-full bg-orange-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#d1410c]">
            Transparent Pricing
          </span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl text-[#1a202c]">
            Simple, honest pricing for organizers
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Free events are always 100% free. No monthly subscription or hidden fees.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xs flex flex-col justify-between">
            <div>
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-extrabold uppercase text-gray-700">Free Events</span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#1a202c]">₦0</span>
                <span className="text-xs font-semibold text-gray-400">/ ticket</span>
              </div>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Perfect for campus meetups, club gatherings, and free student activities.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-gray-600">
                <li>✓ Unlimited Free Tickets</li>
                <li>✓ Instant Scannable QR Codes</li>
                <li>✓ Downloadable PDF Tickets</li>
                <li>✓ Gate Scanner Verification</li>
              </ul>
            </div>
            <Link
              href="/organizer/events/new"
              className="mt-8 block w-full rounded-xl border border-gray-200 py-3 text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Create Free Event
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-[#d1410c] bg-white p-8 shadow-lg flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 rounded-full bg-[#d1410c] px-3 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
              Most Popular
            </span>
            <div>
              <span className="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-extrabold uppercase text-[#d1410c]">Paid Events</span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#d1410c]">Standard</span>
                <span className="text-xs font-semibold text-gray-400">Low flat transaction fee</span>
              </div>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Built for concerts, festivals, campus dinners, conferences, and parties.
              </p>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-gray-600">
                <li>✓ Automated Paystack Bank Processing</li>
                <li>✓ Real-Time Organizer Wallet</li>
                <li>✓ On-Demand Bank Withdrawals</li>
                <li>✓ Complete Attendee & Sales Analytics</li>
              </ul>
            </div>
            <Link
              href="/organizer/events/new"
              className="mt-8 block w-full rounded-xl bg-[#d1410c] py-3 text-center text-xs font-bold text-white shadow-md hover:bg-[#b03507]"
            >
              Start Selling Tickets
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-gray-800"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
