"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setMessage(res.data.message || "A 6-digit verification code has been sent to your email.");
      setStep("reset");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send reset code. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setMessage(res.data.message || "Password reset successful! You can now log in.");
      setStep("success");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to reset password. Please verify the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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

        {error && (
          <div className="mb-5 rounded border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] font-medium text-[#d1410c]">
            {error}
          </div>
        )}

        {message && step !== "success" && (
          <div className="mb-5 rounded border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-[13px] font-medium text-[#15803d]">
            {message}
          </div>
        )}

        {/* STEP 1: REQUEST CODE */}
        {step === "request" && (
          <div>
            <h1 className="text-[24px] font-semibold text-[#39364f] mb-1 tracking-tight">
              Forgot password?
            </h1>
            <p className="text-[14px] text-[#6f7287] mb-6">
              Enter your registered email address and we&apos;ll send you a 6-digit code to reset your password.
            </p>

            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !mt-6"
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: ENTER CODE & NEW PASSWORD */}
        {step === "reset" && (
          <div>
            <h1 className="text-[24px] font-semibold text-[#39364f] mb-1 tracking-tight">
              Reset your password
            </h1>
            <p className="text-[14px] text-[#6f7287] mb-6">
              Enter the 6-digit code sent to <strong className="text-[#39364f]">{email}</strong> and set your new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full h-12 px-3.5 text-center text-[22px] tracking-[8px] font-mono font-bold rounded border border-[#dddae3] text-[#39364f] outline-none focus:border-[#d1410c] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-[#39364f]">
                    New Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              <div>
                <label className="block text-[13px] font-semibold text-[#39364f] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full h-11 px-3.5 rounded border border-[#dddae3] text-[14px] text-[#39364f] outline-none focus:border-[#39364f] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !mt-6"
              >
                {loading ? "Resetting Password..." : "Update Password"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setError("");
                    setMessage("");
                  }}
                  className="text-[13px] font-medium text-[#d1410c] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Didn&apos;t get the code? Request again
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "success" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0fdf4] text-[#15803d]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-[#39364f] mb-2">
              Password Reset!
            </h1>
            <p className="text-[14px] text-[#6f7287] mb-8 leading-relaxed">
              Your password has been changed successfully. You can now log into your account with your new credentials.
            </p>
            <Link
              href="/login"
              className="btn-primary w-full block text-center no-underline"
            >
              Back to Log In
            </Link>
          </div>
        )}

        <p className="mt-8 text-center text-[13px] text-[#6f7287] border-t border-[#e5e7eb] pt-6">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-[#d1410c] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
