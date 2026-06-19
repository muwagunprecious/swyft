"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/updates", label: "Updates" },
  { href: "/events", label: "Find Events" },
  { href: "/organizer/events/new", label: "Create Events" },
  { href: "/help", label: "Help Center" },
  { href: "/tickets", label: "Track Ticket" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5 no-underline" aria-label="SWYFT home">
      <span className="flex h-7 w-7 items-center justify-center text-[#f05537]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-xl font-black tracking-[-0.04em] text-[#f05537]">swyft</span>
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const userDataStr = localStorage.getItem("otix_user");
    if (userDataStr) {
      try {
        setUser(JSON.parse(userDataStr));
      } catch (e) {
        console.error("Failed to parse user in navbar", e);
      }
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b transition-all duration-300"
      style={{
        height: 72,
        borderColor: scrolled ? "rgba(30, 10, 60, 0.08)" : "rgba(30, 10, 60, 0.03)",
        background: scrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(20px)",
        boxShadow: scrolled ? "0 4px 30px rgba(0, 0, 0, 0.02)" : "none",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1360px] items-center justify-between gap-6 px-6">
        <Logo />

        {/* Professional Search Input Widget */}
        <div className="hidden h-[46px] min-w-[400px] max-w-[500px] flex-1 items-center rounded-full border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#f05537] focus-within:ring-4 focus-within:ring-[#f05537]/5 pl-4 pr-1 lg:flex transition-all duration-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="w-full bg-transparent px-3 text-xs font-semibold text-[#1e0a3c] placeholder-slate-400 outline-none"
            placeholder="Search events, hosts or campuses..."
          />
          <span className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 px-3 shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f05537" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="text-xs font-black text-[#1e0a3c]">{user?.university || "All Campuses"}</span>
          </div>
          <button className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#f05537] hover:bg-[#d1410c] text-white transition-all shadow-md active:scale-95" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="hidden items-center gap-1.5 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#f05537] hover:bg-[#f05537]/5 no-underline transition-all duration-300"
            >
              {item.label}
              {item.label === "Help Center" ? <span className="ml-1 text-[10px] text-slate-400">▼</span> : null}
            </Link>
          ))}
        </nav>

        {/* CTAs & Session States */}
        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-full px-4 py-2 text-xs font-black text-[#f05537] border border-[#f05537]/20 bg-[#f05537]/5 no-underline hover:bg-[#f05537]/10 transition-all active:scale-95"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href={user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/dashboard"}
              className="rounded-full px-4 py-2 text-xs font-black text-[#1e0a3c] border border-slate-200 bg-white hover:bg-slate-50 no-underline transition-all active:scale-95"
            >
              Console
            </Link>
            <span className="h-4 w-px bg-slate-200" />
            <button
              onClick={() => {
                localStorage.removeItem("otix_token");
                localStorage.removeItem("otix_user");
                window.location.href = "/";
              }}
              className="rounded-full px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full px-5 py-2.5 text-xs font-black text-white bg-[#1e0a3c] hover:bg-[#2e1254] no-underline transition-all shadow-md active:scale-95"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1e0a3c] hover:bg-slate-50 active:scale-95 transition-all xl:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Glass Drawer */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[72px] border-b border-slate-200 bg-white/95 backdrop-blur-xl p-5 shadow-2xl xl:hidden animate-slideDown">
          <div className="mb-4 flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input className="w-full bg-transparent px-3 text-xs font-semibold outline-none text-[#1e0a3c]" placeholder="Search SWYFT" />
          </div>
          <div className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-xs font-bold text-slate-700 no-underline hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="h-px bg-slate-100 my-2" />
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-xs font-black text-indigo-600 no-underline hover:bg-slate-50"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href={user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-xs font-black text-[#f05537] no-underline hover:bg-slate-50"
                >
                  Console
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("otix_token");
                    localStorage.removeItem("otix_user");
                    window.location.href = "/";
                  }}
                  className="text-left rounded-xl px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-slate-100 my-2" />
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-xs font-black text-[#1e0a3c] no-underline hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
