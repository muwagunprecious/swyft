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
    free: { label: "Free", color: "#12B76A", bg: "#f0fdf4", border: "#86efac" },
    paid: { label: "Paid", color: "#1565ff", bg: "#f0f4ff", border: "#c9d6ff" },
    donation: { label: "Donation", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
  };

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[780px] px-6 py-8">

        {/* BREADCRUMB */}
        <Link
          href="/organizer/events"
          className="mb-6 flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 no-underline transition hover:text-[#1a202c]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Go to My Events
        </Link>

        <h1 className="mb-8 text-2xl font-black uppercase tracking-tight text-[#1a202c]">
          Setup Your Event
        </h1>

        <div className="flex flex-col gap-6">

          {/* ── IMAGE UPLOAD ───────────────────────────── */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white transition-all ${dragOver ? "border-[#f05537] bg-[#fff3f0]" : "border-gray-200 hover:border-[#f05537] hover:bg-[#fff3f0]"}`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {preview ? (
              <>
                <img src={preview} alt="Banner" className="h-full max-h-[200px] w-full rounded-xl object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setBannerBase64(null); }}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 px-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-gray-400">
                  Click or drop files here to upload <span className="text-gray-300">(MAX: 5MB)</span>
                </p>
              </div>
            )}
          </div>

          {/* ── EVENT NAME ─────────────────────────────── */}
          <div>
            <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Event Name</label>
            <input type="text" placeholder="Enter event name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/20 placeholder:text-gray-300" />
          </div>

          {/* ── DESCRIPTION ────────────────────────────── */}
          <div>
            <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Event Description</label>
            <textarea placeholder="Describe your event" rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/20 placeholder:text-gray-300" />
          </div>

          {/* ── CATEGORY ───────────────────────────────── */}
          <div>
            <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/20"
            >
              <option value="Party and nightlife">Party and nightlife</option>
              <option value="Tech">Tech</option>
              <option value="Dinner">Dinner</option>
              <option value="Workshop">Workshop</option>
              <option value="Sports">Sports</option>
              <option value="Religious">Religious</option>
              <option value="Hackathon">Hackathon</option>
            </select>
          </div>

          {/* ── DATE / TIME / VENUE ────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Event Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/20" />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Start Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/20" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Venue / Location</label>
            <input type="text" placeholder="e.g. Main Auditorium, OOU Ago-Iwoye"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:ring-2 focus:ring-[#f05537]/20 placeholder:text-gray-300" />
          </div>

          {/* ── TICKET SETUP ───────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">

            {/* Header */}
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-[14px] font-black uppercase tracking-wide text-[#1a202c]">Ticket Setup</h2>
              <p className="mt-0.5 text-[12px] font-semibold text-gray-400">Choose ticket type and add pricing tiers</p>
            </div>

            <div className="px-5 py-5">

              {/* TICKET MODE TOGGLE */}
              <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                {(["free", "paid", "donation"] as TicketMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTicketMode(mode);
                      // Reset tickets to default single row
                      setTickets([{ id: 1, name: "", price: "", capacity: "", description: "" }]);
                    }}
                    className={`rounded-lg py-2.5 text-[13px] font-bold capitalize transition-all ${
                      ticketMode === mode
                        ? "bg-white text-[#1a202c] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
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
                className="mb-5 rounded-lg border px-4 py-3 text-[12px] font-semibold"
                style={{
                  background: modeConfig[ticketMode].bg,
                  borderColor: modeConfig[ticketMode].border,
                  color: modeConfig[ticketMode].color,
                }}
              >
                {ticketMode === "free" && "Attendees can register at no cost. Great for community events, campus meetups, and open sessions."}
                {ticketMode === "paid" && "Set a price per ticket tier. You can add multiple categories like Regular, VIP, or VVIP with different prices."}
                {ticketMode === "donation" && "Attendees pay what they want. You can optionally set a suggested minimum donation amount."}
              </div>

              {/* COLUMN HEADERS */}
              <div
                className={`mb-2 hidden sm:grid gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-gray-400 ${
                  ticketMode === "paid" ? "grid-cols-[1fr_130px_130px_110px_90px_36px]" : "grid-cols-[1fr_110px_36px]"
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
              <div className="flex flex-col gap-4 sm:gap-2">
                {tickets.map((ticket, i) => (
                  <div
                    key={ticket.id}
                    className={`grid items-end gap-3 sm:items-center sm:gap-2 rounded-xl sm:rounded-none border border-gray-100 sm:border-none p-3 sm:p-0 bg-gray-50 sm:bg-transparent ${
                      ticketMode === "paid" ? "grid-cols-2 sm:grid-cols-[1fr_130px_130px_110px_90px_36px]" : "grid-cols-2 sm:grid-cols-[1fr_110px_36px]"
                    }`}
                  >
                    {/* Category Name */}
                    <div className="col-span-2 sm:col-span-1">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase text-gray-400 sm:hidden">Category Name</span>
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
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white sm:bg-[#F7F8FA] px-3 text-[13px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:bg-white placeholder:text-gray-300"
                      />
                    </div>

                    {/* Price — only for paid/donation */}
                    {(ticketMode === "paid" || ticketMode === "donation") && (
                      <div>
                        <span className="mb-1.5 block text-[10px] font-bold uppercase text-gray-400 sm:hidden">
                          {ticketMode === "paid" ? "Price (₦)" : "Min. Amount (₦)"}
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">₦</span>
                          <input
                            type="number"
                            min="0"
                            value={ticket.price}
                            onChange={(e) => updateTicket(ticket.id, "price", e.target.value)}
                            placeholder={ticketMode === "donation" ? "0" : "0.00"}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white sm:bg-[#F7F8FA] pl-7 pr-3 text-[13px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:bg-white placeholder:text-gray-300"
                          />
                        </div>
                      </div>
                    )}

                    {/* Optional Discount Price — only for paid */}
                    {ticketMode === "paid" && (
                      <div>
                        <span className="mb-1.5 block text-[10px] font-bold uppercase text-gray-400 sm:hidden">
                          Discount Price (₦)
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-emerald-600">₦</span>
                          <input
                            type="number"
                            min="0"
                            value={ticket.discountPrice || ""}
                            onChange={(e) => updateTicket(ticket.id, "discountPrice", e.target.value)}
                            placeholder="Optional"
                            className="h-10 w-full rounded-lg border border-emerald-200 bg-white sm:bg-emerald-50/20 pl-7 pr-3 text-[13px] font-medium text-emerald-700 outline-none transition focus:border-emerald-500 focus:bg-white placeholder:text-gray-300"
                          />
                        </div>
                      </div>
                    )}

                    {/* Capacity */}
                    <div>
                      <span className="mb-1.5 block text-[10px] font-bold uppercase text-gray-400 sm:hidden">Capacity</span>
                      <input
                        type="number"
                        min="1"
                        value={ticket.capacity}
                        onChange={(e) => updateTicket(ticket.id, "capacity", e.target.value)}
                        placeholder="100"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white sm:bg-[#F7F8FA] px-3 text-[13px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:bg-white placeholder:text-gray-300"
                      />
                    </div>

                    {/* Discount Valid Days — only for paid */}
                    {ticketMode === "paid" && (
                      <div>
                        <span className="mb-1.5 block text-[10px] font-bold uppercase text-gray-400 sm:hidden">
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
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white sm:bg-[#F7F8FA] px-2 text-center text-[13px] font-medium text-[#1a202c] outline-none transition focus:border-[#f05537] focus:bg-white placeholder:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Remove */}
                    <div className="flex justify-end sm:justify-center">
                      <button
                        onClick={() => removeTicket(ticket.id)}
                        disabled={tickets.length === 1}
                        className="flex h-10 w-full sm:w-9 items-center justify-center rounded-lg border border-red-100 sm:border-gray-100 bg-red-50 sm:bg-transparent text-red-500 sm:text-gray-300 transition hover:border-red-200 hover:bg-red-50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-20 disabled:bg-gray-100 disabled:border-gray-100 disabled:text-gray-300"
                      >
                        <span className="mr-2 text-xs font-bold sm:hidden">Remove</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ADD TIER — only meaningful for paid */}
              {ticketMode !== "free" && (
                <button
                  onClick={addTicket}
                  className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#f05537] transition hover:opacity-70"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
                  Add another ticket tier
                </button>
              )}

              {/* LIVE PREVIEW */}
              {tickets.some((t) => t.name || t.capacity) && (
                <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</p>
                  <div className="flex flex-col gap-2">
                    {tickets.filter((t) => t.name || t.capacity).map((t) => {
                      const hasDiscount = ticketMode === "paid" && t.discountPrice && parseFloat(t.discountPrice) >= 0;
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 border border-gray-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-bold text-[#1a202c]">{t.name || (ticketMode === "free" ? "Free Entry" : ticketMode === "donation" ? "General Donation" : "Regular Ticket")}</p>
                              {hasDiscount && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {t.discountDays ? `${t.discountDays} days discount` : "Discounted"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-gray-400">{t.capacity ? `${t.capacity} available` : "100 available"}</p>
                          </div>
                          <div className="text-right">
                            {ticketMode === "free" ? (
                              <span className="text-[13px] font-black" style={{ color: modeConfig[ticketMode].color }}>Free</span>
                            ) : hasDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] text-gray-400 line-through font-semibold">
                                  ₦{Number(t.price || 0).toLocaleString()}
                                </span>
                                <span className="text-[14px] font-black text-emerald-600">
                                  ₦{Number(t.discountPrice).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span
                                className="text-[13px] font-black"
                                style={{ color: modeConfig[ticketMode].color }}
                              >
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
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-600">
              ⚠️ {publishingError}
            </div>
          )}

          {/* ── ACTION BUTTONS ─────────────────────────── */}
          <div className="flex flex-col gap-3 pb-10 sm:flex-row">
            <button
              onClick={() => handlePublish(false)}
              disabled={publishing}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#f05537] hover:bg-[#d1410c] text-[14px] font-bold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "Publishing Event..." : "Publish Event"}
            </button>
            <button
              onClick={() => handlePublish(true)}
              disabled={publishing}
              className="flex h-12 flex-1 items-center justify-center rounded-full border border-gray-200 bg-white text-[14px] font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
          </div>

        </div>
      </div>

      {/* ── EVENT PUBLISHED MODAL (COPYABLE TITLE LINK) ── */}
      {createdEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="flex w-full max-w-[500px] flex-col rounded-3xl bg-white p-7 shadow-2xl">
            
            {/* Header / Celebration Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 text-[#d1410c]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>

            <div className="text-center mb-6">
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-wider px-3 py-1 mb-2">
                Event is Live!
              </span>
              <h3 className="text-2xl font-black text-[#1a202c]">
                {createdEvent.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                Your event has been published with a custom shareable link. Share it with your attendees to start selling tickets!
              </p>
            </div>

            {/* Copyable Link Input */}
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">
                Your Custom Event Link
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 focus-within:border-[#d1410c] focus-within:ring-2 focus-within:ring-[#d1410c]/10">
                <input
                  type="text"
                  readOnly
                  value={createdEvent.url}
                  className="w-full bg-transparent px-2 text-xs font-mono font-bold text-gray-700 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    copied
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : "bg-[#d1410c] hover:bg-[#b03507] text-white shadow-md shadow-orange-500/10"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="mb-6">
              <p className="mb-2 text-center text-xs font-bold text-gray-400">Share directly to:</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Get your tickets for ${createdEvent.title} on Swyft: ${createdEvent.url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition no-underline"
                >
                  <span>💬</span> WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your tickets for ${createdEvent.title} on Swyft!`)}&url=${encodeURIComponent(createdEvent.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50/50 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition no-underline"
                >
                  <span>🐦</span> X / Twitter
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/events/${createdEvent.slug}`}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-gray-900 hover:bg-black text-sm font-black text-white transition no-underline"
              >
                View Live Event Page →
              </Link>
              <Link
                href="/organizer/events"
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition no-underline"
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
