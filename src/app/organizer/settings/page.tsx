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
    <div style={{
      position: "fixed", top: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      background: type === "success" ? "#f0fdf4" : "#fef2f2",
      border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
      color: type === "success" ? "#15803d" : "#dc2626",
      padding: "14px 18px", borderRadius: "14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)", fontWeight: 700, fontSize: "0.88rem",
      animation: "slideIn 0.25s ease",
      maxWidth: "360px",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{type === "success" ? "✅" : "❌"}</span>
      {message}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "20px", border: "1px solid #e5e7eb",
      padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      marginBottom: "20px",
    }}>
      <h2 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9333ea", marginBottom: "20px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "7px" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "12px",
  border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: "0.9rem",
  color: "#111827", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.15s",
};

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
    <button type="button" onClick={toggle} style={{
      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px",
    }}>
      {show ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #e5e7eb", borderTopColor: "#9333ea", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#6b7280", fontWeight: 600, fontSize: "0.875rem" }}>Loading your settings…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8f7fc", minHeight: "100%", padding: "32px 24px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9333ea", marginBottom: "6px" }}>Account</p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1a0a2e", letterSpacing: "-0.03em" }}>Settings</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "4px" }}>Manage your profile and account preferences.</p>
        </div>

        {/* ── PROFILE ── */}
        <Section title="Profile Information">
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
              border: "2px solid #d8b4fe",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", fontWeight: 900, color: "#9333ea",
            }}>
              {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
            </div>
            <div>
              <p style={{ fontWeight: 800, color: "#111827", fontSize: "0.95rem" }}>{name || "Your Name"}</p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "2px" }}>{email}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Full Name">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
              </Field>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Email Address">
                <input value={email} disabled style={{ ...inputStyle, background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }} />
                <p style={{ fontSize: "0.73rem", color: "#9ca3af", marginTop: "5px", fontWeight: 500 }}>Email cannot be changed here.</p>
              </Field>
            </div>
            <Field label="Phone Number">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="080xxxxxxxx" style={inputStyle} />
            </Field>
            <Field label="University / Campus">
              <div style={{ position: "relative" }}>
                <select value={university} onChange={e => setUniversity(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: "36px" }}>
                  <option value="">Select university…</option>
                  {universities.filter(u => u !== "Others").map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="Others">Others</option>
                </select>
                <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
            </Field>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={{
              marginTop: "8px", width: "100%", padding: "13px", borderRadius: "12px", border: "none",
              background: savingProfile ? "#e5e7eb" : "linear-gradient(135deg, #9333ea, #7e22ce)",
              color: savingProfile ? "#9ca3af" : "#fff",
              fontWeight: 800, fontSize: "0.9rem", cursor: savingProfile ? "default" : "pointer",
              boxShadow: savingProfile ? "none" : "0 4px 16px rgba(147,51,234,0.35)",
              transition: "all 0.2s",
            }}
          >
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </Section>

        {/* ── PASSWORD ── */}
        <Section title="Change Password">
          <Field label="Current Password">
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: "40px" }}
              />
              {eyeIcon(showCurrent, () => setShowCurrent(v => !v))}
            </div>
          </Field>
          <Field label="New Password">
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{ ...inputStyle, paddingRight: "40px" }}
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
              style={{
                ...inputStyle,
                borderColor: confirmPassword && confirmPassword !== newPassword ? "#fca5a5" : inputStyle.borderColor,
              }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p style={{ fontSize: "0.73rem", color: "#ef4444", marginTop: "5px", fontWeight: 600 }}>Passwords do not match</p>
            )}
          </Field>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px", border: "none",
              background: savingPassword ? "#e5e7eb" : "linear-gradient(135deg, #1e0a3c, #3b0764)",
              color: savingPassword ? "#9ca3af" : "#fff",
              fontWeight: 800, fontSize: "0.9rem", cursor: savingPassword ? "default" : "pointer",
              boxShadow: savingPassword ? "none" : "0 4px 16px rgba(30,10,60,0.3)",
              transition: "all 0.2s",
            }}
          >
            {savingPassword ? "Changing…" : "Change Password"}
          </button>
        </Section>

        {/* ── DANGER ZONE ── */}
        <Section title="Danger Zone">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>Sign out of your account</p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "2px" }}>You'll need your credentials to sign back in.</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("otix_token");
                localStorage.removeItem("otix_user");
                window.location.href = "/login";
              }}
              style={{
                padding: "10px 22px", borderRadius: "10px", border: "1.5px solid #fecaca",
                background: "#fff5f5", color: "#dc2626", fontWeight: 700,
                fontSize: "0.85rem", cursor: "pointer", transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              Sign Out
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
