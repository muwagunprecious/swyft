import Link from "next/link";

const footerLinks = {
  "Discover": [
    ["All Events", "/events"],
    ["Campus Parties", "/events?category=Party"],
    ["Concerts & Music", "/events?category=Entertainment"],
    ["Tech & Hackathons", "/events?category=Tech"],
    ["Student Voting", "/voting"],
  ],
  "Campuses": [
    ["UNILAG Tickets", "/events?university=UNILAG"],
    ["OOU Tickets", "/events?university=OOU"],
    ["UI Tickets", "/events?university=UI"],
    ["LASU Tickets", "/events?university=LASU"],
    ["UNIBEN & More", "/events"],
  ],
  "Platform": [
    ["Host an Event", "/organizer/events/new"],
    ["Organizer Portal", "/organizer"],
    ["Pricing & Fees", "/pricing"],
    ["Gate Verification", "/verify"],
    ["Track My Ticket", "/tickets"],
  ],
  "Legal & Support": [
    ["Help Center", "/help"],
    ["Privacy Policy", "/privacy"],
    ["Terms of Service", "/terms"],
    ["Departmental Dues", "/dues"],
  ],
};

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#374151] bg-[#0a0a0a] text-[#fafafa] mt-24">
      <div className="grix-container py-16">
        
        {/* Main Columns Grid: 5 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          
          {/* Brand info column */}
          <div className="lg:col-span-1 sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 no-underline mb-4 text-[#fafafa] group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fafafa] text-[#0a0a0a] transition-transform group-hover:scale-105">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="text-[22px] font-bold tracking-tight text-[#fafafa]">
                swyft
              </span>
            </Link>
            <p className="text-[13px] text-[#9ca3af] font-light leading-relaxed mb-4">
              Nigeria&apos;s leading campus ticketing and university event platform. Instant QR code digital passes, student union voting, and seamless payments.
            </p>
            <p className="text-[12px] text-[#6b7280]">
              swyft-ticket.name.ng
            </p>
          </div>

          {/* Nav links columns */}
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-[13px] font-medium text-[#fafafa] uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5 p-0 m-0 list-none">
                {items.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-[#9ca3af] hover:text-[#fafafa] no-underline transition-colors font-light"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom legal & copyright row */}
        <div className="pt-8 border-t border-[#374151] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#9ca3af] font-light">
          <p>© {new Date().getFullYear()} Swyft Ticket. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#fafafa] no-underline transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#fafafa] no-underline transition-colors">Terms</Link>
            <Link href="/help" className="hover:text-[#fafafa] no-underline transition-colors">Support</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
