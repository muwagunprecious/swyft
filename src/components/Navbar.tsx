"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[#374151] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="grix-container flex h-[72px] items-center justify-between gap-6">
        
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline text-[#fafafa] group" aria-label="Swyft home">
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

        {/* Center: Clean Text Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/events" className="text-[14px] font-medium text-[#9ca3af] hover:text-[#fafafa] transition-colors no-underline">
            Events
          </Link>
          <Link href="/organizer/events/new" className="text-[14px] font-medium text-[#9ca3af] hover:text-[#fafafa] transition-colors no-underline">
            Host an Event
          </Link>
          <Link href="/voting" className="text-[14px] font-medium text-[#9ca3af] hover:text-[#fafafa] transition-colors no-underline">
            Voting
          </Link>
          <Link href="/tickets" className="text-[14px] font-medium text-[#9ca3af] hover:text-[#fafafa] transition-colors no-underline">
            Find My Ticket
          </Link>
        </nav>

        {/* Right: Actions Cluster (Full Pill Controls) */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-1.5 text-[13px] font-medium text-[#fafafa] border border-[#374151] hover:border-[#fafafa] no-underline transition-all"
                >
                  Admin
                </Link>
              )}
              <Link
                href={user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/dashboard"}
                className="rounded-full px-5 py-2 text-[14px] font-medium bg-[#fafafa] text-[#171717] hover:opacity-90 no-underline transition-all shadow-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("otix_token");
                  localStorage.removeItem("otix_user");
                  window.location.href = "/";
                }}
                className="text-[14px] font-medium text-[#9ca3af] hover:text-[#fafafa] bg-transparent border-none cursor-pointer transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[14px] font-medium text-[#9ca3af] hover:text-[#fafafa] no-underline transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-[#fafafa] text-[#171717] px-6 py-2.5 text-[14px] font-medium hover:opacity-90 transition-all shadow-sm no-underline"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#374151] text-[#fafafa] md:hidden bg-transparent"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#374151] bg-[#0a0a0a] p-6 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/events" className="text-[16px] font-medium text-[#fafafa] no-underline" onClick={() => setMobileOpen(false)}>
              Events
            </Link>
            <Link href="/organizer/events/new" className="text-[16px] font-medium text-[#fafafa] no-underline" onClick={() => setMobileOpen(false)}>
              Host an Event
            </Link>
            <Link href="/voting" className="text-[16px] font-medium text-[#fafafa] no-underline" onClick={() => setMobileOpen(false)}>
              Voting
            </Link>
            <Link href="/tickets" className="text-[16px] font-medium text-[#fafafa] no-underline" onClick={() => setMobileOpen(false)}>
              Find My Ticket
            </Link>
            <div className="h-px bg-[#374151] my-2" />
            {user ? (
              <>
                <Link
                  href={user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/dashboard"}
                  className="text-[16px] font-medium text-[#fafafa] no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("otix_token");
                    localStorage.removeItem("otix_user");
                    window.location.href = "/";
                  }}
                  className="text-left text-[16px] font-medium text-[#ef4444] bg-transparent border-none p-0 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" className="text-center py-3 text-[14px] font-medium text-[#fafafa] border border-[#374151] rounded-full no-underline" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
                <Link href="/register" className="text-center py-3 text-[14px] font-medium bg-[#fafafa] text-[#171717] rounded-full no-underline" onClick={() => setMobileOpen(false)}>
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
