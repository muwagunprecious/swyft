"use client";

import { useState } from "react";

interface Props {
  url?: string;
  title?: string;
}

export default function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = url || window.location.href;
      if (navigator.share) {
        navigator.share({
          title: title || "Check out this event on Swyft",
          url: shareUrl,
        }).catch(() => {
          navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${
        copied
          ? "border-[#fafafa] bg-[#fafafa] text-[#171717]"
          : "border-[#374151] bg-transparent text-[#fafafa] hover:border-[#fafafa]"
      }`}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Link Copied
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share Event
        </>
      )}
    </button>
  );
}
