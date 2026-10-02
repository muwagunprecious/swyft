import Link from "next/link";

const footerLinks = {
  "Use Swyft": [
    ["Create Events", "/organizer/events/new"],
    ["Pricing & Fees", "/pricing"],
    ["Event Marketing", "/marketing"],
    ["Campus Elections & Voting", "/voting"],
    ["Track Tickets", "/tickets"],
  ],
  "Plan Events": [
    ["Sell Tickets Online", "/organizer"],
    ["QR Check-in App", "/verify"],
    ["Student Dues & Reg", "/dues"],
    ["Post Event Virtuals", "/events"],
  ],
  "Find Events": [
    ["Music & Nightlife", "/events?category=Entertainment"],
    ["Campus Parties", "/events?category=Party"],
    ["Hackathons & Tech", "/events?category=Tech"],
    ["Academic Conferences", "/events?category=Conference"],
    ["Food & Drinks", "/events?category=Dinner"],
  ],
  "Connect With Us": [
    ["Contact Support", "/help"],
    ["Twitter / X", "https://x.com"],
    ["Instagram", "https://instagram.com"],
    ["Privacy Policy", "/privacy"],
    ["Terms of Service", "/terms"],
  ],
};

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#e5e7eb] bg-[#f8f7fa] text-[#39364f]">
      <div className="eb-container py-14">
        
        {/* Main Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand info column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 no-underline mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[#d1410c] text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="text-[20px] font-bold text-[#d1410c] tracking-tight">swyft</span>
            </Link>
            <p className="text-[13px] text-[#6f7287] leading-relaxed mb-4">
              The premier ticketing and campus experience platform built for Nigerian universities.
            </p>
          </div>

          {/* Nav links columns */}
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-[13px] font-semibold text-[#39364f] uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5 p-0 m-0 list-none">
                {items.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("http") ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[#6f7287] hover:text-[#d1410c] no-underline transition-colors font-normal"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-[13px] text-[#6f7287] hover:text-[#d1410c] no-underline transition-colors font-normal"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom legal & copyright row */}
        <div className="pt-8 border-t border-[#e5e7eb] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#6f7287]">
          <p>© {new Date().getFullYear()} Swyft Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#d1410c] no-underline">Privacy</Link>
            <Link href="/terms" className="hover:text-[#d1410c] no-underline">Terms</Link>
            <Link href="/help" className="hover:text-[#d1410c] no-underline">Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
