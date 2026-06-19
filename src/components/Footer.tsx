import Link from "next/link";

const links = {
  Discover: [
    ["Explore Events", "/events"],
    ["Live Voting", "/voting"],
    ["Fundraisers", "/fundraisers"],
    ["Track Ticket", "/tickets"],
  ],
  Organise: [
    ["Create Event", "/organizer/events/new"],
    ["Dues Collection", "/dues"],
    ["QR Verification", "/verify"],
    ["Organiser Dashboard", "/organizer"],
  ],
  Company: [
    ["Universities", "/events"],
    ["Help Center", "/help"],
    ["Privacy Policy", "/privacy"],
    ["Terms of Service", "/terms"],
  ],
};

const socials = [
  {
    label: "Twitter / X",
    href: "https://x.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://whatsapp.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.098.543 4.07 1.494 5.789L0 24l6.395-1.677A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-4.992-1.367l-.358-.213-3.718.975.993-3.63-.234-.374A9.818 9.818 0 1 1 12 21.818z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#050212",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Top section ── */}
      <div
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
          padding: "64px 24px 48px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div style={{ maxWidth: "340px" }}>
            {/* Logo */}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f05537",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              >
                swyft
              </span>
            </Link>

            {/* Tagline */}
            <p
              style={{
                fontSize: "0.88rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "28px",
                fontWeight: 500,
              }}
            >
              Africa's campus operating system — events, ticketing,
              live voting, dues, fundraising &amp; QR verification.
              Built for student life.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(240,85,55,0.15)";
                    e.currentTarget.style.borderColor = "rgba(240,85,55,0.4)";
                    e.currentTarget.style.color = "#f05537";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
            }}
            className="footer-links-grid"
          >
            {Object.entries(links).map(([heading, items]) => (
              <div key={heading}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#f05537",
                    marginBottom: "16px",
                  }}
                >
                  {heading}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.5)",
                        textDecoration: "none",
                        transition: "color 0.15s ease",
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.5)";
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.25)",
            margin: 0,
          }}
        >
          © 2026 Swyft Technologies Ltd. All rights reserved.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              boxShadow: "0 0 6px #22c55e",
            }}
          />
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.25)",
              margin: 0,
            }}
          >
            All systems operational
          </p>
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 1.2fr 2fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-links-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </footer>
  );
}
