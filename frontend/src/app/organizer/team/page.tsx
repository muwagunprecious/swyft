"use client";

import { useState } from "react";

type Role = "admin" | "scanner" | "manager";

interface Member {
  id: number;
  name: string;
  email: string;
  role: Role;
  event: string;
  addedOn: string;
  status: "active" | "pending";
}

const mockMembers: Member[] = [];

const roleColors: Record<Role, string> = {
  admin: "bg-purple-50 text-purple-600",
  manager: "bg-blue-50 text-blue-600",
  scanner: "bg-green-50 text-green-600",
};

const roleDesc: Record<Role, string> = {
  admin: "Full access — manage events, payouts, team",
  manager: "Can create events and view reports",
  scanner: "Can only verify/scan tickets at the gate",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("scanner");
  const [inviteEvent, setInviteEvent] = useState("All Events");

  const handleInvite = () => {
    if (!inviteName || !inviteEmail) return;
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        event: inviteEvent,
        addedOn: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        status: "pending",
      },
    ]);
    setShowInvite(false);
    setInviteName(""); setInviteEmail(""); setInviteRole("scanner"); setInviteEvent("All Events");
  };

  const removeMemember = (id: number) => setMembers((prev) => prev.filter((m) => m.id !== id));

  return (
    <div className="min-h-full bg-[#F2F3F5]">
      <div className="mx-auto max-w-[900px] px-6 py-8">

        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-[#9333ea]">Team</p>
            <h1 className="text-2xl font-black text-[#1a202c]">Access Managers</h1>
            <p className="mt-1 text-[13px] font-semibold text-gray-400">Invite people to help manage your events and verify tickets.</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#9333ea] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#7e22ce]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
            Invite Member
          </button>
        </div>

        {/* ROLE GUIDE */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {(Object.entries(roleDesc) as [Role, string][]).map(([role, desc]) => (
            <div key={role} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black capitalize ${roleColors[role]}`}>{role}</span>
              <p className="mt-2 text-[12px] font-semibold text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        {/* MEMBERS TABLE */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-[14px] font-black text-[#1a202c]">Team Members ({members.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3e8ff] text-[13px] font-black text-[#9333ea]">
                  {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-black text-[#1a202c]">{m.name}</p>
                    {m.status === "pending" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">Pending</span>
                    )}
                  </div>
                  <p className="text-[12px] font-semibold text-gray-400">{m.email} · {m.event}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black capitalize ${roleColors[m.role]}`}>{m.role}</span>
                <p className="shrink-0 text-[11px] font-semibold text-gray-400 hidden sm:block">{m.addedOn}</p>
                <button
                  onClick={() => removeMemember(m.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-[440px] rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-[16px] font-black text-[#1a202c]">Invite a Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Full Name</label>
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Ayomide Adekunle"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20 placeholder:text-gray-300" />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Email Address</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@university.edu.ng"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea] focus:ring-2 focus:ring-[#9333ea]/20 placeholder:text-gray-300" />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Role</label>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                  {(["scanner", "manager", "admin"] as Role[]).map((r) => (
                    <button key={r} onClick={() => setInviteRole(r)}
                      className={`rounded-lg py-2 text-[12px] font-bold capitalize transition ${inviteRole === r ? "bg-white text-[#1a202c] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] font-semibold text-gray-400">{roleDesc[inviteRole]}</p>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-bold text-[#1a202c]">Assigned Event</label>
                <select value={inviteEvent} onChange={(e) => setInviteEvent(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#F7F8FA] px-4 text-[14px] font-medium text-[#1a202c] outline-none transition focus:border-[#9333ea]">
                  <option>All Events</option>
                  <option>OOU Campus Tech Summit 2026</option>
                  <option>Faculty of Arts Dinner</option>
                  <option>Hack The Campus Hackathon</option>
                  <option>LASU Sports Festival</option>
                </select>
              </div>
              <button onClick={handleInvite} disabled={!inviteName || !inviteEmail}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#9333ea] text-[14px] font-bold text-white transition hover:bg-[#7e22ce] disabled:opacity-40 disabled:cursor-not-allowed">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
