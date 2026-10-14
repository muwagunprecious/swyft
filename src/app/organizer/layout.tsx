"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";


const navItems = [
  {
    label: "Overview",
    href: "/organizer",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
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
      <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0a0a0a] text-[#fafafa] p-6">
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-white/5" />
          <div className="absolute h-16 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="relative flex h-14 w-14 items-center justify-center text-[#fafafa] animate-bounce">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        <h2 className="mt-8 text-sm font-light tracking-tight text-[#fafafa]">
          Verifying Credentials
        </h2>
        <p className="mt-1 text-[10px] font-medium tracking-widest text-[#9ca3af] uppercase animate-pulse">
          SWYFT CREATOR STUDIO
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] font-sans selection:bg-[#fafafa] selection:text-[#0a0a0a]">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[280px] flex-col border-r border-[#262626] bg-[#0d0d0d] lg:flex z-40">
        <div className="flex flex-1 flex-col overflow-y-auto py-6">
          {/* Logo / Brand */}
          <div className="mb-6 flex items-center gap-3 border-b border-[#262626] px-6 pb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171717] border border-[#262626] text-[#fafafa] shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-[#fafafa] uppercase leading-none">swyft</p>
              <p className="text-[9px] font-medium uppercase tracking-widest text-[#9ca3af] mt-1">Creator Studio</p>
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
                  className={`relative flex items-center gap-3 rounded-full px-4.5 py-3 text-[13px] font-medium no-underline transition-all ${
                    active
                      ? "bg-[#fafafa] text-[#0a0a0a] font-semibold shadow-sm"
                      : "text-[#9ca3af] hover:bg-[#171717] hover:text-[#fafafa]"
                  }`}
                >
                  <span className={active ? "text-[#0a0a0a]" : "text-[#9ca3af]"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Links */}
          <div className="border-t border-[#262626] px-4 pt-4 space-y-1">
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-full px-4.5 py-2.5 text-[13px] font-medium text-[#9ca3af] no-underline transition hover:bg-[#171717] hover:text-[#fafafa]"
              >
                <span className="text-[#9ca3af]">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-full px-4.5 py-2.5 text-[13px] font-medium text-rose-400 transition hover:bg-rose-950/30 cursor-pointer"
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
      <div className="fixed left-0 right-0 top-0 z-30 flex h-[64px] items-center justify-between border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-8 lg:left-[280px]">
        {/* Mobile hamburger */}
        <button
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#262626] bg-[#121212] text-[#9ca3af] hover:text-[#fafafa] lg:hidden cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <h1 className="text-base font-light tracking-tight text-[#fafafa]">{pageTitle}</h1>

        {/* User badge */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#262626] bg-[#121212]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="truncate max-w-[150px] text-xs font-medium text-[#fafafa]">{user?.name || "Organizer"}</span>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[64px] z-20 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-[260px] bg-[#0d0d0d] border-r border-[#262626] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-full px-4 py-3 text-[13px] font-medium no-underline mb-1 ${pathname === item.href ? "bg-[#fafafa] text-[#0a0a0a] font-semibold" : "text-[#9ca3af] hover:text-[#fafafa]"}`}>
                {item.icon}{item.label}
              </Link>
            ))}
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="min-h-screen lg:pl-[280px] bg-[#0a0a0a]">
        <div className="min-h-[calc(100vh-64px)] pt-[64px] p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
