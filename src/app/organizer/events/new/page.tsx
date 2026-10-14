"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type TicketMode = "free" | "paid" | "donation";

interface TicketRow {
  id: number;
  name: string;
  price: string;
  capacity: string;
  description: string;
  discountPrice?: string;
  discountDays?: string;
}

let nextId = 2;

export default function CreateEventPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  
  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Tech");
  
  // Tickets States
  const [ticketMode, setTicketMode] = useState<TicketMode>("free");
  const [tickets, setTickets] = useState<TicketRow[]>([
    { id: 1, name: "", price: "", capacity: "", description: "" },
  ]);

  // Submission States
  const [publishing, setPublishing] = useState(false);
  const [publishingError, setPublishingError] = useState("");
  const [createdEvent, setCreatedEvent] = useState<{ title: string; url: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!createdEvent?.url) return;
    navigator.clipboard.writeText(createdEvent.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));

    // Compress & resize image to max 1280px width/height and JPEG quality 0.85
    // This reduces multi-megabyte camera photos down to < 200KB so uploads are fast and never time out
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setBannerBase64(compressedDataUrl);
        } else {
          setBannerBase64(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addTicket = () => {
    setTickets((prev) => [
      ...prev,
      { id: nextId++, name: "", price: "", capacity: "", description: "" },
    ]);
  };

  const removeTicket = (id: number) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTicket = (id: number, field: keyof TicketRow, value: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handlePublish = async (isDraft = false) => {
    if (publishing) return;
    if (!title.trim()) {
      alert("Event title is required!");
      return;
    }
    if (!date) {
      alert("Event date is required!");
      return;
    }

    setPublishing(true);
    setPublishingError("");

    // Combine date and time to ISO string
    const dateTimeStr = time ? `${date}T${time}` : date;

    const formattedTickets = tickets.map((t) => {
      let priceVal = 0;
      if (ticketMode === "paid" || ticketMode === "donation") {
        priceVal = parseFloat(t.price) || 0;
      }
      return {
        name: t.name.trim() || (ticketMode === "free" ? "Free Pass" : ticketMode === "donation" ? "Donation" : "Regular"),
        price: priceVal,
        quantity: parseInt(t.capacity) || 100,
        discountPrice: t.discountPrice && parseFloat(t.discountPrice) >= 0 ? parseFloat(t.discountPrice) : null,
        discountDays: t.discountDays && parseInt(t.discountDays) > 0 ? parseInt(t.discountDays) : null,
      };
    });

    try {
      const res = await api.post("/events", {
        title: title.trim(),
        description: description.trim(),
        bannerImage: bannerBase64 || preview || undefined,
        date: dateTimeStr,
        location: location.trim(),
        category,
        tickets: formattedTickets,
        status: isDraft ? "DRAFT" : "PUBLISHED"
      });

      const eventData = res.data;
      const slug = eventData?.slug || eventData?.id;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}/events/${slug}`;

      if (isDraft) {
        router.push("/organizer/events");
      } else {
        setCreatedEvent({
          title: eventData?.title || title.trim(),
          url: fullUrl,
          slug,
        });
      }
    } catch (err: any) {
      console.error("Failed to publish event:", err);
      setPublishingError(err.response?.data?.message || "Failed to create event. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const modeConfig = {
    free: { label: "Free", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-800/40" },
    paid: { label: "Paid", color: "text-[#fafafa]", bg: "bg-[#171717]", border: "border-[#262626]" },
    donation: { label: "Donation", color: "text-amber-400", bg: "bg-amber-950/20", border: "border-amber-800/40" },
  };

  return (
    <div className="space-y-6 pt-2 max-w-3xl">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2">
        <Link
          href="/organizer/events"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#9ca3af] no-underline transition hover:text-[#fafafa]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Events
        </Link>
      </div>

      <div>
        <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
          New Event
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">
          Setup Your Event
        </h1>
        <p className="mt-1 text-xs text-[#9ca3af]">
          Configure event details, schedule, venue, and ticket pricing tiers.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── IMAGE UPLOAD ───────────────────────────── */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
            dragOver ? "border-[#fafafa] bg-[#171717]" : "border-[#262626] bg-[#121212] hover:border-[#374151] hover:bg-[#171717]"
          }`}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {preview ? (
            <>
              <img src={preview} alt="Banner" className="h-full max-h-[220px] w-full rounded-2xl object-cover" />
              <button onClick={(e) => { e.stopPropagation(); setPreview(null); setBannerBase64(null); }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 px-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#171717] border border-[#262626]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-xs font-medium text-[#9ca3af]">
                Click or drop flyer image here to upload <span className="text-[#737373]">(Max 5MB)</span>
              </p>
            </div>
          )}
        </div>

        {/* ── EVENT NAME ─────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#fafafa]">Event Name *</label>
          <input type="text" placeholder="Enter event name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373]" />
        </div>

        {/* ── DESCRIPTION ────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#fafafa]">Event Description</label>
          <textarea placeholder="Describe your event..." rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-2xl border border-[#262626] bg-[#171717] px-4 py-3 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373]" />
        </div>

        {/* ── CATEGORY ───────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#fafafa]">Category</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full appearance-none rounded-full border border-[#262626] bg-[#171717] px-4 pr-10 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]"
            >
              <option value="Party and nightlife" className="bg-[#171717] text-[#fafafa]">Party and nightlife</option>
              <option value="Tech" className="bg-[#171717] text-[#fafafa]">Tech</option>
              <option value="Dinner" className="bg-[#171717] text-[#fafafa]">Dinner</option>
              <option value="Workshop" className="bg-[#171717] text-[#fafafa]">Workshop</option>
              <option value="Sports" className="bg-[#171717] text-[#fafafa]">Sports</option>
              <option value="Religious" className="bg-[#171717] text-[#fafafa]">Religious</option>
              <option value="Hackathon" className="bg-[#171717] text-[#fafafa]">Hackathon</option>
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>

        {/* ── DATE / TIME / VENUE ────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#fafafa]">Event Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#fafafa]">Start Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#fafafa]">Venue / Location</label>
          <input type="text" placeholder="e.g. Main Auditorium, OOU Ago-Iwoye"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373]" />
        </div>

        {/* ── TICKET SETUP ───────────────────────────── */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-hidden shadow-sm">

          {/* Header */}
          <div className="border-b border-[#262626] px-6 py-4 bg-[#141414]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#fafafa]">Ticket Setup</h2>
            <p className="mt-0.5 text-[11px] text-[#9ca3af]">Choose ticket type and configure pricing tiers</p>
          </div>

          <div className="p-6">

            {/* TICKET MODE TOGGLE */}
            <div className="mb-6 grid grid-cols-3 gap-1 rounded-full border border-[#262626] bg-[#171717] p-1">
              {(["free", "paid", "donation"] as TicketMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setTicketMode(mode);
                    setTickets([{ id: 1, name: "", price: "", capacity: "", description: "" }]);
                  }}
                  className={`rounded-full py-2 text-xs font-semibold capitalize transition-all ${
                    ticketMode === mode
                      ? "bg-[#262626] text-[#fafafa] shadow-sm"
                      : "text-[#737373] hover:text-[#fafafa]"
                  }`}
                >
                  {mode === "free" && "🎟 Free"}
                  {mode === "paid" && "💳 Paid"}
                  {mode === "donation" && "🤝 Donation"}
                </button>
              ))}
            </div>

            {/* MODE DESCRIPTION */}
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-xs font-medium ${modeConfig[ticketMode].bg} ${modeConfig[ticketMode].border} ${modeConfig[ticketMode].color}`}
            >
              {ticketMode === "free" && "Attendees can register at no cost. Great for community events, campus meetups, and open sessions."}
              {ticketMode === "paid" && "Set a price per ticket tier. You can add multiple categories like Regular, VIP, or VVIP with different prices."}
              {ticketMode === "donation" && "Attendees pay what they want. You can optionally set a suggested minimum donation amount."}
            </div>

            {/* COLUMN HEADERS */}
            <div
              className={`mb-2 hidden sm:grid gap-2 px-1 text-[10px] uppercase tracking-wider text-[#737373] ${
                ticketMode === "paid" ? "grid-cols-[1fr_120px_120px_100px_90px_36px]" : "grid-cols-[1fr_100px_36px]"
              }`}
            >
              <span>Category Name</span>
              {ticketMode === "paid" && <span>Price (₦)</span>}
              {ticketMode === "paid" && <span>Discount Price (₦)</span>}
              {ticketMode === "donation" && <span>Min. Amount (₦)</span>}
              <span>Capacity</span>
              {ticketMode === "paid" && <span>Valid (Days)</span>}
              <span />
            </div>

            {/* TICKET ROWS */}
            <div className="flex flex-col gap-3">
              {tickets.map((ticket, i) => (
                <div
                  key={ticket.id}
                  className={`grid items-end gap-3 sm:items-center sm:gap-2 rounded-2xl sm:rounded-none border border-[#262626] sm:border-none p-4 sm:p-0 bg-[#171717] sm:bg-transparent ${
                    ticketMode === "paid" ? "grid-cols-2 sm:grid-cols-[1fr_120px_120px_100px_90px_36px]" : "grid-cols-2 sm:grid-cols-[1fr_100px_36px]"
                  }`}
                >
                  {/* Category Name */}
                  <div className="col-span-2 sm:col-span-1">
                    <span className="mb-1 block text-[10px] text-[#737373] sm:hidden">Category Name</span>
                    <input
                      value={ticket.name}
                      onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                      placeholder={
                        ticketMode === "paid"
                          ? i === 0 ? "Regular" : i === 1 ? "VIP" : i === 2 ? "VVIP" : `Tier ${i + 1}`
                          : ticketMode === "donation"
                          ? "General Donation"
                          : "Free Entry"
                      }
                      className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-3.5 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373]"
                    />
                  </div>

                  {/* Price */}
                  {(ticketMode === "paid" || ticketMode === "donation") && (
                    <div>
                      <span className="mb-1 block text-[10px] text-[#737373] sm:hidden">
                        {ticketMode === "paid" ? "Price (₦)" : "Min. Amount (₦)"}
                      </span>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373]">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={ticket.price}
                          onChange={(e) => updateTicket(ticket.id, "price", e.target.value)}
                          placeholder="0.00"
                          className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] pl-7 pr-3 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Discount Price */}
                  {ticketMode === "paid" && (
                    <div>
                      <span className="mb-1 block text-[10px] text-[#737373] sm:hidden">
                        Discount Price (₦)
                      </span>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={ticket.discountPrice || ""}
                          onChange={(e) => updateTicket(ticket.id, "discountPrice", e.target.value)}
                          placeholder="Optional"
                          className="h-10 w-full rounded-full border border-emerald-800/40 bg-emerald-950/20 pl-7 pr-3 text-xs font-medium text-emerald-400 outline-none transition focus:border-emerald-700 placeholder-[#737373]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Capacity */}
                  <div>
                    <span className="mb-1 block text-[10px] text-[#737373] sm:hidden">Capacity</span>
                    <input
                      type="number"
                      min="1"
                      value={ticket.capacity}
                      onChange={(e) => updateTicket(ticket.id, "capacity", e.target.value)}
                      placeholder="100"
                      className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-3.5 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373]"
                    />
                  </div>

                  {/* Valid Days */}
                  {ticketMode === "paid" && (
                    <div>
                      <span className="mb-1 block text-[10px] text-[#737373] sm:hidden">
                        Valid (Days)
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={ticket.discountDays || ""}
                        onChange={(e) => updateTicket(ticket.id, "discountDays", e.target.value)}
                        placeholder="e.g. 5"
                        disabled={!ticket.discountPrice}
                        className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-2 text-center text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151] placeholder-[#737373] disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}

                  {/* Remove */}
                  <div className="flex justify-end sm:justify-center">
                    <button
                      onClick={() => removeTicket(ticket.id)}
                      disabled={tickets.length === 1}
                      className="flex h-10 w-full sm:w-9 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-[#9ca3af] transition hover:border-rose-900/40 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      <span className="mr-2 text-xs font-medium sm:hidden">Remove</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD TIER */}
            {ticketMode !== "free" && (
              <button
                onClick={addTicket}
                className="mt-4 flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#171717] px-4 py-2 text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
                Add another ticket tier
              </button>
            )}

            {/* LIVE PREVIEW */}
            {tickets.some((t) => t.name || t.capacity) && (
              <div className="mt-6 rounded-2xl border border-[#262626] bg-[#141414] p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-[#737373]">Live Preview</p>
                <div className="flex flex-col gap-2">
                  {tickets.filter((t) => t.name || t.capacity).map((t) => {
                    const hasDiscount = ticketMode === "paid" && t.discountPrice && parseFloat(t.discountPrice) >= 0;
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#171717] px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[#fafafa]">{t.name || (ticketMode === "free" ? "Free Entry" : ticketMode === "donation" ? "General Donation" : "Regular Ticket")}</p>
                            {hasDiscount && (
                              <span className="border border-emerald-800/40 bg-emerald-950/40 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                {t.discountDays ? `${t.discountDays}d discount` : "Discounted"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#9ca3af]">{t.capacity ? `${t.capacity} available` : "100 available"}</p>
                        </div>
                        <div className="text-right">
                          {ticketMode === "free" ? (
                            <span className="text-xs font-semibold text-emerald-400">Free</span>
                          ) : hasDiscount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#737373] line-through">
                                ₦{Number(t.price || 0).toLocaleString()}
                              </span>
                              <span className="text-xs font-semibold text-emerald-400">
                                ₦{Number(t.discountPrice).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-[#fafafa]">
                              {t.price ? `₦${Number(t.price).toLocaleString()}` : ticketMode === "donation" ? "Donation" : "₦0"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {publishingError && (
          <div className="rounded-2xl border border-rose-800/40 bg-rose-950/30 p-4 text-xs font-medium text-rose-400">
            ⚠️ {publishingError}
          </div>
        )}

        {/* ── ACTION BUTTONS ─────────────────────────── */}
        <div className="flex flex-col gap-3 pb-10 sm:flex-row">
          <button
            onClick={() => handlePublish(false)}
            disabled={publishing}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? "Publishing Event..." : "Publish Event"}
          </button>
          <button
            onClick={() => handlePublish(true)}
            disabled={publishing}
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
        </div>

      </div>

      {/* ── EVENT PUBLISHED MODAL ── */}
      {createdEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="flex w-full max-w-[500px] flex-col rounded-2xl border border-[#262626] bg-[#121212] p-7 shadow-2xl">
            
            {/* Header / Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-800/40 bg-emerald-950/40 text-emerald-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>

            <div className="text-center mb-6">
              <span className="inline-block rounded-full border border-emerald-800/40 bg-emerald-950/40 px-3 py-0.5 text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-2">
                Event is Live
              </span>
              <h3 className="text-xl font-bold tracking-tight text-[#fafafa]">
                {createdEvent.title}
              </h3>
              <p className="mt-1 text-xs text-[#9ca3af]">
                Your event has been published with a custom shareable link. Share it with your attendees to start selling tickets!
              </p>
            </div>

            {/* Copyable Link Input */}
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-medium text-[#fafafa]">
                Your Custom Event Link
              </label>
              <div className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#171717] p-1.5 focus-within:border-[#374151]">
                <input
                  type="text"
                  readOnly
                  value={createdEvent.url}
                  className="w-full bg-transparent px-3 text-xs font-medium text-[#fafafa] outline-none select-all truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-[#fafafa] text-[#0a0a0a] hover:bg-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="mb-6">
              <p className="mb-2 text-center text-xs text-[#9ca3af]">Share directly to:</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Get your tickets for ${createdEvent.title} on Swyft: ${createdEvent.url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full border border-emerald-800/40 bg-emerald-950/40 py-2.5 text-xs font-medium text-emerald-400 hover:bg-emerald-900/40 transition no-underline"
                >
                  <span>💬</span> WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your tickets for ${createdEvent.title} on Swyft!`)}&url=${encodeURIComponent(createdEvent.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full border border-[#262626] bg-[#171717] py-2.5 text-xs font-medium text-[#fafafa] hover:bg-[#202020] transition no-underline"
                >
                  <span className="font-bold">𝕏</span> Post
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/events/${createdEvent.slug}`}
                className="flex h-11 w-full items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] hover:bg-white transition no-underline"
              >
                View Live Event Page →
              </Link>
              <Link
                href="/organizer/events"
                className="flex h-11 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#9ca3af] hover:text-[#fafafa] hover:bg-[#202020] transition no-underline"
              >
                Go to My Events Dashboard
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
