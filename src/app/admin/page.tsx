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
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'organizers' | 'events' | 'payouts' | 'tickets'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search Filter States
  const [userSearch, setUserSearch] = useState("");
  const [organizerSearch, setOrganizerSearch] = useState("");
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

  // Flow State 4: Edit Organizer Bank Details Modal
  const [editBankModal, setEditBankModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
    bankName: string;
    accountNumber: string;
  }>({
    show: false,
    userId: "",
    userName: "",
    bankName: "",
    accountNumber: "",
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);

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
      const [statsResult, usersResult, organizersResult, eventsResult, payoutsResult, ticketsResult] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/organizers"),
        api.get("/admin/events"),
        api.get("/admin/payouts"),
        api.get("/admin/tickets"),
      ]);

      const loadedUsers = usersResult.status === "fulfilled" ? usersResult.value.data : [];
      setUsers(loadedUsers);

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.data.stats || {});
        setRecentOrders(statsResult.value.data.recentOrders || []);
      }

      if (organizersResult.status === "fulfilled") {
        setOrganizers(organizersResult.value.data || []);
      } else {
        // Graceful fallback: extract organizers from users list if endpoint was delayed
        console.warn("Organizers endpoint fallback to users list:", organizersResult.reason);
        const fallbackOrganizers = (loadedUsers || []).filter(
          (u: any) => u.role === "ORGANIZER" || u.accountNumber || (typeof u.walletBalance === 'number' && u.walletBalance > 0)
        );
        setOrganizers(fallbackOrganizers);
      }

      if (eventsResult.status === "fulfilled") setEvents(eventsResult.value.data || []);
      if (payoutsResult.status === "fulfilled") setPayouts(payoutsResult.value.data || []);
      if (ticketsResult.status === "fulfilled") setTickets(ticketsResult.value.data || []);
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

  const handleRejectPayout = async (targetPayoutId: string) => {
    try {
      const res = await api.post(`/admin/payouts/${targetPayoutId}/reject`);
      showToast(res.data.message || "Payout request rejected.", "success");
      loadData();
      if (inspectItem.show && inspectItem.type === "payout" && inspectItem.data.id === targetPayoutId) {
        setInspectItem((prev) => ({
          ...prev,
          data: { ...prev.data, status: "REJECTED" },
        }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to reject payout.", "error");
    }
  };

  const handleSaveOrganizerBank = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editBankModal.bankName || !editBankModal.accountNumber) {
      showToast("Please provide both bank name and account number", "error");
      return;
    }
    const cleanNum = editBankModal.accountNumber.trim().replace(/\D/g, "");
    const formattedNum = cleanNum.length === 11 && cleanNum.startsWith("0") ? cleanNum.slice(1) : cleanNum;
    if (formattedNum.length !== 10) {
      showToast("Account number must be 10 digits", "error");
      return;
    }
    try {
      setSavingBankDetails(true);
      const res = await api.put(`/admin/organizers/${editBankModal.userId}/bank-details`, {
        bankName: editBankModal.bankName.trim(),
        accountNumber: formattedNum,
      });
      showToast(res.data.message || "Bank details updated successfully", "success");
      setEditBankModal((prev) => ({ ...prev, show: false }));
      loadData();
      if (inspectItem.show && inspectItem.data?.id === editBankModal.userId) {
        setInspectItem((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            bankName: editBankModal.bankName.trim(),
            accountNumber: formattedNum,
          },
        }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update bank details", "error");
    } finally {
      setSavingBankDetails(false);
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

  const filteredOrganizers = organizers.filter(
    (o) =>
      o.name?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
      o.email?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
      o.phone?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
      o.bankName?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
      o.accountNumber?.toLowerCase().includes(organizerSearch.toLowerCase()) ||
      o.bankCode?.toLowerCase().includes(organizerSearch.toLowerCase())
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
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-[#fafafa]">
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-white/5" />
          <div className="absolute h-16 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="relative flex h-14 w-14 items-center justify-center text-[#fafafa] animate-bounce">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <p className="mt-8 text-xs font-medium tracking-widest text-[#9ca3af] uppercase animate-pulse">
          VERIFYING SWYFT ADMINISTRATOR CREDS...
        </p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] font-sans flex relative overflow-hidden selection:bg-[#fafafa] selection:text-[#0a0a0a]">
      
      {/* Subtle Editorial Glow Accents */}
      <div className="absolute top-[-10%] left-[-5%] w-[45rem] h-[45rem] rounded-full bg-white/[0.015] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50rem] h-[50rem] rounded-full bg-white/[0.015] blur-[160px] pointer-events-none" />

      {/* FLOATING TOAST NOTIFICATION CONTAINER */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-full border border-[#374151] bg-[#121212]/95 backdrop-blur-xl px-5 py-3 shadow-2xl animate-slideLeft">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${toast.type === "success" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" : toast.type === "error" ? "bg-rose-950/60 text-rose-400 border border-rose-800/40" : "bg-[#1f1f1f] text-[#9ca3af] border border-[#262626]"}`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p className="text-xs font-medium text-[#fafafa]">{toast.message}</p>
        </div>
      )}

      {/* CUSTOM CONFIRMATION OVERLAY MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#374151] bg-[#121212] p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-light tracking-tight text-[#fafafa]">{confirmModal.title}</h3>
              <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="rounded-full border border-[#374151] bg-transparent hover:bg-[#1f1f1f] px-5 py-2.5 text-xs font-medium text-[#9ca3af] hover:text-[#fafafa] transition cursor-pointer"
              >
                Cancel Action
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`rounded-full px-5 py-2.5 text-xs font-semibold transition cursor-pointer active:scale-95 ${
                  confirmModal.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20"
                    : confirmModal.type === "success"
                    ? "bg-[#fafafa] hover:bg-[#e5e5e5] text-[#0a0a0a]"
                    : "bg-[#fafafa] hover:bg-[#e5e5e5] text-[#0a0a0a]"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / SET ORGANIZER SETTLEMENT BANK ACCOUNT MODAL */}
      {editBankModal.show && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-[#374151] bg-[#121212] p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af]">
                  ADMIN SETTLEMENT SETTINGS
                </span>
                <h3 className="text-base font-light tracking-tight text-[#fafafa] mt-1">
                  Organizer Bank Details
                </h3>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  Update account for <strong className="text-[#fafafa] font-medium">{editBankModal.userName}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditBankModal((prev) => ({ ...prev, show: false }))}
                className="h-8 w-8 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] hover:border-[#374151] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrganizerBank} className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider block mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. OPay, PalmPay, GTBank, Access Bank, Moniepoint"
                  list="bank-suggestions"
                  value={editBankModal.bankName}
                  onChange={(e) => setEditBankModal((prev) => ({ ...prev, bankName: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-[#374151] bg-[#171717] px-4 py-3 text-xs text-[#fafafa] placeholder-[#737373] outline-none focus:border-[#fafafa] transition"
                />
                <datalist id="bank-suggestions">
                  <option value="OPay" />
                  <option value="PalmPay" />
                  <option value="Moniepoint" />
                  <option value="Kuda Bank" />
                  <option value="Guaranty Trust Bank (GTB)" />
                  <option value="Access Bank" />
                  <option value="United Bank for Africa (UBA)" />
                  <option value="Zenith Bank" />
                  <option value="First Bank of Nigeria" />
                  <option value="Stanbic IBTC" />
                  <option value="Wema Bank" />
                  <option value="FCMB" />
                  <option value="Fidelity Bank" />
                </datalist>

                {/* Quick chip selects */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["OPay", "PalmPay", "Moniepoint", "GTBank", "Access Bank", "Kuda"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setEditBankModal((prev) => ({ ...prev, bankName: b }))}
                      className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#171717] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#374151] text-[#9ca3af] hover:text-[#fafafa] transition cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wider block mb-1.5">
                  10-Digit Account Number
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="e.g. 8144065785 (or 08144065785)"
                  value={editBankModal.accountNumber}
                  onChange={(e) => setEditBankModal((prev) => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                  required
                  className="w-full rounded-xl border border-[#374151] bg-[#171717] px-4 py-3 text-xs font-mono font-medium text-[#fafafa] placeholder-[#737373] outline-none focus:border-[#fafafa] transition"
                />
                <p className="text-[10px] text-[#737373] mt-1">
                  Enter 10-digit NUBAN. For OPay/PalmPay phone numbers, 11-digit numbers starting with 0 are automatically normalized.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditBankModal((prev) => ({ ...prev, show: false }))}
                  className="rounded-full border border-[#374151] bg-transparent hover:bg-[#1f1f1f] px-5 py-2.5 text-xs font-medium text-[#9ca3af] hover:text-[#fafafa] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBankDetails || !editBankModal.bankName || editBankModal.accountNumber.length < 10}
                  className="rounded-full bg-[#fafafa] hover:bg-[#e5e5e5] disabled:opacity-40 text-[#0a0a0a] px-5 py-2.5 text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer"
                >
                  {savingBankDetails ? "Saving Details..." : "Save Bank Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL INSPECTION DRAWER OVERLAY */}
      {inspectItem.show && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setInspectItem((prev) => ({ ...prev, show: false }))} />
          
          <div className="relative w-full max-w-lg h-full border-l border-[#262626] bg-[#0f0f0f] p-6 md:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft text-[#fafafa]">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-[#9ca3af] bg-[#1a1a1a] border border-[#262626] px-2.5 py-1 rounded-full">
                    Audit Inspection
                  </span>
                  <span className="text-xs text-[#9ca3af] capitalize">• {inspectItem.type} Record</span>
                </div>
                <button
                  onClick={() => setInspectItem((prev) => ({ ...prev, show: false }))}
                  className="h-8 w-8 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] hover:border-[#374151] transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Inspector Content Cards */}
              <div className="space-y-6">
                {inspectItem.type === "user" && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] text-center">
                      <div className="h-16 w-16 mx-auto rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#fafafa] text-2xl font-light mb-3 border border-[#262626]">
                        {inspectItem.data.name?.charAt(0)}
                      </div>
                      <h4 className="text-lg font-light tracking-tight text-[#fafafa]">{inspectItem.data.name}</h4>
                      <p className="text-xs text-[#9ca3af] mt-1">{inspectItem.data.email}</p>
                    </div>

                    <div className="grid gap-3 p-5 rounded-2xl bg-[#141414] border border-[#262626] text-xs font-normal">
                      {[
                        { label: "Account ID", val: inspectItem.data.id, mono: true },
                        { label: "User Role", val: inspectItem.data.role, badge: true },
                        { label: "Wallet Balance", val: formatNaira(inspectItem.data.walletBalance || 0), highlight: true },
                        ...(inspectItem.data.totalRevenue !== undefined ? [
                          { label: "Total Ticket Revenue", val: formatNaira(inspectItem.data.totalRevenue || 0) },
                          { label: "Tickets Sold", val: `${inspectItem.data.ticketsSold || inspectItem.data.buyers?.length || 0} tickets sold`, highlight: true }
                        ] : []),
                        { label: "Settlement Bank", val: inspectItem.data.bankName || "Not Configured" },
                        { 
                          label: "Account Number", 
                          val: inspectItem.data.accountNumber || "Not Configured", 
                          mono: true,
                          action: (
                            <button
                              onClick={() => setEditBankModal({
                                show: true,
                                userId: inspectItem.data.id,
                                userName: inspectItem.data.name,
                                bankName: inspectItem.data.bankName && inspectItem.data.bankName !== "Not Provided" ? inspectItem.data.bankName : "",
                                accountNumber: inspectItem.data.accountNumber && inspectItem.data.accountNumber !== "Not Provided" && inspectItem.data.accountNumber !== "Not Configured" ? inspectItem.data.accountNumber : "",
                              })}
                              className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#fafafa] text-[#0a0a0a] hover:bg-[#e5e5e5] transition cursor-pointer shrink-0"
                            >
                              {inspectItem.data.accountNumber && inspectItem.data.accountNumber !== "Not Provided" && inspectItem.data.accountNumber !== "Not Configured" ? "Edit Bank" : "+ Set Bank"}
                            </button>
                          )
                        },
                        ...(inspectItem.data.bankCode ? [{ label: "Bank Code", val: inspectItem.data.bankCode, mono: true }] : []),
                        ...(inspectItem.data.subaccountCode ? [{ label: "Paystack Subaccount", val: inspectItem.data.subaccountCode, mono: true }] : []),
                        { label: "Phone Number", val: inspectItem.data.phone || "Not Configured" },
                        { label: "Campuses / College", val: inspectItem.data.university || "None" },
                        { label: "Verified Status", val: inspectItem.data.isVerified ? "Verified User" : "Unverified" },
                        { label: "Suspension Status", val: inspectItem.data.isBanned ? "Suspended Account" : "Active status" },
                        { label: "Registration Date", val: inspectItem.data.createdAt ? new Date(inspectItem.data.createdAt).toLocaleString() : "N/A" },
                      ].map((item: any, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-[#262626]/80 last:border-0">
                          <span className="text-[#9ca3af]">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[#fafafa] ${item.mono ? "font-mono text-[11px]" : ""} ${item.highlight ? "font-medium text-emerald-400 text-sm" : ""} ${item.badge ? "px-2.5 py-0.5 rounded-full text-[10px] bg-[#1f1f1f] border border-[#262626] uppercase text-[#9ca3af]" : ""}`}>
                              {item.val}
                            </span>
                            {item.action}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[#262626] flex gap-3">
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
                          className={`flex-1 rounded-full py-3 text-xs font-medium transition cursor-pointer border ${inspectItem.data.isBanned ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40" : "bg-rose-950/40 text-rose-400 border-rose-800/40 hover:bg-rose-900/40"}`}
                        >
                          {inspectItem.data.isBanned ? "Unban Account" : "Ban User"}
                        </button>
                      )}
                    </div>

                    {/* TICKETS SOLD & ATTENDEE BUYER DETAILS */}
                    <div className="pt-6 border-t border-[#262626] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-medium text-[#fafafa] uppercase tracking-wider flex items-center gap-1.5">
                            <span>🎟️</span> Tickets Sold & Attendees
                          </h4>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5">
                            {inspectItem.data.ticketsSold || inspectItem.data.buyers?.length || 0} tickets sold across all hosted events
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                          {inspectItem.data.ticketsSold || inspectItem.data.buyers?.length || 0} sold
                        </span>
                      </div>

                      {(!inspectItem.data.buyers || inspectItem.data.buyers.length === 0) ? (
                        <div className="text-center py-6 px-4 bg-[#141414] rounded-2xl border border-[#262626] text-[#9ca3af] text-xs">
                          <p className="text-xl mb-1">🎫</p>
                          <p className="text-[#fafafa] font-medium">No tickets sold yet</p>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5">Attendees will show up here once purchases are completed.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                          {inspectItem.data.buyers.map((buyer: any, idx: number) => (
                            <div
                              key={buyer.orderId ? `${buyer.orderId}-${idx}` : idx}
                              className="p-4 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#374151] transition space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-xs text-[#fafafa]">{buyer.buyerName}</p>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#1f1f1f] text-[#9ca3af] border border-[#262626]">
                                      {buyer.quantity}x {buyer.ticketName}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#9ca3af] mt-0.5 truncate max-w-[240px]">
                                    📍 {buyer.eventTitle}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-medium text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40 block">
                                    {formatNaira(buyer.pricePaid ?? 0)}
                                  </span>
                                  <span className="text-[9px] text-[#9ca3af] mt-0.5 block">
                                    Paid
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262626] text-[10px]">
                                <div className="space-y-0.5">
                                  <span className="text-[#9ca3af] block font-medium">Email:</span>
                                  <span className="text-[#fafafa] truncate block font-mono" title={buyer.buyerEmail}>
                                    {buyer.buyerEmail}
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[#9ca3af] block font-medium">Phone:</span>
                                  <span className="text-[#fafafa] font-mono block">
                                    {buyer.buyerPhone || "N/A"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1.5 text-[9px] text-[#9ca3af]">
                                <span>Purchased {buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                                {buyer.orderId && (
                                  <span className="font-mono text-[9px] text-[#737373] truncate max-w-[120px]" title={buyer.orderId}>
                                    Ref: {buyer.orderId.substring(0, 8)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ACTIVITY AND DISPUTE AUDIT LOG */}
                    <div className="pt-6 border-t border-[#262626]">
                      <h4 className="text-xs font-medium text-[#fafafa] uppercase tracking-wider mb-4">Activity & Dispute Log</h4>
                      
                      {loadingAuditTrail ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 border-2 border-[#fafafa] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : !inspectUserAuditTrail || inspectUserAuditTrail.length === 0 ? (
                        <div className="text-center py-8 text-[#9ca3af] text-xs bg-[#141414] rounded-xl border border-[#262626]">
                          No activities recorded for this account.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                          {inspectUserAuditTrail.map((log: any, idx: number) => (
                            <div key={log.id + idx} className="flex gap-3 items-start relative">
                              {/* Timeline line */}
                              {idx !== inspectUserAuditTrail.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-[#262626]"></div>
                              )}
                              
                              <div className={`mt-1 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                log.type === 'TICKET_PURCHASE' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' :
                                log.type === 'VOTE_ALTERED' ? 'bg-rose-950/60 text-rose-400 border-rose-800/40' :
                                log.type === 'VOTE_CAST' ? 'bg-indigo-950/60 text-indigo-400 border-indigo-800/40' :
                                'bg-amber-950/60 text-amber-400 border-amber-800/40'
                              }`}>
                                {log.type === 'TICKET_PURCHASE' ? '🎟' : log.type === 'VOTE_ALTERED' ? '!' : log.type === 'VOTE_CAST' ? 'V' : '+'}
                              </div>
                              
                              <div className="flex-1 bg-[#141414] border border-[#262626] p-3.5 rounded-xl">
                                <p className="text-xs font-medium text-[#fafafa]">{log.title}</p>
                                {log.description && <p className="text-[10px] text-[#9ca3af] mt-1">{log.description}</p>}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262626]">
                                  <span className="text-[9px] text-[#9ca3af]">{new Date(log.date).toLocaleString()}</span>
                                  {log.amount !== undefined && (
                                    <span className="text-[10px] font-medium text-emerald-400">{formatNaira(log.amount)}</span>
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
                      <img src={inspectItem.data.bannerImage} className="w-full h-44 object-cover rounded-2xl border border-[#262626]" alt="" />
                    )}

                    <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626]">
                      <h4 className="text-base font-light tracking-tight text-[#fafafa]">{inspectItem.data.title}</h4>
                      <p className="text-xs text-[#9ca3af] leading-relaxed mt-2">{inspectItem.data.description}</p>
                    </div>

                    <div className="grid gap-3 p-5 rounded-2xl bg-[#141414] border border-[#262626] text-xs">
                      {[
                        { label: "Event ID", val: inspectItem.data.id, mono: true },
                        { label: "Organizer ID", val: inspectItem.data.organizerId, mono: true },
                        { label: "Category", val: inspectItem.data.category },
                        { label: "Target Venue", val: inspectItem.data.location },
                        { label: "Schedule Date", val: inspectItem.data.date ? new Date(inspectItem.data.date).toLocaleString() : "N/A" },
                        { label: "Status Visibility", val: inspectItem.data.isSuspended ? "Suspended" : "Live" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-[#262626]/80 last:border-0">
                          <span className="text-[#9ca3af]">{item.label}</span>
                          <span className={`text-[#fafafa] ${item.mono ? "font-mono text-[11px]" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                    {inspectItem.data.isVotingEnabled && (
                      <div className="space-y-4 border-t border-[#262626] pt-4">
                        <h5 className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">🗳️ Voting Integrity Audit</h5>
                        
                        {loadingVotingResults ? (
                          <div className="flex flex-col items-center justify-center py-6 gap-2 bg-[#141414] rounded-xl border border-[#262626]">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            <span className="text-[9px] font-medium text-[#9ca3af] uppercase tracking-widest animate-pulse">Auditing votes...</span>
                          </div>
                        ) : inspectEventVotingResults && inspectEventVotingResults.length > 0 ? (
                          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                            {inspectEventVotingResults.map((category: any) => {
                              const categoryTotal = (category.contestants || []).reduce(
                                (sum: number, c: any) => sum + (c.totalVotesCount || 0),
                                0
                              );
                              return (
                                <div key={category.id} className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                                  <div className="flex justify-between items-center border-b border-[#262626] pb-2">
                                    <span className="text-xs font-medium text-[#fafafa] truncate max-w-[70%]">{category.name}</span>
                                    <span className="text-[10px] font-mono text-[#9ca3af]">{categoryTotal} votes</span>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {(category.contestants || []).map((contestant: any) => {
                                      const realPct = contestant.totalVotesCount > 0 ? Math.round((contestant.realVotesCount / contestant.totalVotesCount) * 100) : 0;
                                      const tweakedPct = contestant.totalVotesCount > 0 ? 100 - realPct : 0;
                                      
                                      return (
                                        <div key={contestant.id} className="space-y-1.5 text-[11px]">
                                          <div className="flex justify-between items-center font-normal text-[#fafafa]">
                                            <span className="truncate max-w-[60%]">{contestant.name}</span>
                                            <span className="font-mono text-[#9ca3af]">
                                              Total: <strong className="text-[#fafafa]">{contestant.totalVotesCount}</strong> 
                                              <span className="mx-1.5 text-[#374151]">|</span> 
                                              Real: <strong className="text-emerald-400">{contestant.realVotesCount}</strong> 
                                              <span className="mx-1.5 text-[#374151]">|</span> 
                                              Tweaked: <strong className="text-amber-400">{contestant.tweakedVotesCount}</strong>
                                            </span>
                                          </div>
                                          
                                          {/* Dual-colored progress bar (emerald for real, amber for tweaked) */}
                                          <div className="h-2 w-full rounded-full bg-[#262626] overflow-hidden flex">
                                            {contestant.totalVotesCount > 0 ? (
                                              <>
                                                {contestant.realVotesCount > 0 && (
                                                  <div className="h-full bg-emerald-500 shadow-sm" style={{ width: `${realPct}%` }} />
                                                )}
                                                {contestant.tweakedVotesCount > 0 && (
                                                  <div className="h-full bg-amber-500 shadow-sm" style={{ width: `${tweakedPct}%` }} />
                                                )}
                                              </>
                                            ) : (
                                              <div className="h-full w-full bg-[#262626]" />
                                            )}
                                          </div>
                                          
                                          <div className="flex justify-between text-[9px] font-medium text-[#9ca3af] uppercase tracking-wide">
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
                          <div className="py-4 text-center text-[#9ca3af] bg-[#141414] rounded-xl border border-[#262626] text-[11px]">
                            No active contestants or votes recorded.
                          </div>
                        )}
                      </div>
                    )}
 
                    <div className="pt-4 border-t border-[#262626]">
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
                        className={`w-full rounded-full py-3 text-xs font-medium border transition-all cursor-pointer ${inspectItem.data.isSuspended ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40" : "bg-rose-950/40 text-rose-400 border-rose-800/40 hover:bg-rose-900/40"}`}
                      >
                        {inspectItem.data.isSuspended ? "Restore Live Listing" : "Bring Down Event"}
                      </button>
                    </div>
                  </div>
                )}

                {inspectItem.type === "payout" && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af]">Total Requested Amount</p>
                      <h4 className="text-3xl font-light text-[#fafafa]">{formatNaira(inspectItem.data.amount)}</h4>
                      <p className="text-xs text-[#9ca3af]">{inspectItem.data.eventTitle}</p>
                    </div>

                    <div className="grid gap-3 p-5 rounded-2xl bg-[#141414] border border-[#262626] text-xs">
                      {[
                        { label: "Payout Reference", val: inspectItem.data.reference || inspectItem.data.id, mono: true },
                        { label: "Organizer Name", val: inspectItem.data.organizerName },
                        { label: "Organizer Email", val: inspectItem.data.organizerEmail || "N/A" },
                        { label: "Organizer Phone", val: inspectItem.data.organizerPhone || "N/A" },
                        { label: "Settlement Bank", val: inspectItem.data.bankName },
                        { label: "Account Number", val: inspectItem.data.accountNumber, mono: true },
                        { label: "Account Name", val: inspectItem.data.accountName },
                        { label: "Request Status", val: inspectItem.data.status },
                        { label: "Requested On", val: inspectItem.data.createdAt ? new Date(inspectItem.data.createdAt).toLocaleString() : "N/A" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-[#262626]/80 last:border-0">
                          <span className="text-[#9ca3af]">{item.label}</span>
                          <span className={`text-[#fafafa] ${item.mono ? "font-mono text-[11px]" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    {inspectItem.data.status === "PENDING" && (
                      <div className="pt-4 border-t border-[#262626] flex flex-col gap-2">
                        <button
                          id={`inspect-release-${inspectItem.data.id}`}
                          onClick={() => {
                            triggerConfirm(
                              `Confirm Payout Approval`,
                              `Authorize and release this payout of ${formatNaira(inspectItem.data.amount)} to organizer ${inspectItem.data.organizerName} (${inspectItem.data.bankName} - ${inspectItem.data.accountNumber})?`,
                              () => handleReleasePayout(inspectItem.data.id),
                              "Approve & Release",
                              "success"
                            );
                          }}
                          className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-semibold text-[#0a0a0a] transition cursor-pointer"
                        >
                          Approve & Release Funds
                        </button>
                        <button
                          id={`inspect-reject-${inspectItem.data.id}`}
                          onClick={() => {
                            triggerConfirm(
                              `Reject Withdrawal Request`,
                              `Decline this withdrawal request of ${formatNaira(inspectItem.data.amount)} from ${inspectItem.data.organizerName}? The funds will return to their available balance.`,
                              () => handleRejectPayout(inspectItem.data.id),
                              "Reject Request",
                              "danger"
                            );
                          }}
                          className="w-full rounded-full border border-rose-800/50 hover:bg-rose-950/50 py-2.5 text-xs font-medium text-rose-400 transition cursor-pointer"
                        >
                          Decline Request
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {inspectItem.type === "ticket" && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af]">Total Purchase Value</p>
                      <h4 className="text-2xl font-light text-[#fafafa]">{formatNaira(inspectItem.data.totalPaid)}</h4>
                      <p className="text-xs text-[#9ca3af]">{inspectItem.data.eventTitle} • {inspectItem.data.ticketName}</p>
                    </div>

                    <div className="grid gap-3 p-5 rounded-2xl bg-[#141414] border border-[#262626] text-xs">
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
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-[#262626]/80 last:border-0">
                          <span className="text-[#9ca3af]">{item.label}</span>
                          <span className={`text-[#fafafa] ${item.mono ? "font-mono text-[11px]" : ""}`}>
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-6 mt-6 border-t border-[#262626] text-center">
              <span className="text-[9px] font-mono text-[#737373]">System Trace Log ID: {inspectItem.data.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* TWO-COLUMN SAAS CONSOLE LAYOUT */}
      
      {/* 1. COLLAPSIBLE LEFT SIDEBAR */}
      <aside
        className={`bg-[#0d0d0d] border-r border-[#262626] flex flex-col justify-between relative z-20 shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="h-20 border-b border-[#262626] flex items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="SWYFT home">
              <span className="flex h-7 w-7 items-center justify-center text-[#fafafa] shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z" fill="currentColor" />
                </svg>
              </span>
              {!sidebarCollapsed && (
                <span className="text-base font-bold tracking-tight text-[#fafafa] uppercase">swyft</span>
              )}
            </Link>
            
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-7 w-7 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-[#9ca3af] hover:text-[#fafafa] hover:border-[#374151] transition-all cursor-pointer"
              aria-label="Collapse sidebar"
            >
              {sidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          {/* Navigation link items */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: "overview", label: "Overview", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg> },
              { id: "users", label: "Users Directory", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
              { id: "organizers", label: "Organizer Wallets", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><circle cx="16" cy="15" r="1.5" /><path d="M6 15h4" /></svg> },
              { id: "events", label: "Event Moderation", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
              { id: "payouts", label: "Payout Operations", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M17 9H7" /></svg> },
              { id: "tickets", label: "Ticket Audit Logs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg> },
            ].map((item) => (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as any);
                }}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-full text-xs font-medium transition-all relative group cursor-pointer active:scale-[0.98] ${
                  activeTab === item.id
                    ? "bg-[#fafafa] text-[#0a0a0a] shadow-sm font-semibold"
                    : "text-[#9ca3af] hover:text-[#fafafa] hover:bg-[#171717]"
                }`}
              >
                <span className={activeTab === item.id ? "text-[#0a0a0a]" : "text-[#9ca3af] group-hover:text-[#fafafa]"}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span>{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Card / Return to app */}
        <div className="p-4 border-t border-[#262626] space-y-3">
          <Link
            href="/"
            className="flex items-center gap-3.5 px-4.5 py-2.5 rounded-full text-xs font-medium text-[#9ca3af] hover:text-[#fafafa] hover:bg-[#171717] no-underline transition-all"
          >
            <span>🏠</span>
            {!sidebarCollapsed && <span>Return to Site</span>}
          </Link>
          
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
            <div className="h-8 w-8 shrink-0 rounded-full bg-[#262626] flex items-center justify-center font-medium text-xs text-[#fafafa] border border-[#374151]">
              {user?.name?.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#fafafa] truncate">{user?.name}</p>
                <p className="text-[10px] text-[#9ca3af] truncate mt-0.5">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKING WORKSPACE */}
      <main className="flex-1 min-w-0 h-screen flex flex-col justify-between overflow-y-auto z-10 relative">
        
        {/* Workspace top-bar */}
        <div className="h-20 border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-medium tracking-widest text-[#9ca3af] uppercase">
              SWYFT CORE OPERATIONS CONSOLE
            </span>
            <h2 className="text-base font-light tracking-tight text-[#fafafa] mt-0.5 capitalize">{activeTab} panel</h2>
          </div>

          {/* Server status monitor indicators */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#262626] bg-[#121212]">
              <span className="text-[9px] font-medium text-[#9ca3af] uppercase">SYS CPU</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400">12%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#262626] bg-[#121212]">
              <span className="text-[9px] font-medium text-[#9ca3af] uppercase">DB QUERY</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">4ms</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#262626] bg-[#121212]">
              <span className="text-[9px] font-medium text-[#9ca3af] uppercase">SESSIONS</span>
              <span className="text-[10px] font-mono text-[#fafafa]">140</span>
            </div>
          </div>
        </div>

        {/* Scrollable central content dashboard panel */}
        <div className="flex-1 p-6 md:p-8">
          
          {loadingData ? (
            /* Main Dashboard Pulse Loader */
            <div className="h-full min-h-[350px] border border-[#262626] bg-[#121212] rounded-3xl flex flex-col items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-[10px] font-medium uppercase text-[#9ca3af] animate-pulse tracking-widest">
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
                      { label: "Platform Revenue", value: formatNaira(stats.totalRevenue), sub: "Total ticket earnings" },
                      { label: "Tickets Sold", value: stats.ticketsSold.toLocaleString(), sub: "Total check-ins issued" },
                      { label: "Events Index", value: `${stats.activeEvents} / ${stats.totalEvents}`, sub: "Live / total campaigns" },
                      { label: "Pending Payouts", value: formatNaira(stats.pendingPayouts), sub: "Organizer requests" },
                    ].map((card, i) => (
                      <div key={i} className="rounded-2xl border border-[#262626] bg-[#121212] p-6 hover:border-[#374151] transition-all duration-200">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">{card.label}</p>
                        <p className="mt-3 text-3xl font-extralight tracking-tight text-[#fafafa]">{card.value}</p>
                        <p className="mt-1 text-xs text-[#737373]">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Activity Feed Logs */}
                    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 lg:col-span-2 space-y-5">
                      <div>
                        <h3 className="text-sm font-medium text-[#fafafa]">System Operations Feed</h3>
                        <p className="text-xs text-[#9ca3af]">Chronological list of platform sales</p>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {recentOrders.length > 0 ? (
                          recentOrders.map((ord) => (
                            <div key={ord.id} className="flex gap-4 items-start p-3.5 rounded-xl bg-[#171717] hover:bg-[#1c1c1c] border border-[#262626] transition-all text-xs">
                              <span className="h-6 w-6 shrink-0 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold text-[10px]">
                                ✓
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-normal text-[#fafafa]">
                                  Order ID <span className="font-mono text-[#9ca3af]">{ord.id}</span> completed for <span className="font-semibold text-emerald-400">{formatNaira(ord.totalPrice)}</span>
                                </p>
                                <p className="text-[10px] text-[#737373] mt-1">
                                  Created At: {new Date(ord.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-[#9ca3af]">No activity logs found.</div>
                        )}
                      </div>
                    </div>

                    {/* Operational Commands Panel */}
                    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 space-y-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-[#fafafa]">System Dials</h3>
                        <p className="text-xs text-[#9ca3af]">Quick administration overview counters</p>
                      </div>

                      <div className="grid gap-3 text-xs">
                        {[
                          { label: "Active Organizer Wallets", count: organizers.length, color: "text-emerald-400", tab: "organizers" },
                          { label: "Pending Payout Requests", count: payouts.filter(p => p.status === 'PENDING').length, color: "text-[#fafafa]", tab: "payouts" },
                          { label: "Suspended Accounts", count: users.filter(u => u.isBanned).length, color: "text-rose-400", tab: "users" },
                          { label: "Deactivated Events", count: events.filter(e => e.isSuspended).length, color: "text-amber-400", tab: "events" },
                        ].map((dial, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveTab(dial.tab as any)}
                            className="flex items-center justify-between p-4 rounded-xl bg-[#171717] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#374151] text-left transition-all cursor-pointer"
                          >
                            <span className="font-normal text-[#fafafa]">{dial.label}</span>
                            <span className={`font-mono text-xs font-semibold ${dial.color}`}>{dial.count}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-3 rounded-full bg-emerald-950/30 border border-emerald-800/40 text-center">
                        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest">
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
                      className="w-full sm:max-w-md rounded-full bg-[#121212] border border-[#374151] focus:border-[#fafafa] px-5 py-3 text-xs text-[#fafafa] placeholder-[#737373] outline-none transition-all"
                    />
                    <span className="text-xs text-[#9ca3af]">Showing {filteredUsers.length} accounts</span>
                  </div>

                  <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#262626] bg-[#171717] text-[#9ca3af] text-[11px] font-medium uppercase tracking-wider">
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">University</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626] font-normal text-[#fafafa]">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <tr
                              key={u.id}
                              className="hover:bg-[#1a1a1a] transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "user", data: u })}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-[#fafafa]">{u.name}</p>
                                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{u.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-[#fafafa] text-[#0a0a0a] border border-[#fafafa]' : u.role === 'ORGANIZER' ? 'bg-[#1f1f1f] text-[#fafafa] border border-[#374151]' : 'bg-[#141414] text-[#9ca3af] border border-[#262626]'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[#9ca3af]">{u.university || "Not Set"}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${u.isBanned ? "bg-rose-950/40 text-rose-400 border border-rose-800/40" : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"}`}>
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
                                    className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition cursor-pointer ${u.isBanned ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/40" : "bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/40"}`}
                                  >
                                    {u.isBanned ? "Unban Account" : "Ban User"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-[#9ca3af]">No matches found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ORGANIZERS & WALLETS DIRECTORY PANEL CONTENT */}
              {activeTab === "organizers" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Top Financial Stat Counter Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#374151] transition-all">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">Total Organizers</p>
                      <h3 className="text-3xl font-extralight tracking-tight text-[#fafafa] mt-2">{organizers.length}</h3>
                      <p className="text-xs text-[#737373] mt-1">With active/registered wallets</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#374151] transition-all">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">Total Money in Wallets</p>
                      <h3 className="text-3xl font-extralight tracking-tight text-emerald-400 mt-2">
                        {formatNaira(organizers.reduce((sum, o) => sum + (o.walletBalance || 0), 0))}
                      </h3>
                      <p className="text-xs text-[#737373] mt-1">Cumulative available balance</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#374151] transition-all">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">Total Withdrawn</p>
                      <h3 className="text-3xl font-extralight tracking-tight text-[#fafafa] mt-2">
                        {formatNaira(organizers.reduce((sum, o) => sum + (o.totalWithdrawn || 0), 0))}
                      </h3>
                      <p className="text-xs text-[#737373] mt-1">Completed settlements</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#121212] border border-[#262626] hover:border-[#374151] transition-all">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">Pending Withdrawals</p>
                      <h3 className="text-3xl font-extralight tracking-tight text-amber-400 mt-2">
                        {formatNaira(organizers.reduce((sum, o) => sum + (o.pendingWithdrawals || 0), 0))}
                      </h3>
                      <p className="text-xs text-[#737373] mt-1">Awaiting release approval</p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <input
                      id="organizer-search"
                      type="text"
                      placeholder="Search organizer by name, email, phone, bank name, or account number..."
                      value={organizerSearch}
                      onChange={(e) => setOrganizerSearch(e.target.value)}
                      className="w-full sm:max-w-lg rounded-full bg-[#121212] border border-[#374151] focus:border-[#fafafa] px-5 py-3 text-xs text-[#fafafa] placeholder-[#737373] outline-none transition-all"
                    />
                    <span className="text-xs text-[#9ca3af]">
                      Showing {filteredOrganizers.length} of {organizers.length} organizers
                    </span>
                  </div>

                  {/* Main Organizers & Wallets Directory Table */}
                  <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#262626] bg-[#171717] text-[#9ca3af] text-[11px] font-medium uppercase tracking-wider">
                          <th className="px-6 py-4">Organizer</th>
                          <th className="px-6 py-4">Bank Name</th>
                          <th className="px-6 py-4">Account Number</th>
                          <th className="px-6 py-4">Money in Wallet</th>
                          <th className="px-6 py-4">Tickets Sold</th>
                          <th className="px-6 py-4">Total Withdrawn</th>
                          <th className="px-6 py-4">Pending Payouts</th>
                          <th className="px-6 py-4">Events</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626] font-normal text-[#fafafa]">
                        {filteredOrganizers.length > 0 ? (
                          filteredOrganizers.map((org) => (
                            <tr
                              key={org.id}
                              className="hover:bg-[#1a1a1a] transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "user", data: org })}
                            >
                              {/* Organizer Info */}
                              <td className="px-6 py-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-[#fafafa]">{org.name}</p>
                                    {org.isBanned && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-rose-950/40 text-rose-400 border border-rose-800/40">
                                        Suspended
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{org.email}</p>
                                  {org.phone && org.phone !== 'N/A' && (
                                    <p className="text-[10px] text-[#737373]">{org.phone}</p>
                                  )}
                                </div>
                              </td>

                              {/* Bank Name */}
                              <td className="px-6 py-4">
                                <span className="font-medium text-[#fafafa]">
                                  {org.bankName}
                                </span>
                              </td>

                              {/* Account Number with Copy & Edit Buttons */}
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                {org.accountNumber && org.accountNumber !== 'Not Provided' && org.accountNumber !== 'Not Set' && org.accountNumber !== '—' ? (
                                  <div className="flex items-center gap-2">
                                    <code className="font-mono text-xs text-[#fafafa] bg-[#171717] px-2.5 py-1 rounded-md border border-[#262626] select-all">
                                      {org.accountNumber}
                                    </code>
                                    <button
                                      title="Copy account number"
                                      onClick={() => {
                                        navigator.clipboard.writeText(org.accountNumber);
                                        showToast(`Account number ${org.accountNumber} copied to clipboard!`, "success");
                                      }}
                                      className="p-1 rounded-full hover:bg-[#262626] text-[#9ca3af] hover:text-[#fafafa] transition cursor-pointer"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                      </svg>
                                    </button>
                                    <button
                                      title="Edit settlement bank details"
                                      onClick={() => setEditBankModal({
                                        show: true,
                                        userId: org.id,
                                        userName: org.name,
                                        bankName: org.bankName && org.bankName !== 'Not Provided' ? org.bankName : '',
                                        accountNumber: org.accountNumber,
                                      })}
                                      className="p-1 rounded-full hover:bg-[#262626] text-[#9ca3af] hover:text-[#fafafa] transition cursor-pointer"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setEditBankModal({
                                      show: true,
                                      userId: org.id,
                                      userName: org.name,
                                      bankName: org.bankName && org.bankName !== 'Not Provided' ? org.bankName : '',
                                      accountNumber: '',
                                    })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-900/40 transition cursor-pointer active:scale-95"
                                  >
                                    <span>+</span> Set Account
                                  </button>
                                )}
                                {org.subaccountCode && (
                                  <span className="text-[10px] font-mono text-[#9ca3af] block mt-1">
                                    Subaccount: {org.subaccountCode}
                                  </span>
                                )}
                              </td>

                              {/* Wallet Balance */}
                              <td className="px-6 py-4">
                                <span className="font-semibold text-sm text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40 inline-block">
                                  {formatNaira(org.walletBalance)}
                                </span>
                              </td>

                              {/* Tickets Sold */}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 font-medium text-xs ${
                                  (org.ticketsSold || org.buyers?.length || 0) > 0
                                    ? "text-[#fafafa] bg-[#1f1f1f] px-2.5 py-1 rounded-full border border-[#262626]"
                                    : "text-[#737373]"
                                }`}>
                                  🎟️ {org.ticketsSold || org.buyers?.length || 0} sold
                                </span>
                              </td>

                              {/* Total Withdrawn */}
                              <td className="px-6 py-4 text-[#9ca3af]">
                                {formatNaira(org.totalWithdrawn)}
                              </td>

                              {/* Pending Payouts */}
                              <td className="px-6 py-4">
                                {org.pendingWithdrawals > 0 ? (
                                  <span className="font-medium text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full text-[11px] border border-amber-800/40">
                                    {formatNaira(org.pendingWithdrawals)} pending
                                  </span>
                                ) : (
                                  <span className="text-[#737373] text-xs">None</span>
                                )}
                              </td>

                              {/* Events Count */}
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#171717] text-[#9ca3af] border border-[#262626]">
                                  {org.eventsCount} events
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setInspectItem({ show: true, type: "user", data: org })}
                                  className="rounded-full px-4 py-1.5 text-xs font-medium bg-[#fafafa] text-[#0a0a0a] hover:bg-[#e5e5e5] transition cursor-pointer active:scale-95"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="text-center py-16 text-[#9ca3af]">
                              No organizers found matching your search.
                            </td>
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
                      className="w-full sm:max-w-md rounded-full bg-[#121212] border border-[#374151] focus:border-[#fafafa] px-5 py-3 text-xs text-[#fafafa] placeholder-[#737373] outline-none transition-all"
                    />
                    <span className="text-xs text-[#9ca3af]">Showing {filteredEvents.length} events</span>
                  </div>

                  <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#262626] bg-[#171717] text-[#9ca3af] text-[11px] font-medium uppercase tracking-wider">
                          <th className="px-6 py-4">Event</th>
                          <th className="px-6 py-4">Organizer</th>
                          <th className="px-6 py-4">Venue</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626] font-normal text-[#fafafa]">
                        {filteredEvents.length > 0 ? (
                          filteredEvents.map((e) => (
                            <tr
                              key={e.id}
                              className="hover:bg-[#1a1a1a] transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "event", data: e })}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {e.bannerImage && <img src={e.bannerImage} className="h-9 w-14 object-cover rounded-md bg-[#1f1f1f] border border-[#262626]" alt="" />}
                                  <div>
                                    <p className="font-medium text-[#fafafa]">{e.title}</p>
                                    <p className="text-[10px] text-[#9ca3af] mt-0.5">{e.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[#9ca3af]">{e.organizer?.name || "Unknown"}</td>
                              <td className="px-6 py-4 text-[#9ca3af]">{e.location}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${e.isSuspended ? "bg-rose-950/40 text-rose-400 border border-rose-800/40" : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"}`}>
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
                                  className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition cursor-pointer ${e.isSuspended ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/40" : "bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/40"}`}
                                >
                                  {e.isSuspended ? "Restore Live" : "Bring Down"}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-[#9ca3af]">No events matched.</td>
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
                      className="w-full sm:max-w-md rounded-full bg-[#121212] border border-[#374151] focus:border-[#fafafa] px-5 py-3 text-xs text-[#fafafa] placeholder-[#737373] outline-none transition-all"
                    />
                    <span className="text-xs text-[#9ca3af]">Showing {filteredPayouts.length} payout logs</span>
                  </div>

                  <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#262626] bg-[#171717] text-[#9ca3af] text-[11px] font-medium uppercase tracking-wider">
                          <th className="px-6 py-4">Organizer</th>
                          <th className="px-6 py-4">Settlement Bank</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626] font-normal text-[#fafafa]">
                        {filteredPayouts.length > 0 ? (
                          filteredPayouts.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-[#1a1a1a] transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "payout", data: p })}
                            >
                              <td className="px-6 py-4">
                                <p className="font-medium text-[#fafafa]">{p.organizerName || p.accountName || 'Organizer'}</p>
                                <p className="text-[11px] text-[#9ca3af]">{p.organizerEmail || '—'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-[#fafafa]">{p.bankName || 'Bank'}</p>
                                <p className="text-[11px] font-mono text-[#9ca3af]">{p.accountNumber} · {p.accountName}</p>
                              </td>
                              <td className="px-6 py-4 font-semibold text-[#fafafa] text-xs">{formatNaira(p.amount)}</td>
                              <td className="px-6 py-4 text-[11px] text-[#9ca3af]">
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                                  p.status === "COMPLETED"
                                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                                    : p.status === "PENDING"
                                    ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                                    : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                                }`}>
                                  {p.status === "COMPLETED" ? "APPROVED" : p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                {p.status === "PENDING" ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      id={`release-btn-${p.id}`}
                                      onClick={() => {
                                        triggerConfirm(
                                          "Confirm Payout Approval",
                                          `Authorize and approve withdrawal of ${formatNaira(p.amount)} to organizer ${p.organizerName} (${p.bankName} - ${p.accountNumber})?`,
                                          () => handleReleasePayout(p.id),
                                          "Approve Payout",
                                          "success"
                                        );
                                      }}
                                      className="rounded-full bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1 text-[11px] font-semibold text-[#0a0a0a] transition cursor-pointer active:scale-95"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      id={`reject-btn-${p.id}`}
                                      onClick={() => {
                                        triggerConfirm(
                                          "Reject Withdrawal",
                                          `Decline this withdrawal of ${formatNaira(p.amount)} from ${p.organizerName}? Funds will return to their available wallet balance.`,
                                          () => handleRejectPayout(p.id),
                                          "Reject",
                                          "danger"
                                        );
                                      }}
                                      className="rounded-full border border-rose-800/50 hover:bg-rose-950/50 text-rose-400 px-3 py-1 text-[11px] font-medium transition cursor-pointer active:scale-95"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : p.status === "COMPLETED" ? (
                                  <span className="text-[11px] text-emerald-400 font-medium">Approved ✓</span>
                                ) : (
                                  <span className="text-[11px] text-rose-400 font-medium">Rejected ✗</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-16 text-[#9ca3af]">No payouts matched.</td>
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
                      className="w-full sm:max-w-md rounded-full bg-[#121212] border border-[#374151] focus:border-[#fafafa] px-5 py-3 text-xs text-[#fafafa] placeholder-[#737373] outline-none transition-all"
                    />
                    <span className="text-xs text-[#9ca3af]">Showing {filteredTickets.length} ticket registers</span>
                  </div>

                  <div className="rounded-2xl border border-[#262626] bg-[#121212] overflow-x-auto shadow-2xl">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#262626] bg-[#171717] text-[#9ca3af] text-[11px] font-medium uppercase tracking-wider">
                          <th className="px-6 py-4">Attendee</th>
                          <th className="px-6 py-4">Event Info</th>
                          <th className="px-6 py-4">Amount Paid</th>
                          <th className="px-6 py-4">QR Reference</th>
                          <th className="px-6 py-4">Check-in</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626] font-normal text-[#fafafa]">
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-[#1a1a1a] transition-all cursor-pointer"
                              onClick={() => setInspectItem({ show: true, type: "ticket", data: t })}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-[#fafafa]">{t.userName}</p>
                                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{t.userEmail}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-[#fafafa] font-medium">{t.eventTitle}</p>
                                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{t.ticketName} (x{t.quantity})</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[#fafafa]">
                                <p className="font-medium">{formatNaira(t.totalPaid)}</p>
                              </td>
                              <td className="px-6 py-4 font-mono text-[#9ca3af] text-[11px]">{t.qrCode || "N/A"}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${t.isUsed ? "bg-amber-950/40 text-amber-400 border border-amber-800/40" : "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"}`}>
                                  {t.isUsed ? "Checked In" : "Unused"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-[#9ca3af]">No tickets found.</td>
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
        <footer className="h-14 border-t border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between text-[11px] font-normal text-[#737373] shrink-0 select-none">
          <span>© 2026 SWYFT Technologies Inc.</span>
          <span>Security Level: Super Administrator Access</span>
        </footer>

      </main>
    </div>
  );
}
