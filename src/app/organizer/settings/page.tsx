"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { universities } from "@/lib/swyft-data";

type ToastType = "success" | "error";

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl text-xs font-semibold backdrop-blur-md transition-all ${
      type === "success"
        ? "border-emerald-800/60 bg-[#121212]/95 text-emerald-400 shadow-emerald-950/40"
        : "border-rose-800/60 bg-[#121212]/95 text-rose-400 shadow-rose-950/40"
    }`}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 shadow-sm space-y-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#fafafa]">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });

  // Load real user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("otix_token");
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = res.data.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setUniversity(u.university || "");
      } catch {
        // Fallback to localStorage
        const stored = localStorage.getItem("otix_user");
        if (stored) {
          const u = JSON.parse(stored);
          setName(u.name || "");
          setEmail(u.email || "");
          setPhone(u.phone || "");
          setUniversity(u.university || "");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) { showToast("Full name is required", "error"); return; }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("otix_token");
      const res = await api.patch("/auth/profile",
        { name, phone, university },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update localStorage so the sidebar name refreshes
      const stored = localStorage.getItem("otix_user");
      if (stored) {
        const u = JSON.parse(stored);
        u.name = res.data.user.name;
        u.phone = res.data.user.phone;
        u.university = res.data.user.university;
        localStorage.setItem("otix_user", JSON.stringify(u));
      }
      showToast("Profile saved successfully!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required", "error"); return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error"); return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters", "error"); return;
    }
    setSavingPassword(true);
    try {
      const token = localStorage.getItem("otix_token");
      await api.post("/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Password changed successfully!", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const eyeIcon = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#fafafa] transition"
    >
      {show ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#262626] border-t-[#fafafa]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 max-w-2xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <span className="inline-block rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-[11px] font-medium tracking-wide text-[#9ca3af] uppercase">
          Account
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#fafafa]">Settings</h1>
        <p className="mt-1 text-xs text-[#9ca3af]">
          Manage your organizer profile and account security settings.
        </p>
      </div>

      {/* ── PROFILE ── */}
      <Section title="Profile Information">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-4 border-b border-[#262626]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-base font-bold text-[#fafafa]">
            {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#fafafa]">{name || "Your Name"}</p>
            <p className="text-xs text-[#9ca3af]">{email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Full Name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Email Address">
              <input
                value={email}
                disabled
                className="h-10 w-full rounded-full border border-[#202020] bg-[#141414] px-4 text-xs font-medium text-[#737373] cursor-not-allowed outline-none"
              />
              <p className="mt-1 text-[11px] text-[#737373]">Email cannot be changed directly.</p>
            </Field>
          </div>
          <Field label="Phone Number">
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="080xxxxxxxx"
              className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
            />
          </Field>
          <Field label="University / Campus">
            <div className="relative">
              <select
                value={university}
                onChange={e => setUniversity(e.target.value)}
                className="h-10 w-full appearance-none rounded-full border border-[#262626] bg-[#171717] px-4 pr-10 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#374151]"
              >
                <option value="">Select university…</option>
                {universities.filter(u => u !== "Others").map(u => <option key={u} value={u} className="bg-[#171717] text-[#fafafa]">{u}</option>)}
                <option value="Others" className="bg-[#171717] text-[#fafafa]">Others</option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </div>
          </Field>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="mt-2 flex h-10 w-full items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingProfile ? "Saving…" : "Save Profile"}
        </button>
      </Section>

      {/* ── PASSWORD ── */}
      <Section title="Change Password">
        <Field label="Current Password">
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 pr-10 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
            />
            {eyeIcon(showCurrent, () => setShowCurrent(v => !v))}
          </div>
        </Field>
        <Field label="New Password">
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-10 w-full rounded-full border border-[#262626] bg-[#171717] px-4 pr-10 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition focus:border-[#374151]"
            />
            {eyeIcon(showNew, () => setShowNew(v => !v))}
          </div>
        </Field>
        <Field label="Confirm New Password">
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className={`h-10 w-full rounded-full border bg-[#171717] px-4 text-xs font-medium text-[#fafafa] placeholder-[#737373] outline-none transition ${
              confirmPassword && confirmPassword !== newPassword ? "border-rose-500" : "border-[#262626] focus:border-[#374151]"
            }`}
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-1 text-[11px] font-medium text-rose-400">Passwords do not match</p>
          )}
        </Field>

        <button
          onClick={handleChangePassword}
          disabled={savingPassword}
          className="flex h-10 w-full items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-semibold text-[#fafafa] transition hover:bg-[#202020] hover:border-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingPassword ? "Updating…" : "Change Password"}
        </button>
      </Section>

      {/* ── DANGER ZONE ── */}
      <Section title="Account Actions">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#fafafa]">Sign out of your account</p>
            <p className="mt-0.5 text-[11px] text-[#9ca3af]">You will need your credentials to sign back into this workspace.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("otix_token");
              localStorage.removeItem("otix_user");
              window.location.href = "/login";
            }}
            className="rounded-full border border-rose-800/40 bg-rose-950/30 px-5 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-900/40 shrink-0"
          >
            Sign Out
          </button>
        </div>
      </Section>
    </div>
  );
}
