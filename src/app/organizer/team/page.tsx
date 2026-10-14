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
  admin: "border border-purple-800/40 bg-purple-950/40 text-purple-400",
  manager: "border border-blue-800/40 bg-blue-950/40 text-blue-400",
  scanner: "border border-emerald-800/40 bg-emerald-950/40 text-emerald-400",
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
    <div className="space-y-6 pt-2">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#fafafa] tracking-tight">Access Managers</h1>
          <p className="text-xs font-medium text-[#9ca3af] mt-0.5">Invite team members to manage your events and verify tickets at the gate.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-[#fafafa] px-5 py-2 text-xs font-semibold text-[#0a0a0a] shadow-sm transition hover:bg-white cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
          Invite Member
        </button>
      </div>

      {/* ROLE GUIDE */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.entries(roleDesc) as [Role, string][]).map(([role, desc]) => (
          <div key={role} className="rounded-2xl border border-[#262626] bg-[#121212] p-4 transition hover:border-[#374151]">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize border ${roleColors[role]}`}>{role}</span>
            <p className="mt-2 text-xs font-medium text-[#9ca3af] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* MEMBERS TABLE */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-hidden">
        <div className="border-b border-[#262626] px-6 py-4">
          <h2 className="text-xs font-bold text-[#fafafa]">Team Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-[#262626]/60">
          {members.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-[#9ca3af]">
              No team members added yet. Click &quot;Invite Member&quot; to grant access to your event team.
            </div>
          ) : members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-[#171717]/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] border border-[#262626] text-xs font-bold text-[#fafafa]">
                {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-[#fafafa]">{m.name}</p>
                  {m.status === "pending" && (
                    <span className="rounded-full border border-amber-800/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-400">Pending</span>
                  )}
                </div>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">{m.email} · {m.event}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize border ${roleColors[m.role]}`}>{m.role}</span>
              <p className="shrink-0 text-[11px] text-[#9ca3af] hidden sm:block">{m.addedOn}</p>
              <button
                onClick={() => removeMemember(m.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-[#9ca3af] transition hover:border-rose-800/40 hover:bg-rose-950/40 hover:text-rose-400 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-[440px] rounded-2xl border border-[#262626] bg-[#121212] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#262626] px-6 py-5">
              <h2 className="text-base font-bold text-[#fafafa]">Invite a Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-[#9ca3af] hover:text-[#fafafa] hover:border-[#374151] cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#fafafa]">Full Name</label>
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Ayomide Adekunle"
                  className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280]" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[#fafafa]">Email Address</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@university.edu.ng"
                  className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#fafafa] placeholder:text-[#6b7280]" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[#fafafa]">Role</label>
                <div className="grid grid-cols-3 gap-2 rounded-full border border-[#262626] bg-[#171717] p-1">
                  {(["scanner", "manager", "admin"] as Role[]).map((r) => (
                    <button key={r} onClick={() => setInviteRole(r)}
                      className={`rounded-full py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${inviteRole === r ? "bg-[#fafafa] text-[#0a0a0a] shadow-sm" : "text-[#9ca3af] hover:text-[#fafafa]"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] font-medium text-[#9ca3af]">{roleDesc[inviteRole]}</p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[#fafafa]">Assigned Event</label>
                <select value={inviteEvent} onChange={(e) => setInviteEvent(e.target.value)}
                  className="h-11 w-full rounded-full border border-[#262626] bg-[#171717] px-4 text-xs font-medium text-[#fafafa] outline-none transition focus:border-[#fafafa]">
                  <option className="bg-[#171717] text-[#fafafa]">All Events</option>
                  <option className="bg-[#171717] text-[#fafafa]">OOU Campus Tech Summit 2026</option>
                  <option className="bg-[#171717] text-[#fafafa]">Faculty of Arts Dinner</option>
                  <option className="bg-[#171717] text-[#fafafa]">Hack The Campus Hackathon</option>
                  <option className="bg-[#171717] text-[#fafafa]">LASU Sports Festival</option>
                </select>
              </div>
              <button onClick={handleInvite} disabled={!inviteName || !inviteEmail}
                className="flex h-11 w-full items-center justify-center rounded-full bg-[#fafafa] text-xs font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
