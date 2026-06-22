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
    
    // Build cart in the exact format CheckoutForm reads from localStorage
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
      <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs font-semibold text-gray-400">
        No ticket options available for this event.
      </div>
    );
  }

  return (
    <div className="mt-4 w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
          Select Admission Type
        </h3>
        <span className="text-xs font-bold text-gray-500">
          {tickets.length} {tickets.length === 1 ? "tier" : "tiers"} available
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
              className={`w-full rounded-xl border bg-white p-4 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f05537]/50 ${
                isSelected
                  ? "border-[#f05537] shadow-[0_4px_20px_rgba(240,85,55,0.08)] bg-orange-50/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Custom radio indicator */}
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                    isSelected ? "border-[#f05537]" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#f05537]" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">{t.name}</h4>
                    <p className={`text-xs font-black mt-0.5 ${t.price === 0 ? "text-emerald-600" : "text-[#f05537]"}`}>
                      {t.price === 0 ? "Free" : formatNaira(t.price)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    avail < 20 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-gray-100 text-gray-500"
                  }`}>
                    {avail <= 0 ? "Sold Out" : `${avail} left`}
                  </span>
                </div>
              </div>

              {/* Quantity Stepper (Rendered inside the active card) */}
              {isSelected && avail > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Quantity</span>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg p-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                      disabled={qty <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="min-w-[20px] text-center text-xs font-black text-gray-800">{qty}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQty(Math.min(avail, qty + 1)); }}
                      disabled={qty >= avail}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mb-6 rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Subtotal ({qty} ticket{qty > 1 ? "s" : ""})</span>
            <span className="font-bold text-gray-900">
              {isFree ? "₦0.00" : formatNaira(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200/50 pt-2 text-sm font-black text-gray-950">
            <span>Total Cost</span>
            <span className={isFree ? "text-emerald-600" : "text-[#f05537]"}>
              {isFree ? "Free" : formatNaira(subtotal)}
            </span>
          </div>
        </div>
      )}

      {/* Premium CTA Button */}
      <button
        onClick={handleCheckout}
        disabled={available <= 0}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[#f05537] hover:bg-[#d1410c] text-sm font-black uppercase tracking-wider text-white shadow-md hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
      >
        {available <= 0
          ? "Sold Out"
          : `Get ${isFree ? "Free Pass" : "Admission Pass"}`}
      </button>

      <p className="mt-3 text-center text-[10px] font-bold text-gray-400">
        ⚡ Instant receipt & ticket delivery to your inbox.
      </p>
    </div>
  );
}
