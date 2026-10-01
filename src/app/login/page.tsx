"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { universities } from "@/lib/swyft-data";

function UniversityPopup({ onSave, onSkip }: { onSave: (uni: string) => void; onSkip: () => void }) {
  const [selectedUni, setSelectedUni] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedUni) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("otix_token");
      await api.patch("/auth/profile", { university: selectedUni }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stored = localStorage.getItem("otix_user");
      if (stored) {
        const user = JSON.parse(stored);
        user.university = selectedUni;
        localStorage.setItem("otix_user", JSON.stringify(user));
      }
      onSave(selectedUni);
    } catch {
      const stored = localStorage.getItem("otix_user");
      if (stored) {
        const user = JSON.parse(stored);
        user.university = selectedUni;
        localStorage.setItem("otix_user", JSON.stringify(user));
      }
      onSave(selectedUni);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#e5e7eb] bg-white p-8 shadow-xl">
        <h2 className="text-[21px] font-semibold text-[#39364f] mb-2">
          Select your campus
        </h2>
        <p className="text-[14px] text-[#6f7287] mb-6">
          Personalize your event discovery and student ticketing experience.
        </p>

        <select
          value={selectedUni}
          onChange={(e) => setSelectedUni(e.target.value)}
          className="w-full h-11 px-3 mb-6 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f]"
        >
          <option value="">Select your university...</option>
          {universities.filter(u => u !== "Others").map((uni) => (
            <option key={uni} value={uni}>{uni}</option>
          ))}
        </select>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onSkip} className="btn-secondary !min-h-[40px] !min-w-[100px] !text-[13px]">
            Skip
          </button>
          <button onClick={handleSave} disabled={saving || !selectedUni} className="btn-primary !min-h-[40px] !min-w-[120px] !text-[13px]">
            {saving ? "Saving..." : "Save Campus"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerHref, setRegisterHref] = useState("/register");
  const [showUniPopup, setShowUniPopup] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState("/events");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) setRegisterHref(`/register${search}`);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("otix_token", res.data.token);
      localStorage.setItem("otix_user", JSON.stringify(res.data.user));

      const userRole = res.data.user.role;
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTarget = searchParams.get("redirect");
      const target = redirectTarget || (userRole === "ORGANIZER" ? "/organizer" : userRole === "ADMIN" ? "/admin" : "/events");

      if (!res.data.user.university) {
        setPendingRedirect(target);
        setShowUniPopup(true);
        setLoading(false);
      } else {
        window.location.href = target;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <>
      {showUniPopup && (
        <UniversityPopup
          onSave={() => (window.location.href = pendingRedirect)}
          onSkip={() => (window.location.href = pendingRedirect)}
        />
      )}

      <main className="min-h-screen bg-[#f8f7fa] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[440px] rounded-lg border border-[#e5e7eb] bg-white p-8 md:p-10 shadow-[rgba(40,44,53,0.1)_0px_1px_20px_0px]">
          
          {/* Logo Header */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="inline-flex items-center gap-2 no-underline">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[#d1410c] text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="text-[20px] font-bold text-[#d1410c] tracking-tight">swyft</span>
            </Link>
          </div>

          <h1 className="text-[24px] font-semibold text-[#39364f] mb-1 tracking-tight">
            Log in
          </h1>
          <p className="text-[14px] text-[#6f7287] mb-6">
            Enter your email and password to access your account.
          </p>

          {error && (
            <div className="mb-5 rounded border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] font-medium text-[#d1410c]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@email.com"
                className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold text-[#39364f]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[12px] font-semibold text-[#d1410c] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 pr-10 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f7287] hover:text-[#39364f] border-none bg-transparent cursor-pointer p-0"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !mt-6"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-[#6f7287]">
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="font-semibold text-[#d1410c] hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </main>
    </>
  );
}
