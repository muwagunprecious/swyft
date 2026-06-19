"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOrganizer = pathname?.startsWith("/organizer");
  const isAuth = pathname === "/login" || pathname === "/register";

  if (isOrganizer) {
    return (
      <main className="min-h-screen bg-[#F2F3F5]">
        {children}
      </main>
    );
  }

  if (pathname?.startsWith("/admin")) {
    return (
      <main className="min-h-screen bg-[#07050f]">
        {children}
      </main>
    );
  }

  if (isAuth) {
    return (
      <main className="min-h-screen bg-[#f8f7fa]">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[66px] bg-[#f8f7fa]">{children}</main>
      <Footer />
    </>
  );
}
