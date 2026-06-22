"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";


const navItems = [
  {
    label: "Events",
    href: "/organizer/events",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Voting System",
    href: "/organizer/voting",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M12 2v2" />
      </svg>
    ),
  },
  {
    label: "My Wallet",
    href: "/organizer/wallet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    label: "Access Managers",
    href: "/organizer/team",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Audience",
    href: "/organizer/attendees",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Verify Tickets",
    href: "/organizer/verification",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    label: "My Account",
    href: "/organizer/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Payouts",
    href: "/organizer/payouts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    label: "Back to Main Site",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Help",
    href: "/help",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("otix_token");
    const userDataStr = localStorage.getItem("otix_user");

    if (!token || !userDataStr) {
      setAuthorized(false);
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      return;
    }

    try {
      const parsedUser = JSON.parse(userDataStr);
      if (parsedUser.role === "ORGANIZER" || parsedUser.role === "ADMIN") {
        setUser(parsedUser);
        setAuthorized(true);
      } else {
        // Logged in but not an organizer or admin - redirect to student/consumer dashboard
        setAuthorized(false);
        window.location.href = "/dashboard";
      }
    } catch (e) {
      console.error("Failed to parse user data", e);
      setAuthorized(false);
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("otix_token");
    localStorage.removeItem("otix_user");
    window.location.href = "/";
  };

  // derive page title from pathname
  const pageTitle =
    pathname === "/organizer" ? "Dashboard" :
    pathname.includes("/events/new") ? "Create Event" :
    pathname.includes("/events") ? "My Events" :
    pathname.includes("/wallet") ? "My Wallet" :
    pathname.includes("/team") ? "Access Managers" :
    pathname.includes("/settings") ? "My Account" :
    pathname.includes("/analytics") ? "Analytics" :
    pathname.includes("/voting") ? "Voting System" :
    "Dashboard";

  if (authorized === null || authorized === false) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(255, 255, 255, 0.96)", backdropFilter: "blur(16px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 10000, padding: "24px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "400px", textAlign: "center" }}>
          
          {/* Pulsing Glowing Ring with Swyft Logo */}
          <div style={{ position: "relative", width: "100px", height: "100px", marginBottom: "32px" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: "50%", border: "4px solid rgba(240, 85, 55, 0.08)",
              borderTopColor: "#f05537", borderRightColor: "#ff8f7a",
              animation: "spin 1s linear infinite",
              boxShadow: "0 0 15px rgba(240, 85, 55, 0.15)"
            }} />
            <div style={{
              position: "absolute", top: "10px", left: "10px", right: "10px", bottom: "10px",
              borderRadius: "50%", background: "radial-gradient(circle, rgba(240, 85, 55, 0.08) 0%, transparent 70%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              {/* SVG Swyft Logo */}
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-[#f05537] drop-shadow-[0_0_8px_rgba(240, 85, 55, 0.3)]">
                <path
                  d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#111827", marginBottom: "8px", letterSpacing: "-0.02em" }}>
            Verifying Credentials
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#f05537", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "24px" }}>
            SWYFT CREATOR STUDIO
          </p>

          {/* Status Steps */}
          <div style={{
            background: "#F9FAFB", border: "1px solid #E5E7EB",
            borderRadius: "16px", padding: "18px 24px", width: "100%", minHeight: "68px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            backdropFilter: "blur(8px)"
          }}>
            <p style={{ fontSize: "0.9rem", color: "#1F2937", fontWeight: 700, margin: 0 }}>
              ⚡ Securing dashboard session...
            </p>
          </div>
          
          <p style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "24px", fontWeight: 600 }}>
            🔒 Secured by SWYFT Cryptographic Tokens
          </p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(1.08); opacity: 1; }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F3F5]">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[320px] flex-col border-r border-white/10 bg-[#1e0a3c] lg:flex z-40">
        <div className="flex flex-1 flex-col overflow-y-auto py-6">
          {/* Logo / Brand */}
          <div className="mb-6 flex items-center gap-3 border-b border-white/10 px-6 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f05537]/20 text-[#f05537] shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-black tracking-tight text-white mb-0.5">swyft</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Creator Studio</p>
            </div>
          </div>

          {/* Main Nav */}
          <nav className="flex flex-col gap-1.5 px-4">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-[14px] font-bold no-underline transition-all ${
                    active
                      ? "bg-[#f05537] text-white shadow-md shadow-[#f05537]/20"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-[20%] bottom-[20%] w-[3.5px] rounded-r bg-white" />
                  )}
                  <span className={active ? "text-white" : "text-gray-400"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Links */}
          <div className="border-t border-white/10 px-4 pt-4">
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-300 no-underline transition hover:bg-white/5 hover:text-white"
              >
                <span className="text-gray-400">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-red-400 transition hover:bg-red-500/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* TOP BAR */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-[64px] items-center justify-between border-b border-gray-200 bg-white px-8 lg:left-[320px]">
        {/* Mobile hamburger */}
        <button
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <h1 className="text-[16px] font-black text-[#1a202c]">{pageTitle}</h1>

        {/* User badge */}
        <div className="hidden sm:flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="truncate max-w-[150px] text-[14px] font-bold text-[#1a202c]">{user?.name || "SWYFT Admin"}</span>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[64px] z-20 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-[240px] bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-bold no-underline ${pathname === item.href ? "bg-[#fff3f0] text-[#f05537]" : "text-gray-600"}`}>
                {item.icon}{item.label}
              </Link>
            ))}
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="min-h-screen lg:pl-[320px]">
        <div className="min-h-[calc(100vh-64px)] pt-[64px] p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
