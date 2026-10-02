import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a202c]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <span className="rounded-full bg-orange-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#d1410c]">
            Help Center & Support
          </span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl text-[#1a202c]">
            How can we help you?
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Find answers to common questions about tickets, event check-ins, and organizer payouts.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-[#1a202c] mb-2">🎫 Where is my ticket?</h3>
            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              Tickets and scannable QR passes are emailed immediately upon purchase. You can also view and download all your admission passes anytime on your <Link href="/tickets" className="text-[#d1410c] font-bold underline">My Tickets</Link> dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-[#1a202c] mb-2">📱 How do I verify tickets at the gate?</h3>
            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              Use our built-in <Link href="/verify" className="text-[#d1410c] font-bold underline">QR Verification Tool</Link> or simply point any mobile phone camera at the attendee&apos;s QR code to verify validity and view attendee details instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-[#1a202c] mb-2">💳 How do payouts work for organizers?</h3>
            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              Earnings from completed ticket sales accumulate in your organizer wallet in real time. Once your balance reaches ₦500, you can request a withdrawal to your linked bank account anytime.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-[#1a202c] mb-2">✉️ Contact Support</h3>
            <p className="text-xs font-medium text-gray-600 leading-relaxed">
              Need assistance? Email our dedicated support desk at{" "}
              <a href="mailto:info@swyft-ticket.name.ng" className="text-[#d1410c] font-bold underline">
                info@swyft-ticket.name.ng
              </a>
              . We typically respond within 24 hours.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#d1410c] px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#b03507]"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
