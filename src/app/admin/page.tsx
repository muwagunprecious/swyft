"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

// Helper for formatting currencies
const formatNaira = (amount: number) => {
  return "₦" + Math.round(amount).toLocaleString();
};

export default function AdminConsole() {
  const [user, setUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Stats and database states
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalEvents: 0,
    activeEvents: 0,
    ticketsSold: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'payouts' | 'tickets'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search Filter States
  const [userSearch, setUserSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");

  // Flow State 1: Custom Toast
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error" | "info"; message: string }>({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // Flow State 2: Custom Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    type: "danger" | "warning" | "success";
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    type: "warning",
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    type: "danger" | "warning" | "success" = "warning"
  ) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
      confirmText,
      type,
    });
  };

  // Flow State 3: Detail Inspection Sheet
  const [inspectItem, setInspectItem] = useState<{
    show: boolean;
    type: "user" | "event" | "payout" | "ticket";
    data: any;
  }>({
    show: false,
    type: "user",
    data: null,
  });

  const [inspectEventVotingResults, setInspectEventVotingResults] = useState<any[] | null>(null);
  const [loadingVotingResults, setLoadingVotingResults] = useState(false);

  const [inspectUserAuditTrail, setInspectUserAuditTrail] = useState<any[] | null>(null);
  const [loadingAuditTrail, setLoadingAuditTrail] = useState(false);

  // Verify auth on load
  useEffect(() => {
    const token = localStorage.getItem("otix_token");
    const userDataStr = localStorage.getItem("otix_user");

    if (!token || !userDataStr) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);
      if (userData.role !== "ADMIN") {
        alert("Access Denied: Administrative privileges required.");
        window.location.href = "/dashboard";
        return;
      }
      setUser(userData);
      setAuthorized(true);
    } catch (e) {
      console.error("Auth verify failed:", e);
      window.location.href = "/login";
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  // Fetch admin stats
  const loadData = async () => {
    try {
      setLoadingData(true);
      const [statsRes, usersRes, eventsRes, payoutsRes, ticketsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/events"),
        api.get("/admin/payouts"),
        api.get("/admin/tickets"),
      ]);

      setStats(statsRes.data.stats);
      setRecentOrders(statsRes.data.recentOrders);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
      setPayouts(payoutsRes.data);
      setTickets(ticketsRes.data);
    } catch (err) {
      console.error("Stats fetching failed:", err);
      showToast("Sync failed. Check database connections.", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  useEffect(() => {
    if (inspectItem.show && inspectItem.type === "event" && inspectItem.data?.isVotingEnabled) {
      const fetchResults = async () => {
        try {
          setLoadingVotingResults(true);
          const res = await api.get(`/votes/results/${inspectItem.data.id}`);
          setInspectEventVotingResults(res.data);
        } catch (err) {
          console.error("Failed to fetch event voting results for audit:", err);
          setInspectEventVotingResults(null);
        } finally {
          setLoadingVotingResults(false);
        }
      };
      fetchResults();
    } else {
      setInspectEventVotingResults(null);
    }

    if (inspectItem.show && inspectItem.type === "user" && inspectItem.data?.id) {
      const fetchAuditTrail = async () => {
        try {
          setLoadingAuditTrail(true);
          const res = await api.get(`/admin/users/${inspectItem.data.id}/audit`);
          setInspectUserAuditTrail(res.data);
        } catch (err) {
          console.error("Failed to fetch user audit trail:", err);
          setInspectUserAuditTrail(null);
        } finally {
          setLoadingAuditTrail(false);
        }
      };
      fetchAuditTrail();
    } else {
      setInspectUserAuditTrail(null);
    }
  }, [inspectItem.show, inspectItem.type, inspectItem.data?.id]);

  // Operations actions
  const handleToggleBan = async (targetUserId: string) => {
    try {
      const res = await api.post(`/admin/users/${targetUserId}/ban`);
      showToast(res.data.message, "success");
      loadData();
      // If we are inspecting this user, update details
      if (inspectItem.show && inspectItem.type === "user" && inspectItem.data.id === targetUserId) {
        setInspectItem((prev) => ({
          ...prev,
          data: { ...prev.data, isBanned: !prev.data.isBanned },
        }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update ban state.", "error");
    }
  };

  const handleToggleEventStatus = async (targetEventId: string) => {
    try {
      const res = await api.post(`/admin/events/${targetEventId}/toggle-status`);
      showToast(res.data.message, "success");
      loadData();
      if (inspectItem.show && inspectItem.type === "event" && inspectItem.data.id === targetEventId) {
        setInspectItem((prev) => ({
          ...prev,
          data: { ...prev.data, isSuspended: !prev.data.isSuspended },
        }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to toggle event visibility.", "error");
    }
  };

  const handleReleasePayout = async (targetPayoutId: string) => {
    try {
      const res = await api.post(`/admin/payouts/${targetPayoutId}/release`);
      showToast(res.data.message, "success");
      loadData();
      if (inspectItem.show && inspectItem.type === "payout" && inspectItem.data.id === targetPayoutId) {
        setInspectItem((prev) => ({
          ...prev,
          data: { ...prev.data, status: "COMPLETED" },
        }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to release payout.", "error");
    }
  };

  // Lists filtering
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.university && u.university.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredEvents = events.filter(
    (e) =>
      e.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.category?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.location?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.organizer?.name?.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredPayouts = payouts.filter(
    (p) =>
      p.eventTitle?.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      p.organizerName?.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      p.status?.toLowerCase().includes(payoutSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.eventTitle?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.userName?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.qrCode?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.ticketName?.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  // Authenticating Loader state
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-[#f05537]/10" />
          <div className="absolute h-16 w-16 animate-pulse rounded-full bg-[#f05537]/25" />
          <div className="relative flex h-14 w-14 items-center justify-center text-[#f05537] animate-bounce">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <p className="mt-8 text-xs font-black tracking-widest text-[#1e0a3c] animate-pulse">
          VERIFYING SWYFT ADMINISTRATOR CREDS...
        </p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-900 font-sans flex relative overflow-hidden">
      
      {/* Dynamic Glow Circles */}
      <div className="absolute top-[-10%] left-[-5%] w-[45rem] h-[45rem] rounded-full bg-[#f05537]/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50rem] h-[50rem] rounded-full bg-[#1565ff]/5 blur-[160px] pointer-events-none" />

      {/* FLOATING TOAST NOTIFICATION CONTAINER */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-slate-300 bg-white/90 backdrop-blur-xl px-5 py-4 shadow-2xl animate-slideLeft">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${toast.type === "success" ? "bg-emerald-50 text-emerald-600" : toast.type === "error" ? "bg-rose-50 text-rose-600" : "bg-blue-500/10 text-blue-400"}`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-bold text-slate-900">{toast.message}</p>
        </div>
      )}

      {/* CUSTOM CONFIRMATION OVERLAY MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="rounded-xl bg-white shadow-sm hover:bg-white shadow-md border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all active:scale-95"
              >
                Cancel Action
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`rounded-xl px-5 py-2.5 text-xs font-black text-slate-950 transition-all active:scale-95 ${
                  confirmModal.type === "danger"
                    ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/15"
                    : confirmModal.type === "success"
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/15"
                    : "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/15"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL INSPECTION DRAWER OVERLAY */}
      {inspectItem.show && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setInspectItem((prev) => ({ ...prev, show: false }))} />
          
          <div className="relative w-full max-w-lg h-full border-l border-slate-300 bg-white p-6 md:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#f05537] bg-[#f05537]/10 px-2.5 py-1 rounded">
                    Audit Inspection
                  </span>
                  <span className="text-xs font-bold text-slate-400 capitalize">• {inspectItem.type} Record</span>
                </div>
                <button
                  onClick={() => setInspectItem((prev) => ({ ...prev, show: false }))}
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                >
                  ✕
                </button>
              </div>

              {/* Inspector Content Cards */}
              <div className="space-y-6">
                {inspectItem.type === "user" && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center">
                      <div className="h-16 w-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-black mb-3 border border-indigo-200">
                        {inspectItem.data.name?.charAt(0)}
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{inspectItem.data.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">{inspectItem.data.email}</p>
                    </div>

                    <div className="grid gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold">
                      {[
                        { label: "Account ID", val: inspectItem.data.id, mono: true },
                        { label: "User Role", val: inspectItem.data.role, badge: true },
                        { label: "Phone Number", val: inspectItem.data.phone || "Not Configured" },
                        { label: "Campuses / College", val: inspectItem.data.university || "None" },
                        { label: "Verified Status", val: inspectItem.data.isVerified ? "Verified User" : "Unverified" },
                        { label: "Suspension Status", val: inspectItem.data.isBanned ? "Suspended Account" : "Active status" },
                        { label: "Registration Date", val: inspectItem.data.createdAt ? new Date(inspectItem.data.createdAt).toLocaleString() : "N/A" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`text-slate-800 ${item.mono ? "font-mono text-[10px]" : ""} ${item.badge ? "px-2 py-0.5 rounded text-[10px] bg-slate-500/10 border border-slate-500/20 uppercase" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex gap-3">
                      {inspectItem.data.id !== user?.id && (
                        <button
                          id={`inspect-ban-${inspectItem.data.id}`}
                          onClick={() => {
                            const action = inspectItem.data.isBanned ? "re-activate" : "suspend";
                            triggerConfirm(
                              `Confirm User Suspension`,
                              `Are you sure you want to ${action} this user's account? Banned users are denied login capabilities.`,
                              () => handleToggleBan(inspectItem.data.id),
                              inspectItem.data.isBanned ? "Unban Account" : "Ban User",
                              inspectItem.data.isBanned ? "success" : "danger"
                            );
                          }}
                          className={`flex-1 rounded-xl py-3 text-xs font-black transition-all active:scale-95 border ${inspectItem.data.isBanned ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-500/20"}`}
                        >
                          {inspectItem.data.isBanned ? "Unban Account" : "Ban User"}
                        </button>
                      )}
                    </div>

                    {/* ACTIVITY AND DISPUTE AUDIT LOG */}
                    <div className="pt-6 border-t border-slate-200">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Activity & Dispute Log</h4>
                      
                      {loadingAuditTrail ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : !inspectUserAuditTrail || inspectUserAuditTrail.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs font-bold bg-white rounded-xl border border-slate-200">
                          No activities recorded for this account.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                          {inspectUserAuditTrail.map((log: any, idx: number) => (
                            <div key={log.id + idx} className="flex gap-3 items-start relative">
                              {/* Timeline line */}
                              {idx !== inspectUserAuditTrail.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-white shadow-sm"></div>
                              )}
                              
                              <div className={`mt-1 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                                log.type === 'TICKET_PURCHASE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                log.type === 'VOTE_ALTERED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                log.type === 'VOTE_CAST' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {log.type === 'TICKET_PURCHASE' ? '🎟' : log.type === 'VOTE_ALTERED' ? '!' : log.type === 'VOTE_CAST' ? 'V' : '+'}
                              </div>
                              
                              <div className="flex-1 bg-white border border-slate-200 p-3 rounded-xl">
                                <p className="text-xs font-bold text-slate-800">{log.title}</p>
                                {log.description && <p className="text-[10px] font-medium text-slate-400 mt-1">{log.description}</p>}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                  <span className="text-[9px] font-bold text-slate-400">{new Date(log.date).toLocaleString()}</span>
                                  {log.amount !== undefined && (
                                    <span className="text-[10px] font-black text-emerald-600">{formatNaira(log.amount)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {inspectItem.type === "event" && (
                  <div className="space-y-5">
                    {inspectItem.data.bannerImage && (
                      <img src={inspectItem.data.bannerImage} className="w-full h-44 object-cover rounded-2xl border border-slate-300" alt="" />
                    )}

                    <div className="p-5 rounded-2xl bg-white border border-slate-200">
                      <h4 className="text-base font-black text-slate-900">{inspectItem.data.title}</h4>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed mt-2">{inspectItem.data.description}</p>
                    </div>

                    <div className="grid gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold">
                      {[
                        { label: "Event ID", val: inspectItem.data.id, mono: true },
                        { label: "Organizer ID", val: inspectItem.data.organizerId, mono: true },
                        { label: "Category", val: inspectItem.data.category },
                        { label: "Target Venue", val: inspectItem.data.location },
                        { label: "Schedule Date", val: inspectItem.data.date ? new Date(inspectItem.data.date).toLocaleString() : "N/A" },
                        { label: "Status Visibility", val: inspectItem.data.isSuspended ? "Suspended" : "Live" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`text-slate-800 ${item.mono ? "font-mono text-[10px]" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                    {inspectItem.data.isVotingEnabled && (
                      <div className="space-y-4 border-t border-slate-200 pt-4">
                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">🗳️ Voting Integrity Audit</h5>
                        
                        {loadingVotingResults ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-2 bg-white rounded-xl border border-slate-200">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f05537]/20 border-t-[#f05537]" />
                            <span className="text-[9px] font-bold text-slate-505 uppercase tracking-widest animate-pulse">Auditing votes...</span>
                          </div>
                        ) : inspectEventVotingResults && inspectEventVotingResults.length > 0 ? (
                          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                            {inspectEventVotingResults.map((category: any) => {
                              const categoryTotal = (category.contestants || []).reduce(
                                (sum: number, c: any) => sum + (c.totalVotesCount || 0),
                                0
                              );
                              return (
                                <div key={category.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-900 truncate max-w-[70%]">{category.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{categoryTotal} votes</span>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {(category.contestants || []).map((contestant: any) => {
                                      const realPct = contestant.totalVotesCount > 0 ? Math.round((contestant.realVotesCount / contestant.totalVotesCount) * 100) : 0;
                                      const tweakedPct = contestant.totalVotesCount > 0 ? 100 - realPct : 0;
                                      
                                      return (
                                        <div key={contestant.id} className="space-y-1.5 text-[11px]">
                                          <div className="flex justify-between items-center font-semibold text-slate-800">
                                            <span className="truncate max-w-[60%]">{contestant.name}</span>
                                            <span className="font-mono text-slate-400">
                                              Total: <strong className="text-slate-900">{contestant.totalVotesCount}</strong> 
                                              <span className="mx-1.5 text-slate-600">|</span> 
                                              Real: <strong className="text-emerald-600">{contestant.realVotesCount}</strong> 
                                              <span className="mx-1.5 text-slate-600">|</span> 
                                              Tweaked: <strong className="text-amber-500">{contestant.tweakedVotesCount}</strong>
                                            </span>
                                          </div>
                                          
                                          {/* Dual-colored progress bar (emerald for real, amber for tweaked) */}
                                          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden flex">
                                            {contestant.totalVotesCount > 0 ? (
                                              <>
                                                {contestant.realVotesCount > 0 && (
                                                  <div className="h-full bg-emerald-500/90 shadow-sm" style={{ width: `${realPct}%` }} />
                                                )}
                                                {contestant.tweakedVotesCount > 0 && (
                                                  <div className="h-full bg-amber-500/90 shadow-sm" style={{ width: `${tweakedPct}%` }} />
                                                )}
                                              </>
                                            ) : (
                                              <div className="h-full w-full bg-slate-100" />
                                            )}
                                          </div>
                                          
                                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wide">
                                            <span>{realPct}% Real</span>
                                            <span>{tweakedPct}% Tweaked</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-slate-400 font-semibold bg-white rounded-xl border border-slate-200 text-[11px]">
                            No active contestants or votes recorded.
                          </div>
                        )}
                      </div>
                    )}
 
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        id={`inspect-suspend-${inspectItem.data.id}`}
                        onClick={() => {
                          const action = inspectItem.data.isSuspended ? "restore" : "deactivate/bring down";
                          triggerConfirm(
                            `Confirm Event Visibility Toggle`,
                            `Are you sure you want to ${action} this event? Suspended events do not appear on search listings.`,
                            () => handleToggleEventStatus(inspectItem.data.id),
                            inspectItem.data.isSuspended ? "Activate Event" : "Bring Down Event",
                            inspectItem.data.isSuspended ? "success" : "danger"
                          );
                        }}
                        className={`w-full rounded-xl py-3 text-xs font-black border transition-all active:scale-95 ${inspectItem.data.isSuspended ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20" : "bg-[#f05537]/10 text-[#f05537] border-b border-[#f05537]/20 hover:bg-[#f05537]/20"}`}
                      >
                        {inspectItem.data.isSuspended ? "Restore Live Listing" : "Bring Down Event"}
                      </button>
                    </div>
                  </div>
                )}

                {inspectItem.type === "payout" && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Total Requested Amount</p>
                      <h4 className="text-2xl font-black text-slate-900">{formatNaira(inspectItem.data.amount)}</h4>
                      <p className="text-xs font-bold text-slate-400">{inspectItem.data.eventTitle}</p>
                    </div>

                    <div className="grid gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold">
                      {[
                        { label: "Payout ID", val: inspectItem.data.id, mono: true },
                        { label: "Event ID", val: inspectItem.data.eventId, mono: true },
                        { label: "Organizer Name", val: inspectItem.data.organizerName },
                        { label: "Organizer ID", val: inspectItem.data.organizerId, mono: true },
                        { label: "Request Status", val: inspectItem.data.status },
                        { label: "Creation Date", val: inspectItem.data.createdAt ? new Date(inspectItem.data.createdAt).toLocaleString() : "N/A" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`text-slate-800 ${item.mono ? "font-mono text-[10px]" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    {inspectItem.data.status === "PENDING" && (
                      <div className="pt-4 border-t border-slate-200">
                        <button
                          id={`inspect-release-${inspectItem.data.id}`}
                          onClick={() => {
                            triggerConfirm(
                              `Confirm Payout Release`,
                              `Are you sure you want to release this payout of ${formatNaira(inspectItem.data.amount)} to organizer ${inspectItem.data.organizerName}?`,
                              () => handleReleasePayout(inspectItem.data.id),
                              "Confirm Release",
                              "success"
                            );
                          }}
                          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-black text-slate-950 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                        >
                          Approve & Release Funds
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {inspectItem.type === "ticket" && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Total Purchase Value</p>
                      <h4 className="text-xl font-black text-slate-900">{formatNaira(inspectItem.data.totalPaid)}</h4>
                      <p className="text-xs font-bold text-slate-400">{inspectItem.data.eventTitle} • {inspectItem.data.ticketName}</p>
                    </div>

                    <div className="grid gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold">
                      {[
                        { label: "Purchase ID", val: inspectItem.data.id, mono: true },
                        { label: "Order ID", val: inspectItem.data.orderId, mono: true },
                        { label: "Attendee Name", val: inspectItem.data.userName },
                        { label: "Attendee Email", val: inspectItem.data.userEmail },
                        { label: "Ticket Class", val: `${inspectItem.data.ticketName} (x${inspectItem.data.quantity})` },
                        { label: "QR Serial Code", val: inspectItem.data.qrCode || "Unissued", mono: true },
                        { label: "Check-in Status", val: inspectItem.data.isUsed ? "Checked In / Scanned" : "Unused" },
                        { label: "Purchase Time", val: inspectItem.data.createdAt ? new Date(inspectItem.data.createdAt).toLocaleString() : "N/A" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`text-slate-800 ${item.mono ? "font-mono text-[10px]" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-6 mt-6 border-t border-slate-200 text-center">
              <span className="text-[9px] font-mono text-slate-400">System Trace Log ID: {inspectItem.data.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* TWO-COLUMN SAAS CONSOLE LAYOUT */}
      
      {/* 1. COLLAPSIBLE LEFT SIDEBAR */}
      <aside
        className={`bg-[#0d091a]/90 backdrop-blur-xl border-r border-slate-200 flex flex-col justify-between relative z-20 shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="h-20 border-b border-slate-200 flex items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="SWYFT home">
              <span className="flex h-7 w-7 items-center justify-center text-[#f05537] shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z" fill="currentColor" />
                </svg>
              </span>
              {!sidebarCollapsed && (
                <span className="text-lg font-black tracking-[-0.04em] text-[#f05537] uppercase">swyft</span>
              )}
            </Link>
            
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-7 w-7 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
              aria-label="Collapse sidebar"
            >
              {sidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          {/* Navigation link items */}
          <nav className="p-4 space-y-1">
            {[
              { id: "overview", label: "Overview", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg> },
              { id: "users", label: "Users Directory", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              { id: "events", label: "Event Moderation", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
              { id: "payouts", label: "Payout Operations", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M17 9H7" /></svg> },
              { id: "tickets", label: "Ticket Audit Logs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg> },
            ].map((item) => (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as any);
                }}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl text-xs font-bold transition-all relative group active:scale-[0.98] ${
                  activeTab === item.id
                    ? "bg-[#f05537]/10 text-[#f05537]"
                    : "text-slate-400 hover:text-slate-800 hover:bg-white shadow-sm"
                }`}
              >
                <span className={activeTab === item.id ? "text-[#f05537]" : "text-slate-400 group-hover:text-slate-800"}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span>{item.label}</span>
                )}
                {/* Active Indicator Accent Line */}
                {activeTab === item.id && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#f05537] rounded-r" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Card / Return to app */}
        <div className="p-4 border-t border-slate-200 space-y-4">
          <Link
            href="/"
            className="flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-800 hover:bg-white shadow-sm no-underline transition-all"
          >
            <span>🏠</span>
            {!sidebarCollapsed && <span>Return to Site</span>}
          </Link>
          
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-slate-200">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#f05537]/10 flex items-center justify-center font-bold text-xs text-[#f05537]">
              {user?.name?.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-900 truncate">{user?.name}</p>
                <p className="text-[9px] font-semibold text-slate-400 truncate mt-0.5">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKING WORKSPACE */}
      <main className="flex-1 min-w-0 h-screen flex flex-col justify-between overflow-y-auto z-10 relative">
        
        {/* Workspace top-bar */}
        <div className="h-20 border-b border-slate-200 bg-white/20 backdrop-blur-md px-6 md:px-8 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#f05537] uppercase">
              SWYFT CORE OPERATIONS CONSOLE
            </span>
            <h2 className="text-sm font-black text-slate-900 mt-1 capitalize">{activeTab} panel</h2>
          </div>

          {/* Server status monitor indicators */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase">SYS CPU</span>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600">12%</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase">DB query</span>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600">4ms</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase">Active sessions</span>
              <p className="text-[10px] font-black text-slate-900 mt-0.5">140</p>
            </div>
          </div>
        </div>

        {/* Scrollable central content dashboard panel */}
        <div className="flex-1 p-6 md:p-8">
          
          {loadingData ? (
            /* Main Dashboard Pulse Loader */
            <div className="h-full min-h-[350px] border border-slate-200 bg-white rounded-3xl flex flex-col items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f05537]/20 border-t-[#f05537]" />
              <p className="text-[10px] font-black uppercase text-slate-400 animate-pulse tracking-widest">
                Fetching administration payload...
              </p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* OVERVIEW PANEL CONTENT */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Stats Cards */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Platform Revenue", value: formatNaira(stats.totalRevenue), sub: "Total ticket earnings", color: "text-emerald-600 bg-emerald-500/5 border-emerald-500/10" },
                      { label: "Tickets Sold", value: stats.ticketsSold.toLocaleString(), sub: "Total check-ins issued", color: "text-[#1565ff] bg-[#1565ff]/5 border-[#1565ff]/10" },
                      { label: "Events Index", value: `${stats.activeEvents} / ${stats.totalEvents}`, sub: "Live / total campaigns", color: "text-amber-600 bg-amber-500/5 border-amber-500/10" },
                      { label: "Pending Payouts", value: formatNaira(stats.pendingPayouts), sub: "Organizer requests", color: "text-[#f05537] bg-[#f05537]/5 border-[#f05537]/10" },
                    ].map((card, i) => (
                      <div key={i} className={`rounded-2xl border bg-white backdrop-blur-md p-6 shadow-xl hover:scale-[1.02] transition-all duration-300 ${card.color}`}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</p>
                        <p className="mt-4 text-2xl font-black text-slate-900">{card.value}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Activity Feed Logs */}
                    <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-md p-6 shadow-xl lg:col-span-2 space-y-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">System Operations Feed</h3>
                        <p className="text-xs font-semibold text-slate-400">Chronological list of platform sales</p>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {recentOrders.length > 0 ? (
                          recentOrders.map((ord) => (
                            <div key={ord.id} className="flex gap-4 items-start p-3 rounded-xl bg-white hover:bg-white border border-slate-200 transition-all text-xs">
                              <span className="h-6 w-6 shrink-0 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                                ✓
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800">
                                  Order ID <span className="font-mono text-indigo-600">{ord.id}</span> completed for <span className="font-black text-slate-900">{formatNaira(ord.totalPrice)}</span>
                                </p>
                                <p className="text-[9px] font-medium text-slate-400 mt-1">
                                  Created At: {new Date(ord.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-slate-400 font-bold">No activity logs found.</div>
                        )}
                      </div>
                    </div>

                    {/* Operational Commands Panel */}
                    <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-md p-6 shadow-xl space-y-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">System Dials</h3>
                        <p className="text-xs font-semibold text-slate-400">Quick administration overview counters</p>
                      </div>

                      <div className="grid gap-3 text-xs">
                        {[
                          { label: "Suspended Accounts", count: users.filter(u => u.isBanned).length, color: "text-[#f05537]", tab: "users" },
                          { label: "Deactivated Events", count: events.filter(e => e.isSuspended).length, color: "text-amber-600", tab: "events" },
                          { label: "Pending Payouts Requests", count: payouts.filter(p => p.status === 'PENDING').length, color: "text-[#1565ff]", tab: "payouts" },
                        ].map((dial, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveTab(dial.tab as any)}
                            className="flex items-center justify-between p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all"
                          >
                            <span className="font-bold text-slate-700">{dial.label}</span>
                            <span className={`font-black ${dial.color}`}>{dial.count}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                        <span className="text-[9px] font-black text-[#1565ff] uppercase tracking-wider">
                          SYSTEM HEALTH OK
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* USERS PANEL CONTENT */}
              {activeTab === "users" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <input
                      id="user-search"
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full sm:max-w-md rounded-xl bg-white border border-slate-200 focus:border-[#f05537] px-4 py-3 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                    <span className="text-xs font-bold text-slate-400">Showing {filteredUsers.length} accounts</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white text-slate-400 font-bold">
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">University</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <tr
                              key={u.id}
                              className="hover:bg-white transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "user", data: u })}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-black text-slate-900">{u.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : u.role === 'ORGANIZER' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-700">{u.university || "Not Set"}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${u.isBanned ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                                  {u.isBanned ? "Suspended" : "Active"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                {u.id !== user?.id && (
                                  <button
                                    id={`ban-btn-${u.id}`}
                                    onClick={() => {
                                      const act = u.isBanned ? "re-activate" : "suspend";
                                      triggerConfirm(
                                        "Confirm User Suspension",
                                        `Are you sure you want to ${act} account for ${u.name}?`,
                                        () => handleToggleBan(u.id),
                                        u.isBanned ? "Unban User" : "Ban User",
                                        u.isBanned ? "success" : "danger"
                                      );
                                    }}
                                    className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition-all ${u.isBanned ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/20" : "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500/20"}`}
                                  >
                                    {u.isBanned ? "Unban Account" : "Ban User"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">No matches found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EVENTS PANEL CONTENT */}
              {activeTab === "events" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <input
                      id="event-search"
                      type="text"
                      placeholder="Search events..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full sm:max-w-md rounded-xl bg-white border border-slate-200 focus:border-[#f05537] px-4 py-3 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                    <span className="text-xs font-bold text-slate-400">Showing {filteredEvents.length} events</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white text-slate-400 font-bold">
                          <th className="px-6 py-4">Event</th>
                          <th className="px-6 py-4">Organizer</th>
                          <th className="px-6 py-4">Venue</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                        {filteredEvents.length > 0 ? (
                          filteredEvents.map((e) => (
                            <tr
                              key={e.id}
                              className="hover:bg-white transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "event", data: e })}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {e.bannerImage && <img src={e.bannerImage} className="h-9 w-14 object-cover rounded bg-slate-100" alt="" />}
                                  <div>
                                    <p className="font-black text-slate-900">{e.title}</p>
                                    <p className="text-[10px] text-slate-450 mt-0.5">{e.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-700">{e.organizer?.name || "Unknown"}</td>
                              <td className="px-6 py-4 text-slate-400">{e.location}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${e.isSuspended ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                                  {e.isSuspended ? "Suspended" : "Live"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  id={`suspend-btn-${e.id}`}
                                  onClick={() => {
                                    const act = e.isSuspended ? "restore" : "bring down";
                                    triggerConfirm(
                                      "Confirm Event Visibility",
                                      `Are you sure you want to ${act} this event?`,
                                      () => handleToggleEventStatus(e.id),
                                      e.isSuspended ? "Activate" : "Bring Down",
                                      e.isSuspended ? "success" : "danger"
                                    );
                                  }}
                                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition-all ${e.isSuspended ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/20" : "bg-[#f05537]/10 text-[#f05537] border border-[#f05537]/20 hover:bg-[#f05537]/20"}`}
                                >
                                  {e.isSuspended ? "Restore Live" : "Bring Down"}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">No events matched.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAYOUTS PANEL CONTENT */}
              {activeTab === "payouts" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <input
                      id="payout-search"
                      type="text"
                      placeholder="Search payouts..."
                      value={payoutSearch}
                      onChange={(e) => setPayoutSearch(e.target.value)}
                      className="w-full sm:max-w-md rounded-xl bg-white border border-slate-200 focus:border-[#f05537] px-4 py-3 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                    <span className="text-xs font-bold text-slate-400">Showing {filteredPayouts.length} payout logs</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white text-slate-400 font-bold">
                          <th className="px-6 py-4">Event</th>
                          <th className="px-6 py-4">Organizer</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                        {filteredPayouts.length > 0 ? (
                          filteredPayouts.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-white transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "payout", data: p })}
                            >
                              <td className="px-6 py-4 font-black text-slate-900">{p.eventTitle}</td>
                              <td className="px-6 py-4 text-slate-700">{p.organizerName}</td>
                              <td className="px-6 py-4 font-black text-slate-900 text-xs">{formatNaira(p.amount)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                {p.status === "PENDING" ? (
                                  <button
                                    id={`release-btn-${p.id}`}
                                    onClick={() => {
                                      triggerConfirm(
                                        "Confirm Payout Approval",
                                        `Authorize transfer of ${formatNaira(p.amount)} to organizer ${p.organizerName}?`,
                                        () => handleReleasePayout(p.id),
                                        "Release Payout",
                                        "success"
                                      );
                                    }}
                                    className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-slate-950 transition-all shadow-md active:scale-95"
                                  >
                                    Release Payout
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold">Cleared ✓</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">No payouts matched.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TICKETS AUDIT PANEL CONTENT */}
              {activeTab === "tickets" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <input
                      id="ticket-search"
                      type="text"
                      placeholder="Search tickets logs..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="w-full sm:max-w-md rounded-xl bg-white border border-slate-200 focus:border-[#f05537] px-4 py-3 text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                    <span className="text-xs font-bold text-slate-400">Showing {filteredTickets.length} ticket registers</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-white text-slate-400 font-bold">
                          <th className="px-6 py-4">Attendee</th>
                          <th className="px-6 py-4">Event Info</th>
                          <th className="px-6 py-4">Amount Paid</th>
                          <th className="px-6 py-4">QR Reference</th>
                          <th className="px-6 py-4">Check-in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-white transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "ticket", data: t })}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-black text-slate-900">{t.userName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{t.userEmail}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-slate-900 font-bold">{t.eventTitle}</p>
                                  <p className="text-[10px] text-slate-450 mt-0.5">{t.ticketName} (x{t.quantity})</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-800">
                                <p className="font-black">{formatNaira(t.totalPaid)}</p>
                              </td>
                              <td className="px-6 py-4 font-mono text-indigo-600 text-[10px]">{t.qrCode || "N/A"}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${t.isUsed ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                                  {t.isUsed ? "Checked In" : "Unused"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">No tickets found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Console footer branding */}
        <footer className="h-14 border-t border-slate-200 bg-white/20 backdrop-blur-md px-6 md:px-8 flex items-center justify-between text-[10px] font-semibold text-slate-400 shrink-0 select-none">
          <span>© 2026 SWYFT Technologies Inc.</span>
          <span>Security Level: Super Administrator Access</span>
        </footer>

      </main>
    </div>
  );
}
