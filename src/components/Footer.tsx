import Link from "next/link";

const columns = [
  {
    heading: "Discover",
    links: [
      ["Explore Events", "/events"],
      ["Voting", "/voting"],
      ["Fundraisers", "/fundraisers"],
      ["Track Ticket", "/tickets"],
    ],
  },
  {
    heading: "Collect",
    links: [
      ["Create Project", "/organizer/events/new"],
      ["Dues Payment", "/dues"],
      ["QR Verification", "/verify"],
      ["Creator Dashboard", "/organizer"],
    ],
  },
  {
    heading: "Company",
    links: [
      ["Universities", "/universities"],
      ["Help Center", "/help"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#101828] text-white">
      <div className="wrap py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13.5h6.25L9 21l10-11.5h-6.25L15 2 5 13.5Z" fill="#FF6B00" />
                </svg>
              </span>
              <span className="text-xl font-black">SWYFT</span>
            </div>
            <p className="max-w-sm text-sm leading-6 text-gray-300">
              Africa's modern operating system for campus events, ticketing,
              voting, dues, fundraising, and QR verification.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.heading}>
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">
                  {column.heading}
                </p>
                <div className="grid gap-2">
                  {column.links.map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="text-sm font-semibold text-gray-300 no-underline transition hover:text-white"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs font-semibold text-gray-400">
          <p>Copyright 2026 SWYFT Technologies. All rights reserved.</p>
          <p>Built for fast campus activity across Africa.</p>
        </div>
      </div>
    </footer>
  );
}
