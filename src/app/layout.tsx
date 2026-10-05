import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SWYFT - Curated Events & Ticketing",
  description:
    "Dark, minimal event-ticketing interface with oversized editorial hero typography, pill CTAs, and image-led event cards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen bg-[#0a0a0a] text-[#fafafa] antialiased ${geistSans.variable} font-sans`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
