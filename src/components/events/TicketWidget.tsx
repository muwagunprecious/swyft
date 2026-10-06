"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/swyft-data";

interface Ticket {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

interface Props {
  eventId: string;
  eventTitle: string;
  eventImage: string;
  subaccountCode?: string;
  tickets: Ticket[];
}

export default function TicketWidget({ eventId, eventTitle, eventImage, subaccountCode, tickets }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedTicket = tickets[selectedIndex];
  const subtotal = selectedTicket ? selectedTicket.price * qty : 0;
  const isFree = selectedTicket?.price === 0;
  const available = selectedTicket ? (selectedTicket.quantity - selectedTicket.sold) : 0;

  const handleCheckout = () => {
    if (!selectedTicket) return;
    
    const cartItem = {
      ticketId: selectedTicket.id,
      title: eventTitle,
      ticketType: selectedTicket.name,
      price: selectedTicket.price,
      qty,
      image: eventImage,
      subaccountCode,
    };

    localStorage.setItem("otix_cart", JSON.stringify([cartItem]));
    router.push(`/checkout/${eventId}`);
  };

  if (!tickets || tickets.length === 0) {
    return (
      <div className="p-6 border border-[#374151] rounded-lg text-center text-sm font-normal text-[#9ca3af] bg-[#0a0a0a]">
        No ticket options available for this event.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-medium tracking-wider uppercase text-[#9ca3af]">
          Select Admission
        </h3>
        <span className="text-[13px] font-light text-[#9ca3af]">
          {tickets.length} {tickets.length === 1 ? "tier" : "tiers"}
        </span>
      </div>

      {/* Ticket options selection */}
      <div className="mb-6 space-y-3">
        {tickets.map((t, i) => {
          const isSelected = i === selectedIndex;
          const avail = t.quantity - t.sold;
          
          return (
            <div
              key={t.name}
              onClick={() => { setSelectedIndex(i); setQty(1); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedIndex(i);
                  setQty(1);
                }
              }}
              tabIndex={0}
              role="button"
              className={`w-full rounded-lg border p-4 text-left transition-all cursor-pointer focus:outline-none ${
                isSelected
                  ? "border-[#fafafa] bg-[#171717]"
                  : "border-[#374151] bg-[#0a0a0a] hover:border-[#9ca3af]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {/* Minimal radio dot */}
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "border-[#fafafa]" : "border-[#374151]"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#fafafa]" />}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-medium text-[#fafafa]">{t.name}</h4>
                    <p className="text-[14px] font-light text-[#9ca3af] mt-0.5">
                      {t.price === 0 ? "Free" : formatNaira(t.price)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    avail <= 0
                      ? "border-[#ef4444] text-[#ef4444]"
                      : isSelected
                      ? "border-[#fafafa] text-[#fafafa]"
                      : "border-[#374151] text-[#9ca3af]"
                  }`}>
                    {avail <= 0 ? "Sold Out" : `${avail} left`}
                  </span>
                </div>
              </div>

              {/* Quantity Stepper */}
              {isSelected && avail > 0 && (
                <div className="mt-4 pt-3 border-t border-[#374151] flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#9ca3af] uppercase tracking-wider">Quantity</span>
                  <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#374151] rounded-full px-2 py-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                      disabled={qty <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-medium text-[#fafafa] hover:bg-[#171717] disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer"
                    >
                      –
                    </button>
                    <span className="min-w-[20px] text-center text-[14px] font-medium text-[#fafafa]">{qty}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQty(Math.min(avail, qty + 1)); }}
                      disabled={qty >= avail}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-medium text-[#fafafa] hover:bg-[#171717] disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bill summary breakdown */}
      {selectedTicket && available > 0 && (
        <div className="mb-6 rounded-lg bg-[#171717] border border-[#374151] p-4 space-y-2">
          <div className="flex items-center justify-between text-[13px] font-light text-[#9ca3af]">
            <span>Subtotal ({qty} {qty > 1 ? "tickets" : "ticket"})</span>
            <span className="font-medium text-[#fafafa]">
              {isFree ? "Free" : formatNaira(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#374151] pt-2 text-[15px] font-medium text-[#fafafa]">
            <span>Total</span>
            <span>{isFree ? "Free" : formatNaira(subtotal)}</span>
          </div>
        </div>
      )}

      {/* Primary Pill Button */}
      <button
        onClick={handleCheckout}
        disabled={available <= 0}
        className="btn-primary w-full justify-center !min-h-[52px] !text-[16px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {available <= 0
          ? "Sold Out"
          : `Continue to Checkout (${isFree ? "Free" : formatNaira(subtotal)})`}
      </button>

      <p className="mt-4 text-center text-[12px] font-light text-[#9ca3af]">
        Instant digital tickets with scannable QR verification pass.
      </p>
    </div>
  );
}
