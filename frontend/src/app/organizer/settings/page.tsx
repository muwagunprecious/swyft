"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("SWYFT Admin");
  const [email, setEmail] = useState("admin@swyft.africa");
  const [phone, setPhone] = useState("08012345678");
  const [orgName, setOrgName] = useState("Campus Ops HQ");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[680px] px-6 py-8">
        <div className="mb-8">
          <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">Settings</p>
          <h1 className="text-2xl font-black text-[#1a202c]">My Account</h1>
          <p className="mt-1 text-[13px] font-semibold text-gray-400">Manage your profile and account preferences.</p>
        </div>

        {/* Profile */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-[14px] font-black uppercase tracking-wide text-[#1a202c]">Profile</h2>

          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8ff] text-xl font-black text-[#9333ea]">
              {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <button className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[12px] font-bold text-gray-600 transition hover:bg-gray-50">
                Upload Photo
              </button>
              <p className="mt-1 text-[11px] font-semibold text-gray-400">JPG, PNG or GIF · Max 2MB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Full Name", value: name, setter: setName },
              { label: "Organisation / Brand Name", value: orgName, setter: setOrgName },
              { label: "Email Address", value: email, setter: setEmail },
              { label: "Phone Number", value: phone, setter: setPhone },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">{label}</label>
                <input value={value} onChange={(e) => setter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Password */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-[14px] font-black uppercase tracking-wide text-[#1a202c]">Change Password</h2>
          <div className="grid gap-4">
            {["Current Password", "New Password", "Confirm New Password"].map((label) => (
              <div key={label}>
                <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">{label}</label>
                <input type="password" placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20 placeholder:text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-[14px] font-black uppercase tracking-wide text-[#1a202c]">Notifications</h2>
          <div className="flex flex-col gap-4">
            {[
              ["Email me on ticket sale", true],
              ["Email me on payout processed", true],
              ["SMS alerts for check-in", false],
              ["Weekly earnings summary", true],
            ].map(([label, def]) => (
              <label key={String(label)} className="flex cursor-pointer items-center justify-between">
                <span className="text-[13px] font-semibold text-gray-700">{String(label)}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked={Boolean(def)} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-gray-200 transition peer-checked:bg-[#9333ea]" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white transition ${saved ? "bg-[#12B76A]" : "bg-[#9333ea] hover:bg-[#7e22ce]"}`}>
          {saved ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg> Saved!</>
          ) : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
