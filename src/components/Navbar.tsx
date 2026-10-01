"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userDataStr = localStorage.getItem("otix_user");
    if (userDataStr) {
      try {
        setUser(JSON.parse(userDataStr));
      } catch (e) {
        console.error("Failed to parse user in navbar", e);
      }
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/events?q=${encodeURIComponent(searchQuery.trim())}`;
    } else {
      window.location.href = `/events`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-[#ffffff]">
      <div className="eb-container flex h-[72px] items-center justify-between gap-6">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Swyft home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d1410c] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="text-[22px] font-bold tracking-tight text-[#d1410c]">swyft</span>
        </Link>

        {/* Global Search & Location Bar (Eventbrite style) */}
        <form 
          onSubmit={handleSearchSubmit}
          className="hidden md:flex h-[46px] max-w-[560px] flex-1 items-center rounded-full border border-[#dddae3] bg-[#ffffff] pl-4 pr-1 focus-within:border-[#39364f] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6f7287" strokeWidth="2.5" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 text-[14px] font-medium text-[#39364f] placeholder-[#6f7287] outline-none"
            placeholder="Search events, organizers, or topics"
          />
          <span className="h-5 w-px bg-[#dddae3]" />
          <div className="flex items-center gap-1.5 px-3 shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1410c" strokeWidth="2.5">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="text-[13px] font-semibold text-[#39364f] truncate max-w-[120px]">
              {user?.university || "All Campuses"}
            </span>
          </div>
          <button 
            type="submit" 
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#d1410c] hover:bg-[#b53809] text-white transition-all"
            aria-label="Search"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>

        {/* Navigation & Actions */}
        <nav className="hidden lg:flex items-center gap-5">
          <Link href="/events" className="text-[13px] font-semibold text-[#39364f] hover:text-[#d1410c] no-underline">
            Find Events
          </Link>
          <Link href="/organizer/events/new" className="text-[13px] font-semibold text-[#39364f] hover:text-[#d1410c] no-underline">
            Create Events
          </Link>
          <Link href="/help" className="text-[13px] font-semibold text-[#39364f] hover:text-[#d1410c] no-underline">
            Help Center
          </Link>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-[#d1410c] border border-[#d1410c] hover:bg-[#fff9f6] no-underline"
                >
                  Admin
                </Link>
              )}
              <Link
                href={user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/dashboard"}
                className="btn-secondary !min-w-[100px] !min-h-[38px] !py-1.5 !px-4 text-[13px]"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("otix_token");
                  localStorage.removeItem("otix_user");
                  window.location.href = "/";
                }}
                className="text-[13px] font-semibold text-[#6f7287] hover:text-[#d1410c] bg-transparent border-none cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <Link
                href="/login"
                className="text-[13px] font-semibold text-[#39364f] hover:text-[#d1410c] no-underline px-2"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="btn-primary !min-w-[110px] !min-h-[40px] !py-2 !px-4 text-[13px]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dddae3] text-[#39364f] lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#e5e7eb] bg-white p-5 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center rounded-full border border-[#dddae3] px-3.5 py-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f7287" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 text-[14px] text-[#39364f] outline-none"
              placeholder="Search events"
            />
          </form>
          <div className="flex flex-col gap-2">
            <Link href="/events" className="py-2 text-[14px] font-semibold text-[#39364f] no-underline" onClick={() => setMobileOpen(false)}>
              Find Events
            </Link>
            <Link href="/organizer/events/new" className="py-2 text-[14px] font-semibold text-[#39364f] no-underline" onClick={() => setMobileOpen(false)}>
              Create Events
            </Link>
            <Link href="/tickets" className="py-2 text-[14px] font-semibold text-[#39364f] no-underline" onClick={() => setMobileOpen(false)}>
              Track Ticket
            </Link>
            <div className="h-px bg-[#e5e7eb] my-2" />
            {user ? (
              <>
                <Link
                  href={user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/dashboard"}
                  className="py-2 text-[14px] font-semibold text-[#d1410c] no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("otix_token");
                    localStorage.removeItem("otix_user");
                    window.location.href = "/";
                  }}
                  className="py-2 text-left text-[14px] font-semibold text-rose-600 bg-transparent border-none"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" className="btn-secondary text-center" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
                <Link href="/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
