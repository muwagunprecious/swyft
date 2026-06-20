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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));

    // Convert file to base64 for backend storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerBase64(reader.result as string);
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
      };
    });

    try {
      await api.post("/events", {
        title: title.trim(),
        description: description.trim(),
        bannerImage: bannerBase64 || preview || undefined,
        date: dateTimeStr,
        location: location.trim(),
        category,
        tickets: formattedTickets,
        status: isDraft ? "DRAFT" : "PUBLISHED"
      });

      // Redirect back to events list
      router.push("/organizer/events");
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
                  ticketMode === "paid" ? "grid-cols-[1fr_140px_110px_36px]" : "grid-cols-[1fr_110px_36px]"
                }`}
              >
                <span>Category Name</span>
                {ticketMode === "paid" && <span>Price (₦)</span>}
                {ticketMode === "donation" && <span>Min. Amount (₦)</span>}
                <span>Capacity</span>
                <span />
              </div>

              {/* TICKET ROWS */}
              <div className="flex flex-col gap-4 sm:gap-2">
                {tickets.map((ticket, i) => (
                  <div
                    key={ticket.id}
                    className={`grid items-end gap-3 sm:items-center sm:gap-2 rounded-xl sm:rounded-none border border-gray-100 sm:border-none p-3 sm:p-0 bg-gray-50 sm:bg-transparent ${
                      ticketMode === "paid" ? "grid-cols-2 sm:grid-cols-[1fr_140px_110px_36px]" : "grid-cols-2 sm:grid-cols-[1fr_110px_36px]"
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
                    {tickets.filter((t) => t.name || t.capacity).map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 border border-gray-100">
                        <div>
                          <p className="text-[13px] font-bold text-[#1a202c]">{t.name || (ticketMode === "free" ? "Free Entry" : ticketMode === "donation" ? "General Donation" : "Regular Ticket")}</p>
                          <p className="text-[11px] font-semibold text-gray-400">{t.capacity ? `${t.capacity} available` : "100 available"}</p>
                        </div>
                        <span
                          className="text-[13px] font-black"
                          style={{ color: modeConfig[ticketMode].color }}
                        >
                          {ticketMode === "free"
                            ? "Free"
                            : t.price
                            ? `₦${Number(t.price).toLocaleString()}`
                            : ticketMode === "donation" ? "Donation" : "₦0"}
                        </span>
                      </div>
                    ))}
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
    </div>
  );
}
