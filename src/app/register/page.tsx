"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { universities } from "@/lib/swyft-data";

const roles = [
  { id: "STUDENT", label: "Student Attendee", desc: "Buy tickets, pay dues, and vote in campus events", icon: "🎓" },
  { id: "ORGANIZER", label: "Event Organizer", desc: "Create events, sell tickets, and manage check-ins", icon: "🎪" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>("STUDENT");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", matric: "", university: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) setLoginHref(`/login${search}`);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        ...form,
        role,
        matricNumber: form.matric || undefined,
        university: form.university || undefined,
      });

      const loginRes = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("otix_token", loginRes.data.token);
      localStorage.setItem("otix_user", JSON.stringify(loginRes.data.user));

      const userRole = loginRes.data.user.role;
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTarget = searchParams.get("redirect");
      const target = redirectTarget || (userRole === "ORGANIZER" ? "/organizer" : "/events");
      window.location.href = target;
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f7fa] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[480px] rounded-lg border border-[#e5e7eb] bg-white p-8 md:p-10 shadow-[rgba(40,44,53,0.1)_0px_1px_20px_0px]">
        
        {/* Brand Header */}
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
          Create an account
        </h1>
        <p className="text-[14px] text-[#6f7287] mb-6">
          {step === 0 ? "Step 1 of 2: Select how you will use Swyft" : "Step 2 of 2: Fill in your details"}
        </p>

        {error && (
          <div className="mb-5 rounded border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] font-medium text-[#d1410c]">
            {error}
          </div>
        )}

        {step === 0 ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              {roles.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#d1410c] bg-[#fff9f6] ring-1 ring-[#d1410c]"
                        : "border-[#dddae3] bg-white hover:border-[#39364f]"
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[15px] font-semibold text-[#39364f]">{r.label}</h4>
                        <span
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-[#d1410c] bg-[#d1410c]" : "border-[#dddae3]"
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#6f7287] mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-primary w-full !mt-6"
            >
              Continue &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Precious Ademuwagun"
                className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                Campus / University
              </label>
              <select
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                className="w-full h-11 px-3 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f] bg-white"
              >
                <option value="">Select your university...</option>
                {universities.filter(u => u !== "Others").map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>

            {role === "STUDENT" && (
              <div>
                <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                  Matriculation Number <span className="text-[12px] font-normal text-[#6f7287]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.matric}
                  onChange={(e) => setForm({ ...form, matric: e.target.value })}
                  placeholder="e.g. 210102010"
                  className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f]"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="btn-secondary !w-auto flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary !w-auto flex-1"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-[13px] text-[#6f7287]">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-[#d1410c] hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </main>
  );
}
