import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1a202c]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#1a202c] mb-2">Terms of Service</h1>
        <p className="text-xs font-semibold text-gray-400 mb-8">Last updated: October 2026</p>

        <div className="space-y-6 text-xs font-medium text-gray-600 leading-relaxed bg-white border border-gray-200 p-8 rounded-2xl shadow-xs">
          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Swyft platform (swyft-ticket.name.ng), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">2. Ticket Purchases & Admission</h2>
            <p>
              Tickets purchased through Swyft grant admission subject to event organizer policies. Scannable QR passes are single-use unless specified otherwise. Attempting to duplicate or fraudulently scan used tickets is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">3. Organizer Obligations</h2>
            <p>
              Organizers are responsible for fulfilling their events as advertised and complying with applicable regulations. Ticket sales are settled into organizer wallets and subject to review and verification.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black text-[#1a202c] mb-2">4. Support & Inquiries</h2>
            <p>
              For legal or terms inquiries, contact us at{" "}
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
