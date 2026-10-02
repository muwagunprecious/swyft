import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a202c]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#1a202c] mb-2">Privacy Policy</h1>
        <p className="text-xs font-semibold text-gray-400 mb-8">Last updated: October 2026</p>

        <div className="space-y-6 text-xs font-medium text-gray-600 leading-relaxed bg-white border border-gray-200 p-8 rounded-2xl shadow-xs">
          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">1. Information We Collect</h2>
            <p>
              When you purchase a ticket or create an event on Swyft, we collect information necessary to process your transaction and deliver your passes. This includes your name, email address, phone number, and optional academic affiliation (university or department).
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">2. How We Use Your Information</h2>
            <p>
              We use your contact details to deliver transaction receipts, scannable QR ticket passes, and important updates about events you registered for. We do not sell your personal data to advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">3. Payment Security</h2>
            <p>
              Payment transactions are processed securely through certified payment gateways (Paystack). Swyft does not store your debit or credit card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">4. Contacting Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:info@swyft-ticket.name.ng" className="text-[#d1410c] font-bold underline">
                info@swyft-ticket.name.ng
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs font-bold text-[#d1410c] hover:underline">
            ← Back to Swyft Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
